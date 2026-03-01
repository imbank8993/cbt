"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, BookOpen,
    Trash2, Edit3, MoreHorizontal,
    ArrowRight, Loader2, X, Sparkles
} from 'lucide-react';
import { createQuestionBank, listQuestionBanks, deleteQuestionBank, toggleQuestionBankPublishAction } from '@/app/actions/question';
import { getProctorOrganization } from '@/app/actions/proktor';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function QuestionBankPage() {
    const [banks, setBanks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bankToDelete, setBankToDelete] = useState<any>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [org, setOrg] = useState<any>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        classLevel: ''
    });

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

    const handleCreateBank = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user || !org) return;

            setIsSubmitting(true);
            const result: any = await createQuestionBank(org.id, user.id, formData.title, formData.description, formData.subject, formData.classLevel);

            if (result.success) {
                setIsAddModalOpen(false);
                setFormData({ title: '', description: '', subject: '', classLevel: '' });
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
        if (deleteConfirmName !== bankToDelete.title) {
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
                await loadData();
            } else {
                alert('Gagal mengubah status publish: ' + result.error);
            }
        } catch (err) {
            alert('Terjadi kesalahan.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-premium border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BookOpen size={24} className="text-primary" />
                        Bank Soal
                    </h2>
                    <div className="flex flex-col mt-1">
                        <p className="text-slate-500 font-medium text-xs">Kelola kumpulan soal ujian untuk sekolah {org?.name || ''}.</p>
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto relative z-10">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-accent hover:bg-orange-600 text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center gap-3 active:scale-95 text-xs uppercase tracking-widest"
                    >
                        <Plus size={18} /> Buat Bank Soal
                    </button>
                </div>
            </header>

            {/* Grid Content */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={48} className="text-primary animate-spin opacity-20" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {banks.map((bank, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={bank.id}
                            className="group bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-premium transition-all relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                    <BookOpen size={22} />
                                </div>
                                <div className="flex gap-1 items-center">
                                    <button
                                        onClick={() => handleTogglePublish(bank)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all border ${bank.is_published ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                                    >
                                        {bank.is_published ? 'Published' : 'Draft'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBankToDelete(bank);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors ml-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight group-hover:text-primary transition-colors">{bank.title}</h3>
                                <div className="flex gap-2 mb-3">
                                    {bank.subject && <span className="px-2 py-0.5 bg-primary/5 text-primary text-[8px] font-black rounded text-primary uppercase tracking-wider">{bank.subject}</span>}
                                    {bank.class_level && <span className="px-2 py-0.5 bg-accent/5 text-accent text-[8px] font-black rounded text-accent uppercase tracking-wider">{bank.class_level}</span>}
                                </div>
                                <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-4">
                                    {bank.description || 'Tidak ada deskripsi.'}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total Soal</span>
                                    <span className="text-base font-black text-slate-900 leading-none">{bank.question_count || 0}</span>
                                </div>
                                <Link
                                    href={`/dashboard/guru/questions/${bank.id}`}
                                    className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-primary transition-all shadow-lg shadow-black/5"
                                >
                                    Buka <ArrowRight size={12} />
                                </Link>
                            </div>
                        </motion.div>
                    ))}

                    {banks.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <Sparkles size={48} className="text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-slate-300 uppercase">Belum Ada Bank Soal</h3>
                            <p className="text-slate-400 text-xs mt-1">Mulai dengan membuat bank soal pertama sekolah anda.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Tambah Bank Soal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl p-8 relative border border-slate-100"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase leading-none">Bank Soal Baru</h3>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Kategorikan koleksi pertanyaan anda</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateBank} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Bank Soal</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Misal: Matematika Kelas X - Semester 1"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mata Pelajaran</label>
                                        <select
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all text-xs"
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
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tingkatan</label>
                                        <select
                                            required
                                            value={formData.classLevel}
                                            onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all text-xs"
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

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi (Opsional)</label>
                                    <textarea
                                        placeholder="Keterangan singkat..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[80px] placeholder:text-slate-300 text-sm"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                                    Simpan Bank Soal
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Hapus Bank Soal */}
            <AnimatePresence>
                {isDeleteModalOpen && bankToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-red-950/20 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl p-8 relative border border-red-100"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-red-600 uppercase leading-none italic">Hapus Bank Soal</h3>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Tindakan ini tidak dapat dibatalkan</p>
                                </div>
                                <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmName(''); }} className="text-slate-400 hover:text-slate-900 p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-red-50 p-6 rounded-2xl mb-8 border border-red-100 italic">
                                <p className="text-slate-600 text-[11px] font-bold leading-relaxed mb-4">
                                    Anda akan menghapus bank soal <span className="text-red-600 font-black">"{bankToDelete.title}"</span> beserta seluruh soal di dalamnya secara permanen.
                                </p>
                                <p className="text-red-500 text-[9px] font-black uppercase tracking-widest">
                                    Ketik ulang nama bank soal di bawah untuk konfirmasi:
                                </p>
                            </div>

                            <div className="space-y-6">
                                <input
                                    type="text"
                                    placeholder={bankToDelete.title}
                                    value={deleteConfirmName}
                                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-black outline-none focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-slate-200 text-sm italic"
                                />

                                <button
                                    onClick={handleDeleteBank}
                                    disabled={isSubmitting || deleteConfirmName !== bankToDelete.title}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-20 text-xs uppercase tracking-widest italic"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={18} />}
                                    Hapus Permanen
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper icons
function Save({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
}
