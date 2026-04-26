"use client";

import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Activity } from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

type Batch = {
  batch_no: string;
  expiry_date: string;
  qty: string | number;
};

// Use the same interface from your InventoryTable for consistency
interface Drug {
  _id?: string;
  id?: string;
  name?: string;
  drug?: string; // Modal mapping
  stock?: number;
  counted_stock?: number; // Modal mapping
  usageHistory?: number[];
  daily_usage?: number[]; // Modal mapping
  hospitalType?: 'rural' | 'urban';
  hospital_type?: 'rural' | 'urban'; // Modal mapping
  coldChainIntact?: boolean;
  cold_chain_intact?: boolean; // Modal mapping
  region?: string;
  batches: Batch[];
}

export const DashboardCharts = ({ drugs = [] }: { drugs: Drug[] }) => {

  // 1. DATA TRANSFORMATION: Prepare data for Chart 1 (Stock vs Forecast)
  const barChartData = useMemo(() => {
    return drugs.slice(0, 5).map(item => {
      const name = item.name || item.drug || "Unknown";
      const stock = item.stock ?? item.counted_stock ?? 0;
      const history = item.usageHistory || item.daily_usage || [0, 0, 0];
      
      // Calculate avg demand from the 3 history points
      const avgDemand = history.length > 0 
        ? (history.reduce((a, b) => a + b, 0) / history.length) 
        : 0;

      return {
        name: name.length > 10 ? name.substring(0, 10) + '...' : name,
        full_name: name,
        stock: stock,
        demand: parseFloat(avgDemand.toFixed(1))
      };
    });
  }, [drugs]);

  // 2. DATA TRANSFORMATION: Prepare data for Chart 2 (Trend Analysis)
  // We use the first drug in the list to show its specific consumption trend
  const trendData = useMemo(() => {
    if (drugs.length === 0) return [];
    
    const targetDrug = drugs[0];
    const history = targetDrug.usageHistory || targetDrug.daily_usage || [0, 0, 0];
    
    // Map the 3 history points to "Days Ago"
    return history.map((val, index) => ({
      day: `Day ${index + 1}`,
      usage: val
    }));
  }, [drugs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
      
      {/* Chart 1: Stock vs. AI Demand Projection */}
      <Card className="p-6 border-none shadow-xl bg-white dark:bg-slate-900">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <ArrowUpRight className="h-4 w-4 text-blue-600" /> 
              Stock vs. Forecast
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top 5 Inventory Items</p>
          </div>
        </div>

        <div className="h-72">
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" aspect={2}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={11} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8'}}
                />
                <YAxis 
                  fontSize={11} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8'}}
                />
                <Tooltip 
                  cursor={{fill: '#F8FAFC'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle" 
                  wrapperStyle={{fontSize: '12px', paddingBottom: '20px'}} 
                />
                <Bar 
                  dataKey="stock" 
                  name="Current Stock" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={25} 
                />
                <Bar 
                  dataKey="demand" 
                  name="Predicted Demand" 
                  fill="#e2e8f0" 
                  radius={[6, 6, 0, 0]} 
                  barSize={25} 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
              Awaiting data for analysis...
            </div>
          )}
        </div>
      </Card>

      {/* Chart 2: Consumption Flow (Trend Analysis) */}
      <Card className="p-6 border-none shadow-xl bg-white dark:bg-slate-900">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Activity className="h-4 w-4 text-purple-600" /> 
              Real-time Consumption Flow
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {drugs[0] ? `Active Trend: ${drugs[0].name || drugs[0].drug}` : 'No Data Detected'}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] border-purple-100 text-purple-600">
            LIVE SENSOR DATA
          </Badge>
        </div>

        <div className="h-72">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" aspect={2}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8'}}
                />
                <YAxis 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8'}}
                />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="usage" 
                  name="Units Consumed" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorUsage)" 
                  strokeWidth={4} 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
              No consumption trends available...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};