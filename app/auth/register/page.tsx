"use client"

import { useAuth } from "@/lib/auth-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Schéma de validation pour l'étape 1 (Informations personnelles)
const step1Schema = z.object({
  firstname: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
  lastname: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  email: z.string().email({ message: "Adresse email invalide" }),
})

// Schéma de validation pour l'étape 2 (Mot de passe et adresse)
const step2SchemaBase = z.object({
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  confirmPassword: z.string().min(6, { message: "Veuillez confirmer votre mot de passe" }),
  address: z.string().min(5, { message: "L'adresse doit contenir au moins 5 caractères" }),
  city: z.string().min(2, { message: "La ville doit contenir au moins 2 caractères" }),
  zipCode: z.string().min(5, { message: "Le code postal doit contenir au moins 5 caractères" }),
  phone: z.string().min(10, { message: "Le numéro de téléphone doit contenir au moins 10 caractères" }),
})

const step2Schema = step2SchemaBase.refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

// Schéma de validation pour l'étape 3 (Informations professionnelles)
const step3SchemaBase = z.object({
  isProfessional: z.boolean(),
  siret: z.string().optional(),
})

const step3Schema = step3SchemaBase.refine((data) => !data.isProfessional || (data.isProfessional && data.siret && data.siret.length >= 14), {
  message: "Le numéro SIRET est requis pour les comptes professionnels et doit contenir 14 chiffres",
  path: ["siret"],
})

// Schéma complet combinant toutes les étapes
const formSchema = z.object({
  ...step1Schema.shape,
  ...step2SchemaBase.shape,
  ...step3SchemaBase.shape,
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  }
).refine(
  (data) => !data.isProfessional || (data.isProfessional && data.siret && data.siret.length >= 14),
  {
    message: "Le numéro SIRET est requis pour les comptes professionnels et doit contenir 14 chiffres",
    path: ["siret"],
  }
)

type FormData = z.infer<typeof formSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [emailExists, setEmailExists] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)

  // Formulaire principal avec toutes les données
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
      address: "",
      city: "",
      zipCode: "",
      phone: "",
      isProfessional: false,
      siret: "",
    },
    mode: "onChange",
  })

  const isProfessional = form.watch("isProfessional")
  const email = form.watch("email")

  // Vérifier si l'email existe déjà
  const checkEmailExists = async (email: string) => {
    if (!email || !step1Schema.shape.email.safeParse(email).success) return

    setEmailChecking(true)
    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`, {
        method: "GET",
      })

      const data = await response.json()
      setEmailExists(data.exists)
    } catch (err) {
      console.error("Erreur lors de la vérification de l'email:", err)
    } finally {
      setEmailChecking(false)
    }
  }

  // Gérer le changement d'étape
  const handleNextStep = async () => {
    let isValid = false

    if (currentStep === 1) {
      isValid = await form.trigger(["firstname", "lastname", "email"], { shouldFocus: true })

      if (isValid && !emailChecking) {
        await checkEmailExists(email)
        if (emailExists) {
          form.setError("email", {
            type: "manual",
            message: "Cette adresse email est déjà utilisée",
          })
          return
        }
      } else if (emailChecking) {
        return
      }
    } else if (currentStep === 2) {
      isValid = await form.trigger(["password", "confirmPassword", "address", "city", "zipCode", "phone"], {
        shouldFocus: true,
      })
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
    }
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Soumettre le formulaire complet
  async function onSubmit(values: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      // Exclure certains champs avant l'envoi
      const { confirmPassword, ...registrationData } = values

      await register(registrationData as any)

      // Redirection après inscription réussie
      router.push("/auth/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite")
    } finally {
      setIsLoading(false)
    }
  }

  // Déterminer le titre et la description de l'étape actuelle
  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "Informations personnelles",
          description: "Commençons par vos informations de base",
        }
      case 2:
        return {
          title: "Sécurité et coordonnées",
          description: "Définissez votre mot de passe et vos coordonnées",
        }
      case 3:
        return {
          title: "Informations professionnelles",
          description: "Dernière étape avant de finaliser votre inscription",
        }
      default:
        return {
          title: "Inscription",
          description: "Créez votre compte Match Room",
        }
    }
  }

  const { title, description } = getStepContent()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>

          {/* Stepper */}
          <div className="flex justify-between items-center mt-6 px-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    currentStep === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep > step
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {currentStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
                </div>
                <span className={`text-xs mt-1 ${currentStep >= step ? "text-primary" : "text-muted-foreground"}`}>
                  {step === 1 ? "Informations" : step === 2 ? "Coordonnées" : "Professionnel"}
                </span>
              </div>
            ))}

            {/* Ligne de progression */}
            <div className="absolute top-[7.5rem] left-0 right-0 flex justify-center">
              <div className="w-[60%] h-[2px] bg-muted-foreground/30 flex">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Étape 1: Informations personnelles */}
              {currentStep === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre prénom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="votre@email.com"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e)
                                setEmailExists(false)
                              }}
                              onBlur={(e) => {
                                field.onBlur()
                                checkEmailExists(e.target.value)
                              }}
                              className={emailExists ? "pr-10 border-destructive" : ""}
                            />
                            {emailChecking && (
                              <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-muted-foreground" />
                            )}
                            {emailExists && <CircleAlert className="h-4 w-4 absolute right-3 top-3 text-destructive" />}
                          </div>
                        </FormControl>
                        <FormMessage />
                        {emailExists && (
                          <p className="text-sm text-destructive mt-1">Cette adresse email est déjà utilisée</p>
                        )}
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Étape 2: Mot de passe et coordonnées */}
              {currentStep === 2 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="123 rue de Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville</FormLabel>
                          <FormControl>
                            <Input placeholder="Paris" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code postal</FormLabel>
                          <FormControl>
                            <Input placeholder="75000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="0612345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Étape 3: Informations professionnelles */}
              {currentStep === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="isProfessional"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base">Je suis un professionnel</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Cochez cette case si vous représentez une entreprise ou si vous êtes un professionnel du
                            secteur
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {isProfessional && (
                    <FormField
                      control={form.control}
                      name="siret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro SIRET</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678901234" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground mt-1">
                            Le numéro SIRET doit contenir 14 chiffres
                          </p>
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              {/* Navigation entre les étapes */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={handlePrevStep} className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                ) : (
                  <div></div>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={emailChecking || (currentStep === 1 && emailExists)}
                    className="flex items-center gap-2"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Inscription en cours...
                      </>
                    ) : (
                      <>
                        S'inscrire
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center space-y-2">
          <div className="text-center text-sm">
            Vous avez déjà un compte?{" "}
            <Link href="/auth/login" className="text-primary underline hover:text-primary/80">
              Se connecter
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
