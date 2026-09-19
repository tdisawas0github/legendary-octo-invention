"use client";

import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
}

export default function StatCard({ label, value, icon, color = "text-violet-500" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 text-slate-800`}>{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl bg-slate-50 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
