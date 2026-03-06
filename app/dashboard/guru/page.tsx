"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    FilePlus,
    Library,
    Search,
    Filter,
    CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GuruDashboard() {
    const router = useRouter();
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <header className="relative p-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary-light to-[#051163] text-white shadow-xl shadow-primary/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-10 blur-[80px] -mr-20 -mt-20 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 blur-[60px] -ml-16 -mb-16 rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest mb-4"
                        >
                            <Library size={10} className="text-accent" /> Unelma CBT System
                        </motion.div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 uppercase text-white">
                            Guru <span className="text-accent">Panel</span>
                        </h1>
                        <p className="text-white/60 font-bold max-w-sm text-sm">
                            Kelola Bank Soal & Aktivitas Penilaian Anda.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => router.push('/dashboard/guru/questions')} className="bg-white/10 hover:bg-white/20 text-white font-black px-6 py-4 rounded-xl border border-white/10 transition-all text-[9px] uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
                            <BookOpen size={14} className="text-accent" /> Statistik
                        </button>
                        <button onClick={() => router.push('/dashboard/guru/questions?action=new')} className="bg-accent hover:bg-orange-500 text-white font-black px-6 py-4 rounded-xl shadow-lg transition-all flex items-center gap-2 text-[9px] uppercase tracking-widest">
                            <FilePlus size={14} /> Buat Bank Soal
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-4 gap-10">
                <div className="lg:col-span-3 space-y-10">
                    {/* Search Area */}
                    <div className="flex items-center gap-6 p-2 bg-white border border-slate-100 rounded-3xl shadow-sm">
                        <div className="flex-1 relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input
                                type="text"
                                placeholder="Cari soal, paket, atau kategori..."
                                className="w-full bg-transparent border-none py-4 pl-16 pr-6 text-slate-900 font-bold outline-none placeholder:text-slate-300 text-sm"
                            />
                        </div>
                        <button className="p-4 mr-2 bg-slate-50 rounded-2xl text-primary font-black uppercase text-[10px] hover:bg-primary hover:text-white transition-all">
                            Filter
                        </button>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { title: 'Matematika Umum 1A', count: 45, type: 'MCQ', color: 'bg-primary' },
                            { title: 'Fisika Kuantum XI', count: 20, type: 'Mixed', color: 'bg-primary-light' },
                            { title: 'Bahasa Indonesia Dasar', count: 32, type: 'Essay', color: 'bg-slate-800' },
                            { title: 'Kimia Organik XII', count: 50, type: 'MCQ', color: 'bg-accent' },
                        ].map((bank, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-premium hover:border-primary/20 transition-all relative overflow-hidden group"
                            >
                                <div className={`absolute top-0 left-0 w-2 h-full ${bank.color}`}></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm ${bank.color}`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">{bank.type}</span>
                                </div>
                                <h3 className="text-xl font-black text-primary mb-2 leading-tight uppercase group-hover:text-accent transition-colors">{bank.title}</h3>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4 mt-4 border-t border-slate-50">
                                    <CheckCircle2 size={16} className={bank.color === 'bg-accent' ? 'text-primary' : 'text-accent'} /> {bank.count} Item Terverifikasi
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Notification Card */}
                    <div className="bg-primary border border-primary-light rounded-[3rem] p-10 shadow-2xl shadow-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h4 className="text-accent font-black uppercase tracking-[0.2em] text-[9px] mb-6 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></div> ACTION REQUIRED</h4>
                        <p className="text-white font-black text-xl leading-snug mb-8 uppercase">Terdapat 12 jawaban essay ujian yang menunggu hasil penilaian Anda.</p>
                        <button onClick={() => router.push('/dashboard/guru/grading')} className="w-full bg-white text-primary hover:bg-accent hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg">
                            Mulai Menilai
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

import { ArrowRight } from 'lucide-react';
