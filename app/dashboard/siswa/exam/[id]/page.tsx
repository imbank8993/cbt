"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
    Clock,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Check,
    LogOut,
    Ghost,
    Loader2
} from 'lucide-react';
import { submitExamAction } from '@/app/actions/siswa';

export default function ExamSessionPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [exam, setExam] = useState<any>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // question_id -> option_id
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [updatedQuestionIds, setUpdatedQuestionIds] = useState<Set<string>>(new Set());

    // Initial Data Fetch
    useEffect(() => {
        async function fetchExamData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) setUser(user);

                // 1. Fetch Exam Details and Check Attempt Sync
                const [examRes, attemptRes] = await Promise.all([
                    supabase
                        .from('exams')
                        .select('*, question_banks(id, title)')
                        .eq('id', examId)
                        .single(),
                    user ? supabase
                        .from('exam_attempts')
                        .select('status')
                        .eq('user_id', user.id)
                        .eq('exam_id', examId)
                        .eq('status', 'submitted')
                        .maybeSingle() : Promise.resolve({ data: null })
                ]);

                const exData = examRes.data;
                const exErr = examRes.error;

                if (attemptRes.data) {
                    setIsCompleted(true);
                    setLoading(false);
                    return;
                }

                if (exErr || !exData) {
                    console.error("Exam not found", exErr);
                    setLoading(false);
                    return;
                }
                setExam(exData);

                // 2. Fetch Questions & Options
                // Assuming it's linked directly or via question_sources
                let qbId = exData.question_bank_id;
                if (!qbId) {
                    // Try sources
                    const { data: sources } = await supabase.from('exam_question_sources').select('bank_id').eq('exam_id', examId).limit(1);
                    if (sources && sources.length > 0) qbId = sources[0].bank_id;
                }

                if (qbId) {
                    const { data: qData, error: qErr } = await supabase
                        .from('bank_questions')
                        .select(`
                            id, question_text, type, score_default,
                            bank_question_options(id, option_text, is_correct, weight)
                        `)
                        .eq('bank_id', qbId);

                    if (!qErr && qData) {
                        // Shuffle questions if needed (omitted for speed)
                        setQuestions(qData);
                    }
                }

                // Initialize Timer
                setTimeLeft(exData.duration_minutes * 60);

            } catch (err) {
                console.error("Error fetching exam", err);
            }
            setLoading(false);
        }

        if (examId) fetchExamData();
    }, [examId]);

    // Realtime Subscription
    useEffect(() => {
        if (!exam?.question_bank_id) return;

        const channel = supabase
            .channel(`exam-updates-${exam.question_bank_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bank_questions',
                    filter: `bank_id=eq.${exam.question_bank_id}`
                },
                (payload) => {
                    console.log('Realtime change detected:', payload);
                    setUpdatedQuestionIds(prev => {
                        const next = new Set(prev);
                        next.add(payload.new.id);
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [exam?.question_bank_id]);

    // Timer Logic
    useEffect(() => {
        if (loading || !exam || timeLeft <= 0 || submitting) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, exam, timeLeft, submitting]);

    const handleAnswerSelect = (questionId: string, optionId: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmitExam = async () => {
        if (!user) return alert('Sesi anda telah habis. Silakan login kembali.');
        setSubmitting(true);
        const result = await submitExamAction(user.id, examId, answers);
        if (result.success) {
            router.push('/dashboard/siswa/results');
        } else {
            alert('Gagal mengumpulkan ujian: ' + result.error);
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
                <Loader2 size={48} className="text-primary animate-spin mb-4" />
                <h2 className="text-white font-bold text-xl">Menyiapkan Ujian...</h2>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-white font-black text-3xl mb-3 tracking-tight italic uppercase">Ujian Telah Diselesaikan</h2>
                <p className="text-slate-400 mb-8 max-w-sm text-lg">Anda sudah mengumpulkan hasil untuk ujian ini. Anda tidak dapat mengulanginya lagi.</p>
                <div className="flex gap-4">
                    <button onClick={() => router.push('/dashboard/siswa/results')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-full transition-all shadow-lg active:scale-95">
                        Lihat Hasil
                    </button>
                    <button onClick={() => router.push('/dashboard/siswa')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-3 rounded-full transition-all border border-slate-700 active:scale-95">
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    if (!exam || questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
                <Ghost size={64} className="text-slate-800 mb-6" />
                <h2 className="text-white font-bold text-2xl mb-2">Ujian Tidak Ditemukan</h2>
                <p className="text-slate-400 mb-8">Ujian belum memiliki soal atau telah ditarik.</p>
                <button onClick={() => router.push('/dashboard/siswa')} className="bg-primary hover:bg-primary-light text-white font-bold px-8 py-3 rounded-full transition-all">
                    Kembali ke Dashboard
                </button>
            </div>
        );
    }

    const currentQ = questions[currentQIndex];

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
            {/* TOP BAR */}
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard/siswa')}
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-slate-700"
                            title="Keluar (Dianggap Selesai)"
                        >
                            <LogOut size={18} />
                        </button>
                        <div>
                            <h1 className="text-white font-black text-xl italic tracking-tight">{exam.title}</h1>
                            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">{questions.length} Soal Pilihan Ganda</p>
                        </div>
                    </div>

                    <div className={`px-6 py-2 rounded-2xl flex items-center gap-3 border ${timeLeft < 300 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                        <Clock size={18} className={timeLeft < 300 ? 'animate-pulse' : ''} />
                        <span className="font-mono text-xl font-black tracking-widest">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {updatedQuestionIds.size > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-accent text-white px-6 py-4 flex items-center justify-between shadow-lg z-40 overflow-hidden"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase italic tracking-widest">Pembaruan Soal Terdeteksi</h4>
                                <p className="text-xs font-medium text-white/80">Guru atau Proktor telah melakukan perubahan pada soal ujian ini. Silakan tekan tombol Refresh di bawah atau periksa nomor bertanda ⚠️.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-white text-accent font-black px-6 py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-md active:scale-95"
                        >
                            Refresh Halaman
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8 p-6">

                {/* QUESTION AREA */}
                <div className="flex-1 flex flex-col">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 lg:p-12 mb-6 flex-1 shadow-2xl flex flex-col">

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center text-primary font-black text-xl shadow-inner">
                                {currentQIndex + 1}
                            </div>
                            <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-slate-500 font-bold text-sm tracking-widest">{currentQIndex + 1} OF {questions.length}</span>
                        </div>

                        {/* QUESTION TEXT */}
                        <div className="prose prose-invert prose-primary max-w-none mb-10 text-lg text-slate-200" dangerouslySetInnerHTML={{ __html: currentQ.question_text }} />

                        {/* OPTIONS */}
                        <div className="space-y-4 mt-auto">
                            {currentQ.bank_question_options?.map((opt: any, idx: number) => {
                                const isSelected = answers[currentQ.id] === opt.id;
                                const letters = ['A', 'B', 'C', 'D', 'E'];
                                return (
                                    <label key={opt.id} className={`flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all group ${isSelected ? 'border-primary bg-primary/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'}`}>
                                        <input
                                            type="radio"
                                            name={`q-${currentQ.id}`}
                                            className="hidden"
                                            checked={isSelected}
                                            onChange={() => handleAnswerSelect(currentQ.id, opt.id)}
                                        />
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black mr-6 transition-colors shadow-inner ${isSelected ? 'bg-primary text-white shadow-primary/50' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                                            {letters[idx] || '?'}
                                        </div>
                                        <div className="flex-1 text-slate-300 font-medium" dangerouslySetInnerHTML={{ __html: opt.option_text }} />

                                        <div className="w-6 h-6 rounded-full ml-4 flex items-center justify-center">
                                            {isSelected && <CheckCircle2 className="text-primary" size={24} />}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-between items-center gap-4">
                        <button
                            onClick={() => setCurrentQIndex(i => Math.max(0, i - 1))}
                            disabled={currentQIndex === 0}
                            className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-sm"
                        >
                            <ArrowLeft size={18} /> SEBELUMNYA
                        </button>

                        {currentQIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmitExam}
                                disabled={submitting}
                                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black flex items-center gap-3 transition-all uppercase tracking-widest text-sm shadow-xl shadow-emerald-600/20"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin text-white" /> : <Check size={18} />}
                                SELESAI & SUBMIT
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQIndex(i => Math.min(questions.length - 1, i + 1))}
                                className="px-10 py-4 bg-primary hover:bg-primary-light text-white rounded-2xl font-black flex items-center gap-3 transition-all uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                            >
                                SELANJUTNYA <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* SIDEBAR NAVIGATION */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-slate-400 font-black tracking-widest uppercase text-xs mb-6">Navigasi Soal</h3>
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((q, i) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = currentQIndex === i;

                                let btnClass = "w-full aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ";

                                if (isCurrent) {
                                    btnClass += "bg-primary text-white shadow-lg shadow-primary/30 scale-110 z-10 border-2 border-primary";
                                } else if (isAnswered) {
                                    btnClass += "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30";
                                } else {
                                    btnClass += "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white";
                                }

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQIndex(i)}
                                        className={btnClass + " relative"}
                                    >
                                        {i + 1}
                                        {updatedQuestionIds.has(q.id) && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg animate-pulse">
                                                <AlertTriangle size={10} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex items-start gap-4">
                        <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="text-amber-500 font-bold mb-1">Perhatian</h4>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Pastikan koneksi internet stabil. Jangan menutup tab ujian ini karena dapat tercatat sebagai pelanggaran.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
