"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Globe, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/20 overflow-hidden relative font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] gaussian-blur blur-navy-white opacity-40"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] gaussian-blur blur-orange-white opacity-20"></div>
      <div className="noise-bg opacity-[0.015]"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 p-6 md:p-10 backdrop-blur-md border-b border-slate-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-[1.25rem] flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-primary/20">U</div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">UNELMA<span className="text-accent">CBT</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-black/10">
                Portal Login
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-56 pb-32 relative">
        <div className="text-center max-w-4xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2.5 bg-primary/5 border border-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-10"
          >
            <Sparkles size={14} /> The Elite Assessment Infrastructure
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-12 uppercase italic"
          >
            Precision <br />
            <span className="text-primary italic">Assessment <span className="text-slate-200">/</span></span> <br />
            <span className="text-accent">Unelma.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 font-bold leading-relaxed max-w-2xl mx-auto mb-16 italic"
          >
            Satu platform, ribuan kemungkinan. Kelola ujian digital institusi anda dengan keamanan tingkat enterprise dan visual yang memukau.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <Link href="/login">
              <button className="px-14 py-6 bg-primary hover:bg-blue-700 text-white font-black rounded-2xl shadow-2xl shadow-primary/30 transition-all active:scale-95 text-xs uppercase tracking-[0.2em] flex items-center gap-4">
                Enter Dashboard <ArrowRight size={22} />
              </button>
            </Link>
            <button className="px-14 py-6 bg-white hover:bg-slate-50 text-slate-900 font-black rounded-2xl border border-slate-200 transition-all text-xs uppercase tracking-[0.2em] shadow-sm">
              Explore Solutions
            </button>
          </motion.div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: 'Global Multi-Tenant', desc: 'Isolasi data sempurna untuk institusi berskala besar dengan manajemen terpusat.', icon: Globe, accent: 'text-primary' },
            { title: 'Elite Security Guard', desc: 'Sistem anti-kecurangan berbasis algoritma cerdas yang memantau setiap aktivitas.', icon: ShieldCheck, accent: 'text-emerald-500' },
            { title: 'Peak Performance', desc: 'Infrastruktur cloud yang mampu menangani jutaan request simultan tanpa lag.', icon: Zap, accent: 'text-accent' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-12 bg-white border border-slate-100 rounded-[3.5rem] shadow-premium group hover:border-primary/20 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <feature.icon className={`${feature.accent} mb-8 transition-transform group-hover:scale-110 group-hover:rotate-6`} size={48} strokeWidth={2.5} />
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase italic">{feature.title}</h3>
              <p className="text-slate-400 font-bold italic leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="max-w-7xl mx-auto px-10 py-20 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 rounded-t-[4rem]">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-300 italic mb-2">Powered by</p>
          <h3 className="text-xl font-black text-slate-900 tracking-tighter">UNELMA<span className="text-accent italic">TECHNOLOGIES</span></h3>
        </div>
        <div className="flex gap-12 mt-10 md:mt-0 items-center">
          <span className="text-primary font-black text-[10px] uppercase tracking-widest cursor-pointer hover:underline underline-offset-8">Support Hub</span>
          <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:text-slate-900">Enterprise Privacy</span>
          <p className="text-slate-300 font-bold text-[10px] uppercase tracking-[0.2em] italic">© 2026 UNELMA-CBT. EST 2024</p>
        </div>
      </footer>
    </div>
  );
}
