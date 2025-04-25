import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-auth";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { message: "Configuration Google manquante" },
        { status: 500 }
      );
    }

    const authUrl = getGoogleAuthUrl();
    
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}