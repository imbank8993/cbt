"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Ghost,
    Calendar,
    Award,
    ArrowRight,
    Clock,
    Sparkles,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getStudentExams, getStudentResultsAction } from '@/app/actions/siswa';
import { useRouter } from 'next/navigation';

export default function SiswaDashboard() {
    const [exams, setExams] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const [ex, res] = await Promise.all([
                    getStudentExams(user.id),
                    getStudentResultsAction(user.id)
                ]);
                setExams(ex);
                setResults(res);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    const formatDay = (dateStr: string) => {
        if (!dateStr) return 'TBA';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }).toUpperCase();
    };

    const formatTime = (startStr: string, endStr: string) => {
        if (!startStr) return '--:-- WIB';
        const s = new Date(startStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const e = endStr ? new Date(endStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...';
        return `${s} - ${e} WIB`;
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <header className="relative p-10 md:p-14 overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary via-primary-light to-[#051163] text-white shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-5 blur-[80px] -ml-20 -mb-20 rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                        >
                            <Sparkles size={12} className="text-accent" /> Student Hub
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase italic">
                            Halo, <span className="text-accent">{user?.user_metadata?.full_name?.split(' ')[0] || 'Siswa'}</span>
                        </h1>
                        <p className="text-white/60 font-bold max-w-md italic text-lg">
                            Siap untuk meraih hasil terbaik hari ini?
                        </p>
                    </div>

                    <div className="flex bg-white/10 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Rata-Rata Nilai</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter">
                                {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + (Number(r.total_score) || 0), 0) / results.length) : 0}
                                <span className="text-lg text-white/50">/100</span>
                            </p>
                        </div>
                        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-accent/20">
                            <Award size={32} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-10">
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter">Ujian Mendatang</h2>
                            <button onClick={() => router.push('/dashboard/siswa/schedule')} className="px-4 py-1.5 bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 hover:bg-accent hover:text-white transition-colors">
                                <span className="w-2 h-2 bg-accent rounded-full animate-ping"></span> Jadwal Anda
                            </button>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="p-12 bg-white border border-slate-100 rounded-[3rem] shadow-premium flex items-center justify-center">
                                    <Loader2 className="animate-spin text-primary" size={40} />
                                </div>
                            ) : exams.length === 0 ? (
                                <div className="p-16 bg-white border border-slate-100 rounded-[3rem] shadow-premium text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                        <Ghost size={32} className="text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-300 uppercase italic tracking-tighter mb-2">Belum Ada Ujian</h3>
                                    <p className="text-slate-400 font-bold italic text-sm">Anda bisa bersantai sejenak.</p>
                                </div>
                            ) : (
                                exams.map((exam, i) => {
                                    const isReady = exam.status === 'active' || exam.status === 'draft' || exam.status === 'scheduled';
                                    return (
                                        <motion.div
                                            key={exam.id || i}
                                            whileHover={{ x: 5, y: -2 }}
                                            className="p-8 bg-white border border-slate-100 hover:border-primary/20 rounded-[2.5rem] flex items-center justify-between group cursor-pointer transition-all shadow-sm hover:shadow-premium"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 bg-primary/5 rounded-[1.5rem] flex flex-col items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <p className="text-[11px] font-black uppercase px-1 text-center group-hover:text-white text-primary tracking-widest">{formatDay(exam.start_time)}</p>
                                                    <Clock size={20} className="text-accent mt-2" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-primary text-xl uppercase italic tracking-tight mb-2 group-hover:text-accent transition-colors">{exam.title}</h3>
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-3 py-1 bg-slate-50 text-primary font-bold text-[10px] uppercase tracking-widest rounded-lg border border-slate-100">{formatTime(exam.start_time, exam.end_time)}</span>
                                                        <span className="px-3 py-1 bg-accent/10 text-accent font-black text-[10px] uppercase tracking-widest rounded-lg">{exam.duration_minutes} Mins</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {exam.isCompleted ? (
                                                <button
                                                    onClick={() => router.push('/dashboard/siswa/results')}
                                                    className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-black px-6 py-3 rounded-2xl flex items-center gap-2 transition-all tracking-widest text-[10px] uppercase"
                                                >
                                                    Selesai <CheckCircle2 size={16} />
                                                </button>
                                            ) : isReady ? (
                                                <button
                                                    onClick={() => router.push(`/dashboard/siswa/exam/${exam.id}`)}
                                                    className="bg-primary hover:bg-primary-light text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all group-hover:shadow-lg group-hover:shadow-primary/20 tracking-widest text-[10px] uppercase"
                                                >
                                                    Mulai <ArrowRight size={16} />
                                                </button>
                                            ) : (
                                                <div className="text-slate-400 font-black text-[10px] tracking-widest uppercase italic px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">{exam.status}</div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[3rem] shadow-premium p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h2 className="text-2xl font-black text-primary uppercase italic tracking-tighter mb-8">Riwayat Nilai</h2>
                        <div className="space-y-8 relative z-10">
                            {results.length === 0 ? (
                                <p className="text-sm font-medium text-slate-400 italic text-center py-4">Belum ada ujian yang diselesaikan.</p>
                            ) : (
                                results.slice(0, 3).map((res, i) => (
                                    <div key={res.id || i} className="group">
                                        <div className="flex justify-between items-end mb-3">
                                            <p className="font-black text-primary uppercase italic tracking-tight group-hover:text-accent transition-colors truncate pr-4">{res.exams?.title || 'Ujian'}</p>
                                            <p className="text-sm font-black text-slate-500 italic shrink-0"><span className="text-primary text-xl">{Number(res.total_score).toFixed(0)}</span>/100</p>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, Math.max(0, Number(res.total_score) || 0))}%` }}
                                                transition={{ duration: 1, delay: i * 0.2 }}
                                                className="h-full bg-accent rounded-full"
                                            ></motion.div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <button onClick={() => router.push('/dashboard/siswa/results')} className="w-full text-center text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-primary pt-6 border-t border-slate-100 transition-colors">
                                Lihat Laporan Lengkap
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
