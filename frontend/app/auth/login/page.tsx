"use client"

import React, { useState } from "react" // Added useState for error feedback
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiRequest } from "@/lib/api"
// FIX: Correct import for App Router
import { useRouter } from 'next/navigation'

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type FormData = z.infer<typeof formSchema>

export default function LoginPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  const { register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: FormData) => {
    setAuthError(null) // Reset error on new attempt
    try {
      const result = await apiRequest("/api/auth/login", "POST", data)

      if (result && result.token) {
        localStorage.setItem("token", result.token)
        
        // Ensure result.user exists before checking role
        const userRole = result.user?.role
        
        if (userRole === "Healthcare Provider") {
          router.push('/dashboards/healthcareProvider')
        } else {
          router.push('/dashboards/supplier')
        }
      } else {
        setAuthError("Invalid response from server. Please try again.")
      }

    } catch (err: any) {
      console.error("Login Error:", err)
      setAuthError(err.message || "Invalid email or password.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your email and password
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Global Auth Error Feedback */}
            {authError && (
              <div className="p-3 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg">
                {authError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="name@example.com"
                {...register("email")}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}