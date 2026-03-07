"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, BookOpen, Trash2, Edit3, MoreHorizontal,
    ArrowRight, Loader2, X, Sparkles, User, ShieldCheck,
    Calculator, Languages, Atom, Globe, BookMarked, Dumbbell, Palette, Cpu,
    Image as ImageIcon, Upload, Check, ChevronDown, Eye
} from 'lucide-react';
import { createQuestionBank, listQuestionBanks, deleteQuestionBank, toggleQuestionBankPublishAction, updateQuestionBankAction, bulkToggleQuestionBankPublishAction } from '@/app/actions/question';
import { getProctorOrganization, listOrganizationMembers } from '@/app/actions/proktor';
import { supabase } from '@/lib/supabase';
import { uploadToHosting } from '@/lib/uploader';
import Link from 'next/link';

const AVAILABLE_ICONS = [
    { id: 'BookOpen', icon: BookOpen, label: 'Buku' },
    { id: 'Calculator', icon: Calculator, label: 'Matematika' },
    { id: 'Languages', icon: Languages, label: 'Bahasa' },
    { id: 'Atom', icon: Atom, label: 'Sains' },
    { id: 'Globe', icon: Globe, label: 'Sosial' },
    { id: 'BookMarked', icon: BookMarked, label: 'Agama' },
    { id: 'Dumbbell', icon: Dumbbell, label: 'Olahraga' },
    { id: 'Palette', icon: Palette, label: 'Seni' },
    { id: 'Cpu', icon: Cpu, label: 'Teknologi' },
];

export default function ProktorQuestionBankPage() {
    const [banks, setBanks] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bankToDelete, setBankToDelete] = useState<any>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [org, setOrg] = useState<any>(null);
    const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

    const [activeTab, setActiveTab] = useState<'draft' | 'published'>('draft');
    const [editingBank, setEditingBank] = useState<any>(null);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterClassLevel, setFilterClassLevel] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        classLevel: '',
        iconIdentifier: 'BookOpen',
        imageUrl: ''
    });

    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (user) {
                const organization = await getProctorOrganization(user.id);
                if (organization) {
                    setOrg(organization);
                    const [list, memberList] = await Promise.all([
                        listQuestionBanks(organization.id, user.id),
                        listOrganizationMembers(organization.id)
                    ]);
                    setBanks(list);
                    setTeachers(memberList.filter((m: any) => m.role === 'Guru' || m.role === 'Proktor' || m.role === 'Admin'));
                }
            }
        } catch (err) {
            console.error('Bank: Load error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !org) return;

        setUploadingImage(true);
        try {
            let oldUrl = '';
            if (formData.imageUrl && (formData.imageUrl.includes('icgowa.sch.id') || formData.imageUrl.includes('unelma.id'))) {
                oldUrl = formData.imageUrl;
            }

            const result = await uploadToHosting(file, 'banks', oldUrl);

            if (!result.success || !result.url) {
                throw new Error(result.error || 'Terjadi kesalahan saat upload');
            }

            setFormData(prev => ({ ...prev, imageUrl: result.url, iconIdentifier: '' }));
        } catch (error: any) {
            alert('Gagal upload: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleOpenEdit = (bank: any) => {
        setEditingBank(bank);
        setFormData({
            title: bank.title,
            description: bank.description || '',
            subject: bank.subject || '',
            classLevel: bank.class_level || '',
            iconIdentifier: bank.icon_identifier || 'BookOpen',
            imageUrl: bank.image_url || ''
        });
        setIsAddModalOpen(true);
    };

    const handleSaveBank = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user || !org) return;

            setIsSubmitting(true);

            let result: any;
            if (editingBank) {
                result = await updateQuestionBankAction(editingBank.id, org.id, {
                    title: formData.title,
                    description: formData.description,
                    subject: formData.subject,
                    classLevel: formData.classLevel,
                    iconIdentifier: formData.iconIdentifier,
                    imageUrl: formData.imageUrl
                });
            } else {
                result = await createQuestionBank(
                    org.id,
                    user.id,
                    formData.title,
                    formData.description,
                    formData.subject,
                    formData.classLevel,
                    formData.iconIdentifier,
                    formData.imageUrl
                );
            }

            if (result.success) {
                setIsAddModalOpen(false);
                setEditingBank(null);
                setFormData({ title: '', description: '', subject: '', classLevel: '', iconIdentifier: 'BookOpen', imageUrl: '' });
                await loadData();
            } else {
                alert('GAGAL: ' + result.error);
            }
        } catch (err: any) {
            alert('KESALAHAN SISTEM: ' + (err.message || 'Error occurred'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBank = async () => {
        if (!bankToDelete || !org) return;
        if (deleteConfirmName.trim().toLowerCase() !== bankToDelete.title.trim().toLowerCase()) {
            alert('Nama bank soal tidak cocok.');
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await deleteQuestionBank(bankToDelete.id, org.id);
            if (result.success) {
                setIsDeleteModalOpen(false);
                setBankToDelete(null);
                setDeleteConfirmName('');
                await loadData();
            } else {
                alert('Gagal menghapus: ' + result.error);
            }
        } catch (err) {
            alert('Error saat menghapus.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePublish = async (bank: any) => {
        if (!org) return;
        try {
            const newStatus = !bank.is_published;
            const result = await toggleQuestionBankPublishAction(bank.id, org.id, newStatus);
            if (result.success) {
                alert(newStatus ? 'Berhasil menerbitkan bank soal!' : 'Berhasil menarik publikasi bank soal (Draft).');
                await loadData();
            } else {
                alert('Gagal mengubah status publish: ' + result.error);
            }
        } catch (err) {
            alert('Terjadi kesalahan.');
        }
    };

    const handleBulkTogglePublish = async (isPublished: boolean) => {
        if (!org || selectedBankIds.length === 0) return;
        try {
            setIsSubmitting(true);
            const result = await bulkToggleQuestionBankPublishAction(selectedBankIds, org.id, isPublished);
            if (result.success) {
                alert(`Berhasil ${isPublished ? 'menerbitkan' : 'menarik'} ${selectedBankIds.length} bank soal!`);
                setSelectedBankIds([]);
                await loadData();
            } else {
                alert('Gagal melakukan aksi masal: ' + result.error);
            }
        } catch (err) {
            alert('Terjadi kesalahan pada aksi masal.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSelectBank = (id: string) => {
        setSelectedBankIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedBankIds.length === filteredBanks.length) {
            setSelectedBankIds([]);
        } else {
            setSelectedBankIds(filteredBanks.map(b => b.id));
        }
    };

    const filteredBanks = useMemo(() => {
        return banks.filter(bank => {
            const matchesTab = activeTab === 'published' ? bank.is_published : !bank.is_published;
            const matchesSearch = bank.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                bank.subject?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSubject = !filterSubject || bank.subject === filterSubject;
            const matchesLevel = !filterClassLevel || bank.class_level === filterClassLevel;
            const matchesTeacher = !filterTeacher || bank.created_by === filterTeacher;

            return matchesTab && matchesSearch && matchesSubject && matchesLevel && matchesTeacher;
        });
    }, [banks, searchQuery, filterSubject, filterClassLevel, filterTeacher, activeTab]);

    const getIconComponent = (iconId: string) => {
        const found = AVAILABLE_ICONS.find(i => i.id === iconId);
        return found ? found.icon : BookOpen;
    };

    const getInitials = (text: string) => {
        if (!text) return '??';
        const parts = text.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return text.trim().substring(0, 2).toUpperCase();
    };

    const subjects = Array.from(new Set(banks.map(b => b.subject).filter(Boolean)));
    const levels = Array.from(new Set(banks.map(b => b.class_level).filter(Boolean)));

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 space-y-10 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Header Area */}
            <header className="relative z-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#000B44] via-[#000B44] to-[#0d1b3e] text-white shadow-xl shadow-blue-900/10 border border-white/10">
                {/* Decorative Accents */}
                <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[80%] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[80%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-lg group-hover:scale-105 transition-transform duration-500">
                            <ShieldCheck size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter leading-none">
                                Manajemen <span className="text-amber-400">Soal</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Sparkles size={12} className="text-amber-500 animate-pulse" />
                                <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.2em]">Kontrol Kualitas & Distribusi</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-amber-400 hover:bg-amber-500 text-[#000B44] font-black px-6 py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest"
                        >
                            <Plus size={16} strokeWidth={3} /> Buat Bank Soal
                        </button>
                    </div>
                </div>
            </header>

            {/* Filter and Search Bar (Separate from Header) */}
            <div className="relative z-10 flex flex-col gap-4">
                {/* Row 1: Tabs & Batch Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex p-1.5 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-x-auto w-full md:w-max backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('draft')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'draft' ? 'bg-[#000B44] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Draft
                        </button>
                        <button
                            onClick={() => setActiveTab('published')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'published' ? 'bg-[#000B44] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Published
                        </button>
                    </div>

                    {filteredBanks.length > 0 && (
                        <button
                            onClick={toggleSelectAll}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-black px-6 py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95 text-[9px] uppercase tracking-widest w-full md:w-auto"
                        >
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${selectedBankIds.length === filteredBanks.length ? 'bg-[#000B44] border-[#000B44]' : 'bg-slate-50 border-slate-200'}`}>
                                {selectedBankIds.length === filteredBanks.length && <Check size={10} className="text-white" strokeWidth={4} />}
                            </div>
                            {selectedBankIds.length === filteredBanks.length ? 'Batal Pilih' : 'Pilih Semua'}
                        </button>
                    )}
                </div>

                {/* Row 2: Search & Select Dropdowns */}
                <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4">
                    <div className="flex-1 relative w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={16} strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="Cari bank soal organisasi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-[#000B44] placeholder:text-slate-300 focus:ring-2 focus:ring-[#000B44]/20 outline-none font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                        <div className="flex-1 min-w-[160px] relative group/sel">
                            <select
                                value={filterSubject}
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-3.5 px-5 pr-10 text-[10px] font-black text-slate-700 uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#000B44]/20 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="">Semua Mapel</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/sel:rotate-180 transition-transform" />
                        </div>

                        <div className="flex-1 min-w-[160px] relative group/sel">
                            <select
                                value={filterTeacher}
                                onChange={(e) => setFilterTeacher(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-3.5 px-5 pr-10 text-[10px] font-black text-slate-700 uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#000B44]/20 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="">Semua Guru</option>
                                {teachers.map(t => <option key={t.userId} value={t.userId}>{t.fullName}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/sel:rotate-180 transition-transform" />
                        </div>

                        <div className="flex-1 min-w-[120px] relative group/sel">
                            <select
                                value={filterClassLevel}
                                onChange={(e) => setFilterClassLevel(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-3.5 px-5 pr-10 text-[10px] font-black text-slate-700 uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#000B44]/20 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="">Tingkat</option>
                                {levels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/sel:rotate-180 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={48} className="text-primary animate-spin opacity-20" />
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredBanks.map((bank, idx) => {
                        const IconComponent = getIconComponent(bank.icon_identifier);
                        const isSelected = selectedBankIds.includes(bank.id);

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: idx * 0.05,
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 20
                                }}
                                key={bank.id}
                                className={`group bg-white rounded-2xl border ${isSelected ? 'border-[#000B44]/40 ring-4 ring-[#000B44]/5 shadow-2xl' : 'border-slate-100 shadow-premium-sm'} p-4 md:p-5 hover:shadow-premium transition-all relative overflow-hidden flex flex-col md:flex-row items-center gap-5 text-left`}
                            >
                                {/* Glow Effect on Hover */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#000B44]/5 to-amber-500/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#000B44]/2 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125 duration-700"></div>
                                {/* Selection Checkbox */}
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleSelectBank(bank.id); }}
                                    className={`relative z-20 shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? 'bg-[#0038A8] border-[#0038A8] rotate-0 scale-110 shadow-lg shadow-blue-900/30' : 'bg-slate-50 border-slate-200 hover:border-[#0038A8]/50 rotate-[-15deg] group-hover:rotate-0'}`}
                                >
                                    {isSelected ? (
                                        <Check size={14} className="text-white" strokeWidth={4} />
                                    ) : (
                                        <div className="w-1 h-1 rounded-full bg-slate-200 group-hover:bg-[#0038A8]/30 transition-colors"></div>
                                    )}
                                </div>

                                {/* Visual Identity */}
                                <div className="relative z-10 w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden bg-white border border-slate-100 shadow-[0_4px_15px_rgb(0,0,0,0.03)] group-hover:shadow-lg group-hover:shadow-blue-900/5 transition-all duration-500">
                                    {bank.image_url ? (
                                        <img src={bank.image_url} alt={bank.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                    ) : bank.icon_identifier ? (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center group-hover:bg-[#0038A8] transition-colors">
                                            <IconComponent size={24} className="text-[#0038A8] group-hover:text-white transition-all duration-500" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-blue-50 flex items-center justify-center group-hover:bg-[#0038A8] transition-colors">
                                            <span className="text-xl font-black text-[#0038A8] group-hover:text-white transition-all uppercase tracking-tighter">{getInitials(bank.subject || bank.title)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0 relative z-10 flex flex-col gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-black text-slate-900 truncate group-hover:text-[#0038A8] transition-colors tracking-tight">{bank.title}</h3>
                                        <div className="flex gap-1.5">
                                            {bank.subject && (
                                                <span className="px-2 py-0.5 bg-white border border-slate-100 text-slate-500 text-[8px] font-black rounded uppercase tracking-wider shadow-sm group-hover:border-blue-500/20 transition-colors">
                                                    {bank.subject}
                                                </span>
                                            )}
                                            {bank.class_level && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-[#0038A8] text-[8px] font-black rounded uppercase tracking-wider border border-blue-100">
                                                    {bank.class_level}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                <User size={8} className="text-slate-400" />
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">{(bank.profiles as any)?.full_name || 'System Generated'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Management Actions */}
                                <div className="flex items-center gap-4 shrink-0 relative z-10 w-full md:w-auto mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-50 justify-between md:justify-end">
                                    <div className="flex flex-col items-start md:items-end group/stats gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${bank.is_published ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`}></div>
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${bank.is_published ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                    {bank.is_published ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                            <span className="text-[7px] font-black text-slate-200">|</span>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <span className="text-[9px] font-black text-slate-900 leading-none">{bank.question_count || 0}</span>
                                                <span className="text-[6px] font-black uppercase tracking-widest">Soal</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-8 w-[1px] bg-slate-100 hidden md:block"></div>

                                    <div className="flex gap-1.5 items-center">
                                        {/* Publish Toggle */}
                                        <button
                                            onClick={() => handleTogglePublish(bank)}
                                            className={`group/pub px-4 py-2 rounded-xl text-[7px] font-black uppercase tracking-[0.2em] transition-all border shadow-md relative overflow-hidden ${bank.is_published ? 'bg-[#000B44] text-white border-blue-950 shadow-blue-900/20' : 'bg-slate-900 text-white border-black shadow-black/20 hover:bg-[#000B44] hover:border-[#000B44]'}`}
                                        >
                                            <span className="relative z-10">{bank.is_published ? 'Unpublish' : 'Publish'}</span>
                                            {bank.is_published && <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/pub:translate-x-[100%] transition-transform duration-1000"></div>}
                                        </button>

                                        {/* Review Link */}
                                        <Link
                                            href={`/dashboard/proktor/questions/${bank.id}`}
                                            className="w-8 h-8 bg-white text-slate-800 rounded-lg flex items-center justify-center hover:bg-[#0038A8] hover:text-white transition-all shadow-sm border border-slate-100 active:scale-95 group/btn"
                                            title="Tinjau Konten"
                                        >
                                            <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                                        </Link>

                                        {/* Edit Button */}
                                        <button
                                            onClick={() => handleOpenEdit(bank)}
                                            className="w-8 h-8 bg-white text-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-100 active:scale-95"
                                            title="Ubah Identitas"
                                        >
                                            <Edit3 size={14} />
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => {
                                                setBankToDelete(bank);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="w-8 h-8 bg-white text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-slate-100 active:scale-95"
                                            title="Hapus Permanen"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {filteredBanks.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300 uppercase">Data Tidak Ditemukan</h3>
                            <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-widest opacity-50">Coba sesuaikan kata kunci atau filter pencarian anda.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Bulk Action Bar - Control Center Aesthetic */}
            <AnimatePresence>
                {selectedBankIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 backdrop-blur-3xl border border-white/10 px-10 py-6 rounded-[3rem] shadow-[0_45px_100px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center gap-10 min-w-[320px] md:min-w-[600px]"
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-1.5 bg-[#000B44] rounded-full shadow-[0_0_20px_rgba(0,11,68,0.4)] text-[8px] font-black uppercase tracking-[0.3em] text-white">
                            Administrative Control
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <span className="text-white font-black text-4xl leading-none tracking-tighter drop-shadow-2xl">{selectedBankIds.length}</span>
                                <div className="absolute -top-2 -right-2 w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-100 text-[11px] font-black uppercase tracking-widest leading-none">Bank Soal</span>
                                <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em] mt-1.5">Aksi Massal Proktor</span>
                            </div>
                        </div>

                        <div className="h-12 w-[1px] bg-white/10 hidden md:block"></div>

                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => handleBulkTogglePublish(true)}
                                disabled={isSubmitting}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-500/20 disabled:opacity-50 group/bulk"
                            >
                                <Check size={16} strokeWidth={4} className="group-hover/bulk:scale-125 transition-transform" /> Publish Masal
                            </button>
                            <button
                                onClick={() => handleBulkTogglePublish(false)}
                                disabled={isSubmitting}
                                className="bg-white/5 hover:bg-white/10 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 text-[10px] uppercase tracking-widest border border-white/10 disabled:opacity-50 group/bulk"
                            >
                                <X size={16} strokeWidth={4} className="group-hover/bulk:rotate-90 transition-transform" /> Tarik Masal
                            </button>
                            <button
                                onClick={() => setSelectedBankIds([])}
                                className="text-slate-400 hover:text-white font-black px-6 py-4 text-[10px] uppercase tracking-widest transition-colors hover:bg-white/5 rounded-2xl"
                            >
                                Batal
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Tambah/Edit Bank Soal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh] border border-white/20 text-left"
                        >
                            <div className="p-10 pb-6 flex justify-between items-start border-b border-slate-50 relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-sm border border-primary/5">
                                        {editingBank ? <Edit3 size={32} strokeWidth={3} /> : <Plus size={32} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingBank ? 'Ubah Identitas' : 'Koleksi Baru'}</h3>
                                        <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-[0.2em] opacity-70">Konfigurasi parameter dasar bank soal sekolah</p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsAddModalOpen(false); setEditingBank(null); }} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100 shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Judul Koleksi</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Contoh: USBN Fisika 2024"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-slate-900 font-bold outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mata Pelajaran</label>
                                                <select
                                                    required
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-slate-900 font-bold outline-none focus:border-primary focus:bg-white transition-all appearance-none cursor-pointer shadow-inner"
                                                >
                                                    <option value="">Pilih Mapel</option>
                                                    <option value="Matematika">Matematika</option>
                                                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                                                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                                                    <option value="IPA">IPA</option>
                                                    <option value="IPS">IPS</option>
                                                    <option value="PAI">PAI</option>
                                                    <option value="Lainnya">Lainnya</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tingkatan</label>
                                                <select
                                                    required
                                                    value={formData.classLevel}
                                                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-slate-900 font-bold outline-none focus:border-primary focus:bg-white transition-all appearance-none cursor-pointer shadow-inner"
                                                >
                                                    <option value="">Pilih Tingkat</option>
                                                    <option value="Kelas 7">Kelas 7</option>
                                                    <option value="Kelas 8">Kelas 8</option>
                                                    <option value="Kelas 9">Kelas 9</option>
                                                    <option value="Kelas 10">Kelas 10</option>
                                                    <option value="Kelas 11">Kelas 11</option>
                                                    <option value="Kelas 12">Kelas 12</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex justify-between">
                                                <span>Preview Kartu</span>
                                                <span className="text-primary animate-pulse">Live</span>
                                            </label>

                                            <div className="aspect-[4/3] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl group/prev border border-white/10">
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary-rgb),0.3),transparent)] opacity-50"></div>
                                                <div className="relative z-10 flex justify-between items-start">
                                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                                                        {formData.imageUrl ? (
                                                            <img src={formData.imageUrl} className="w-full h-full object-cover rounded-2xl" />
                                                        ) : (
                                                            React.createElement(getIconComponent(formData.iconIdentifier), { size: 32, className: "text-white" })
                                                        )}
                                                    </div>
                                                    <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{formData.classLevel || 'Level'}</span>
                                                    </div>
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-2">{formData.subject || 'Subject'}</p>
                                                    <h4 className="text-2xl font-black text-white truncate tracking-tight">{formData.title || 'Judul Koleksi'}</h4>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-5 gap-3 mt-4">
                                                {AVAILABLE_ICONS.map(item => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, iconIdentifier: item.id, imageUrl: '' })}
                                                        className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all ${formData.iconIdentifier === item.id && !formData.imageUrl ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-primary/30'}`}
                                                    >
                                                        <item.icon size={18} />
                                                    </button>
                                                ))}
                                                <label className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all ${formData.imageUrl ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-primary/30'}`}>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                                    {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={18} />}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Catatan Administratif</label>
                                    <textarea
                                        placeholder="Berikan deskripsi atau catatan khusus untuk bank soal ini..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-slate-900 font-bold outline-none focus:border-primary focus:bg-white transition-all min-h-[120px] shadow-inner resize-none"
                                    />
                                </div>
                            </div>

                            <div className="p-10 pt-0 bg-white">
                                <button
                                    onClick={handleSaveBank}
                                    disabled={isSubmitting || uploadingImage}
                                    className="w-full bg-slate-950 hover:bg-primary text-white font-black py-7 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] group border-b-8 border-black/20 active:scale-95 active:border-b-0"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                        <>
                                            {editingBank ? 'Perbarui Koleksi' : 'Siapkan Koleksi Baru'}
                                            <ArrowRight size={20} className="group-hover:translate-x-3 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Hapus Bank Soal */}
            <AnimatePresence>
                {isDeleteModalOpen && bankToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-red-950/40 backdrop-blur-xl">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl p-10 relative border border-red-100"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-red-600 uppercase leading-none tracking-tight">Destruksi Data</h3>
                                    <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-[0.2em] opacity-80">Tindakan fatal tidak dapat dikembalikan</p>
                                </div>
                                <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmName(''); }} className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-300 hover:text-red-600 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-red-50/50 p-6 rounded-3xl mb-8 border border-red-100">
                                <p className="text-slate-600 text-[12px] font-bold leading-relaxed mb-4">
                                    Anda akan menghapus total <span className="text-red-600 font-black">"{bankToDelete.title}"</span> beserta seluruh sejarah kuis yang terkait.
                                </p>
                                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest opacity-70">
                                    Tanda Tangani dengan Nama Bank Soal:
                                </p>
                            </div>

                            <div className="space-y-6">
                                <input
                                    type="text"
                                    placeholder={bankToDelete.title}
                                    value={deleteConfirmName}
                                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-red-100 rounded-2xl p-5 text-slate-900 font-black outline-none focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-slate-200 text-sm"
                                />

                                <button
                                    onClick={handleDeleteBank}
                                    disabled={isSubmitting || deleteConfirmName.trim().toLowerCase() !== bankToDelete.title.trim().toLowerCase()}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-[1.5rem] shadow-xl shadow-red-500/30 flex items-center justify-center gap-4 transition-all disabled:opacity-20 text-xs uppercase tracking-widest"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Trash2 size={20} strokeWidth={3} />}
                                    Eksekusi Penghapusan
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f8fafc;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
