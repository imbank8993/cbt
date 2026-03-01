"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
    Users, Search, UserPlus, Plus,
    MoreVertical, Trash2, Shield,
    School, GraduationCap, X,
    Loader2, Check, Download, Activity, Upload, AlertCircle
} from 'lucide-react';
import {
    getProctorOrganization,
    listOrganizationMembers,
    inviteMemberAction,
    listOrganizationClasses,
    createClassAction,
    assignStudentToClassAction,
    importMembersAction
} from '@/app/actions/proktor';
import { supabase } from '@/lib/supabase';

const MembersPage = () => {
    const [members, setMembers] = useState<any[]>([]);
    const [org, setOrg] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Semua');
    const [classes, setClasses] = useState<any[]>([]);

    // Class Modal States
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [classFormData, setClassFormData] = useState({ name: '', type: 'reguler' as 'reguler' | 'tambahan' });
    const [selectedMemberForClass, setSelectedMemberForClass] = useState<any>(null);

    // Modal & Form States
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAddingClass, setIsAddingClass] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        role: 'Siswa' as any,
        password: ''
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
                const [memberList, classList] = await Promise.all([
                    listOrganizationMembers(organization.id),
                    listOrganizationClasses(organization.id)
                ]);
                setMembers(memberList);
                setClasses(classList);
            }
        }
        setIsLoading(false);
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org) return;
        setIsSubmitting(true);
        const result = await inviteMemberAction(org.id, formData.email, formData.fullName, formData.role, formData.password);
        if (result.success) {
            setIsInviteModalOpen(false);
            setFormData({ email: '', fullName: '', role: 'Siswa', password: '' });
            await loadData();
        } else {
            alert('Gagal menambah anggota: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org) return;
        setIsSubmitting(true);
        const result = await createClassAction(org.id, classFormData.name, classFormData.type);
        if (result.success) {
            setIsClassModalOpen(false);
            setClassFormData({ name: '', type: 'reguler' });
            await loadData();
        } else {
            alert('Gagal membuat kelas: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const handleAssignToClass = async (userId: string, classId: string, type: 'reguler' | 'tambahan') => {
        setIsSubmitting(true);
        const result = await assignStudentToClassAction(userId, classId, type);
        if (result.success) {
            setSelectedMemberForClass(null);
            await loadData();
        } else {
            alert('Gagal mengatur kelas: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.role?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'Semua' || m.role === activeTab;
        return matchesSearch && matchesTab;
    });

    const tabs = ['Semua', 'Proktor', 'Guru', 'Siswa', 'Kelas'];

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-primary tracking-tight uppercase italic flex items-center gap-4">
                        <Users size={36} className="text-accent" />
                        Management: {org?.name || 'School'}
                    </h2>
                    <p className="text-slate-400 font-medium italic uppercase tracking-tighter">Kelola Siswa, Guru, dan Pengawas di sekolah Anda.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-primary focus:ring-2 focus:ring-primary/50 outline-none font-bold italic uppercase tracking-tighter shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {/* Tabs & Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex p-1.5 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-x-auto w-full md:w-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-slate-700 font-black px-6 py-4 rounded-2xl border border-slate-200 shadow-sm transition-all flex items-center gap-3 active:scale-95 text-xs uppercase italic tracking-widest leading-none">
                        <Download size={18} /> Export
                    </button>
                    {activeTab === 'Kelas' ? (
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex-1 md:flex-none group relative bg-primary hover:bg-primary-light text-white font-black px-6 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 active:scale-95 overflow-hidden"
                            >
                                <div className="relative flex items-center justify-center gap-2">
                                    <Upload size={18} className="group-hover:bounce" />
                                    <span className="uppercase tracking-widest text-xs">Import Massal</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setIsClassModalOpen(true)}
                                className="flex-1 md:flex-none group relative bg-accent hover:bg-orange-600 text-white font-black px-6 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/30 active:scale-95 overflow-hidden"
                            >
                                <div className="relative flex items-center justify-center gap-2">
                                    <Plus size={18} className="group-hover:rotate-12 transition-transform" />
                                    <span className="uppercase tracking-widest text-xs">Buat Kelas Baru</span>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex-1 md:flex-none bg-primary hover:bg-primary-light text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-3 active:scale-95 text-xs uppercase italic tracking-widest leading-none"
                        >
                            <UserPlus size={18} /> Tambah Anggota
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : activeTab === 'Kelas' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <motion.div
                            key={cls.id}
                            layout
                            className="bg-white border border-slate-100 rounded-[2rem] p-8 group hover:border-primary/20 transition-all hover:shadow-premium shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-2 h-full bg-slate-100 group-hover:bg-primary transition-colors"></div>

                            <div className="flex justify-between items-start mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${cls.type === 'reguler' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
                                    {cls.type}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-slate-400 hover:text-rose-500 border border-transparent hover:border-rose-200 bg-white shadow-sm hover:shadow-md"
                                        onClick={async () => {
                                            if (confirm('Hapus kelas ini?')) {
                                                const { supabase } = await import('@/lib/supabase');
                                                await supabase.from('classes').delete().eq('id', cls.id);
                                                loadData();
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <School size={18} className="text-slate-400 mt-2" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-primary italic uppercase tracking-tight mb-2 group-hover:text-accent transition-colors">{cls.name}</h3>
                            <div className="flex items-center gap-2 mb-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg w-max shadow-sm">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Kode:</span>
                                <span className="text-sm font-black tracking-widest text-primary font-mono">{cls.join_code || '------'}</span>
                            </div>
                            <div className="flex justify-between items-end mt-4">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                                    {cls.type === 'reguler' ? 'Kelas Utama Sekolah' : 'Kelas Belajar Tambahan'}
                                </div>
                                <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                                    <Users size={12} className="text-primary" />
                                    <span className="text-[10px] font-black text-primary">{cls.studentCount || 0} Siswa</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {classes.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <School size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold italic uppercase tracking-tighter">Belum ada kelas tersedia</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
                    <div className="p-6">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] px-6">
                                    <th className="px-6 pb-2">Full Name & Email</th>
                                    <th className="px-6 pb-2 text-center">Role / Kelas</th>
                                    <th className="px-6 pb-2 text-center">Status</th>
                                    <th className="px-6 pb-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={member.id} className="group">
                                        <td className="px-6 py-6 bg-slate-50/80 rounded-l-3xl border-y border-l border-slate-100 group-hover:bg-slate-100/80 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-primary uppercase italic">
                                                    {(member.fullName || 'U')[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 uppercase italic tracking-tight">{member.fullName || 'Unnamed User'}</span>
                                                    <span className="text-[10px] font-medium text-slate-500 lowercase">{member.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 bg-slate-50/80 border-y border-slate-100 group-hover:bg-slate-100/80 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    {member.role === 'Guru' ? (
                                                        <Shield size={14} className="text-accent" />
                                                    ) : member.role === 'Proktor' ? (
                                                        <Activity size={14} className="text-primary" />
                                                    ) : (
                                                        <GraduationCap size={14} className="text-emerald-500" />
                                                    )}
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{member.role || 'Siswa'}</span>
                                                </div>

                                                <div className="flex flex-wrap justify-center gap-1 mt-1">
                                                    {member.classes?.map((cls: any) => (
                                                        <span key={cls.id} className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${cls.type === 'reguler' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                                                            {cls.name}
                                                        </span>
                                                    ))}
                                                    {member.role === 'Siswa' && (!member.classes || member.classes.length === 0) && (
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase italic">Belum ada kelas</span>
                                                    )}
                                                </div>

                                                {member.role === 'Siswa' && (
                                                    <button
                                                        onClick={() => setSelectedMemberForClass(member)}
                                                        className="text-[8px] font-black text-primary hover:text-primary-light uppercase tracking-[0.2em] italic border-b border-primary/20 hover:border-primary-light transition-all mt-2"
                                                    >
                                                        Atur Kelas
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 bg-slate-50/80 border-y border-slate-100 group-hover:bg-slate-100/80 text-center">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-200">ACTIVE</span>
                                        </td>
                                        <td className="px-6 py-6 bg-slate-50/80 rounded-r-3xl border-y border-r border-slate-100 group-hover:bg-slate-100/80 text-right">
                                            <button className="p-2 hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600 mr-2 rounded-xl border border-transparent hover:border-slate-300 bg-white shadow-sm">
                                                <MoreVertical size={18} />
                                            </button>
                                            <button className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-slate-400 hover:text-rose-500 border border-transparent hover:border-rose-200 bg-white shadow-sm">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredMembers.length === 0 && (
                            <div className="py-20 text-center">
                                <Users size={48} className="text-slate-800 mx-auto mb-4" />
                                <p className="text-slate-600 font-bold italic uppercase tracking-tighter">Tidak ada anggota ditemukan</p>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl">
                            <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-all"><X size={24} /></button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic mb-1">Tambah Anggota</h3>
                                <p className="text-sm text-slate-500 font-medium">Tambah Guru atau Siswa ke {org?.name}</p>
                            </div>

                            <form onSubmit={handleAddMember} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Pilih Peran (Role)</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic uppercase tracking-tighter"
                                    >
                                        <option value="Siswa">Siswa</option>
                                        <option value="Guru">Guru</option>
                                        <option value="Pengawas">Pengawas</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Nama Lengkap</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Contoh: Ahmad Fauzan"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic uppercase tracking-tighter placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="email@sekolah.id"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic tracking-tighter placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Password</label>
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary tracking-tighter placeholder:text-slate-300"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-primary hover:bg-primary-light text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 transition-all shadow-xl shadow-primary/20 hover:shadow-2xl disabled:opacity-50 italic uppercase tracking-widest active:scale-95"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    TAMBAH SEKARANG
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Import Massal */}
            <AnimatePresence>
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                            onClick={() => !isSubmitting && setIsImportModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            {/* Header Modal */}
                            <div className="bg-gradient-to-r from-primary to-primary-light p-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Bulk Import</span>
                                            <Upload size={16} className="text-white/80" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">Import Massal Anggota</h2>
                                        <p className="text-primary-50 font-medium mt-1">Gunakan template CSV untuk menambahkan banyak anggota sekaligus.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsImportModalOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8">
                                {!isSubmitting ? (
                                    <div className="space-y-6">
                                        {/* Download Template */}
                                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                                    <Download size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-primary uppercase tracking-widest">Template Tersedia</div>
                                                    <div className="text-[10px] text-primary/60 font-medium">Download template CSV untuk pengisian.</div>
                                                </div>
                                            </div>
                                            <a
                                                href="/templates/member_import_template.xlsx"
                                                download
                                                className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all shadow-md"
                                            >
                                                Download
                                            </a>
                                        </div>

                                        {/* File Upload */}
                                        <div className="space-y-4">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Pilih File Excel</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept=".xlsx, .xls"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        const reader = new FileReader();
                                                        reader.onload = async (event) => {
                                                            const data = new Uint8Array(event.target?.result as ArrayBuffer);
                                                            const workbook = XLSX.read(data, { type: 'array' });
                                                            const firstSheetName = workbook.SheetNames[0];
                                                            const worksheet = workbook.Sheets[firstSheetName];
                                                            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                                                            const formattedData = jsonData.map(row => {
                                                                let rawRole = String(row.role || row.Role || row['Peran'] || 'Siswa').trim().toLowerCase();
                                                                let role: any = 'Siswa';
                                                                if (rawRole === 'guru') role = 'Guru';
                                                                if (rawRole === 'pengawas') role = 'Pengawas';

                                                                return {
                                                                    fullName: String(row.fullName || row.FullName || row['Nama Lengkap'] || '').trim(),
                                                                    email: String(row.email || row.Email || '').trim(),
                                                                    role,
                                                                    password: String(row.password || row.Password || 'password').trim()
                                                                };
                                                            });

                                                            if (confirm(`Impor ${formattedData.length} anggota dari file Excel?`)) {
                                                                setIsSubmitting(true);
                                                                const result = await importMembersAction(org.id, formattedData);

                                                                let message = `Selesai! Berhasil: ${result.successCount}, Gagal: ${result.failedCount}`;
                                                                if (result.failedCount > 0 && result.errors?.length > 0) {
                                                                    message += `\n\nDetail Error:\n` + result.errors.map((e: any) => `- ${e.email}: ${e.error}`).join('\n');
                                                                }

                                                                alert(message);
                                                                setIsSubmitting(false);
                                                                setIsImportModalOpen(false);
                                                                loadData();
                                                            }
                                                        };
                                                        reader.readAsArrayBuffer(file);
                                                    }}
                                                    className="hidden"
                                                    id="csv-upload"
                                                />
                                                <label
                                                    htmlFor="csv-upload"
                                                    className="flex flex-col items-center justify-center gap-4 py-12 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-[24px] cursor-pointer transition-all group"
                                                >
                                                    <div className="p-4 bg-primary/10 text-primary rounded-full group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                                                        <Upload size={32} />
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs font-black text-primary uppercase tracking-widest mb-1 group-hover:text-primary-light transition-colors">Klik untuk Upload File Excel</div>
                                                        <div className="text-[10px] text-slate-500 font-medium">Mendukung format .xlsx atau .xls</div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={() => setIsImportModalOpen(false)}
                                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest shadow-sm"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 gap-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-20 animate-pulse" />
                                            <Loader2 size={64} className="text-primary animate-spin relative" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-black text-primary uppercase italic tracking-tight mb-2">Sedang Mengimpor...</h3>
                                            <p className="text-slate-500 text-xs font-medium">Mohon tunggu, kami sedang mendaftarkan anggota ke dalam sistem.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Class Modal */}
            <AnimatePresence>
                {isClassModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsClassModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl">
                            <button onClick={() => setIsClassModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-all"><X size={24} /></button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-primary tracking-tight uppercase italic mb-1">Buat Kelas Baru</h3>
                                <p className="text-sm text-slate-500 font-medium">Tambah kelompok siswa untuk {org?.name}</p>
                            </div>

                            <form onSubmit={handleCreateClass} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Nama Kelas</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Contoh: Kelas 10-A atau Club Fisika"
                                        value={classFormData.name}
                                        onChange={e => setClassFormData({ ...classFormData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic uppercase tracking-tighter shadow-inner placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Tipe Kelas</label>
                                    <select
                                        value={classFormData.type}
                                        onChange={e => setClassFormData({ ...classFormData, type: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary italic uppercase tracking-tighter shadow-inner"
                                    >
                                        <option value="reguler">Kelas Reguler (Sekolah)</option>
                                        <option value="tambahan">Kelas Tambahan (Belajar)</option>
                                    </select>
                                    <p className="text-[10px] text-slate-500 italic mt-1 ml-2">Siswa hanya boleh memiliki SATU kelas Reguler.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-accent text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 italic uppercase tracking-widest"
                                >
                                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    BUAT KELAS
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assign Student to Class Modal */}
            <AnimatePresence>
                {selectedMemberForClass && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedMemberForClass(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-100 shadow-2xl">
                            <button onClick={() => setSelectedMemberForClass(null)} className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-all"><X size={24} /></button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-primary tracking-tight uppercase italic mb-1">Set Kelas Siswa</h3>
                                <p className="text-sm text-slate-500 font-medium">Pilih kelas untuk {selectedMemberForClass.fullName}</p>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Daftar Kelas Tersedia</div>
                                {classes.map((cls) => (
                                    <button
                                        key={cls.id}
                                        onClick={() => handleAssignToClass(selectedMemberForClass.userId, cls.id, cls.type)}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all text-left group shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-primary font-bold uppercase italic tracking-tight group-hover:text-primary-light transition-colors">{cls.name}</div>
                                                <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{cls.type}</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                                                <Plus size={16} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {classes.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-slate-500 text-xs italic">Belum ada kelas. Silakan buat kelas baru di tab Kelas.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default MembersPage;
