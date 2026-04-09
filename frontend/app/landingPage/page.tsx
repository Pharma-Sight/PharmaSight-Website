// landingPage/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  ArrowRight, BrainCircuit, Building, ShieldCheck, 
  Zap, PackageSearch, Activity, AlertTriangle, 
  TrendingDown, Globe, MousePointerClick
} from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

export default function PharmaSightLanding() {
  const [activeTab, setActiveTab] = useState("shortages");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      
      {/* --- Navigation --- */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/70 backdrop-blur-md">
        <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 shadow-lg shadow-blue-200">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Pharma<span className="text-blue-600">Sight</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-600 font-medium" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md transition-all active:scale-95" asChild>
              <Link href="/auth/register">Register</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* --- Hero Section --- */}
      <section className="relative pt-20 pb-20 md:pt-32">
        <motion.div className="container mx-auto px-6 text-center" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 mb-6 px-4 py-1 rounded-full">Powered by Vertex AI</Badge>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            Predict drug shortages <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">before they hit the shelf.</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            The world's first proactive early-warning system for hospitals. We use graph modeling to alert healthcare providers <strong>3 weeks in advance</strong>.
          </motion.p>
          <motion.div variants={itemVariants} className="flex gap-4 justify-center">
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-10 h-14 text-lg shadow-xl">Get Started</Button>
            <Button size="lg" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl px-10 h-14 text-lg">Watch Demo</Button>
          </motion.div>
        </motion.div>
      </section>

      {/* --- Why We Need This Section --- */}
      <section className="py-20 bg-blue-50/30">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 italic">"Reactive healthcare costs lives."</h2>
            <p className="text-slate-500">Every year, thousands of surgeries are delayed because life-saving medicine isn't there.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 space-y-4">
              <div className="bg-red-100 p-4 rounded-full"><TrendingDown className="text-red-600 w-8 h-8" /></div>
              <h3 className="font-bold text-xl">Supply Blindspots</h3>
              <p className="text-sm text-slate-600">Hospitals currently rely on "backorder" notices—it's usually too late.</p>
            </div>
            <div className="flex flex-col items-center p-6 space-y-4">
              <div className="bg-amber-100 p-4 rounded-full"><AlertTriangle className="text-amber-600 w-8 h-8" /></div>
              <h3 className="font-bold text-xl">300+ Active Gaps</h3>
              <p className="text-sm text-slate-600">The FDA reports record-high shortages in chemotherapy and emergency meds.</p>
            </div>
            <div className="flex flex-col items-center p-6 space-y-4">
              <div className="bg-indigo-100 p-4 rounded-full"><Globe className="text-indigo-600 w-8 h-8" /></div>
              <h3 className="font-bold text-xl">Global Instability</h3>
              <p className="text-sm text-slate-600">PharmaSight tracks geopolitical shifts to predict ripples in the supply chain.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Simulation Section --- */}
      <section className="container mx-auto px-6 pb-24">
        {mounted ? (
          <div className="max-w-5xl mx-auto rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <Tabs defaultValue="shortages" onValueChange={setActiveTab}>
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">System Simulation: Live</span>
                </div>
                <TabsList className="bg-slate-200/50 p-1">
                  <TabsTrigger value="shortages">Live Signals</TabsTrigger>
                  <TabsTrigger value="forecast">Risk Analysis</TabsTrigger>
                </TabsList>
                <div className="hidden md:block text-xs font-mono text-slate-400 italic">
                  UTC: {new Date().toLocaleTimeString()}
                </div>
              </div>

              <div className="p-8 min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeTab} 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === "shortages" ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> Detected Shortage Signals</h3>
                        {[{ drug: "Amoxicillin 500mg", status: "Critical" }, { drug: "Saline Solution 1L", status: "Warning" }].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <span className="font-semibold">{item.drug}</span>
                            <Badge className={item.status === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>{item.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <h3 className="text-lg font-bold">3-Week Probability Curve</h3>
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between mb-2"><span className="text-sm font-medium">Antibiotic Supply Integrity</span><span className="text-sm font-bold text-blue-600">89% Critical</span></div>
                            <Progress value={89} className="h-2 bg-slate-100" />
                          </div>
                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                            <strong>AI Suggestion:</strong> Initiate transfer before stock depletion on May 14th.
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-slate-400">Loading Simulation...</div>
        )}
      </section>

      <footer className="bg-slate-900 py-12 text-slate-400 text-center">
        <div className="container mx-auto px-6">
          <p className="text-white font-bold mb-2">PharmaSight</p>
          <p className="text-sm">Built for Hackathon 2026 • Predicting the future of healthcare.</p>
        </div>
      </footer>
    </div>
  );
}