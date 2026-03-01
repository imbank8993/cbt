"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardCheck, Plus, Search,
    Calendar, Play, Settings,
    Trash2, Clock, BookOpen,
    Loader2, X, Check
} from 'lucide-react';
import { getProctorOrganization, listOrganizationExams, createExamAction, listOrganizationClasses, assignExamAction } from '@/app/actions/proktor';
import { listQuestionBanks } from '@/app/actions/question';
import { supabase } from '@/lib/supabase';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TeacherExamsPage = () => {
    const [exams, setExams] = useState<any[]>([]);
    const [qBanks, setQBanks] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [org, setOrg] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    // Modal & Form States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
                const [examList, bankList, classList] = await Promise.all([
                    listOrganizationExams(organization.id),
                    listQuestionBanks(organization.id, user.id),
                    listOrganizationClasses(organization.id)
                ]);
                setExams(examList);
                setQBanks(bankList);
                setClasses(classList);
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
            questionBankId: formData.bankId
        });

        if (result.success && result.id) {
            if (formData.selectedClassIds.length > 0) {
                await assignExamAction(result.id, formData.selectedClassIds, [], true);
            }
            setIsAddModalOpen(false);
            setFormData({ title: '', duration: 90, randomizeQuestions: true, randomizeOptions: true, showResults: false, bankId: qBanks[0]?.id || '', startTime: '', endTime: '', selectedClassIds: [] });
            await loadData();
        } else {
            alert('Gagal membuat ujian: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const filteredExams = exams.filter(e =>
        e.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-primary tracking-tight uppercase italic flex items-center gap-4">
                        <ClipboardCheck size={36} className="text-accent" />
                        Jadwal Ujian
                    </h2>
                    <p className="text-slate-400 font-medium italic uppercase tracking-tighter">Kelola dan distribusikan ujian ke kelas pengajaran Anda.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari ujian..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold placeholder:text-slate-300 shadow-sm transition-all"
                        />
                    </div>
                </div>
            </header>

            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary hover:bg-primary-light text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-3 active:scale-95 text-xs uppercase italic tracking-widest leading-none"
                >
                    <Plus size={18} /> Buat Ujian Baru
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam) => (
                        <motion.div
                            layout
                            key={exam.id}
                            className="bg-white border border-slate-100 rounded-[2rem] p-8 group hover:border-primary/20 transition-all hover:shadow-premium shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-2 h-full bg-slate-100 group-hover:bg-primary transition-colors"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${exam.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                    {exam.status}
                                </div>
                                <button
                                    onClick={() => router.push('/dashboard/guru/questions')}
                                    title="Pengaturan Bank Soal"
                                    className="p-2 text-slate-300 hover:text-primary transition-colors"
                                >
                                    <Settings size={18} />
                                </button>
                            </div>

                            <h3 className="text-xl font-black text-primary italic uppercase tracking-tight mb-4 group-hover:text-accent transition-colors line-clamp-2">
                                {exam.title}
                            </h3>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Clock size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">{exam.duration_minutes} Menit</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Calendar size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <button
                                    onClick={() => router.push('/dashboard/guru/grading')}
                                    className="w-full bg-primary/5 text-primary border border-primary/10 hover:bg-primary hover:text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic shadow-sm"
                                >
                                    Lihat Monitoring
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {filteredExams.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[2rem]">
                            <ClipboardCheck size={48} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold italic uppercase tracking-tighter">Tidak ada ujian ditemukan</p>
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-all bg-slate-50 p-2 rounded-full"><X size={20} /></button>

                            <div className="mb-8 font-black text-primary uppercase italic">
                                <h3 className="text-2xl tracking-tighter mb-1">Buat Ujian Baru</h3>
                                <p className="text-xs text-slate-500 tracking-normal non-italic font-bold">Distribusikan bank soal ke kelas Anda</p>
                            </div>

                            <form onSubmit={handleCreateExam} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">1. Judul Ujian</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="UTS MATEMATIKA..."
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic uppercase tracking-tighter placeholder:text-slate-300 shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">2. Pilih Bank Soal</label>
                                    <select
                                        required
                                        value={formData.bankId}
                                        onChange={e => setFormData({ ...formData, bankId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic uppercase tracking-tighter shadow-inner"
                                    >
                                        <option value="">Pilih Bank Soal</option>
                                        {qBanks.map(bank => (
                                            <option key={bank.id} value={bank.id}>{bank.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Waktu Mulai</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Waktu Selesai</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">3. Durasi (Menit)</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic shadow-inner"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end gap-2 pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" checked={formData.randomizeQuestions} onChange={e => setFormData({ ...formData, randomizeQuestions: e.target.checked })} className="hidden" />
                                            <div className={`w-5 h-5 rounded border ${formData.randomizeQuestions ? 'bg-accent border-accent' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.randomizeQuestions && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary">ACAK SOAL</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group mb-1">
                                            <input type="checkbox" checked={formData.randomizeOptions} onChange={e => setFormData({ ...formData, randomizeOptions: e.target.checked })} className="hidden" />
                                            <div className={`w-5 h-5 rounded border ${formData.randomizeOptions ? 'bg-accent border-accent' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.randomizeOptions && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary">ACAK OPSI</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" checked={formData.showResults} onChange={e => setFormData({ ...formData, showResults: e.target.checked })} className="hidden" />
                                            <div className={`w-5 h-5 rounded border ${formData.showResults ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-100 border-slate-200'} flex items-center justify-center transition-all shadow-sm`}>
                                                {formData.showResults && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-500">TAMPILKAN HASIL</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">4. Target Kelas</label>
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
                                                    <span className="text-[10px] font-bold text-primary uppercase italic truncate max-w-[80px]">{cls.name}</span>
                                                    <span className="text-[8px] text-slate-400 font-black uppercase">{cls.type}</span>
                                                </div>
                                                <div className={`w-4 h-4 rounded flex items-center justify-center ${formData.selectedClassIds.includes(cls.id) ? 'bg-primary' : 'bg-slate-100'}`}>
                                                    {formData.selectedClassIds.includes(cls.id) && <Check size={10} className="text-white" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-primary-light transition-all shadow-xl shadow-primary/20 disabled:opacity-50 italic uppercase tracking-widest active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    JADWALKAN UJIAN
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherExamsPage;
