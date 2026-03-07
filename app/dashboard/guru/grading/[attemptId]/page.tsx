"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAttemptDetailsForGrading, submitEssayGradesAction } from '@/app/actions/guru';
import { Loader2, ArrowLeft, Save, User, CheckCircle2, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { QuestionRenderer } from '@/app/components/questions/QuestionRenderer';
import { LatexRenderer } from '@/app/components/questions/LatexRenderer';

export default function GradeEssayPage() {
    const params = useParams();
    const router = useRouter();
    const attemptId = params.attemptId as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [details, setDetails] = useState<any>(null);
    const [grades, setGrades] = useState<Record<string, number>>({});

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getAttemptDetailsForGrading(attemptId);
            if (data) {
                setDetails(data);
                const initialGrades: Record<string, number> = {};
                data.essayAnswers.forEach((a: any) => {
                    initialGrades[a.id] = a.score || 0;
                });
                setGrades(initialGrades);
            }
            setLoading(false);
        }
        load();
    }, [attemptId]);

    const handleGradeChange = (answerId: string, val: string) => {
        setGrades(prev => ({
            ...prev,
            [answerId]: parseFloat(val) || 0
        }));
    };

    const handleSave = async () => {
        if (!confirm('Simpan nilai uraian? Total nilai akhir akan dihitung kembali dan status ujian akan berubah menjadi Selesai.')) return;
        setSubmitting(true);
        const res = await submitEssayGradesAction(attemptId, grades);
        if (res.success) {
            alert('Berhasil menyimpan nilai!');
            router.push('/dashboard/guru/grading');
        } else {
            alert('Gagal: ' + res.error);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 size={48} className="text-rose-500 animate-spin" />
            </div>
        );
    }

    if (!details || details.essayAnswers.length === 0) {
        return (
            <div className="p-10 text-center bg-white border border-slate-100 rounded-[2rem]">
                <p className="text-slate-400 font-bold">Data ujian tidak ditemukan atau tidak ada soal uraian.</p>
                <button onClick={() => router.back()} className="mt-4 text-rose-500 font-bold uppercase tracking-widest text-sm hover:underline">
                    Kembali
                </button>
            </div>
        );
    }

    /* @ts-ignore */
    const studentName = details.attempt.profiles?.full_name || 'Tanpa Nama';
    /* @ts-ignore */
    const examTitle = details.attempt.exams?.title || 'Ujian';

    return (
        <div className="space-y-10 pb-20 animate-in fade-in zoom-in-95 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/50 p-8 rounded-[2.5rem] border border-slate-100 backdrop-blur-xl shadow-sm">
                <div>
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black uppercase tracking-[0.2em] text-[10px] mb-6 group">
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Kembali ke Daftar
                    </button>
                    <h1 className="text-4xl font-black text-[#030c4d] uppercase tracking-tighter mb-3 leading-none">
                        Penilaian Uraian
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                            <User size={14} className="text-primary" />
                            <span className="font-black text-[10px] text-primary uppercase tracking-widest">{studentName}</span>
                        </div>
                        <span className="text-slate-200">/</span>
                        <div className="flex items-center gap-2 text-slate-500">
                            <CheckCircle2 size={14} />
                            <span className="font-bold text-xs">{examTitle}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className="bg-[#030c4d] hover:bg-[#0a1a6e] text-white font-black px-10 py-5 rounded-2xl flex items-center gap-4 transition-all shadow-2xl shadow-[#030c4d]/20 disabled:opacity-50 tracking-[0.2em] text-[11px] uppercase active:scale-95"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Simpan Nilai Uraian
                    </button>
                </div>
            </header>

            <div className="space-y-8">
                {details.essayAnswers.map((answer: any, index: number) => {
                    const qInfo = answer.bank_questions;
                    const maxScore = qInfo.score_default || 1;

                    return (
                        <motion.div
                            key={answer.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-premium relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 blur-[80px] rounded-full -z-10" />

                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#030c4d] font-black text-lg border border-slate-100">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Butir Soal Uraian</span>
                                        <span className="block text-[8px] font-bold text-slate-300 uppercase tracking-widest">Essay Question Item</span>
                                    </div>
                                </div>
                                <div className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Bobot Maksimal: <span className="text-[#030c4d]">{maxScore}</span> Poin
                                    </span>
                                </div>
                            </div>

                            <div className="mb-10 p-2">
                                <QuestionRenderer
                                    question={{
                                        ...qInfo,
                                        question_text: qInfo.question // Map "question" to "question_text" for renderer
                                    }}
                                    answer={answer.essay_answer}
                                    onAnswerChange={() => { }} // Read-only for grading view
                                    isPreview={false}
                                />
                            </div>

                            <div className="bg-slate-50 rounded-[2rem] p-8 border-2 border-slate-100/50 mb-10 relative group/ans">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                                        <User size={14} className="text-slate-400" />
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Jawaban Siswa</h4>
                                </div>
                                <div className="text-lg font-bold text-[#030c4d] leading-relaxed whitespace-pre-wrap pl-1">
                                    {answer.essay_answer || <span className="text-slate-300 font-medium">Peserta tidak memberikan jawaban pada soal ini.</span>}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-8 border-t border-slate-50 pt-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Berikan Penilaian</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Assign Score</span>
                                </div>

                                <div className="flex items-center gap-5 flex-1 w-full md:w-auto">
                                    <div className="relative group/input flex-1 md:flex-none">
                                        <input
                                            type="number"
                                            min="0"
                                            max={maxScore}
                                            step="0.5"
                                            value={isNaN(grades[answer.id]) ? '' : grades[answer.id]}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                handleGradeChange(answer.id, isNaN(val) ? '0' : val.toString());
                                            }}
                                            className="w-full md:w-40 bg-white border-2 border-slate-100 rounded-2xl px-8 py-5 text-3xl font-black text-primary text-center outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-inner group-hover/input:border-slate-200"
                                        />
                                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg transform rotate-12">
                                            <Hash size={14} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black text-slate-200 tracking-tighter">/ {maxScore}</span>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">Total Points</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="flex justify-center pt-12">
                <button
                    onClick={handleSave}
                    disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-12 py-6 rounded-[2rem] flex items-center gap-5 transition-all shadow-2xl shadow-emerald-500/20 tracking-[0.3em] text-xs uppercase active:scale-95 group"
                >
                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={24} className="transition-transform group-hover:scale-110" />}
                    Finalisasi Penilaian & Update Rapor
                </button>
            </div>
        </div>
    );
}
