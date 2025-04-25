import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { googleConfig, createAuthToken } from "@/lib/google-auth";
import { hash } from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    // Récupérer le code d'autorisation
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(
        new URL("/auth/login?error=missing_code", request.url)
      );
    }

    // Échanger le code contre un token d'accès
    const tokenResponse = await fetch(googleConfig.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: googleConfig.clientId,
        client_secret: googleConfig.clientSecret,
        redirect_uri: googleConfig.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Erreur token:", await tokenResponse.text());
      return NextResponse.redirect(
        new URL("/auth/login?error=token_exchange", request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Récupérer les informations de l'utilisateur
    const userInfoResponse = await fetch(googleConfig.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        new URL("/auth/login?error=user_info", request.url)
      );
    }

    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      return NextResponse.redirect(
        new URL("/auth/login?error=missing_email", request.url)
      );
    }

    // Chercher l'utilisateur dans la base de données
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    // Si l'utilisateur n'existe pas, le créer automatiquement
    if (!user) {
      try {
        // Diviser le nom complet en prénom et nom
        let firstname = "";
        let lastname = "";

        if (userInfo.given_name && userInfo.family_name) {
          firstname = userInfo.given_name;
          lastname = userInfo.family_name;
        } else if (userInfo.name) {
          const nameParts = userInfo.name.split(" ");
          if (nameParts.length > 1) {
            firstname = nameParts[0];
            lastname = nameParts.slice(1).join(" ");
          } else {
            firstname = userInfo.name;
            lastname = "";
          }
        }

        // Générer un mot de passe aléatoire
        const randomPassword =
          Math.random().toString(36).slice(-10) +
          Math.random().toString(36).slice(-10);
        const hashedPassword = await hash(randomPassword, 10);

        // Trouver le rôle USER par défaut
        const defaultRole = await prisma.role.findFirst({
          where: { name: "CLIENT" },
        });

        if (!defaultRole) {
          throw new Error("Rôle par défaut introuvable");
        }

        // Créer l'utilisateur avec les informations Google
        user = await prisma.user.create({
          data: {
            email: userInfo.email,
            firstname: firstname,
            lastname: lastname,
            password: hashedPassword,
            roleId: defaultRole.id,
            city: '',
            zipCode: '',
            phone: '',
            address: ''
            // Stocker les informations additionnelles si nécessaire
            // googleId: userInfo.sub,
          },
        });
      } catch (error) {
        console.error("Erreur création utilisateur:", error);
        return NextResponse.redirect(
          new URL("/auth/login?error=user_creation", request.url)
        );
      }
    }

    // Créer un JWT token
    const token = await createAuthToken(user.id);
    // Rediriger vers la page d'accueil avec le token
    const response = NextResponse.redirect(new URL("/", request.url));

    // Définir le cookie d'authentification
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 jours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erreur authentification Google:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=server_error", request.url)
    );
  }
}
