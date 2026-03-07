"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, BookOpen,
    Trash2, Edit3, MoreHorizontal,
    ArrowRight, Loader2, X, Sparkles, User,
    Calculator, Languages, Atom, Globe, BookMarked, Dumbbell, Palette, Cpu,
    Image as ImageIcon, Upload, Check, ChevronDown
} from 'lucide-react';
import { createQuestionBank, listQuestionBanks, deleteQuestionBank, toggleQuestionBankPublishAction, updateQuestionBankAction, bulkToggleQuestionBankPublishAction } from '@/app/actions/question';
import { getProctorOrganization } from '@/app/actions/proktor';
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

export default function QuestionBankPage() {
    const [banks, setBanks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bankToDelete, setBankToDelete] = useState<any>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [org, setOrg] = useState<any>(null);
    const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterClassLevel, setFilterClassLevel] = useState('');

    const [activeTab, setActiveTab] = useState<'draft' | 'published'>('draft');
    const [editingBank, setEditingBank] = useState<any>(null);

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
                    const list = await listQuestionBanks(organization.id, user.id);
                    setBanks(list);
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
            if (formData.imageUrl && formData.imageUrl.includes('icgowa.sch.id')) {
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

            return matchesTab && matchesSearch && matchesSubject && matchesLevel;
        });
    }, [banks, searchQuery, filterSubject, filterClassLevel, activeTab]);

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
                            <BookOpen size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter leading-none">
                                Bank <span className="text-amber-400">Soal</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Sparkles size={12} className="text-amber-500 animate-pulse" />
                                <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.2em]">Pusat Kreativitas & Evaluasi</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Compact Tab Slider */}
                        <div className="bg-white/5 backdrop-blur-md p-1 rounded-xl flex items-center relative overflow-hidden border border-white/10 shadow-inner">
                            <motion.div
                                className="absolute bg-white rounded-lg shadow-md"
                                initial={false}
                                animate={{
                                    x: activeTab === 'draft' ? 4 : 84,
                                    width: activeTab === 'draft' ? 80 : 100
                                }}
                                transition={{ type: "spring", stiffness: 350, damping: 35 }}
                                style={{ height: 'calc(100% - 8px)', top: 4 }}
                            />
                            <button
                                onClick={() => setActiveTab('draft')}
                                className={`relative z-10 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors duration-300 w-[80px] ${activeTab === 'draft' ? 'text-[#000B44]' : 'text-white/60 hover:text-white'}`}
                            >
                                Draft
                            </button>
                            <button
                                onClick={() => setActiveTab('published')}
                                className={`relative z-10 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors duration-300 w-[100px] ${activeTab === 'published' ? 'text-[#000B44]' : 'text-white/60 hover:text-white'}`}
                            >
                                Published
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setEditingBank(null);
                                setFormData({ title: '', description: '', subject: '', classLevel: '', iconIdentifier: 'BookOpen', imageUrl: '' });
                                setIsAddModalOpen(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-4 rounded-xl shadow-lg shadow-amber-900/20 transition-all flex items-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest border-b-4 border-amber-700 hover:border-amber-800 group/btn"
                        >
                            <Plus size={18} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform" />
                            Buat Baru
                        </button>
                    </div>
                </div>

                {/* Search & Filter - More Integrated */}
                <div className="relative px-6 pb-6 md:px-8 md:pb-8 pt-0 flex flex-col md:flex-row gap-4 items-center border-t border-white/5 mt-2 pt-4">
                    <div className="flex-1 relative group/search w-full">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="text-white/30 group-focus-within/search:text-amber-500 transition-colors" size={18} strokeWidth={3} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari koleksi soal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl py-4 pl-14 pr-4 text-xs font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:bg-white/10 focus:border-amber-500/30 transition-all text-white placeholder:text-white/30 shadow-inner"
                        />
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:w-48 relative group/sel">
                            <select
                                value={filterSubject}
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="w-full appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl py-4 px-5 pr-10 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-amber-500/10 focus:bg-white/10 focus:border-amber-500/30 transition-all cursor-pointer shadow-inner text-white/80"
                            >
                                <option value="" className="text-[#000B44]">Semua Mapel</option>
                                {subjects.map(s => <option key={s} value={s} className="text-[#000B44]">{s}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none group-focus-within/sel:rotate-180 transition-transform" />
                        </div>

                        <div className="flex-1 md:w-32 relative group/sel">
                            <select
                                value={filterClassLevel}
                                onChange={(e) => setFilterClassLevel(e.target.value)}
                                className="w-full appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl py-4 px-5 pr-10 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-amber-500/10 focus:bg-white/10 focus:border-amber-500/30 transition-all cursor-pointer shadow-inner text-white/80"
                            >
                                <option value="" className="text-[#000B44]">Tingkat</option>
                                {levels.map(l => <option key={l} value={l} className="text-[#000B44]">{l}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none group-focus-within/sel:rotate-180 transition-transform" />
                        </div>
                    </div>
                </div>
            </header>

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

                                {/* Custom Checkbox - Floating Left */}
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleSelectBank(bank.id); }}
                                    className={`relative z-20 shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? 'bg-[#000B44] border-[#000B44] rotate-0 scale-110 shadow-lg shadow-blue-900/30' : 'bg-slate-50 border-slate-200 hover:border-[#000B44]/50 rotate-[-15deg] group-hover:rotate-0'}`}
                                >
                                    {isSelected ? (
                                        <Check size={16} className="text-white" strokeWidth={4} />
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-[#000B44]/30 transition-colors"></div>
                                    )}
                                </div>

                                {/* Visual Identity */}
                                <div className="relative z-10 w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden bg-white border border-slate-100 shadow-[0_4px_15px_rgb(0,0,0,0.03)] group-hover:shadow-lg group-hover:shadow-blue-900/5 transition-all duration-500">
                                    {bank.image_url ? (
                                        <img src={bank.image_url} alt={bank.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                    ) : bank.icon_identifier ? (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center group-hover:bg-[#000B44] transition-colors">
                                            <IconComponent size={24} className="text-[#000B44] group-hover:text-white transition-all duration-500" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-blue-50 flex items-center justify-center group-hover:bg-[#000B44] transition-colors">
                                            <span className="text-xl font-black text-[#000B44] group-hover:text-white transition-all uppercase tracking-tighter">{getInitials(bank.subject || bank.title)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0 relative z-10 flex flex-col gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-black text-slate-900 truncate group-hover:text-[#000B44] transition-colors tracking-tight">{bank.title}</h3>
                                        <div className="flex gap-1.5">
                                            {bank.subject && (
                                                <span className="px-2 py-0.5 bg-white border border-slate-100 text-slate-500 text-[8px] font-black rounded uppercase tracking-wider shadow-sm group-hover:border-amber-500/20 transition-colors">
                                                    {bank.subject}
                                                </span>
                                            )}
                                            {bank.class_level && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-[#000B44] text-[8px] font-black rounded uppercase tracking-wider border border-blue-100">
                                                    {bank.class_level}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1 opacity-80 leading-relaxed pr-10">
                                        {bank.description || 'Koleksi soal terstruktur untuk mendukung proses evaluasi profesional.'}
                                    </p>
                                </div>

                                {/* Stats & High-end Actions */}
                                <div className="flex items-center gap-6 shrink-0 relative z-10 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-50 justify-between md:justify-end">
                                    <div className="flex flex-col items-start md:items-end group/stats">
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-0.5">Total Soal</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-xl font-black text-slate-900 leading-none tracking-tighter">{bank.question_count || 0}</span>
                                        </div>
                                    </div>

                                    <div className="h-8 w-[1px] bg-slate-100 hidden md:block"></div>

                                    <div className="flex gap-1.5 items-center">
                                        {/* Dynamic Status Action */}
                                        <button
                                            onClick={() => handleTogglePublish(bank)}
                                            className={`group/pub px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border shadow-sm relative overflow-hidden ${bank.is_published ? 'bg-[#000B44] text-white border-blue-950' : 'bg-white text-slate-400 border-slate-200 hover:border-[#000B44] hover:text-[#000B44]'}`}
                                        >
                                            <span className="relative z-10">{bank.is_published ? 'Published' : 'Draft'}</span>
                                            {bank.is_published && <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/pub:translate-x-[100%] transition-transform duration-1000"></div>}
                                        </button>

                                        {/* Action Circle Buttons */}
                                        <div className="flex items-center gap-1 p-0.5 bg-slate-50/50 rounded-xl border border-slate-100">
                                            <Link
                                                href={`/dashboard/guru/questions/${bank.id}`}
                                                className="w-9 h-9 bg-white text-slate-600 rounded-lg flex items-center justify-center hover:bg-[#000B44] hover:text-white transition-all shadow-sm border border-slate-100 active:scale-90"
                                                title="Buka Koleksi"
                                            >
                                                <ArrowRight size={18} strokeWidth={3} />
                                            </Link>

                                            <button
                                                onClick={() => handleOpenEdit(bank)}
                                                className="w-9 h-9 bg-white text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100 active:scale-90"
                                                title="Edit Metadata"
                                            >
                                                <Edit3 size={16} />
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setBankToDelete(bank);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="w-9 h-9 bg-white text-red-400 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-100 active:scale-90"
                                                title="Hapus Koleksi"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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
            )
            }

            {/* Bulk Action Bar - Control Center Aesthetic */}
            <AnimatePresence>
                {selectedBankIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 bg-slate-950/80 backdrop-blur-3xl border border-white/10 px-10 py-6 rounded-[3rem] shadow-[0_45px_100px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center gap-10 min-w-[320px] md:min-w-[600px]"
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-1.5 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] text-[8px] font-black uppercase tracking-[0.3em] text-white">
                            Global Control
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <span className="text-white font-black text-4xl leading-none tracking-tighter drop-shadow-2xl">{selectedBankIds.length}</span>
                                <div className="absolute -top-2 -right-2 w-3 h-3 bg-accent rounded-full animate-ping"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-100 text-[11px] font-black uppercase tracking-widest leading-none">Bank Soal</span>
                                <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em] mt-1.5">Terpilih Ke Aksi</span>
                            </div>
                        </div>

                        <div className="h-12 w-[1px] bg-white/10 hidden md:block"></div>

                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => handleBulkTogglePublish(true)}
                                disabled={isSubmitting}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-500/20 disabled:opacity-50 group/bulk"
                            >
                                <Check size={16} strokeWidth={4} className="group-hover/bulk:scale-125 transition-transform" /> Terbitkan Masal
                            </button>
                            <button
                                onClick={() => handleBulkTogglePublish(false)}
                                disabled={isSubmitting}
                                className="bg-white/5 hover:bg-white/10 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 text-[10px] uppercase tracking-widest border border-white/10 disabled:opacity-50 group/bulk"
                            >
                                <X size={16} strokeWidth={4} className="group-hover/bulk:rotate-90 transition-transform" /> Tarik Publikasi
                            </button>
                            <button
                                onClick={() => setSelectedBankIds([])}
                                className="text-slate-400 hover:text-white font-black px-6 py-4 text-[10px] uppercase tracking-widest transition-colors hover:bg-white/5 rounded-2xl"
                            >
                                Batalkan
                            </button>
                        </div>

                        {/* Neon Scanline Animation */}
                        <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Tambah/Edit Bank Soal - Reconstruct Premium */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-slate-950/40 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="bg-white/95 backdrop-blur-3xl w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh] border border-white/50 relative"
                        >
                            {/* Accent Bar */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-primary-700"></div>

                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100/50 flex justify-between items-center relative z-10 bg-white/50">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner border border-primary/5">
                                        {editingBank ? <Edit3 size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight leading-none">
                                            {editingBank ? 'Edit' : 'Tambah'} <span className="text-primary">Bank Soal</span>
                                        </h3>
                                        <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-[0.2em] opacity-80">The professional evaluation architecture</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setIsAddModalOpen(false); setEditingBank(null); }}
                                    className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-200 hover:rotate-90 hover:bg-white shadow-sm"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
                                <form onSubmit={handleSaveBank} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Left Column: Data */}
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-primary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                Informasi Utama
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Contoh: Matematika Terapan - Fase E"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-bold outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-300 text-sm shadow-sm"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                                                <div className="relative group/sel">
                                                    <select
                                                        required
                                                        value={formData.subject}
                                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-primary focus:bg-white transition-all text-sm cursor-pointer shadow-sm"
                                                    >
                                                        <option value="">Pilih Mapel</option>
                                                        <option value="Matematika">Matematika</option>
                                                        <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                                                        <option value="Bahasa Inggris">Bahasa Inggris</option>
                                                        <option value="IPA">IPA</option>
                                                        <option value="IPS">IPS</option>
                                                        <option value="PAI">PAI</option>
                                                        <option value="Seni Budaya">Seni Budaya</option>
                                                        <option value="Penjasorkes">Penjasorkes</option>
                                                        <option value="Informatika">Informatika</option>
                                                        <option value="Lainnya">Lainnya</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/sel:rotate-180 transition-transform" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tingkat Kelas</label>
                                                <div className="relative group/sel">
                                                    <select
                                                        required
                                                        value={formData.classLevel}
                                                        onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                                                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-primary focus:bg-white transition-all text-sm cursor-pointer shadow-sm"
                                                    >
                                                        <option value="">Pilih Tingkat</option>
                                                        <option value="Kelas 7">Kelas 7</option>
                                                        <option value="Kelas 8">Kelas 8</option>
                                                        <option value="Kelas 9">Kelas 9</option>
                                                        <option value="Kelas 10">Kelas 10</option>
                                                        <option value="Kelas 11">Kelas 11</option>
                                                        <option value="Kelas 12">Kelas 12</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/sel:rotate-180 transition-transform" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Operasional</label>
                                            <textarea
                                                placeholder="Tujuan pembelajaran, cakupan materi, atau catatan penting lainnya..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-900 font-bold outline-none focus:border-primary focus:bg-white transition-all min-h-[120px] text-sm shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column: Visual Identity */}
                                    <div className="space-y-8">
                                        <div className="space-y-5">
                                            <label className="text-[9px] font-black text-accent uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                <Palette size={12} />
                                                Visual Brand Identity
                                            </label>

                                            {/* Preview Card Premium */}
                                            <div className="relative group/prev aspect-video bg-slate-900 rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 flex items-center justify-center p-6">
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30 opacity-40 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-3xl animate-pulse"></div>

                                                <div className="relative z-10 flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-white shadow-2xl overflow-hidden group-hover:scale-110 transition-transform duration-500">
                                                        {formData.imageUrl ? (
                                                            <img src={formData.imageUrl} className="w-full h-full object-cover" alt="preview" />
                                                        ) : (
                                                            React.createElement(getIconComponent(formData.iconIdentifier), { size: 32, strokeWidth: 2 })
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <h4 className="text-white font-bold text-base uppercase tracking-tight truncate max-w-[200px]">
                                                            {formData.title || 'Judul Bank Soal'}
                                                        </h4>
                                                        <p className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em] mt-1 border-t border-white/10 pt-1">Preview Display</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selection Grid */}
                                            <div className="grid grid-cols-1 gap-5">
                                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner">
                                                    <div className="flex flex-wrap gap-3 justify-center">
                                                        {AVAILABLE_ICONS.map(item => (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, iconIdentifier: item.id, imageUrl: '' })}
                                                                className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all duration-300 active:scale-90 ${formData.iconIdentifier === item.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-white border-white text-slate-400 hover:border-primary/30'}`}
                                                                title={item.label}
                                                            >
                                                                <item.icon size={20} strokeWidth={2.5} />
                                                            </button>
                                                        ))}

                                                        {/* Modern Upload Trigger */}
                                                        <label className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 active:scale-90 hover:bg-emerald-50 ${formData.imageUrl ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-500/50'}`}>
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                                            {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} strokeWidth={3} />}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer / Submit */}
                                    <div className="col-span-1 lg:col-span-2 pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || uploadingImage}
                                            className="w-full bg-slate-950 hover:bg-[#000B44] text-white font-black py-5 rounded-2xl shadow-xl hover:shadow-blue-900/20 flex items-center justify-center gap-4 transition-all duration-500 disabled:opacity-50 text-sm uppercase tracking-[0.3em] group/submit"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="animate-spin" size={20} />
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <span>{editingBank ? 'Simpan Perubahan' : 'Tambah Bank Soal'}</span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </form>
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
                                <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmName(''); }} className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-300 hover:text-red-600 transition-all border border-red-100 shadow-sm">
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
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-[1.5rem] shadow-xl shadow-red-500/30 flex items-center justify-center gap-4 transition-all disabled:opacity-20 text-xs uppercase tracking-widest border-b-8 border-red-900/40"
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
        </div >
    );
}
