"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Building2, ShieldCheck, Globe } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from 'react-hook-form';
import { apiRequest } from "@/lib/api";
import { useRouter } from 'next/dist/client/components/navigation';


  
export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm();

  // 1. Define the submit handler
  // register/page.tsx
  const onRegister = async (data: any) => {
    try {
      const result = await apiRequest("/auth/register", "POST", data);

      // If apiRequest throws on !res.ok, this 'if' isn't needed, 
      // but if it returns the data, check for success indicators:
      if (result.token) {
        localStorage.setItem("token", result.token);
        console.log("User registered!");

        // FIX 6: Redirect strings must match your actual folder structure
        if (result.user.role === "Healthcare Provider") {
          router.push("/dashboards/healthcareProvider");
        } else {
          router.push("/dashboards/supplier");
        }
      }
    }
    catch (error: any) {
    // FIX 7: 'error' here will be the 'new Error(result.message)' from your lib/api.ts
    console.error("Registration failed:", error.message);
    // Trigger a toast or alert here to tell the user what happened
    }
  };
  
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
       {/* --- Left Section: Branding & Social Proof --- */}
       <div className="hidden lg:flex flex-col justify-between bg-slate-50 p-12 border-r border-slate-200">
         <div className="flex items-center gap-2">
           <div className="p-1.5 rounded-lg bg-blue-600">
             <Zap className="w-5 h-5 text-white" />
           </div>
           <span className="text-xl font-bold tracking-tight text-slate-900">
             Pharma<span className="text-blue-600">Sight</span>
         </span>
        </div>

         <div className="space-y-8">
           <motion.h2 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight"
          >
            Join the network <br /> 
            <span className="text-blue-600">saving lives through foresight.</span>
          </motion.h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Secure AI Integration</p>
                <p className="text-sm text-slate-500">HIPAA-compliant data processing for hospital inventories.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Direct Sourcing</p>
                <p className="text-sm text-slate-500">Suppliers get real-time demand signals to optimize production.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          © 2026 PharmaSight AI. Building a resilient healthcare future.
        </div>
      </div>

      {/* --- Right Section: Registration Form --- */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h1>
            <p className="text-slate-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onRegister)} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" {...register("name")} className="rounded-xl border-slate-200 focus:ring-blue-600" />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="name@organization.com" className="rounded-xl border-slate-200" />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register("password")} placeholder="••••••••" className="rounded-xl border-slate-200" />
              </div>

              {/* Organization & Location Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization</Label>
                  <Input id="organizationName" {...register("organizationName")} placeholder="City General" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...register("country")} placeholder="United States" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...register("state")} placeholder="New York" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register("city")} placeholder="Manhattan" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input id="district" {...register("district")} placeholder="Uptown" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" {...register("pincode")} placeholder="10001" className="rounded-xl border-slate-200" />
                </div>
              </div>

              {/* Role Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Select onValueChange={(value) => setValue("role", value)}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select your organization type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="Healthcare Provider">Healthcare Provider</SelectItem>
                    <SelectItem value="Pharmaceutical Supplier">Pharmaceutical Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-lg font-semibold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] group">
              Register Account
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-xs text-center text-slate-400 px-8">
              By clicking register, you agree to our{" "}
              <span className="underline cursor-pointer">Terms of Service</span> and{" "}
              <span className="underline cursor-pointer">Privacy Policy</span>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}