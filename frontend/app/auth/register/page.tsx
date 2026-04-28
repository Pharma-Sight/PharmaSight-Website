"use client";

import React, { useState } from 'react';
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
import { useForm } from 'react-hook-form';
import { apiRequest } from "@/lib/api";
// FIX 1: Correct import for App Router
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [regError, setRegError] = useState<string | null>(null);
  
  // FIX 2: Better form management
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm();

  const onRegister = async (data: any) => {
    setRegError(null);
    try {
      const result = await apiRequest("/api/auth/register", "POST", data);

      if (result && result.token) {
        localStorage.setItem("token", result.token);
        
        // FIX 3: Ensure result matches backend role strings
        if (result.user?.role === "Healthcare Provider") {
          router.push("/dashboards/healthcareProvider");
        } else {
          router.push("/dashboards/supplier");
        }
      }
    }
    catch (error: any) {
      console.error("Registration failed:", error.message);
      setRegError(error.message || "An unexpected error occurred.");
    }
  };
  
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
       {/* --- Left Section --- */}
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
                 <p className="text-sm text-slate-500">HIPAA-compliant data processing.</p>
               </div>
             </div>
             <div className="flex gap-4">
               <div className="mt-1 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                 <Building2 className="w-5 h-5 text-blue-600" />
               </div>
               <div>
                 <p className="font-semibold text-slate-800">Direct Sourcing</p>
                 <p className="text-sm text-slate-500">Optimized production signals.</p>
               </div>
             </div>
           </div>
         </div>

         <div className="text-sm text-slate-400">
           © 2026 PharmaSight Website.
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

          {regError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
              {regError}
            </div>
          )}

          <form onSubmit={handleSubmit(onRegister)} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required {...register("name")} className="rounded-xl border-slate-200" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" type="email" required {...register("email")} className="rounded-xl border-slate-200" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required {...register("password")} className="rounded-xl border-slate-200" />
              </div>

              {/* Organization & Location Row
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization</Label>
                  <Input id="organizationName" required {...register("organizationName")} className="rounded-xl border-slate-200" />
                </div>
                <Select >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Healthcare type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Healthcare Provider">Hospital</SelectItem>
                    <SelectItem value="Pharmaceutical Supplier">Pharmacy</SelectItem>
                    <SelectItem value="Pharmaceutical Supplier">Clinic</SelectItem>
                  </SelectContent>
                  </Select>
                  <Select >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Organization type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Healthcare Provider">Urban</SelectItem>
                    <SelectItem value="Pharmaceutical Supplier">Rural</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" required {...register("address")} className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" required {...register("country")} className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" required {...register("state")} className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" required {...register("city")} className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" required {...register("pincode")} className="rounded-xl border-slate-200" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Select onValueChange={(value) => setValue("role", value)} required>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Healthcare Provider">Healthcare Provider</SelectItem>
                    <SelectItem value="Pharmaceutical Supplier">Pharmaceutical Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>*/}
              {/* Organization & Location Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization</Label>
                      <Input 
                        id="organizationName" 
                        required 
                        {...register("organizationName")} 
                        className="rounded-xl border-slate-200" 
                      />
                  </div>

                  <div className="space-y-2">
                    <Label>Healthcare Type</Label>
                      <Select onValueChange={(value) => setValue("healthcaretype", value)} required>
                        <SelectTrigger className="rounded-xl border-slate-200">
                          <SelectValue placeholder="Select Healthcare type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Hospital">Hospital</SelectItem>
                          <SelectItem value="Clinic">Clinic</SelectItem>
                          <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                  
                  <div className="space-y-2">
                  <Label>Organization Type</Label>
                    <Select onValueChange={(value) => setValue("organizationtype", value)} required>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Organization type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Urban">Urban</SelectItem>
                        <SelectItem value="Rural">Rural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

  <div className="space-y-2">
    <Label htmlFor="address">Address</Label>
    <Input 
      id="address" 
      required 
      {...register("address")} 
      className="rounded-xl border-slate-200" 
    />
  </div>

  {/* ... Country, State, City, Pincode fields remain the same ... */}
  <div className="space-y-2">
    <Label htmlFor="country">Country</Label>
    <Input id="country" required {...register("country")} className="rounded-xl border-slate-200" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="state">State</Label>
    <Input id="state" required {...register("state")} className="rounded-xl border-slate-200" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="city">City</Label>
    <Input id="city" required {...register("city")} className="rounded-xl border-slate-200" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="pincode">Pincode</Label>
    <Input id="pincode" required {...register("pincode")} className="rounded-xl border-slate-200" />
  </div>
</div>

{/* Keep your original Role dropdown as is */}
<div className="space-y-2 mt-4">
  <Label htmlFor="role">Your Role</Label>
  <Select onValueChange={(value) => setValue("role", value)} required>
    <SelectTrigger className="rounded-xl border-slate-200">
      <SelectValue placeholder="Select organization type" />
    </SelectTrigger>
    <SelectContent className="bg-white">
      <SelectItem value="Healthcare Provider">Healthcare Provider</SelectItem>
      <SelectItem value="Pharmaceutical Supplier">Pharmaceutical Supplier</SelectItem>
    </SelectContent>
  </Select>
</div>
            </div> 

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-lg font-semibold shadow-lg group"
            >
              {isSubmitting ? "Creating Account..." : "Register Account"}
              {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

