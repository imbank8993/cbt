"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    CalendarDays,
    Clock,
    CheckCircle2,
    ArrowRight,
    Ghost,
    Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getStudentExams } from '@/app/actions/siswa';
import { useRouter } from 'next/navigation';

export default function SiswaSchedulePage() {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const ex = await getStudentExams(user.id);
                setExams(ex);
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
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <header className="relative p-8 md:p-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-light to-[#051163] text-white shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-10 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-5 blur-[80px] -ml-20 -mb-20 rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4 mb-2">
                            <CalendarDays size={36} className="text-accent" />
                            Jadwal Ujian
                        </h2>
                        <p className="text-white/60 font-bold max-w-md text-base">
                            Daftar semua ujian yang dijadwalkan untuk Anda.
                        </p>
                    </div>
                </div>
            </header>

            {/* List of Exams Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                        Agenda Ujian
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        <div className="p-12 bg-white border border-slate-100 rounded-[2rem] shadow-premium flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="p-16 bg-white border border-slate-100 rounded-[2rem] shadow-premium text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <Ghost size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-300 uppercase tracking-tighter mb-2">Belum Ada Ujian</h3>
                            <p className="text-slate-400 font-bold text-sm">Tidak ada jadwal ujian untuk saat ini.</p>
                        </div>
                    ) : (
                        exams.map((exam, i) => {
                            const isReady = exam.status === 'active' || exam.status === 'draft' || exam.status === 'scheduled';
                            return (
                                <motion.div
                                    key={exam.id || i}
                                    whileHover={{ x: 5, y: -2 }}
                                    className="p-8 bg-white border border-slate-100 hover:border-primary/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 group cursor-pointer transition-all shadow-sm hover:shadow-premium"
                                >
                                    <div className="flex items-center gap-6 flex-1 w-full">
                                        <div className="w-20 h-20 bg-primary/5 rounded-[1.5rem] flex flex-col items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                            <p className="text-[11px] font-black uppercase px-1 text-center group-hover:text-white text-primary tracking-widest">{formatDay(exam.start_time)}</p>
                                            <Clock size={20} className="text-accent mt-2" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="font-black text-primary text-xl uppercase tracking-tight mb-2 group-hover:text-accent transition-colors truncate">{exam.title}</h3>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="px-3 py-1 bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-slate-100">{formatTime(exam.start_time, exam.end_time)}</span>
                                                <span className="px-3 py-1 bg-accent/10 text-accent font-black text-[10px] uppercase tracking-widest rounded-lg">{exam.duration_minutes} Menit</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto mt-4 md:mt-0">
                                        {exam.isCompleted ? (
                                            <button
                                                onClick={() => router.push('/dashboard/siswa/results')}
                                                className="w-full md:w-auto bg-emerald-50 text-emerald-600 border border-emerald-200 font-black px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all tracking-widest text-[10px] uppercase"
                                            >
                                                Selesai <CheckCircle2 size={16} />
                                            </button>
                                        ) : isReady ? (
                                            <button
                                                onClick={() => router.push(`/dashboard/siswa/exam/${exam.id}`)}
                                                className="w-full md:w-auto bg-primary hover:bg-primary-light text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group-hover:shadow-lg group-hover:shadow-primary/20 tracking-widest text-[10px] uppercase"
                                            >
                                                Kerjakan <ArrowRight size={16} />
                                            </button>
                                        ) : (
                                            <div className="flex justify-center md:justify-end">
                                                <div className="text-slate-400 font-black text-[10px] tracking-widest uppercase px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">{exam.status}</div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </section>
        </div>
    );
}
