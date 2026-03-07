"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardCheck, Plus, Search,
    Calendar, Play, Settings,
    Trash2, Clock, BookOpen,
    Loader2, CheckCircle2, Filter, ChevronRight,
    X, Check, Users
} from 'lucide-react';
import {
    getProctorOrganization,
    listOrganizationExams,
    createExamAction,
    listOrganizationClasses,
    listOrganizationStudents,
    assignExamAction,
    editExamAction
} from '@/app/actions/proktor';
import { deleteExamAction } from '@/app/actions/admin';
import { listQuestionBanks } from '@/app/actions/question';
import { supabase } from '@/lib/supabase';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ExamsPage = () => {
    const [exams, setExams] = useState<any[]>([]);
    const [qBanks, setQBanks] = useState<any[]>([]);
    const [org, setOrg] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming' | 'finished'>('ongoing');
    const [selectedSubject, setSelectedSubject] = useState<string>('All');

    // Modal & Form States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [assignData, setAssignData] = useState({ classIds: [] as string[], userIds: [] as string[] });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        duration: 90,
        randomizeQuestions: true,
        randomizeOptions: true,
        bankId: '',
        startTime: '',
        endTime: '',
        showResults: false,
        isSafeMode: true,
        selectedClassIds: [] as string[]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const organization = await getProctorOrganization(user.id);
            if (organization) {
                setOrg(organization);
                const [examList, bankList, classList, studentList] = await Promise.all([
                    listOrganizationExams(organization.id),
                    listQuestionBanks(organization.id, user.id, true),
                    listOrganizationClasses(organization.id),
                    listOrganizationStudents(organization.id)
                ]);
                setExams(examList);
                setQBanks(bankList);
                setClasses(classList);
                setStudents(studentList);
                if (bankList.length > 0) {
                    setFormData(prev => ({ ...prev, bankId: bankList[0].id }));
                }
            }
        }
        setIsLoading(false);
    };

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org) return;
        setIsSubmitting(true);
        const result = await createExamAction({
            orgId: org.id,
            title: formData.title,
            duration: formData.duration,
            startTime: formData.startTime || undefined,
            endTime: formData.endTime || undefined,
            randomizeQuestions: formData.randomizeQuestions,
            randomizeOptions: formData.randomizeOptions,
            showResults: formData.showResults,
            isSafeMode: formData.isSafeMode,
            questionBankId: formData.bankId
        });

        if (result.success && result.id) {
            // Set Target Kelas
            if (formData.selectedClassIds.length > 0) {
                await assignExamAction(result.id, formData.selectedClassIds, [], true);
            }
            setIsAddModalOpen(false);
            setFormData({ title: '', duration: 90, randomizeQuestions: true, randomizeOptions: true, showResults: false, isSafeMode: true, bankId: qBanks[0]?.id || '', startTime: '', endTime: '', selectedClassIds: [] });
            await loadData();
        } else {
            alert('Gagal membuat ujian: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const handleEditExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExam) return;
        setIsSubmitting(true);
        const result = await editExamAction(selectedExam.id, {
            title: formData.title,
            duration: formData.duration,
            startTime: formData.startTime || undefined,
            endTime: formData.endTime || undefined,
            randomizeQuestions: formData.randomizeQuestions,
            randomizeOptions: formData.randomizeOptions,
            showResults: formData.showResults,
            isSafeMode: formData.isSafeMode
        });

        if (result.success) {
            setIsEditModalOpen(false);
            setSelectedExam(null);
            await loadData();
        } else {
            alert('Gagal mengedit ujian: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const handleAssignExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExam) return;
        setIsSubmitting(true);
        const result = await assignExamAction(selectedExam.id, assignData.classIds, assignData.userIds, true);
        if (result.success) {
            setIsAssignModalOpen(false);
            setSelectedExam(null);
            await loadData();
        } else {
            alert('Gagal menugaskan ujian: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const handleDeleteExam = async (examId: string) => {
        if (!window.confirm('PERINGATAN: Menghapus ujian akan menghapus seluruh data hasil ujian siswa yang terkait. Apakah Anda yakin?')) return;

        setIsLoading(true);
        const result = await deleteExamAction(examId);
        if (result.success) {
            await loadData();
        } else {
            alert('Gagal menghapus ujian: ' + result.error);
        }
        setIsLoading(false);
    };

    const getSubjects = () => {
        const subjects = new Set<string>();
        subjects.add('All');
        qBanks.forEach(b => {
            if (b.subject) subjects.add(b.subject);
        });
        return Array.from(subjects);
    };

    const filterByTab = (examList: any[]) => {
        const now = new Date();
        return examList.filter(e => {
            const start = e.start_time ? new Date(e.start_time) : null;
            const end = e.end_time ? new Date(e.end_time) : null;

            if (activeTab === 'ongoing') {
                return e.status === 'active' && (!start || start <= now) && (!end || end >= now);
            } else if (activeTab === 'upcoming') {
                return (e.status === 'active' && start && start > now) || e.status === 'draft';
            } else {
                return e.status === 'finished' || (e.status === 'active' && end && end < now);
            }
        });
    };

    const filteredExams = filterByTab(exams).filter(e => {
        const matchSearch = e.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const bank = qBanks.find(b => b.id === e.question_bank_id);
        const matchSubject = selectedSubject === 'All' || bank?.subject === selectedSubject;
        return matchSearch && matchSubject;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const tabs = [
        { id: 'ongoing', label: 'Berlangsung', icon: Play, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'upcoming', label: 'Mendatang', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'finished', label: 'Selesai', icon: CheckCircle2, color: 'text-slate-500', bg: 'bg-slate-50' },
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Professional Header */}
            <header className="relative p-10 md:p-14 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-unelma-navy via-primary-light to-[#051163] text-white shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 blur-[120px] -mr-40 -mt-40 rounded-full animate-pulse-warm"></div>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">
                            Exam <span className="text-accent">Management</span>
                        </h2>
                        <p className="text-white/60 font-bold max-w-sm text-sm">
                            Atur jadwal, durasi, dan konfigurasi ujian di {org?.name || 'Sekolah'}.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-8 py-4 bg-accent hover:bg-unelma-orange-light text-primary font-black rounded-2xl shadow-lg transition-all active:scale-95 text-[10px] uppercase tracking-widest flex items-center gap-3 border border-orange-400/20"
                    >
                        <Plus size={18} strokeWidth={3} /> Buat Ujian Baru
                    </button>
                </div>
            </header>

            {/* Filters & Navigation */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-premium flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1 w-full lg:w-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-400 hover:text-primary hover:bg-white/50'
                                }`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? tab.color : ''} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1 justify-end">
                    <div className="relative w-full md:w-48">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-[10px] font-black uppercase text-primary outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                        >
                            {getSubjects().map(sub => (
                                <option key={sub} value={sub}>{sub === 'All' ? 'SEMUA MAPEL' : sub.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                            type="text"
                            placeholder="CARI JUDUL UJIAN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-[10px] font-black uppercase text-primary outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-24">
                    <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredExams.map((exam) => {
                        const bank = qBanks.find(b => b.id === exam.question_bank_id);
                        return (
                            <motion.div
                                layout
                                key={exam.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-100 rounded-3xl p-6 group hover:border-primary/20 transition-all shadow-sm hover:shadow-premium flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-50 group-hover:bg-accent transition-colors"></div>

                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest rounded-lg">
                                            {bank?.subject || 'UMUM'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${exam.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                            exam.status === 'finished' ? 'bg-slate-50 text-slate-400' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                            {exam.status}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-primary uppercase tracking-tight truncate group-hover:text-accent transition-colors">
                                        {exam.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-slate-300" />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">{exam.duration_minutes} MENIT</span>
                                        </div>
                                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} className="text-slate-300" />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">
                                                {exam.start_time ? new Date(exam.start_time).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'NOT SET'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-50 md:pl-8 pt-4 md:pt-0">
                                    <button
                                        onClick={() => router.push('/dashboard/proktor/monitoring?exam=' + exam.id)}
                                        className="h-11 px-6 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/btn"
                                    >
                                        Monitor <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedExam(exam);
                                            setFormData({
                                                title: exam.title,
                                                duration: exam.duration_minutes,
                                                randomizeQuestions: exam.randomize_questions,
                                                randomizeOptions: exam.randomize_options,
                                                bankId: exam.question_bank_id || '',
                                                startTime: exam.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : '',
                                                endTime: exam.end_time ? new Date(exam.end_time).toISOString().slice(0, 16) : '',
                                                showResults: exam.show_results ?? false,
                                                isSafeMode: exam.metadata?.is_safe_mode ?? true,
                                                selectedClassIds: []
                                            });
                                            setIsEditModalOpen(true);
                                        }}
                                        className="h-11 w-11 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-primary rounded-xl transition-all"
                                    >
                                        <Settings size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedExam(exam);
                                            setAssignData({ classIds: [], userIds: [] });
                                            setIsAssignModalOpen(true);
                                        }}
                                        className="h-11 w-11 flex items-center justify-center bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-xl transition-all"
                                    >
                                        <Users size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteExam(exam.id)}
                                        className="h-11 w-11 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}

                    {filteredExams.length === 0 && (
                        <div className="py-32 text-center bg-white border border-slate-100 rounded-[3rem] shadow-sm">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                                <ClipboardCheck size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter mb-1">Tidak ada ujian</h3>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">PADA KATEGORI {tabs.find(t => t.id === activeTab)?.label}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Exam Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl">
                            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-all bg-slate-50 p-2 rounded-full"><X size={20} /></button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-primary tracking-tight uppercase mb-1">Buat Ujian Baru</h3>
                                <p className="text-sm text-slate-500 font-medium">Jadwalkan ujian baru untuk {org?.name}</p>
                            </div>

                            <form onSubmit={handleCreateExam} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Judul Ujian</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Contoh: UTS Matematika Ganjil"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary uppercase tracking-tighter placeholder:text-slate-300 shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pilih Bank Soal</label>
                                    <select
                                        required
                                        value={formData.bankId}
                                        onChange={e => setFormData({ ...formData, bankId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary uppercase tracking-tighter shadow-inner"
                                    >
                                        <option value="">Pilih Bank Soal</option>
                                        {qBanks.map(bank => (
                                            <option key={bank.id} value={bank.id}>{bank.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Waktu Mulai</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Waktu Selesai</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Durasi (Menit)</label>
                                        <input
                                            required
                                            type="number"
                                            value={isNaN(formData.duration) ? '' : formData.duration}
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                setFormData({ ...formData, duration: isNaN(val) ? 0 : val });
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary shadow-inner"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end gap-2 pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.randomizeQuestions}
                                                onChange={e => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                                                className="hidden"
                                            />
                                            <div className={`w-5 h-5 rounded border ${formData.randomizeQuestions ? 'bg-accent border-accent' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.randomizeQuestions && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary">ACAK SOAL</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group mb-1">
                                            <input
                                                type="checkbox"
                                                checked={formData.randomizeOptions}
                                                onChange={e => setFormData({ ...formData, randomizeOptions: e.target.checked })}
                                                className="hidden"
                                            />
                                            <div className={`w-5 h-5 rounded border ${formData.randomizeOptions ? 'bg-accent border-accent' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.randomizeOptions && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary">ACAK OPSI</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.showResults}
                                                onChange={e => setFormData({ ...formData, showResults: e.target.checked })}
                                                className="hidden"
                                            />
                                            <div className={`w-5 h-5 rounded border ${formData.showResults ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.showResults && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-500">TAMPILKAN HASIL</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.isSafeMode}
                                                onChange={e => setFormData({ ...formData, isSafeMode: e.target.checked })}
                                                className="hidden"
                                            />
                                            <div className={`w-5 h-5 rounded border ${formData.isSafeMode ? 'bg-primary border-primary' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.isSafeMode && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary">MODE AMAN</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Distribusikan ke Kelas</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                        {classes.map(cls => (
                                            <div
                                                key={cls.id}
                                                onClick={() => {
                                                    const ids = formData.selectedClassIds.includes(cls.id)
                                                        ? formData.selectedClassIds.filter(id => id !== cls.id)
                                                        : [...formData.selectedClassIds, cls.id];
                                                    setFormData({ ...formData, selectedClassIds: ids });
                                                }}
                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData.selectedClassIds.includes(cls.id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-primary uppercase truncate max-w-[80px]">{cls.name}</span>
                                                    <span className="text-[8px] text-slate-400 font-black uppercase">{cls.type}</span>
                                                </div>
                                                <div className={`w-4 h-4 rounded flex items-center justify-center ${formData.selectedClassIds.includes(cls.id) ? 'bg-primary' : 'bg-slate-100'}`}>
                                                    {formData.selectedClassIds.includes(cls.id) && <Check size={10} className="text-white" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {classes.length === 0 && (
                                        <p className="text-[10px] text-slate-500 ml-2">Belum ada kelas tersedia. Silakan hubungi Proktor.</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-primary-light transition-all shadow-xl shadow-primary/20 disabled:opacity-50 uppercase tracking-widest active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    JADWALKAN UJIAN
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Edit Exam Modal */}
                {isEditModalOpen && selectedExam && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl">
                            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-all bg-slate-50 p-2 rounded-full"><X size={20} /></button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-primary tracking-tight uppercase mb-1">Edit Ujian</h3>
                                <p className="text-sm text-slate-500 font-medium truncate">Update informasi untuk ujian terpilih</p>
                            </div>

                            <form onSubmit={handleEditExam} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Judul Ujian</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary uppercase tracking-tighter shadow-inner"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Waktu Mulai</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Waktu Selesai</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Durasi (Menit)</label>
                                        <input
                                            required
                                            type="number"
                                            value={isNaN(formData.duration) ? '' : formData.duration}
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                setFormData({ ...formData, duration: isNaN(val) ? 0 : val });
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary shadow-inner"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end gap-2 pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.randomizeQuestions}
                                                onChange={e => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                                                className="hidden"
                                            />
                                            <div className={`w-5 h-5 rounded border ${formData.randomizeQuestions ? 'bg-accent border-accent' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.randomizeQuestions && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary">ACAK SOAL</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group mb-1">
                                            <input
                                                type="checkbox"
                                                checked={formData.randomizeOptions}
                                                onChange={e => setFormData({ ...formData, randomizeOptions: e.target.checked })}
                                                className="hidden"
                                            />
                                            <div className={`w-5 h-5 rounded border ${formData.randomizeOptions ? 'bg-accent border-accent' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.randomizeOptions && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary">ACAK OPSI</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.showResults}
                                                onChange={e => setFormData({ ...formData, showResults: e.target.checked })}
                                                className="hidden"
                                            />
                                            <div className={`w-5 h-5 rounded border ${formData.showResults ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.showResults && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-500">TAMPILKAN HASIL</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.isSafeMode}
                                                onChange={e => setFormData({ ...formData, isSafeMode: e.target.checked })}
                                                className="hidden"
                                            />
                                            <div className={`w-5 h-5 rounded border ${formData.isSafeMode ? 'bg-primary border-primary' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.isSafeMode && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary">MODE AMAN</span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-slate-700 transition-all shadow-xl shadow-slate-800/20 disabled:opacity-50 uppercase tracking-widest active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Settings size={20} />}
                                    SIMPAN PERUBAHAN
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Assign Exam Modal */}
                {isAssignModalOpen && selectedExam && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" onClick={() => setIsAssignModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl">
                            <button onClick={() => setIsAssignModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-all bg-slate-50 p-2 rounded-full"><X size={20} /></button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-primary tracking-tight uppercase mb-1">Assign Ujian</h3>
                                <p className="text-sm text-slate-500 font-medium">Tentukan penerima ujian ini, status ujian akan menjadi Aktif (Active).</p>
                            </div>

                            <form onSubmit={handleAssignExam} className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pilih Kelas</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                        {classes.map(cls => (
                                            <div
                                                key={cls.id}
                                                onClick={() => {
                                                    const ids = assignData.classIds.includes(cls.id)
                                                        ? assignData.classIds.filter(id => id !== cls.id)
                                                        : [...assignData.classIds, cls.id];
                                                    setAssignData({ ...assignData, classIds: ids });
                                                }}
                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${assignData.classIds.includes(cls.id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-primary uppercase truncate max-w-[80px]">{cls.name}</span>
                                                    <span className="text-[8px] text-slate-400 font-black uppercase">{cls.type}</span>
                                                </div>
                                                <div className={`w-4 h-4 rounded flex items-center justify-center ${assignData.classIds.includes(cls.id) ? 'bg-primary' : 'bg-slate-100'}`}>
                                                    {assignData.classIds.includes(cls.id) && <Check size={10} className="text-white" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {classes.length === 0 && (
                                        <p className="text-[10px] text-slate-500 ml-2">Belum ada kelas.</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tambah Siswa Khusus (Opsional)</label>
                                    <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                        {students.map(student => (
                                            <div
                                                key={student.id}
                                                onClick={() => {
                                                    const ids = assignData.userIds.includes(student.id)
                                                        ? assignData.userIds.filter(id => id !== student.id)
                                                        : [...assignData.userIds, student.id];
                                                    setAssignData({ ...assignData, userIds: ids });
                                                }}
                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${assignData.userIds.includes(student.id) ? 'border-accent bg-accent/5 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
                                            >
                                                <span className="text-xs font-bold text-slate-700 uppercase">{student.fullName}</span>
                                                <div className={`w-4 h-4 rounded flex items-center justify-center ${assignData.userIds.includes(student.id) ? 'bg-accent' : 'bg-slate-100'}`}>
                                                    {assignData.userIds.includes(student.id) && <Check size={10} className="text-white" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {students.length === 0 && (
                                        <p className="text-[10px] text-slate-500 ml-2">Belum ada siswa.</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-accent text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 disabled:opacity-50 uppercase tracking-widest active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Users size={20} />}
                                    ASSIGN UJIAN
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExamsPage;
