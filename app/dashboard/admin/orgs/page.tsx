"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    School,
    Plus,
    Search,
    MoreVertical,
    MapPin,
    Users,
    ExternalLink,
    ShieldCheck,
    X,
    PlusCircle,
    Globe
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { registerOrganizationAction } from '@/app/actions/organization';
import { setActiveOrgAction } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

export default function OrgsManagement() {
    const router = useRouter();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedOrg, setSelectedOrg] = useState<any>(null);
    const [showProktorModal, setShowProktorModal] = useState(false);
    const [newProktorEmail, setNewProktorEmail] = useState('');

    // Form states
    const [newOrg, setNewOrg] = useState({
        name: '',
        slug: '',
        license: 'Professional',
        proktorName: '',
        proktorEmail: '',
        proktorPassword: ''
    });

    // Fetch from Supabase
    useEffect(() => {
        fetchOrgs();
    }, []);

    const fetchOrgs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setOrganizations(data);
        setLoading(false);
    };

    const handleDeleteOrg = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus sekolah ini? Seluruh data terkait akan hilang.')) return;

        const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            alert('Error: ' + error.message);
            return;
        }

        fetchOrgs();
    };

    const handleUpdateProktor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrg) return;

        const { error } = await supabase
            .from('organizations')
            .update({ proktor_email: newProktorEmail })
            .eq('id', selectedOrg.id);

        if (error) {
            alert('Gagal mengupdate proktor: ' + error.message);
            return;
        }

        fetchOrgs();
        setShowProktorModal(false);
        setNewProktorEmail('');
        setSelectedOrg(null);
    };

    const handleAddOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await registerOrganizationAction(newOrg);

        if (!result.success) {
            alert('Gagal mendaftarkan sekolah: ' + result.error);
            setLoading(false);
            return;
        }

        // Refresh list
        await fetchOrgs();
        setLoading(false);
        setShowAddModal(false);
        setNewOrg({ name: '', slug: '', license: 'Professional', proktorName: '', proktorEmail: '', proktorPassword: '' });
    };

    const handleManageOrg = async (orgId: string) => {
        setLoading(true);
        await setActiveOrgAction(orgId);
        router.push('/dashboard/proktor');
    };

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 text-primary-light font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                        <div className="w-8 h-px bg-primary/30"></div>
                        Manajemen Ekosistem
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">Daftar Sekolah</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary hover:bg-primary text-white font-black px-10 py-4 rounded-2xl shadow-2xl shadow-primary/20 transition-all flex items-center gap-3 active:scale-95"
                >
                    <PlusCircle size={24} /> Daftarkan Sekolah
                </button>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-primary-light transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari sekolah berdasarkan nama atau subdomain..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800/80 rounded-3xl py-5 pl-16 pr-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-slate-600"
                    />
                </div>
                <div className="flex gap-4">
                    <button className="px-8 py-5 bg-slate-900/50 border border-slate-800 rounded-3xl text-white font-bold hover:bg-slate-800 transition-all">Filter</button>
                    <button className="px-8 py-5 bg-slate-900/50 border border-slate-800 rounded-3xl text-white font-bold hover:bg-slate-800 transition-all">Export</button>
                </div>
            </div>

            {/* Orgs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredOrgs.map((org, i) => (
                            <motion.div
                                key={org.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -8 }}
                                className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] overflow-hidden group hover:border-primary/40 transition-all backdrop-blur-xl flex flex-col"
                            >
                                <div className="p-10 flex-1">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 border border-white/5 shadow-inner">
                                            <School size={32} />
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ${org.is_active ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
                                            }`}>
                                            {org.is_active ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-white mb-1 tracking-tight line-clamp-1">{org.name}</h3>
                                    <div className="flex items-center gap-2 text-primary-light font-bold text-sm mb-6">
                                        <Globe size={14} /> cbt-app.com/{org.slug}
                                    </div>

                                    <div className="mb-8 p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Proktor Utama</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                                {org.proktor_email ? org.proktor_email[0].toUpperCase() : 'P'}
                                            </div>
                                            <div className="overflow-hidden text-ellipsis">
                                                <p className="text-[11px] font-bold text-white truncate">{org.proktor_email || 'Belum Ditugaskan'}</p>
                                                <button
                                                    onClick={() => { setSelectedOrg(org); setNewProktorEmail(org.proktor_email || ''); setShowProktorModal(true); }}
                                                    className="text-[10px] text-primary-light hover:text-primary-light font-bold"
                                                >
                                                    Kelola Proktor
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Siswa</p>
                                            <p className="text-lg font-bold text-white">0</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Lisensi</p>
                                            <p className="text-lg font-bold text-white uppercase italic text-[10px]">Enterprise</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-10 py-6 bg-slate-800/20 border-t border-white/5 flex items-center justify-between">
                                    <button
                                        onClick={() => handleManageOrg(org.id)}
                                        className="text-[10px] font-black text-primary hover:text-accent transition-colors flex items-center gap-2 uppercase tracking-widest px-4 py-2 bg-primary/5 rounded-xl border border-primary/10"
                                    >
                                        <ShieldCheck size={16} /> Kelola
                                    </button>
                                    <button
                                        onClick={() => handleDeleteOrg(org.id)}
                                        className="text-[10px] font-black text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest px-4 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {/* Create Card */}
                <motion.div
                    onClick={() => setShowAddModal(true)}
                    whileHover={{ scale: 0.98 }}
                    className="border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center p-10 cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all group min-h-[400px]"
                >
                    <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 text-slate-600 group-hover:text-primary-light group-hover:border-primary/30 transition-all">
                        <Plus size={40} />
                    </div>
                    <p className="text-xl font-bold text-slate-500 group-hover:text-white transition-colors">Daftarkan Sekolah</p>
                    <p className="text-slate-600 font-medium text-sm mt-2">Bantu satu sekolah lagi hari ini.</p>
                </motion.div>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <form onSubmit={handleAddOrg} className="p-12">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Registrasi Institusi & Proktor</h2>
                                        <p className="text-slate-500 font-medium text-sm">Lengkapi data sekolah dan akun administrator utamanya.</p>
                                    </div>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-inner border border-white/5">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-12">
                                    {/* School Info */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary-light border border-primary/20">
                                                <School size={20} />
                                            </div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">Detail Institusi</h3>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Nama Institusi</label>
                                            <input
                                                type="text"
                                                required
                                                value={newOrg.name}
                                                onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                                                placeholder="e.g. SMK Negeri 1 Jakarta"
                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 outline-none transition-all shadow-inner"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Slug URL Sekolah</label>
                                                <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 shadow-inner">
                                                    <span className="text-slate-600 font-black text-[10px]">cbt-app.com/</span>
                                                    <input
                                                        type="text"
                                                        value={newOrg.slug}
                                                        onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                                                        placeholder="smkn1-jkt"
                                                        className="bg-transparent flex-1 text-white placeholder:text-slate-600 outline-none text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Pilihan Lisensi</label>
                                                <select
                                                    value={newOrg.license}
                                                    onChange={(e) => setNewOrg({ ...newOrg, license: e.target.value })}
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-white outline-none shadow-inner text-sm font-bold appearance-none cursor-pointer"
                                                >
                                                    <option>Professional</option>
                                                    <option>Enterprise</option>
                                                    <option>Government</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Proktor Info */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                                <Users size={20} />
                                            </div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">Akun Proktor Admin</h3>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Nama Lengkap Proktor</label>
                                            <input
                                                type="text"
                                                required
                                                value={newOrg.proktorName}
                                                onChange={(e) => setNewOrg({ ...newOrg, proktorName: e.target.value })}
                                                placeholder="e.g. Ahmad Sujadi"
                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all shadow-inner"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Email Login Proktor</label>
                                            <input
                                                type="email"
                                                required
                                                value={newOrg.proktorEmail}
                                                onChange={(e) => setNewOrg({ ...newOrg, proktorEmail: e.target.value })}
                                                placeholder="proktor@sekolah.id"
                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all shadow-inner"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Password Sementara</label>
                                            <input
                                                type="password"
                                                required
                                                value={newOrg.proktorPassword}
                                                onChange={(e) => setNewOrg({ ...newOrg, proktorPassword: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex gap-6">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-5 bg-slate-800 text-slate-400 font-black rounded-2xl hover:bg-slate-700 hover:text-white transition-all">Batalkan</button>
                                    <button type="submit" className="flex-1 py-5 bg-primary hover:bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/40 transition-all flex items-center justify-center gap-3">
                                        <PlusCircle size={24} /> Konfirmasi Pendaftaran Institusi
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Proktor Management Modal */}
            <AnimatePresence>
                {showProktorModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowProktorModal(false); setSelectedOrg(null); }}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <form onSubmit={handleUpdateProktor} className="p-10">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tighter mb-1">Kelola Proktor</h2>
                                        <p className="text-slate-500 font-medium text-xs">{selectedOrg?.name}</p>
                                    </div>
                                    <button type="button" onClick={() => { setShowProktorModal(false); setSelectedOrg(null); }} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 mb-6">
                                        <p className="text-xs text-primary-light font-medium leading-relaxed">
                                            Masukkan email proktor yang akan bertanggung jawab mengelola sekolah ini. Pastikan email sudah terdaftar di sistem.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Email Admin Proktor</label>
                                        <input
                                            type="email"
                                            required
                                            value={newProktorEmail}
                                            onChange={(e) => setNewProktorEmail(e.target.value)}
                                            placeholder="proktor@sekolah.id"
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/30 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowProktorModal(false); setSelectedOrg(null); }}
                                        className="px-6 py-4 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700 hover:text-white transition-all text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-primary hover:bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/40 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <ShieldCheck size={18} /> Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
