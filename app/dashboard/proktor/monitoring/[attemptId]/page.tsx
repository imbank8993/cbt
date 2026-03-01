"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAttemptDetailsForGrading, submitEssayGradesAction } from '@/app/actions/guru';
import { Loader2, ArrowLeft, Save, User, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
            router.push('/dashboard/proktor/monitoring');
        } else {
            alert('Gagal: ' + res.error);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 size={48} className="text-primary animate-spin" />
            </div>
        );
    }

    if (!details || details.essayAnswers.length === 0) {
        return (
            <div className="p-10 text-center bg-white border border-slate-100 rounded-[2rem]">
                <p className="text-slate-400 font-bold">Data ujian tidak ditemukan atau tidak ada soal uraian.</p>
                <button onClick={() => router.back()} className="mt-4 text-primary font-bold uppercase tracking-widest text-sm hover:underline">
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
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-widest text-xs mb-4">
                        <ArrowLeft size={16} /> Kembali
                    </button>
                    <h1 className="text-3xl font-black text-primary uppercase italic tracking-tight mb-2">
                        Penilaian Uraian
                    </h1>
                    <div className="flex items-center gap-3 text-slate-500">
                        <User size={16} />
                        <span className="font-medium">{studentName} — {examTitle}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className="bg-primary hover:bg-primary-light text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-sm hover:shadow-lg disabled:opacity-50 tracking-widest text-[10px] uppercase"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Simpan Nilai
                    </button>
                </div>
            </header>

            <div className="space-y-6">
                {details.essayAnswers.map((answer: any, index: number) => {
                    const qInfo = answer.bank_questions;
                    const maxScore = qInfo.score_default || 1;

                    return (
                        <motion.div key={answer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-black tracking-widest">
                                    SOAL {index + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-400">
                                    Bobot Maksimal: {maxScore} Poin
                                </span>
                            </div>

                            <div className="prose prose-slate max-w-none mb-6" dangerouslySetInnerHTML={{ __html: qInfo.question }} />

                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-6 font-medium text-slate-700">
                                <h4 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Jawaban Siswa</h4>
                                <div className="whitespace-pre-wrap">{answer.essay_answer || <span className="text-slate-400 italic">Peserta tidak menjawab.</span>}</div>
                            </div>

                            <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
                                <label className="text-sm font-bold text-slate-700 w-32">Berikan Nilai:</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={maxScore}
                                    step="0.5"
                                    value={grades[answer.id] !== undefined ? grades[answer.id] : ''}
                                    onChange={(e) => handleGradeChange(answer.id, e.target.value)}
                                    className="w-24 border border-slate-200 rounded-xl px-4 py-2 text-center text-lg font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-sm font-bold text-slate-400">/ {maxScore}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-8">
                <button
                    onClick={handleSave}
                    disabled={submitting}
                    className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-sm tracking-widest text-[10px] uppercase"
                >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Finalisasi Penilaian
                </button>
            </div>
        </div>
    );
}
