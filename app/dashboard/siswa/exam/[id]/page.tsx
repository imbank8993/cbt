"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
    Clock,
    AlertTriangle,
    CheckCircle2,
    Check,
    LogOut,
    Ghost,
    Loader2,
    Maximize2,
    ShieldAlert,
    ShieldCheck,
    XCircle
} from 'lucide-react';
import { submitExamAction, startExamAttemptAction, saveAnswerAction } from '@/app/actions/siswa';
import { logSecurityViolationAction, forceLogoutStudentAction } from '@/app/actions/security';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { QuestionRenderer } from '@/app/components/questions/QuestionRenderer';

export default function ExamSessionPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [exam, setExam] = useState<any>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [doubtfulAnswers, setDoubtfulAnswers] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [updatedQuestionIds, setUpdatedQuestionIds] = useState<Set<string>>(new Set());
    const [attempt, setAttempt] = useState<any>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [matchingLinks, setMatchingLinks] = useState<{ x1: number, y1: number, x2: number, y2: number }[]>([]);
    const matchingContainerRef = useRef<HTMLDivElement>(null);

    // Security States
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [showViolationModal, setShowViolationModal] = useState(false);
    const [violationType, setViolationType] = useState('');
    const MAX_VIOLATIONS = 3;

    // Helper: LaTeX rendering (supports both \( \) and \[ \])
    // Note: Replaced by QuestionRenderer but kept here if other parts use it
    const renderContent = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\(.*?\\\))/g);
        return parts.map((part, i) => {
            if (part.startsWith('\\[')) {
                return <BlockMath key={i} math={part.slice(2, -2)} />;
            } else if (part.startsWith('\\(')) {
                return <InlineMath key={i} math={part.slice(2, -2)} />;
            }
            return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
        });
    };

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

                // 3. Start or Resume Attempt
                if (user) {
                    const attemptResult = await startExamAttemptAction(user.id, examId);
                    if (attemptResult.success) {
                        setAttempt(attemptResult.attempt);

                        // Sync Saved Answers
                        const savedAnswers: Record<string, string> = {};
                        const savedDoubtful = new Set<string>();

                        (attemptResult.answers || []).forEach((ans: any) => {
                            if (ans.selected_option_id) savedAnswers[ans.question_id] = ans.selected_option_id;
                            if (ans.is_doubtful) savedDoubtful.add(ans.question_id);
                        });

                        setAnswers(savedAnswers);
                        setDoubtfulAnswers(savedDoubtful);
                    } else {
                        alert('Gagal memulai sesi ujian: ' + attemptResult.error);
                        router.push('/dashboard/siswa');
                        return;
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

    // Fullscreen & Security Listeners
    useEffect(() => {
        if (!attempt || isCompleted || loading) return;

        const isSafeMode = exam?.metadata?.is_safe_mode !== false; // Default to true
        if (!isSafeMode) return;

        const enterFullscreen = () => {
            const docElm = document.documentElement;
            if (docElm.requestFullscreen) docElm.requestFullscreen();
            setIsFullScreen(true);
        };

        const handleSecurityViolation = async (type: string) => {
            if (isCompleted || loading) return;

            setViolationType(type);
            setShowViolationModal(true);
            const newCount = violationCount + 1;
            setViolationCount(newCount);

            // Log to database
            await logSecurityViolationAction(attempt.id, type, {
                pathname: window.location.pathname,
                timestamp: new Date().toISOString()
            });

            if (newCount >= MAX_VIOLATIONS) {
                // Auto logout on repeated violations
                await forceLogoutStudentAction(user.id, attempt.id, `Exceeded ${MAX_VIOLATIONS} security violations: ${type}`);
                window.location.reload(); // Trigger re-auth check/redirect
            }
        };

        const onVisibilityChange = () => {
            if (document.hidden) handleSecurityViolation('tab_switch');
        };

        const onBlur = () => {
            handleSecurityViolation('window_blur');
        };

        const onFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullScreen(false);
                handleSecurityViolation('exit_fullscreen');
            }
        };

        const onContextMenu = (e: MouseEvent) => e.preventDefault();

        const onKeyDown = (e: KeyboardEvent) => {
            // Disable PrintScreen, Ctrl+C, Ctrl+V, Ctrl+U, F12, etc.
            if (
                e.key === 'PrintScreen' ||
                (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's')) ||
                e.key === 'F12' ||
                (e.metaKey && e.altKey && e.key === 'i')
            ) {
                e.preventDefault();
                handleSecurityViolation('restricted_shortcut');
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('contextmenu', onContextMenu);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            document.removeEventListener('contextmenu', onContextMenu);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [attempt, isCompleted, loading, violationCount, user]);

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


    const handleAnswerSelect = async (questionId: string, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));

        if (attempt) {
            await saveAnswerAction(attempt.id, questionId, {
                selected_option_id: answer,
                is_doubtful: doubtfulAnswers.has(questionId)
            });
        }
    };

    const toggleDoubtful = async (questionId: string) => {
        const newDoubtful = new Set(doubtfulAnswers);
        let isNowDoubtful = false;

        if (newDoubtful.has(questionId)) {
            newDoubtful.delete(questionId);
        } else {
            newDoubtful.add(questionId);
            isNowDoubtful = true;
        }

        setDoubtfulAnswers(newDoubtful);

        if (attempt) {
            await saveAnswerAction(attempt.id, questionId, {
                selected_option_id: answers[questionId],
                is_doubtful: isNowDoubtful
            });
        }
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

    const currentQ = questions[currentQIndex];

    // Calculate Matching Lines
    useEffect(() => {
        if (currentQ?.type !== 'matching' || !matchingContainerRef.current) return;

        const updateLines = () => {
            const container = matchingContainerRef.current;
            if (!container) return;
            const containerRect = container.getBoundingClientRect();

            let studentPairs: Record<string, string[]> = {};
            try {
                const val = answers[currentQ.id];
                if (val) studentPairs = JSON.parse(val);
            } catch (e) { }

            const newLinks: any[] = [];
            Object.entries(studentPairs).forEach(([leftId, rights]) => {
                const leftEl = document.getElementById(`matching-left-${leftId}`);
                if (!leftEl) return;
                const leftRect = leftEl.getBoundingClientRect();

                rights.forEach((rightText: string) => {
                    const rightEl = document.getElementById(`matching-right-${btoa(rightText).replace(/=/g, '')}`);
                    if (!rightEl) return;
                    const rightRect = rightEl.getBoundingClientRect();

                    newLinks.push({
                        x1: leftRect.right - containerRect.left,
                        y1: leftRect.top + leftRect.height / 2 - containerRect.top,
                        x2: rightRect.left - containerRect.left,
                        y2: rightRect.top + rightRect.height / 2 - containerRect.top
                    });
                });
            });
            setMatchingLinks(newLinks);
        };

        const timer = setTimeout(updateLines, 100); // Wait for render
        window.addEventListener('resize', updateLines);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateLines);
        };
    }, [currentQ, answers, currentQIndex]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
                <Loader2 size={48} className="text-primary animate-spin mb-4" />
                <h2 className="text-white font-medium text-xl">Menyiapkan Ujian...</h2>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-white font-medium text-3xl mb-3 tracking-tight uppercase">Ujian Telah Diselesaikan</h2>
                <p className="text-slate-400 mb-8 max-w-sm text-lg">Anda sudah mengumpulkan hasil untuk ujian ini. Anda tidak dapat mengulanginya lagi.</p>
                <div className="flex gap-4">
                    <button onClick={() => router.push('/dashboard/siswa/results')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-8 py-3 rounded-full transition-all shadow-lg active:scale-95">
                        Lihat Hasil
                    </button>
                    <button onClick={() => router.push('/dashboard/siswa')} className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-8 py-3 rounded-full transition-all border border-slate-700 active:scale-95">
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
                <h2 className="text-white font-medium text-2xl mb-2">Ujian Tidak Ditemukan</h2>
                <p className="text-slate-400 mb-8">Ujian belum memiliki soal atau telah ditarik.</p>
                <button onClick={() => router.push('/dashboard/siswa')} className="bg-primary hover:bg-primary-light text-white font-medium px-8 py-3 rounded-full transition-all">
                    Kembali ke Dashboard
                </button>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden selection:bg-[#f8a01b]/20">
            {/* Ambient Background Elements - Very Subtle */}
            <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#030c4d]/5 blur-[150px] rounded-full -z-10" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#f8a01b]/5 blur-[150px] rounded-full -z-10" />

            {/* FULLSCREEN ENFORCEMENT OVERLAY */}
            <AnimatePresence>
                {!isFullScreen && !isCompleted && !loading && (exam?.metadata?.is_safe_mode !== false) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-white backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="w-20 h-20 bg-[#f8a01b]/10 text-[#f8a01b] rounded-3xl flex items-center justify-center mb-6 border border-[#f8a01b]/20 shadow-[0_0_50px_rgba(248,160,27,0.1)]">
                            <Maximize2 size={36} className="animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-medium text-[#030c4d] mb-3 uppercase tracking-tighter">Mode Ujian Aman</h2>
                        <p className="text-slate-500 mb-8 max-w-sm text-base font-medium leading-relaxed">
                            Demi keamanan, ujian ini harus dikerjakan dalam mode <span className="text-[#f8a01b] font-medium uppercase">Layar Penuh</span>.
                        </p>
                        <button
                            onClick={() => {
                                const docElm = document.documentElement;
                                if (docElm.requestFullscreen) docElm.requestFullscreen();
                                setIsFullScreen(true);
                            }}
                            className="bg-[#030c4d] hover:bg-[#0a1a6e] text-white font-medium px-10 py-4 rounded-xl transition-all shadow-xl shadow-[#030c4d]/20 active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
                        >
                            <ShieldCheck size={18} /> Aktifkan Mode Aman
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* VIOLATION MODAL */}
            <AnimatePresence>
                {showViolationModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#030c4d]/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-8 relative z-10 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-[#f8a01b]/10 text-[#f8a01b] rounded-full flex items-center justify-center mb-6 mx-auto border border-[#f8a01b]/20">
                                <ShieldAlert size={32} />
                            </div>
                            <h3 className="text-xl font-black text-[#030c4d] mb-2 uppercase tracking-tight">Peringatan Keamanan</h3>
                            <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">
                                Terdeteksi tindakan: <span className="text-[#f8a01b] font-bold uppercase">{violationType.replace('_', ' ')}</span>.
                                <br />Pelanggaran: <span className="text-[#030c4d] font-black">{violationCount} / {MAX_VIOLATIONS}</span>.
                            </p>
                            <button
                                onClick={() => setShowViolationModal(false)}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-[10px]"
                            >
                                Saya Mengerti
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TOP BAR */}
            <header className="bg-white/95 backdrop-blur-2xl border-b border-slate-100 sticky top-0 z-[100] shadow-sm">
                <div className="max-w-[1300px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#030c4d] to-[#0a1a6e] flex items-center justify-center text-white shadow-xl shadow-[#030c4d]/20 border border-white/10 font-medium text-xl tracking-tighter">
                            U
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-[#030c4d] font-medium text-xl uppercase tracking-tighter leading-none">{exam.title}</h1>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                                    <span className="text-[8px] font-medium tracking-[0.2em] uppercase text-primary">Live Session</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-medium text-emerald-600 tracking-widest uppercase">Secured Connection</span>
                                </div>
                                <span className="text-slate-200">|</span>
                                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-slate-400">{questions.length} Items</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`px-6 py-3 rounded-2xl flex items-center gap-4 transition-all duration-500 border-2 ${timeLeft < 300 ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-lg shadow-rose-500/10' : 'bg-slate-50 border-slate-100 text-[#030c4d] shadow-sm'}`}>
                            <div className="flex flex-col items-end mr-1">
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 leading-none">Time Remaining</span>
                                <span className="text-[7px] font-bold uppercase tracking-widest opacity-30 mt-1">Sisa Waktu</span>
                            </div>
                            <Clock size={18} className={timeLeft < 300 ? 'animate-pulse text-rose-500' : 'text-primary'} />
                            <span className="font-mono text-2xl font-black tracking-tighter">{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {updatedQuestionIds.size > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-primary text-white px-8 py-5 flex items-center justify-between shadow-2xl z-[90] overflow-hidden"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce shadow-inner border border-white/20">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-base uppercase tracking-tighter">Pembaruan Soal Terdeteksi</h4>
                                <p className="text-xs font-medium text-white/80 tracking-wide">Proktor telah memperbarui bank soal. Silakan sinkronisasi sekarang.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-white text-primary font-black px-8 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl active:scale-95"
                        >
                            Sinkronisasi Sekarang
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className={`flex-1 max-w-none mx-auto w-full grid grid-cols-1 gap-5 p-4 lg:px-4 lg:py-6 relative z-10 ${currentQ?.metadata?.question_layout === 'wide' ? 'lg:grid-cols-[9fr_1fr]' : 'lg:grid-cols-[5fr_4fr_1fr]'}`}>
                {currentQ?.metadata?.question_layout === 'wide' ? (
                    /* WIDE MODE: question + options in one full-width card */
                    <div className="flex flex-col min-w-0 h-full">
                        <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-8 lg:p-10 flex-1 shadow-premium flex flex-col overflow-hidden relative group">
                            {/* Shared Header Section (Minimalist) */}
                            <div className="flex items-center gap-6 mb-10 relative z-10">
                                <div className="flex-1">
                                    <div className="flex justify-between items-end mb-3 px-1">
                                        <div className="flex items-baseline gap-1 text-[#030c4d] font-medium text-sm">
                                            <span className="uppercase tracking-[0.3em] text-[10px] text-slate-400 font-black">Assessment Progress</span>
                                        </div>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{Math.round(((currentQIndex + 1) / questions.length) * 100)}% Complete</div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-[#030c4d] via-[#0a1a6e] to-[#f8a01b]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pt-2">
                                <QuestionRenderer
                                    question={currentQ}
                                    answer={answers[currentQ.id]}
                                    onAnswerChange={(newVal) => handleAnswerSelect(currentQ.id, newVal)}
                                />

                                {/* Ragu-ragu Checkbox in Wide Mode */}
                                <div
                                    className={`mt-12 p-5 rounded-[1.5rem] border-2 max-w-sm flex items-center gap-5 cursor-pointer transition-all duration-300 select-none group relative overflow-hidden ${doubtfulAnswers.has(currentQ.id) ? 'bg-[#f8a01b]/5 border-[#f8a01b] shadow-lg shadow-[#f8a01b]/10' : 'bg-slate-50 border-slate-100 hover:border-primary/30 hover:bg-white'}`}
                                    onClick={() => toggleDoubtful(currentQ.id)}
                                >
                                    <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${doubtfulAnswers.has(currentQ.id) ? 'bg-[#f8a01b] border-[#f8a01b] text-white shadow-xl shadow-[#f8a01b]/20 scale-105' : 'bg-white border-slate-200 text-transparent group-hover:border-primary/50'}`}>
                                        <Check size={22} strokeWidth={4} />
                                    </div>
                                    <div className="flex-1">
                                        <span className={`block font-black text-xs uppercase tracking-[0.1em] leading-none mb-1.5 ${doubtfulAnswers.has(currentQ.id) ? 'text-[#f8a01b]' : 'text-slate-500 group-hover:text-slate-700'}`}>Review Later</span>
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">Tandai Ragu-Ragu</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-2 flex flex-col gap-5">
                        {/* Combined Question & Options Card */}
                        <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-8 lg:p-10 flex-1 shadow-premium flex flex-col overflow-hidden relative group">
                            {/* Shared Header Section */}
                            <div className="flex items-center gap-6 mb-10 relative z-10">
                                <div className="flex-1">
                                    <div className="flex justify-between items-end mb-3 px-1">
                                        <div className="flex items-baseline gap-1 text-[#030c4d] font-medium text-sm">
                                            <span className="uppercase tracking-[0.3em] text-[10px] text-slate-400 font-black">Assessment Progress</span>
                                        </div>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{Math.round(((currentQIndex + 1) / questions.length) * 100)}% Complete</div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-[#030c4d] via-[#0a1a6e] to-[#f8a01b]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parallel Content Grid */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-10 min-h-0">
                                {/* Left: Question Content Area */}
                                <div className="flex flex-col min-h-0 border-r border-slate-100/30 pr-8 overflow-y-auto custom-scrollbar font-medium">
                                    <div className="mb-4">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-6 px-1">Pertanyaan</span>
                                        <QuestionRenderer
                                            question={currentQ}
                                            answer={answers[currentQ.id]}
                                            onAnswerChange={() => { }}
                                            showOptions={false}
                                        />
                                    </div>
                                </div>

                                {/* Right: Response/Options Area */}
                                <div className="flex flex-col min-h-0 overflow-y-auto custom-scrollbar pl-2">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-6 px-1">Pilihan</span>
                                    <div className="flex-1">
                                        <QuestionRenderer
                                            question={currentQ}
                                            answer={answers[currentQ.id]}
                                            onAnswerChange={(newVal) => handleAnswerSelect(currentQ.id, newVal)}
                                            showQuestion={false}
                                        />
                                    </div>

                                    {/* Ragu-ragu Checkbox */}
                                    <div
                                        className={`mt-10 p-5 rounded-[1.5rem] border-2 flex items-center gap-5 cursor-pointer transition-all duration-300 select-none group relative overflow-hidden ${doubtfulAnswers.has(currentQ.id) ? 'bg-[#f8a01b]/5 border-[#f8a01b] shadow-lg shadow-[#f8a01b]/10' : 'bg-slate-50 border-slate-100 hover:border-primary/30 hover:bg-white'}`}
                                        onClick={() => toggleDoubtful(currentQ.id)}
                                    >
                                        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${doubtfulAnswers.has(currentQ.id) ? 'bg-[#f8a01b] border-[#f8a01b] text-white shadow-xl shadow-[#f8a01b]/20 scale-105' : 'bg-white border-slate-200 text-transparent group-hover:border-primary/50'}`}>
                                            <Check size={22} strokeWidth={4} />
                                        </div>
                                        <div className="flex-1">
                                            <span className={`block font-black text-xs uppercase tracking-[0.1em] leading-none mb-1.5 ${doubtfulAnswers.has(currentQ.id) ? 'text-[#f8a01b]' : 'text-slate-500 group-hover:text-slate-700'}`}>Review Later</span>
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">Tandai Ragu-Ragu</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RIGHT: MATRIX NAVIGATION (always visible) */}
                <div className="flex flex-col gap-6 h-full">
                    <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-[2rem] p-6 shadow-premium relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-[#030c4d]" />

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-[#030c4d] font-black tracking-[0.2em] uppercase text-[10px] mb-1">Matrix</h3>
                                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Nomor Soal</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {questions.map((q, i) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = currentQIndex === i;
                                const isDoubtful = doubtfulAnswers.has(q.id);

                                let btnClass = "w-full aspect-square rounded-xl flex items-center justify-center font-black text-[13px] transition-all duration-300 border-2 relative group ";

                                if (isCurrent) {
                                    btnClass += "bg-[#030c4d] text-white border-[#030c4d] shadow-lg shadow-[#030c4d]/20 scale-105 z-10 ring-2 ring-[#030c4d]/10";
                                } else if (isDoubtful) {
                                    btnClass += "bg-[#f8a01b] text-white border-[#f8a01b] shadow-md shadow-[#f8a01b]/20 hover:scale-105";
                                } else if (isAnswered) {
                                    btnClass += "bg-blue-50 text-[#030c4d] border-blue-100 shadow-sm hover:bg-blue-100";
                                } else {
                                    btnClass += "bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-200/50";
                                }

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            setCurrentQIndex(i);
                                            setSelectedLeft(null);
                                        }}
                                        className={btnClass}
                                    >
                                        <span>{i + 1}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* FINAL SUBMISSION IN SIDEBAR MATRIX */}
                        <div className="mt-auto">
                            <button
                                onClick={() => setShowConfirmModal(true)}
                                disabled={submitting}
                                className="w-full py-4 bg-primary hover:bg-[#e08e15] text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all uppercase tracking-[0.1em] text-[10px] shadow-xl shadow-primary/20 active:scale-95 group"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={18} className="transition-transform group-hover:scale-110" />}
                                Selesaikan
                            </button>
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest text-center mt-3">Kirim seluruh jawaban.</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-4 shadow-premium group">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shrink-0 border-2 border-slate-100 shadow-sm group-hover:shadow-md transition-all group-hover:-rotate-3">
                            <ShieldAlert size={20} />
                        </div>
                        <div className="pt-0.5">
                            <h4 className="text-[#030c4d] font-medium text-[10px] uppercase tracking-tighter mb-1">Security Active</h4>
                            <p className="text-slate-400 text-[8px] leading-relaxed font-medium uppercase tracking-tight">
                                Anti-Cheat AI is Monitoring.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !submitting && setShowConfirmModal(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-10 relative z-10 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-[#f8a01b]/10 text-[#f8a01b] rounded-full flex items-center justify-center mb-6 mx-auto border border-[#f8a01b]/20">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-2xl font-medium text-[#030c4d] mb-3 uppercase tracking-tighter">Selesaikan Ujian?</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed font-medium text-sm">
                                Pastikan semua jawaban telah diperiksa. Ketik <span className="text-[#f8a01b] font-medium uppercase font-black">SELESAI</span> untuk konfirmasi.
                            </p>

                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                placeholder="SELESAI"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 text-[#030c4d] font-medium text-center outline-none focus:ring-4 focus:ring-[#f8a01b]/10 focus:border-[#f8a01b]/40 transition-all placeholder:text-slate-300 tracking-[0.5em] text-lg uppercase mb-6"
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={submitting}
                                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSubmitExam}
                                    disabled={confirmText !== 'SELESAI' || submitting}
                                    className="flex-[2] py-4 bg-[#f8a01b] hover:bg-[#e08e15] disabled:opacity-30 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-[#f8a01b]/20 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                    Submit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
