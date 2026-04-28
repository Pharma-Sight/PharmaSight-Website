"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Users,
  TrendingUp,
  Globe,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

export default function PharmaSightLanding() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="PharmaSight Logo" className="w-14 h-14 rounded-lg object-contain"
             />
            <span className="text-xl font-bold tracking-tight">
              Pharma<span className="text-blue-600">Sight</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
              asChild
            >
              <Link href="/auth/register">Register</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* HERO SECTION - Fixed Layout */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent" />
        
        <motion.div
          className="relative container mx-auto px-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT CONTENT */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="z-10"
            >
              <motion.div variants={itemVariants}>
                <Badge className="rounded-full px-4 py-1 bg-blue-50 text-blue-700 border border-blue-100 mb-6 font-medium">
                  Intelligent Healthcare Supply Protection
                </Badge>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-8"
              >
                Predict drug shortages{" "}
                <span className="text-blue-600 block">
                  before they hit.
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10 max-w-xl"
              >
                PharmaSight leverages real-time demand trends and stock signals 
                to provide hospitals with critical early warnings, ensuring that 
                life-saving treatments are never delayed by logistics. 
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-4"
              >
                <Button
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-8 h-14 text-base"
                  asChild
                >
                  <Link href="/auth/register">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* RIGHT IMAGE (BESIDE HERO CONTENT) */}
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.8, delay: 0.2 }}
  className="relative lg:block"
>
  <div className="relative z-10 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
    <img 
      src="/healthcare.png" 
      alt="Healthcare Supply Chain Management" 
      className="w-full h-auto object-cover"
    />
  </div>

  {/* AI PREDICTION BADGE */}
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
    className="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4"
  >
    <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl">
      <Activity className="w-6 h-6 text-blue-600" />
    </div>
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">AI Accuracy</span>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>
      <div className="text-2xl font-bold text-slate-900">94.7%</div>
    </div>
  </motion.div>

  {/* Decorative Background Elements */}
  <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
  <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10" />
</motion.div>

          </div>
        </motion.div>
      </section>

      {/* HOW TO GET STARTED SECTION (BENEATH HERO) */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How to Get Started</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Join the ecosystem designed to eliminate supply chain unpredictability for both providers and distributors. 
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* For Healthcare Providers */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Activity className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">For Healthcare Providers</h3>
              <ul className="space-y-4 text-slate-600 mb-8">
                <li className="flex items-start gap-3 text-base">
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  Connect your inventory management system seamlessly. 
                </li>
                <li className="flex items-start gap-3 text-base">
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  Receive real-time alerts on high-risk drug shortages. 
                </li>
                <li className="flex items-start gap-3 text-base">
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  Optimize procurement cycles based on predictive analytics. 
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl py-6 border-slate-200 hover:bg-slate-50">
                Register Hospital
              </Button>
            </motion.div>

            {/* For Suppliers */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">For Suppliers</h3>
              <ul className="space-y-4 text-slate-600 mb-8">
                <li className="flex items-start gap-3 text-base">
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                  List current stock levels and production capacity. 
                </li>
                <li className="flex items-start gap-3 text-base">
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                  Get automatically matched with hospitals in urgent need. 
                </li>
                <li className="flex items-start gap-3 text-base">
                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                  Streamline fulfillment with integrated logistics data. 
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl py-6 border-slate-200 hover:bg-slate-50">
                Partner with Us
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DETAILED ABOUT SECTION - Long Form Content */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4">
                The Mission
              </h2>
              <p className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Healthcare should heal, <br />
                not hunt for inventory.
              </p>
            </div>

            <div className="space-y-32">
              {/* THE PROBLEM */}
              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div className="sticky top-24">
                   <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                      <AlertTriangle className="text-red-600 w-6 h-6" />
                   </div>
                   <h3 className="text-3xl font-bold mb-4 text-slate-900">The Problem</h3>
                   <div className="h-1.5 w-20 bg-red-500 rounded-full" />
                </div>
                <div className="text-lg text-slate-600 leading-relaxed space-y-6">
                  <p>
                    Today’s pharmaceutical supply chain is fundamentally reactive. Most healthcare 
                    facilities only realize a drug is unavailable when a pharmacist reaches for a 
                    shelf that is already empty. This "just-in-time" failure creates a ripple effect 
                    across the entire hospital ecosystem.
                  </p>
                  <p>
                    When critical medications go missing, the costs are measured in human lives. 
                    Surgeries are delayed, emergency rooms are forced to use suboptimal 
                    substitutions, and medical staff spend thousands of hours manually calling 
                    suppliers instead of treating patients. The current system doesn't just lack 
                    efficiency; it lacks foresight.
                  </p>
                </div>
              </div>

              {/* THE SOLUTION */}
              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div className="md:order-2 sticky top-24">
                   <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                      <Activity className="text-blue-600 w-6 h-6" />
                   </div>
                   <h3 className="text-3xl font-bold mb-4 text-slate-900">Our Solution</h3>
                   <div className="h-1.5 w-20 bg-blue-500 rounded-full" />
                </div>
                <div className="md:order-1 text-lg text-slate-600 leading-relaxed space-y-6">
                  <p>
                    PharmaSight transforms hospital procurement from reactive guesswork into a precise, data-driven system. Our AI microservice continuously analyzes critical operational inputs such as current inventory levels, daily consumption rates, expiry dates, reorder thresholds, supplier lead times, pending purchase orders, department-wise demand patterns, seasonal trends, and historical shortage events. It also factors in external signals like supply chain disruptions, manufacturing delays, regional demand surges, and logistics risks. By combining these inputs, PharmaSight measures true usage velocity, predicts future stock depletion timelines, and forecasts what each facility will need weeks in advance.
                  </p>
                  <p>
                    Our proprietary algorithms don't just look at what you have today, the platform reveals what will run out tomorrow. Procurement teams receive early warnings, risk scores, and smart replenishment recommendations through a centralized dashboard, allowing them to reorder sooner, optimize vendor decisions, reduce waste from expiries, and ensure critical medicines remain available when patients need them most.
                  </p>
                </div>
              </div>

              {/* THE IMPACT */}
              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div className="sticky top-24">
                   <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                      <ShieldCheck className="text-emerald-600 w-6 h-6" />
                   </div>
                   <h3 className="text-3xl font-bold mb-4 text-slate-900">The Impact</h3>
                   <div className="h-1.5 w-20 bg-emerald-500 rounded-full" />
                </div>
                <div className="text-lg text-slate-600 leading-relaxed space-y-6">
                  <p>
                    PharmaSight creates a unified ecosystem where healthcare providers and suppliers operate through one trusted platform, replacing fragmented calls, spreadsheets, and last-minute scrambling with coordinated action. Hospitals and healthcare providers can upload inventory data in bulk, instantly analyze stock risk through AI, detect upcoming shortages, and place orders before supply gaps affect patient care.
                  </p>
                  <p>
                    On the supply side, verified suppliers receive requests, review demand in real time, and dispatch orders efficiently through a transparent workflow. This connected system shortens procurement cycles, improves trust through supplier verification, reduces medicine stockouts, minimizes waste from over-ordering or expired inventory, and enables faster response during emergencies. By turning disconnected procurement steps into one intelligent pipeline, PharmaSight helps ensure critical medicines reach the right place at the right time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white grid md:grid-cols-2 gap-12 items-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px] -mr-32 -mt-32" />
            
            <div>
              <p className="uppercase tracking-[0.3em] text-blue-400 text-xs font-bold mb-4">
                Engineering Excellence
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Neural Nexus
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg mb-8">
                We are a collective of engineers and designers dedicated to solving 
                logistical bottlenecks in healthcare. PharmaSight is our answer to 
                the global drug shortage crisis.
              </p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium">Global Scale</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium">HIPAA Compliant</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="w-56 h-56 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center backdrop-blur-xl group hover:bg-white/10 transition-colors">
                <Users className="w-16 h-16 text-blue-400 mb-4" />
                <p className="font-bold text-xl uppercase tracking-widest">Nexus</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="text-white w-5 h-5" />
               </div>
               <span className="text-xl font-bold">PharmaSight</span>
            </div>
            <p className="text-slate-500 max-w-md mb-8">
              Pioneering the future of pharmaceutical logistics through 
              predictive intelligence and real-time monitoring.
            </p>
            <div className="text-sm text-slate-400 font-medium">
              © 2026 Neural Nexus • Built for the Future of Healthcare
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}