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
    Globe,
    Clock,
    CreditCard,
    Calendar,
    AlertCircle,
    Zap,
    ArrowRight
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { registerOrganizationAction } from '@/app/actions/organization';
import { setActiveOrgAction } from '@/app/actions/admin';
import { updateSubscriptionAction } from '@/app/actions/subscription';
import { getTransactionsAction } from '@/app/actions/payment';
import { fetchPricelist } from '@/lib/unelma';
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
    const [subscriptions, setSubscriptions] = useState<Record<string, any>>({});
    const [showSubModal, setShowSubModal] = useState(false);
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [manualDays, setManualDays] = useState(30);
    const [isSavingSub, setIsSavingSub] = useState(false);
    const [activeTab, setActiveTab] = useState<'orgs' | 'transactions'>('orgs');
    const [transactions, setTransactions] = useState<any[]>([]);

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
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        const data = await fetchPricelist();
        setPackages(data);
    };

    const fetchOrgs = async () => {
        setLoading(true);
        const { data: orgs, error } = await supabase
            .from('organizations')
            .select(`
                *,
                organization_members(count)
            `)
            .order('created_at', { ascending: false });

        if (orgs) {
            setOrganizations(orgs);

            // Fetch subscriptions
            const { data: subs } = await supabase
                .from('organization_subscriptions')
                .select('*, package:package_id(*)');

            if (subs) {
                const subMap: Record<string, any> = {};
                subs.forEach(s => {
                    subMap[s.organization_id] = s;
                });
                setSubscriptions(subMap);
            }
        }
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

    const handleUpdateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrg) return;

        setIsSavingSub(true);
        // If package is selected, use its duration, otherwise use manualDays
        const pkg = packages.find(p => p.id === selectedPackageId);
        const duration = pkg ? pkg.duration_days : manualDays;

        const result = await updateSubscriptionAction(
            selectedOrg.id,
            selectedPackageId || null,
            duration,
            'active'
        );

        if (result.success) {
            fetchOrgs();
            setShowSubModal(false);
            setSelectedOrg(null);
            setSelectedPackageId('');
            setManualDays(30);
        } else {
            alert('Gagal mengupdate langganan: ' + result.error);
        }
        setIsSavingSub(false);
    };

    const fetchTransactions = async () => {
        const result = await getTransactionsAction();
        if (result.success) {
            setTransactions(result.transactions || []);
        }
    };

    useEffect(() => {
        if (activeTab === 'transactions') {
            fetchTransactions();
        }
    }, [activeTab]);

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
        <div className="space-y-10 pb-20 font-['Outfit']">
            <header className="relative p-12 overflow-hidden rounded-[3rem] bg-unelma-navy text-white shadow-2xl shadow-unelma-navy/10 border border-white/5">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-unelma-orange/10 to-transparent"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-unelma-orange opacity-10 blur-[90px] rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10 shadow-xl"
                        >
                            <School size={12} className="text-unelma-orange" /> Ecosystem Infrastructure
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2 uppercase leading-none">
                            Daftar <span className="text-unelma-orange">Sekolah</span>
                        </h2>
                        <p className="text-white/50 font-bold max-w-sm text-sm uppercase tracking-wide">
                            Manajemen instansi, lisensi, dan otoritas proktor sekolah
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="group bg-unelma-orange hover:bg-orange-500 text-unelma-navy font-black px-10 py-5 rounded-2xl shadow-xl shadow-unelma-orange/20 transition-all flex items-center gap-3 active:scale-95 text-[11px] uppercase tracking-widest"
                    >
                        <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" /> DAFTARKAN SEKOLAH
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 p-2 bg-slate-100 rounded-[2rem] w-fit">
                <button
                    onClick={() => setActiveTab('orgs')}
                    className={`px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'orgs' ? 'bg-unelma-navy text-white shadow-xl shadow-unelma-navy/20' : 'text-slate-400 hover:text-unelma-navy'}`}
                >
                    Sekolah ({organizations.length})
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-unelma-navy text-white shadow-xl shadow-unelma-navy/20' : 'text-slate-400 hover:text-unelma-navy'}`}
                >
                    Riwayat Transaksi
                </button>
            </div>

            {/* Controls */}
            {activeTab === 'orgs' && (
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-unelma-orange transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="CARI SEKOLAH BERDASARKAN NAMA ATAU SUBDOMAIN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-5 pl-16 pr-6 text-unelma-navy text-xs focus:outline-none focus:ring-4 focus:ring-unelma-navy/5 focus:border-unelma-navy/20 transition-all placeholder:text-slate-400 font-bold uppercase tracking-widest shadow-sm"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="px-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-unelma-navy font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">Filter</button>
                        <button className="px-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-unelma-navy font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">Export</button>
                    </div>
                </div>
            )}

            {activeTab === 'orgs' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 gap-6">
                            <div className="w-16 h-16 border-4 border-unelma-navy/5 border-t-unelma-orange rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-unelma-navy/20 uppercase tracking-[0.5em]">Synchronizing Data...</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredOrgs.map((org, i) => (
                                <motion.div
                                    key={org.id}
                                    layout
                                    className="bg-white border border-slate-200/60 rounded-[3rem] overflow-hidden group hover:border-unelma-navy/10 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(3,12,77,0.15)] flex flex-col"
                                >
                                    {/* Copy existing Org Card contents */}
                                    <div className="p-8 flex-1">
                                        <div className="flex justify-between items-start mb-10">
                                            <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-unelma-navy border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                                                <School size={32} />
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const { error } = await supabase.from('organizations').update({ is_active: !org.is_active }).eq('id', org.id);
                                                    if (!error) fetchOrgs();
                                                }}
                                                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all active:scale-95 ${org.is_active
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    }`}>
                                                {org.is_active ? 'Online (Active)' : 'Offline (Inactive)'}
                                            </button>
                                        </div>

                                        <h3 className="text-2xl font-black text-unelma-navy mb-1 tracking-tight uppercase leading-none">{org.name}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-8 uppercase tracking-widest">
                                            <Globe size={14} className="text-unelma-orange" /> {org.slug}.cbt-app.com
                                        </div>

                                        <div className="mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group-hover:bg-white transition-colors">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Proktor Utama</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-unelma-navy rounded-xl flex items-center justify-center text-unelma-orange font-black text-sm shadow-lg shadow-unelma-navy/20">
                                                    {org.proktor_email ? org.proktor_email[0].toUpperCase() : 'P'}
                                                </div>
                                                <div className="overflow-hidden flex-1">
                                                    <p className="text-xs font-black text-unelma-navy truncate uppercase tracking-tight">{org.proktor_email || 'BELUM DITUGASKAN'}</p>
                                                    <button
                                                        onClick={() => { setSelectedOrg(org); setNewProktorEmail(org.proktor_email || ''); setShowProktorModal(true); }}
                                                        className="text-[9px] text-unelma-orange hover:text-orange-600 font-black uppercase tracking-widest mt-1.5 transition-colors"
                                                    >
                                                        Kelola Otoritas
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                                            <div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Masa Berlaku</p>
                                                <div className="flex flex-col gap-1">
                                                    <p className={`text-xs font-black uppercase tracking-tight ${subscriptions[org.id] ? (new Date(subscriptions[org.id].end_date) < new Date() ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-300'}`}>
                                                        {subscriptions[org.id]
                                                            ? new Date(subscriptions[org.id].end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                            : 'TIDAK AKTIF'}
                                                    </p>
                                                    <button
                                                        onClick={() => { setSelectedOrg(org); setShowSubModal(true); setManualDays(30); }}
                                                        className="text-[9px] text-unelma-navy hover:text-unelma-orange font-black uppercase tracking-[0.1em] text-left transition-colors flex items-center gap-1"
                                                    >
                                                        {subscriptions[org.id] ? 'MANUAL EDIT' : 'ACTIVATE'} <ArrowRight size={8} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Kapasiatas</p>
                                                <div className="flex items-center gap-2">
                                                    <Users size={12} className="text-unelma-orange" />
                                                    <p className="text-xs font-black text-unelma-navy uppercase tracking-tight">
                                                        {(org.organization_members?.[0] as any)?.count || 0} Siswa
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Paket Layanan</p>
                                                <div className="flex items-center gap-2">
                                                    <Zap size={12} className="text-unelma-orange" />
                                                    <p className="text-xs font-black text-unelma-navy uppercase tracking-tight truncate">
                                                        {subscriptions[org.id]?.package?.name || 'REGULER'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                                        <button
                                            onClick={() => handleManageOrg(org.id)}
                                            className="text-[10px] font-black text-unelma-navy hover:bg-unelma-navy hover:text-white transition-all flex items-center gap-3 uppercase tracking-widest px-6 py-3 bg-white rounded-xl border border-slate-200 shadow-sm"
                                        >
                                            <ShieldCheck size={16} /> Kelola Sistem
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOrg(org.id)}
                                            className="text-[10px] font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest px-4 py-2"
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
                        className="border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50 flex flex-col items-center justify-center p-10 cursor-pointer hover:border-unelma-orange/30 hover:bg-white transition-all group min-h-[450px]"
                    >
                        <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 text-slate-300 group-hover:text-unelma-orange transition-all">
                            <Plus size={48} />
                        </div>
                        <p className="text-2xl font-black text-slate-400 group-hover:text-unelma-navy uppercase tracking-tighter">Daftarkan Sekolah</p>
                    </motion.div>
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Tanggal</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Order ID</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Pelanggan / Org</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Item</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Total</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <CreditCard size={48} />
                                                <p className="font-black uppercase tracking-widest text-xs">Belum ada transaksi</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 text-xs font-bold text-slate-600">
                                                {new Date(t.created_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-8 py-6 text-xs font-black text-unelma-navy">{t.order_id}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-unelma-navy uppercase">{t.guest_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{t.guest_email}</span>
                                                    {t.organization_name && <span className="text-[10px] text-unelma-orange font-black uppercase mt-1">{t.organization_name}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-bold uppercase text-slate-600">{t.item_name}</td>
                                            <td className="px-8 py-6 text-xs font-black text-unelma-navy">
                                                Rp {t.amount?.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${t.status === 'settlement'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-orange-50 text-orange-600 border-orange-100'
                                                    }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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

            {/* Subscription Management Modal */}
            <AnimatePresence>
                {showSubModal && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowSubModal(false); setSelectedOrg(null); }}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <form onSubmit={handleUpdateSubscription} className="p-10">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tighter mb-1">Aktivasi / Perpanjang</h2>
                                        <p className="text-slate-500 font-medium text-xs">{selectedOrg?.name}</p>
                                    </div>
                                    <button type="button" onClick={() => { setShowSubModal(false); setSelectedOrg(null); }} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex gap-4 items-start">
                                        <AlertCircle size={20} className="text-primary-light shrink-0 mt-0.5" />
                                        <p className="text-xs text-primary-light font-medium leading-relaxed">
                                            Memilih paket akan mengatur masa berlaku proktor sesuai dengan durasi paket tersebut mulai dari hari ini.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Pilih Paket (Opsi Otomatis)</label>
                                        <select
                                            value={selectedPackageId}
                                            onChange={(e) => {
                                                setSelectedPackageId(e.target.value);
                                                const pkg = packages.find(p => p.id === e.target.value);
                                                if (pkg) setManualDays(pkg.duration_days);
                                            }}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-white outline-none shadow-inner text-sm font-bold cursor-pointer appearance-none"
                                        >
                                            <option value="">-- PILIH PAKET UNTUK SET DURASI OTOMATIS --</option>
                                            {packages.map(pkg => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    {pkg.name} ({pkg.duration_days} Hari) - Rp {pkg.price.toLocaleString('id-ID')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Durasi Manual (Bonus/Custom Hari)</label>
                                        <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 shadow-inner">
                                            <input
                                                type="number"
                                                value={manualDays}
                                                onChange={(e) => setManualDays(parseInt(e.target.value))}
                                                className="bg-transparent flex-1 text-white outline-none font-black"
                                                placeholder="30"
                                            />
                                            <span className="text-slate-500 font-black text-[10px] uppercase">Hari</span>
                                        </div>
                                    </div>

                                    {subscriptions[selectedOrg?.id] && (
                                        <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl border border-white/5">
                                            <Calendar size={14} className="text-slate-500" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                Eksisting S/D: {new Date(subscriptions[selectedOrg.id].end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowSubModal(false); setSelectedOrg(null); }}
                                        className="px-6 py-4 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700 hover:text-white transition-all text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingSub}
                                        className="flex-1 py-4 bg-primary hover:bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/40 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                    >
                                        {isSavingSub ? 'Menyimpan...' : (
                                            <>
                                                <CreditCard size={18} /> Aktifkan Paket
                                            </>
                                        )}
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
