"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAttemptDetailsAction } from '@/app/actions/siswa';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Info, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentResultDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const attemptId = params.attemptId as string;

    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<any>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const data = await getAttemptDetailsAction(attemptId, user.id);
                setDetails(data);
            }
            setLoading(false);
        }
        load();
    }, [attemptId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 size={48} className="text-primary animate-spin" />
            </div>
        );
    }

    if (!details) {
        return (
            <div className="p-10 text-center bg-white border border-slate-100 rounded-[2rem]">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4">
                    Data tidak ditemukan atau Anda tidak memiliki akses untuk melihat detail hasil ujian ini.
                </p>
                <button onClick={() => router.push('/dashboard/siswa/results')} className="text-primary font-bold uppercase tracking-widest text-sm hover:underline">
                    Kembali ke Daftar Hasil
                </button>
            </div>
        );
    }

    const { attempt, answers } = details;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button onClick={() => router.push('/dashboard/siswa/results')} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-widest text-xs mb-4">
                        <ArrowLeft size={16} /> Kembali
                    </button>
                    <h1 className="text-3xl font-black text-primary uppercase italic tracking-tight mb-2">
                        Detail Jawaban
                    </h1>
                    <div className="flex items-center gap-3 text-slate-500 font-medium">
                        {attempt.exams?.title}
                    </div>
                </div>

                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Nilai Akhir</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-primary tracking-tighter leading-none">{Number(attempt.total_score).toFixed(0)}</span>
                            <span className="text-lg font-bold text-slate-300">/100</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="space-y-6">
                {answers.map((ans: any, idx: number) => {
                    const qInfo = ans.bank_questions;
                    const isEssay = ['essay', 'esay', 'uraian'].includes(qInfo?.type?.toLowerCase());
                    let optionsObj: any = {};
                    if (!isEssay && qInfo?.options) {
                        try {
                            optionsObj = typeof qInfo.options === 'string' ? JSON.parse(qInfo.options) : qInfo.options;
                        } catch (e) {
                            console.error('Failed to parse options', e);
                        }
                    }

                    const isCorrect = ans.is_correct;
                    const studentAnswerText = isEssay ? ans.essay_answer : (optionsObj[ans.answer] || ans.answer);
                    const correctAnswerText = isEssay ? null : (optionsObj[ans.correctAnswer] || ans.correctAnswer);

                    return (
                        <motion.div key={ans.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`bg-white rounded-[2rem] border overflow-hidden shadow-sm ${isCorrect ? 'border-emerald-100/50' : isEssay ? 'border-slate-100' : 'border-rose-100/50'}`}>

                            <div className={`px-6 py-4 border-b flex justify-between items-center ${isCorrect ? 'bg-emerald-50/50 border-emerald-50' : isEssay ? 'bg-slate-50/50 border-slate-100' : 'bg-rose-50/50 border-rose-50'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shadow-sm">
                                        {idx + 1}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Bobot: {qInfo?.score_default || 1} poin
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEssay ? (
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-lg">
                                            Nilai Didapat: {ans.score || 0}
                                        </div>
                                    ) : isCorrect ? (
                                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest bg-emerald-100 px-3 py-1.5 rounded-lg">
                                            <CheckCircle2 size={16} /> Benar
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-widest bg-rose-100 px-3 py-1.5 rounded-lg">
                                            <XCircle size={16} /> Salah
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="prose prose-slate max-w-none mb-8" dangerouslySetInnerHTML={{ __html: qInfo?.question }} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={`p-5 rounded-2xl border ${isEssay ? 'bg-slate-50 border-slate-100' : isCorrect ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' : 'bg-rose-50/50 border-rose-100 text-rose-900'}`}>
                                        <span className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isEssay ? 'text-slate-400' : isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            Jawaban Anda
                                        </span>
                                        <div className="font-medium whitespace-pre-wrap">
                                            {studentAnswerText || <span className="italic opacity-50">Tidak dijawab</span>}
                                        </div>
                                    </div>

                                    {!isEssay && !isCorrect && correctAnswerText && (
                                        <div className="p-5 rounded-2xl border bg-emerald-50/30 border-emerald-100 text-emerald-900">
                                            <span className="text-[10px] font-black uppercase tracking-widest mb-2 block text-emerald-500">
                                                Jawaban Benar
                                            </span>
                                            <div className="font-medium whitespace-pre-wrap">
                                                {correctAnswerText}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {ans.explanation && (
                                    <div className="mt-6 p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info size={16} className="text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                                                Pembahasan
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-blue-900 leading-relaxed whitespace-pre-wrap">
                                            {ans.explanation}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
