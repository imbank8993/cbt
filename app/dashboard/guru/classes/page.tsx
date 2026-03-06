"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, School, Trash2, X, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getGuruOrganization, listGuruClasses, createTambahanClassAction, listOrganizationStudentsForGuru, assignStudentToClassGuruAction } from '@/app/actions/guru';

export default function GuruClassesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [org, setOrg] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [className, setClassName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Assign Student states
    const [selectedClassForStudent, setSelectedClassForStudent] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const organization = await getGuruOrganization(user.id);
            if (organization) {
                setOrg(organization);
                const classList = await listGuruClasses(organization.id);
                setClasses(classList);
            }
        }
        setIsLoading(false);
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org || !className.trim()) return;

        setIsSubmitting(true);
        const result = await createTambahanClassAction(org.id, className);
        if (result.success) {
            setIsCreateModalOpen(false);
            setClassName('');
            loadData();
        } else {
            alert('Gagal membuat kelas: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const handleAssignStudentClick = async (cls: any) => {
        setSelectedClassForStudent(cls);
        if (students.length === 0 && org) {
            setIsLoading(true);
            const studentList = await listOrganizationStudentsForGuru(org.id);
            setStudents(studentList);
            setIsLoading(false);
        }
    };

    const handleAssignStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !selectedClassForStudent) return;
        setIsSubmitting(true);
        const result = await assignStudentToClassGuruAction(selectedStudentId, selectedClassForStudent.id);
        if (result.success) {
            alert('Siswa berhasil ditambahkan');
            setSelectedStudentId('');
            setSelectedClassForStudent(null);
            loadData();
        } else {
            alert('Gagal menambahkan siswa: ' + result.error);
        }
        setIsSubmitting(false);
    }

    return (
        <div className="space-y-10 pb-20">
            <header className="relative p-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary-light to-[#051163] text-white shadow-xl shadow-primary/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-10 blur-[80px] -mr-20 -mt-20 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 blur-[60px] -ml-16 -mb-16 rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest mb-4"
                        >
                            <School size={10} className="text-accent" /> Academic Management
                        </motion.div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 uppercase flex items-center justify-center md:justify-start gap-4">
                            Kelas <span className="text-accent">Saya</span>
                        </h2>
                        <p className="text-white/60 font-bold max-w-sm text-sm uppercase tracking-tight">
                            Kelola Kelas Tambahan & Bimbingan Anda
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="group relative bg-accent hover:bg-orange-600 text-white font-black px-8 py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 text-[10px] uppercase tracking-widest"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        Buat Kelas Tambahan
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <motion.div
                            key={cls.id}
                            layout
                            className="bg-white border border-slate-100 rounded-[2rem] p-8 group hover:border-accent/30 transition-all hover:shadow-xl shadow-slate-200/50"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border bg-emerald-50 text-emerald-600 border-emerald-200`}>
                                    KELAS TAMBAHAN
                                </span>
                                <School size={18} className="text-slate-400 mt-2" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2 uppercase">{cls.name}</h3>
                            <div className="flex items-center gap-2 mb-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-max mt-4">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Join Code:</span>
                                <span className="text-sm font-black tracking-widest text-slate-700 font-mono">{cls.join_code || '------'}</span>
                            </div>

                            <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                    <Users size={12} className="text-primary" />
                                    <span className="text-[10px] font-black text-primary">{cls.studentCount || 0} Siswa</span>
                                </div>
                                <button
                                    onClick={() => handleAssignStudentClick(cls)}
                                    className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-primary-light transition-colors underline"
                                >
                                    + Tambah Siswa
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {classes.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <School size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-tighter">Anda belum memiliki kelas tambahan.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Class Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl">
                            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-all"><X size={24} /></button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-1">Buat Kelas Tambahan</h3>
                                <p className="text-sm text-slate-500 font-medium">Buat ruang belajar baru untuk kelompok siswa spesial.</p>
                            </div>

                            <form onSubmit={handleCreateClass} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Nama Kelas</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Contoh: Bimbingan Fisika Intensif"
                                        value={className}
                                        onChange={e => setClassName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-900 uppercase tracking-tighter shadow-inner"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 ml-2 uppercase font-bold">Siswa akan bergabung menggunakan kode yang dihasilkan nanti.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-accent text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 uppercase tracking-widest active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    BUAT KELAS
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assign Student Modal */}
            <AnimatePresence>
                {selectedClassForStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedClassForStudent(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl">
                            <button onClick={() => setSelectedClassForStudent(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-all"><X size={24} /></button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-1">Tambah Siswa</h3>
                                <p className="text-sm text-slate-500 font-medium">Tambahkan siswa ke {selectedClassForStudent.name}</p>
                            </div>

                            <form onSubmit={handleAssignStudentSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Pilih Siswa</label>
                                    <select
                                        required
                                        value={selectedStudentId}
                                        onChange={e => setSelectedStudentId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-slate-900 tracking-tighter shadow-inner uppercase text-[10px]"
                                    >
                                        <option value="" disabled>-- Pilih Siswa --</option>
                                        {students.map((stu) => (
                                            <option key={stu.userId} value={stu.userId}>{stu.fullName} ({stu.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedStudentId}
                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-primary-light transition-all shadow-lg shadow-primary/20 disabled:opacity-50 uppercase tracking-widest active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                    TAMBAHKAN
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
