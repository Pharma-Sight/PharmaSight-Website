// "use client";

// import React, { useState, useEffect, useMemo } from 'react';
// import { motion, AnimatePresence, Variants } from 'framer-motion';
// import { 
//   ArrowRight, BrainCircuit, Building, ShieldCheck, 
//   Zap, PackageSearch, Activity, AlertTriangle, 
//   TrendingDown, Globe, MousePointerClick
// } from 'lucide-react';
// import Link from 'next/link';
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// const containerVariants: Variants = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1, transition: { staggerChildren: 0.05 } }, // Faster stagger
// };

// const itemVariants: Variants = {
//   hidden: { y: 10, opacity: 0 }, // Reduced movement range
//   visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 20 } },
// };

// export default function PharmaSightLanding() {
//   const [activeTab, setActiveTab] = useState("shortages");
//   const [mounted, setMounted] = useState(false);
//   const [time, setTime] = useState("");

//   // Handle Mounting and Clock Leak
//   useEffect(() => {
//     setMounted(true);
    
//     // Update time every second without re-rendering the whole page logic
//     const timer = setInterval(() => {
//       setTime(new Date().toLocaleTimeString());
//     }, 1000);

//     return () => clearInterval(timer); // Cleanup interval on unmount
//   }, []);

//   // Memoize static data to prevent re-allocation on every render
//   const shortageData = useMemo(() => [
//     { drug: "Amoxicillin 500mg", status: "Critical" },
//     { drug: "Saline Solution 1L", status: "Warning" }
//   ], []);

//   if (!mounted) {
//     return <div className="min-h-screen bg-white" />; // Minimal flash of white
//   }

//   return (
//     <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      
//       {/* --- Navigation --- */}
//       <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/70 backdrop-blur-md">
//         <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
//           <Link href="/" className="flex items-center gap-2">
//             <img src="/icon.png" alt="PharmaSight Logo" className="w-14 h-14 rounded-lg object-contain"
//             />
//             <span className="text-xl font-bold tracking-tight text-slate-900">
//               Pharma<span className="text-blue-600">Sight</span>
//             </span>
//           </Link>

//           <div className="flex items-center gap-3">
//             <Button variant="ghost" className="text-slate-600 font-medium" asChild>
//               <Link href="/auth/login">Log in</Link>
//             </Button>
//             <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md transition-all active:scale-95" asChild>
//               <Link href="/auth/register">Register</Link>
//             </Button>
//           </div>
//         </nav>
//       </header>

//       {/* --- Hero Section --- */}
//       <section className="relative pt-20 pb-20 md:pt-32">
//         <motion.div 
//           className="container mx-auto px-6 text-center" 
//           initial="hidden" 
//           animate="visible" 
//           variants={containerVariants}
//         >
//           <motion.div variants={itemVariants}>
//             <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 mb-6 px-4 py-1 rounded-full">Powered by Vertex AI</Badge>
//           </motion.div>
//           <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
//             Predict drug shortages <br/>
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">before they hit the shelf.</span>
//           </motion.h1>
//           <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
//             The world&apos;s first proactive early-warning system for hospitals. We use graph modeling to alert healthcare providers <strong>3 weeks in advance</strong>.
//           </motion.p>
//           <motion.div variants={itemVariants} className="flex gap-4 justify-center">
//             <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-10 h-14 text-lg shadow-xl">Get Started</Button>
//             <Button size="lg" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl px-10 h-14 text-lg">Watch Demo</Button>
//           </motion.div>
//         </motion.div>
//       </section>

//       {/* --- Why We Need This Section --- */}
//       <section className="py-20 bg-blue-50/30">
//         <div className="container mx-auto px-6 text-center">
//           <div className="max-w-3xl mx-auto mb-16">
//             <h2 className="text-3xl font-bold mb-4 italic">&quot;Reactive healthcare costs lives.&quot;</h2>
//             <p className="text-slate-500">Every year, thousands of surgeries are delayed because life-saving medicine isn&apos;t there.</p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <div className="flex flex-col items-center p-6 space-y-4">
//               <div className="bg-red-100 p-4 rounded-full"><TrendingDown className="text-red-600 w-8 h-8" /></div>
//               <h3 className="font-bold text-xl">Supply Blindspots</h3>
//               <p className="text-sm text-slate-600">Hospitals currently rely on &quot;backorder&quot; notices—it&quot;s usually too late.</p>
//             </div>
//             <div className="flex flex-col items-center p-6 space-y-4">
//               <div className="bg-amber-100 p-4 rounded-full"><AlertTriangle className="text-amber-600 w-8 h-8" /></div>
//               <h3 className="font-bold text-xl">300+ Active Gaps</h3>
//               <p className="text-sm text-slate-600">The FDA reports record-high shortages in chemotherapy and emergency meds.</p>
//             </div>
//             <div className="flex flex-col items-center p-6 space-y-4">
//               <div className="bg-indigo-100 p-4 rounded-full"><Globe className="text-indigo-600 w-8 h-8" /></div>
//               <h3 className="font-bold text-xl">Global Instability</h3>
//               <p className="text-sm text-slate-600">PharmaSight tracks geopolitical shifts to predict ripples in the supply chain.</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* --- Simulation Section --- */}
//       <section className="container mx-auto px-6 pb-24">
//         <div className="max-w-5xl mx-auto rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
//           <Tabs defaultValue="shortages" onValueChange={setActiveTab}>
//             <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
//                 <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">System Simulation: Live</span>
//               </div>
//               <TabsList className="bg-slate-200/50 p-1">
//                 <TabsTrigger value="shortages">Live Signals</TabsTrigger>
//                 <TabsTrigger value="forecast">Risk Analysis</TabsTrigger>
//               </TabsList>
//               <div className="hidden md:block text-xs font-mono text-slate-400 italic">
//                 UTC: {time || "Loading..."}
//               </div>
//             </div>

//             <div className="p-8 min-h-[400px]">
//               <AnimatePresence mode="wait">
//                 <motion.div 
//                   key={activeTab} 
//                   initial={{ opacity: 0, y: 5 }} 
//                   animate={{ opacity: 1, y: 0 }} 
//                   exit={{ opacity: 0, y: -5 }} 
//                   transition={{ duration: 0.2 }}
//                 >
//                   {activeTab === "shortages" ? (
//                     <div className="space-y-4">
//                       <h3 className="text-lg font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> Detected Shortage Signals</h3>
//                       {shortageData.map((item, i) => (
//                         <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
//                           <span className="font-semibold">{item.drug}</span>
//                           <Badge className={item.status === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>{item.status}</Badge>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="space-y-8">
//                       <h3 className="text-lg font-bold">3-Week Probability Curve</h3>
//                       <div className="space-y-6">
//                         <div>
//                           <div className="flex justify-between mb-2"><span className="text-sm font-medium">Antibiotic Supply Integrity</span><span className="text-sm font-bold text-blue-600">89% Critical</span></div>
//                           <Progress value={89} className="h-2 bg-slate-100" />
//                         </div>
//                         <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
//                           <strong>AI Suggestion:</strong> Initiate transfer before stock depletion on May 14th.
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </motion.div>
//               </AnimatePresence>
//             </div>
//           </Tabs>
//         </div>
//       </section>

//       <footer className="bg-slate-900 py-12 text-slate-400 text-center">
//         <div className="container mx-auto px-6">
//           <p className="text-white font-bold mb-2">PharmaSight</p>
//           <p className="text-sm">Built for Hackathon 2026 • Predicting the future of healthcare.</p>
//         </div>
//       </footer>
//     </div>
//   );
// }


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
            <div className="z-10">
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
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl px-8 h-14 text-base border-slate-200"
                >
                  Watch Demo
                </Button>
              </motion.div>
            </div>

            {/* RIGHT IMAGE - Cleaned up to prevent text overlap */}
            <motion.div variants={itemVariants} className="relative lg:ml-4">
              <div className="absolute -inset-10 bg-blue-400/10 blur-[100px] rounded-full" />
              <div className="relative">
                <img
                  src="/healthcare.png" alt="PharmaSight Dashboard"
                  className="rounded-3xl border border-slate-200 shadow-2xl w-full"
                />
                {/* Fixed Accuracy Badge */}
                <div className="absolute -bottom-6 right-10 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="text-emerald-600 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400 font-bold tracking-wider">
                      Forecast Accuracy
                    </p>
                    <p className="text-3xl font-black text-slate-900">94.2%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
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
                    PharmaSight transforms the procurement process from a guessing game into a 
                    data-driven science. By integrating directly with hospital inventory systems, 
                    we analyze "Usage Velocity"—the speed at which different drugs are being 
                    consumed across departments.
                  </p>
                  <p>
                    Our proprietary algorithms don't just look at what you have today; they 
                    forecast what you will need three weeks from now. By correlating internal 
                    usage data with external supply signals, PharmaSight provides a centralized 
                    command center where procurement officers can see pending shortages 
                    long before they become emergencies.
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
                    The result is a resilient healthcare infrastructure. Facilities using PharmaSight 
                    have seen a significant reduction in emergency drug procurement costs and a 
                    drastic decrease in "Stock-Out" events.
                  </p>
                  <p>
                    Beyond the numbers, the impact is felt in the quality of care. Doctors can 
                    prescribe with confidence, knowing the inventory will be there. Suppliers can 
                    optimize their delivery routes based on predicted needs, and most importantly, 
                    patients receive uninterrupted treatment. We are moving healthcare from panic 
                    mode to prediction mode.
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