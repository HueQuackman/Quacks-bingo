import React from 'react';
import { cn } from '@/lib/utils';

export default function OSRSButton({ children, onClick, variant = 'primary', className, disabled }) {
  const baseStyles = "relative px-6 py-2 font-bold text-shadow transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-[#ff981f] border-2 border-[#0a0a0a] shadow-[inset_0_1px_0_#4a4a4a,0_2px_4px_rgba(0,0,0,0.5)] hover:from-[#3a3a3a] hover:to-[#2a2a2a]",
    secondary: "bg-gradient-to-b from-[#4a4a4a] to-[#2a2a2a] text-[#c0c0c0] border-2 border-[#1a1a1a] shadow-[inset_0_1px_0_#6a6a6a,0_2px_4px_rgba(0,0,0,0.5)] hover:from-[#5a5a5a] hover:to-[#3a3a3a]",
    danger: "bg-gradient-to-b from-[#8b2323] to-[#5c1717] text-[#ffcccc] border-2 border-[#3d0f0f] shadow-[inset_0_1px_0_#a84444,0_2px_4px_rgba(0,0,0,0.5)] hover:from-[#9c3030] hover:to-[#6c2020]",
    success: "bg-gradient-to-b from-[#2e5c2e] to-[#1f3d1f] text-[#90ee90] border-2 border-[#142b14] shadow-[inset_0_1px_0_#4a8b4a,0_2px_4px_rgba(0,0,0,0.5)] hover:from-[#3a6d3a] hover:to-[#2a4a2a]"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], className)}
      style={{ fontFamily: "'RuneScape UF', sans-serif" }}
    >
      {children}
    </button>
  );
}