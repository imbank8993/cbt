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
            <header className="relative p-10 md:p-14 overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary via-primary-light to-[#051163] text-white shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-5 blur-[80px] -ml-20 -mb-20 rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                        >
                            <Library size={12} className="text-accent" /> Assessment Center
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase italic">
                            Teacher <span className="text-accent">Workspace</span>
                        </h1>
                        <p className="text-white/60 font-bold max-w-md italic text-lg">
                            Pusat Pengelolaan Bank Soal & Aktivitas Penilaian Kelas Anda.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => router.push('/dashboard/guru/questions')} className="bg-white/10 hover:bg-white/20 text-white font-black px-8 py-5 rounded-2xl border border-white/10 transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
                            <BookOpen size={16} className="text-accent" /> Statistik Bank
                        </button>
                        <button onClick={() => router.push('/dashboard/guru/questions?action=new')} className="bg-accent hover:bg-orange-500 text-white font-black px-8 py-5 rounded-2xl shadow-xl shadow-accent/20 transition-all flex items-center gap-3 text-[10px] uppercase tracking-widest">
                            <FilePlus size={16} /> Buat Bank Soal
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
                                    <span className="bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] italic">{bank.type}</span>
                                </div>
                                <h3 className="text-xl font-black text-primary mb-2 leading-tight uppercase italic group-hover:text-accent transition-colors">{bank.title}</h3>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest italic pt-4 mt-4 border-t border-slate-50">
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
                        <p className="text-white font-black text-xl leading-snug mb-8 uppercase italic">Terdapat 12 jawaban essay ujian yang menunggu hasil penilaian Anda.</p>
                        <button onClick={() => router.push('/dashboard/guru/grading')} className="w-full bg-white text-primary hover:bg-accent hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg italic">
                            Mulai Menilai
                        </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-[3rem] p-10 relative overflow-hidden group">
                        <h4 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[9px] mb-6 italic">Support Center</h4>
                        <p className="text-primary font-black text-base mb-6 italic uppercase leading-tight">Butuh bantuan membuat soal berstandar CBT rasional?</p>
                        <button onClick={() => window.open('https://unelma.co.id/support', '_blank')} className="text-accent font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all italic">
                            Akses Panduan <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { ArrowRight } from 'lucide-react';
