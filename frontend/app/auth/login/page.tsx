"use client"

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
import { apiRequest } from "@/lib/api";
import { useRouter } from 'next/dist/client/components/navigation';

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type FormData = z.infer<typeof formSchema>

export default function LoginPage() {
  const router = useRouter();
  const {register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: FormData) => {
  try {
    // 1. The response is likely already the JSON body
    const result = await apiRequest("/auth/login", "POST", data);

    // 2. Success! (The 'ok' check needs to happen inside apiRequest 
    // or you need to check for the presence of a token/success flag here)
    console.log("Login successful:", result);
    localStorage.setItem("token", result.token); 
    
    if(result.user.role === "Healthcare Provider") {
      router.push('/dashboards/healthcareProvider');
    } else {  
      router.push('/dashboards/supplier');
    }

  } catch (err) {
    console.error("Login Error:", err);
  }
};

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
            
            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="name@example.com"
                {...register("email")}
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