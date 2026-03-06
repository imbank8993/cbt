"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, ArrowLeft, Save, User, CheckCircle2,
    Shield, Clock, Calendar, BarChart3, AlertTriangle,
    CheckCircle, XCircle, HelpCircle, Activity,
    Link as LinkIcon, ExternalLink
} from 'lucide-react';
import { getAttemptFullDetailsAction } from '@/app/actions/proktor';
import { submitEssayGradesAction } from '@/app/actions/guru';
import { QuestionRenderer } from '@/app/components/questions/QuestionRenderer';
import { LatexRenderer } from '@/app/components/questions/LatexRenderer';

export default function AttemptAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const attemptId = params.attemptId as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<any>(null);
    const [grades, setGrades] = useState<Record<string, number>>({});
    const [activeTab, setActiveTab] = useState<'questions' | 'security'>('questions');

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await getAttemptFullDetailsAction(attemptId);
            if (res) {
                setData(res);
                const initialGrades: Record<string, number> = {};
                res.answers.forEach((a: any) => {
                    if (['essay', 'esay', 'uraian'].includes(a.bank_questions?.type)) {
                        initialGrades[a.id] = a.score || 0;
                    }
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
        if (!confirm('Simpan perubahan nilai? Total nilai akhir akan dihitung kembali.')) return;
        setSubmitting(true);
        const res = await submitEssayGradesAction(attemptId, grades);
        if (res.success) {
            alert('Berhasil menyimpan nilai!');
            // Reload data
            const updated = await getAttemptFullDetailsAction(attemptId);
            if (updated) setData(updated);
        } else {
            alert('Gagal: ' + res.error);
        }
        setSubmitting(false);
    };

    const stats = useMemo(() => {
        if (!data) return null;
        const total = data.answers.length;
        const correct = data.answers.filter((a: any) => a.is_correct).length;
        const wrong = total - correct - data.answers.filter((a: any) => ['essay', 'esay', 'uraian'].includes(a.bank_questions?.type)).length;
        const essays = data.answers.filter((a: any) => ['essay', 'esay', 'uraian'].includes(a.bank_questions?.type)).length;

        return { total, correct, wrong, essays };
    }, [data]);

    if (loading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BarChart3 size={24} className="text-secondary animate-pulse" />
                    </div>
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Assembling Analytics Hub...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-20 text-center bg-white border border-slate-100 rounded-[3rem] shadow-premium">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Data Tidak Ditemukan</h3>
                <p className="text-slate-400 font-bold max-w-sm mx-auto">Kami tidak dapat menemukan rekaman pengerjaan untuk ID tersebut.</p>
                <button onClick={() => router.back()} className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-primary active:scale-95">
                    Kembali Ke Monitoring
                </button>
            </div>
        );
    }

    const { attempt, answers, securityLogs } = data;
    const studentName = attempt.profiles?.full_name || 'Tanpa Nama';
    const examTitle = attempt.exams?.title || 'Ujian';

    return (
        <div className="max-w-[1200px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div className="space-y-6">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-black uppercase tracking-widest text-[9px]"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Monitor
                    </button>
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-primary uppercase tracking-tighter">
                                Attempt <span className="text-secondary">Analytics</span>
                            </h1>
                            <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 shadow-sm">
                                ID: {attempt.id.split('-')[0]}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2.5 bg-white border border-slate-100 px-5 py-2.5 rounded-2xl shadow-sm">
                                <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Peserta</p>
                                    <p className="text-sm font-black text-slate-700 leading-none">{studentName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 bg-white border border-slate-100 px-5 py-2.5 rounded-2xl shadow-sm">
                                <div className="w-8 h-8 bg-secondary/5 rounded-lg flex items-center justify-center text-secondary">
                                    <Activity size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Assesment</p>
                                    <p className="text-sm font-black text-slate-700 leading-none">{examTitle}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-4">
                    {attempt.needs_manual_grading && (
                        <div className="px-6 py-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm animate-pulse">
                            <AlertTriangle size={14} /> Menunggu Penilaian Uraian
                        </div>
                    )}
                    <div className="flex gap-3">
                        {Object.keys(grades).length > 0 && (
                            <button
                                onClick={handleSave}
                                disabled={submitting}
                                className="bg-primary hover:bg-primary-light text-white font-black px-8 py-5 rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 tracking-widest text-[10px] uppercase group"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover:scale-110 transition-transform" />}
                                Simpan Perubahan Nilai
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Performance Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Score Card */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <BarChart3 size={80} strokeWidth={1} className="text-white" />
                    </div>
                    <div className="relative">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] block mb-8">Score Matrix</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter">
                                {Number(attempt.total_score).toFixed(0)}
                            </span>
                            <span className="text-xl font-black text-white/20">/100</span>
                        </div>
                        <div className="mt-6 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${attempt.total_score}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-secondary"
                                />
                            </div>
                            <span className="text-[10px] font-black text-secondary">{attempt.total_score.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Timing Info */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium group">
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-start justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Info</span>
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                <Clock size={18} />
                            </div>
                        </div>
                        <div className="space-y-4 pt-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Started</span>
                                <span className="text-xs font-black text-slate-700">
                                    {attempt.started_at ? new Date(attempt.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Finished</span>
                                <span className="text-xs font-black text-slate-700">
                                    {attempt.finished_at ? new Date(attempt.finished_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </span>
                            </div>
                            <div className="h-px bg-slate-50 w-full" />
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${attempt.status === 'submitted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {attempt.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Shield */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium group">
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-start justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Gate Security</span>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${attempt.warning_count > 0 ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}>
                                <Shield size={18} />
                            </div>
                        </div>
                        <div className="pt-6">
                            <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">
                                {attempt.warning_count || 0}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Violations Detected</p>

                            <div className="mt-4 flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < (attempt.warning_count || 0) ? 'bg-rose-500' : 'bg-slate-100'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Answer Summary */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium group">
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-start justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Item Breakdown</span>
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                <Activity size={18} />
                            </div>
                        </div>
                        <div className="pt-6 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-lg font-black text-emerald-600 tracking-tighter leading-none">{stats?.correct}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Correct</p>
                            </div>
                            <div>
                                <p className="text-lg font-black text-rose-500 tracking-tighter leading-none">{stats?.wrong}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Incorrect</p>
                            </div>
                            <div>
                                <p className="text-lg font-black text-amber-500 tracking-tighter leading-none">{stats?.essays}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Essays</p>
                            </div>
                            <div>
                                <p className="text-lg font-black text-primary tracking-tighter leading-none">{stats?.total}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Items</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-white border border-slate-100 rounded-[3.5rem] shadow-premium overflow-hidden">
                <div className="flex border-b border-slate-50 bg-slate-50/30">
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`flex-1 flex items-center justify-center gap-3 py-8 font-black text-[11px] uppercase tracking-[0.2em] transition-all relative ${activeTab === 'questions' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {activeTab === 'questions' && <motion.div layoutId="tab" className="absolute bottom-0 left-8 right-8 h-1 bg-primary rounded-full shadow-lg shadow-primary/20" />}
                        <BarChart3 size={16} /> Exam Breakdown
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 flex items-center justify-center gap-3 py-8 font-black text-[11px] uppercase tracking-[0.2em] transition-all relative ${activeTab === 'security' ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {activeTab === 'security' && <motion.div layoutId="tab" className="absolute bottom-0 left-8 right-8 h-1 bg-rose-500 rounded-full shadow-lg shadow-rose-500/20" />}
                        <Shield size={16} /> Security Logs
                    </button>
                </div>

                <div className="p-10">
                    <AnimatePresence mode="wait">
                        {activeTab === 'questions' && (
                            <motion.div
                                key="questions"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-12"
                            >
                                {answers.map((answer: any, index: number) => {
                                    const q = answer.bank_questions;
                                    if (!q) return null;
                                    const isEssay = ['essay', 'esay', 'uraian'].includes(q.type);

                                    return (
                                        <div key={answer.id} className="group relative">
                                            {/* Vertical Timeline Line */}
                                            {index < answers.length - 1 && (
                                                <div className="absolute top-24 bottom-0 left-[23px] w-px bg-slate-100 z-0" />
                                            )}

                                            <div className="flex gap-10">
                                                {/* Left Status Marker */}
                                                <div className="relative z-10 flex flex-col items-center shrink-0">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all duration-500
                                                        ${isEssay
                                                            ? (answer.needs_manual_grading ? 'bg-amber-100 text-amber-600 group-hover:scale-110' : 'bg-emerald-500 text-white shadow-emerald-500/20')
                                                            : (answer.is_correct ? 'bg-emerald-500 text-white shadow-emerald-500/20 group-hover:scale-110' : 'bg-rose-500 text-white shadow-rose-500/20 group-hover:rotate-12')
                                                        }`}>
                                                        {isEssay
                                                            ? (answer.needs_manual_grading ? <HelpCircle size={20} strokeWidth={3} /> : <CheckCircle size={20} strokeWidth={3} />)
                                                            : (answer.is_correct ? <CheckCircle size={20} strokeWidth={3} /> : <XCircle size={20} strokeWidth={3} />)
                                                        }
                                                    </div>
                                                    <span className="mt-4 text-[10px] font-black text-slate-300 uppercase">#{index + 1}</span>
                                                </div>

                                                {/* Right Card Content */}
                                                <div className="flex-1 space-y-8 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100/50 group-hover:bg-white group-hover:shadow-premium-sm transition-all duration-500">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div className="flex gap-2">
                                                            <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
                                                                {q.type.toUpperCase()}
                                                            </span>
                                                            <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
                                                                Max: {q.score_default || 1} Pts
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points Earned:</span>
                                                            <span className={`text-lg font-black tracking-tighter ${answer.is_correct ? 'text-emerald-600' : isEssay ? 'text-amber-500' : 'text-rose-500'}`}>
                                                                {isEssay ? (Number(grades[answer.id]) || answer.score || 0) : (answer.is_correct ? q.score_default : 0)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100/80 shadow-inner overflow-hidden">
                                                        <QuestionRenderer
                                                            question={q}
                                                            answer={isEssay ? answer.essay_answer : (['mcq', 'true_false'].includes(q.type) ? answer.answer_id : answer.student_answer)}
                                                            onAnswerChange={() => { }} // Read-only
                                                            showFeedback={true}
                                                        />
                                                    </div>

                                                    {/* Essay Grading UI */}
                                                    {isEssay && (
                                                        <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                                                    <BarChart3 size={16} /> Manual Scoring
                                                                </h4>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max={q.score_default || 1}
                                                                            step="0.5"
                                                                            value={grades[answer.id] === undefined ? 0 : grades[answer.id]}
                                                                            onChange={(e) => handleGradeChange(answer.id, e.target.value)}
                                                                            className="w-24 bg-white border-2 border-slate-100 focus:border-primary rounded-xl px-4 py-3 text-center text-lg font-black text-primary outline-none transition-all shadow-sm"
                                                                        />
                                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-2 py-0.5 rounded-full text-[8px] font-black text-white uppercase tracking-widest">Points</div>
                                                                    </div>
                                                                    <span className="text-slate-300 font-black text-xl tracking-tighter">/ {q.score_default || 1}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                                                                <HelpCircle size={16} className="text-amber-500" />
                                                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-tight">Berikan nilai berdasarkan ketepatan deskripsi jawaban siswa di atas.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="p-8 bg-rose-50/50 rounded-3xl border border-rose-100 flex items-center gap-6 mb-10">
                                    <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                                        <Shield size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-rose-900 uppercase tracking-tighter">Security Audit Trail</h3>
                                        <p className="text-[11px] text-rose-700/60 font-bold uppercase tracking-widest mt-1">Rekaman aktivitas yang dideteksi oleh Unelma Gate.</p>
                                    </div>
                                </div>

                                {securityLogs.length === 0 ? (
                                    <div className="py-24 text-center">
                                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle size={32} />
                                        </div>
                                        <h4 className="text-lg font-black text-slate-300 uppercase tracking-tighter">No Violations Recorded</h4>
                                        <p className="text-slate-400 font-bold text-sm mt-2">Siswa ini menjaga integritas selama ujian berlangsung.</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-rose-100 ml-6 pl-10 space-y-12 pb-10">
                                        {securityLogs.map((log: any, idx: number) => (
                                            <div key={log.id} className="relative">
                                                <div className="absolute -left-[51px] top-0 w-[20px] h-[20px] bg-white border-4 border-rose-500 rounded-full z-10" />
                                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="px-4 py-1 bg-rose-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                                                            {log.event_type}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase">
                                                            <Clock size={12} /> {new Date(log.created_at).toLocaleTimeString('id-ID')}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                                                            <AlertTriangle size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Security Event Detected</p>
                                                            <p className="text-xs text-slate-500 mt-1">Metadata: {JSON.stringify(log.metadata)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center py-10 px-14 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
                <div className="relative z-10">
                    <h4 className="text-xl font-black uppercase tracking-tighter mb-1">Final Result Certification</h4>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em]">Institutional Grade Authentication</p>
                </div>
                <div className="relative z-10 flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10"
                    >
                        Return Hub
                    </button>
                    {Object.keys(grades).length > 0 && (
                        <button
                            onClick={handleSave}
                            disabled={submitting}
                            className="bg-secondary hover:bg-orange-500 text-primary-dark font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-secondary/20 active:scale-95 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3"
                        >
                            <CheckCircle2 size={18} strokeWidth={3} /> Post Final Result
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
