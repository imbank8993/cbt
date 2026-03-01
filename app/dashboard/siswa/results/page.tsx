"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Clock, Loader2, RefreshCw } from 'lucide-react';
import { getStudentResultsAction } from '@/app/actions/siswa';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function StudentResultsPage() {
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const data = await getStudentResultsAction(user.id);
            setResults(data);
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight italic uppercase mb-2">
                        Hasil <span className="text-primary">Studi</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">Rekapitulasi performa dan nilai ujian Anda.</p>
                </div>
                <button
                    onClick={loadResults}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 px-6 py-3 rounded-full font-bold transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    Muat Ulang
                </button>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={48} className="text-primary animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((attempt) => {
                        const canViewDetails = attempt.exams?.show_results && !attempt.needs_manual_grading;

                        return (
                            <motion.div
                                layout
                                key={attempt.id}
                                onClick={() => canViewDetails ? router.push(`/dashboard/siswa/results/${attempt.id}`) : null}
                                className={`bg-white border border-slate-100 rounded-[2rem] p-8 group transition-all relative overflow-hidden flex flex-col ${canViewDetails ? 'cursor-pointer hover:border-primary/20 hover:shadow-premium cursor-pointer' : 'opacity-90'}`}
                            >
                                <div className={`absolute top-0 left-0 w-2 h-full bg-slate-100 transition-colors ${canViewDetails ? 'group-hover:bg-primary' : ''}`}></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border bg-emerald-50 text-emerald-600 border-emerald-100">
                                        SELESAI
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                    {/* @ts-ignore : nested relation */}
                                    {attempt.exams?.title || 'Ujian Tidak Diketahui'}
                                </h3>

                                <div className="flex items-center gap-3 text-slate-500 mb-8 mt-4">
                                    <Clock size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        {new Date(attempt.finished_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </span>
                                </div>

                                <div className="mt-auto pt-6 border-t border-slate-100">
                                    <div className="flex items-end justify-between">
                                        {attempt.needs_manual_grading ? (
                                            <div className="w-full flex justify-end">
                                                <div className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 text-[10px] font-black uppercase tracking-widest text-right">
                                                    Menunggu<br />Penilaian Guru
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Nilai Akhir</span>
                                                    {canViewDetails && (
                                                        <span className="text-[10px] font-bold text-primary italic">Klik untuk detail</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-4xl font-black text-primary tracking-tighter">
                                                        {Number(attempt.total_score).toFixed(0)}
                                                    </span>
                                                    <span className="text-lg font-bold text-slate-300">/100</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}

                    {results.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[2rem]">
                            <Award size={64} className="text-slate-200 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tight mb-2">Belum Ada Hasil</h3>
                            <p className="text-slate-500 max-w-md mx-auto">Anda belum menyelesaikan ujian apapun. Hasil ujian akan muncul di sini setelah Anda mengumpulkannya.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
