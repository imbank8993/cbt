"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    School,
    ShieldCheck,
    Settings2,
    Activity,
    PlusCircle,
    Database,
    ArrowRight,
    TrendingUp,
    LayoutDashboard,
    Zap,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getAdminStatsAction } from '@/app/actions/admin';

const QuickAction = ({ label, desc, icon: Icon, href, color, tag }: any) => (
    <Link href={href} className="block group">
        <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            className="h-full bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(3,12,77,0.12)] hover:border-unelma-navy/10 transition-all duration-300 relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${color} group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon size={28} />
                </div>
                {tag && (
                    <span className="px-3 py-1 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-full border border-slate-100 group-hover:bg-unelma-orange group-hover:text-unelma-navy group-hover:border-unelma-orange transition-colors">
                        {tag}
                    </span>
                )}
            </div>

            <h3 className="text-lg font-black text-unelma-navy uppercase mb-3 tracking-tight group-hover:text-unelma-navy transition-colors">
                {label}
            </h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">
                {desc}
            </p>

            <div className="flex items-center gap-2 text-unelma-navy font-black text-[9px] uppercase tracking-[0.2em] group-hover:gap-3 transition-all mt-auto">
                Kelola Modul <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
        </motion.div>
    </Link>
);

const StatCard = ({ label, value, icon: Icon, trend, color, isLoading }: any) => (
    <motion.div
        whileHover={{ y: -4 }}
        className="bg-white rounded-[2rem] p-7 border border-slate-200/60 shadow-sm relative overflow-hidden group min-h-[160px] flex flex-col justify-center"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100 ${color}`}>
                <Icon size={20} strokeWidth={2.5} />
            </div>
            {trend && !isLoading && (
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <TrendingUp size={10} /> {trend}
                </div>
            )}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            {isLoading ? (
                <div className="h-9 flex items-center">
                    <Loader2 size={24} className="text-slate-200 animate-spin" />
                </div>
            ) : (
                <h4 className="text-3xl font-black text-unelma-navy tracking-tighter">{value}</h4>
            )}
        </div>
        <div className="absolute bottom-0 right-0 w-24 h-24 opacity-[0.02] translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
            <Icon size={96} />
        </div>
    </motion.div>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        activeOrgs: 0,
        totalStudents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const res = await getAdminStatsAction();
            if (res.success && res.data) {
                setStats(res.data);
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

    // Helper to format large numbers
    const formatNumber = (num: number) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 font-['Outfit']">
            {/* Header Section - Modern & Clean */}
            <header className="relative p-12 overflow-hidden rounded-[3rem] bg-unelma-navy text-white shadow-2xl shadow-unelma-navy/10 border border-white/5">
                {/* Abstract Background Accents */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-unelma-orange/10 to-transparent"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-unelma-orange opacity-10 blur-[90px] rounded-full"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-5 blur-[80px] rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase leading-none">
                            Admin <span className="text-unelma-orange">Central</span>
                        </h1>
                        <p className="text-white/50 font-bold max-w-md text-sm leading-relaxed uppercase tracking-wide">
                            Pusat kendali operasional dan manajemen infrastruktur ekosistem digital Unelma.
                        </p>
                    </div>
                </div>
            </header>

            {/* Overview Stats - Proportional & Modern */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Institusi Aktif"
                    value={stats.activeOrgs}
                    icon={School}
                    isLoading={loading}
                    color="text-unelma-navy"
                />
                <StatCard
                    label="Total Siswa"
                    value={formatNumber(stats.totalStudents)}
                    icon={Users}
                    isLoading={loading}
                    color="text-unelma-orange"
                />
                <StatCard
                    label="Server Load"
                    value="18%"
                    icon={Activity}
                    color="text-emerald-500"
                />
                <StatCard
                    label="Licensing"
                    value="Healthy"
                    icon={LayoutDashboard}
                    color="text-unelma-navy"
                />
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Main Action Grid */}
                <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
                    <QuickAction
                        label="Master Institusi"
                        desc="Registrasi sekolah baru, manajemen proktor utama, serta pemantauan status subdomain institusi."
                        icon={School}
                        href="/dashboard/admin/orgs"
                        color="bg-unelma-navy/10 text-unelma-navy"
                        tag="Core"
                    />
                    <QuickAction
                        label="Unelma Hub"
                        desc="Kelola katalog layanan, paket harga berlangganan, konten pendaratan, dan manajemen produk digital."
                        icon={Zap}
                        href="/dashboard/admin/unelma"
                        color="bg-unelma-orange/10 text-unelma-orange"
                        tag="Sales"
                    />
                    <QuickAction
                        label="Pengguna Sistem"
                        desc="Manajemen akun administrator platform, penugasan role khusus, dan audit log aktivitas sistem."
                        icon={Users}
                        href="/dashboard/admin/users"
                        color="bg-slate-100 text-slate-600"
                    />
                    <QuickAction
                        label="Global Settings"
                        desc="Konfigurasi parameter sistem, integrasi payment gateway, dan manajemen kunci API platform."
                        icon={Settings2}
                        href="/dashboard/admin/settings"
                        color="bg-slate-100 text-slate-600"
                    />
                </div>

                {/* Sidebar Call to Action - Vibrant & Professional */}
                <div className="lg:col-span-4">
                    <div className="h-full bg-white rounded-[2.5rem] p-10 border border-slate-200/60 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-unelma-orange/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 bg-unelma-navy rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-unelma-navy/10 border border-white/5">
                                <PlusCircle className="text-unelma-orange" size={28} strokeWidth={2.5} />
                            </div>

                            <h2 className="text-3xl font-black text-unelma-navy leading-[0.9] mb-4 tracking-tighter uppercase">
                                Akselerasi <br /> <span className="text-unelma-orange">Edu-Tech</span>
                            </h2>
                            <p className="text-slate-500 font-bold text-xs leading-relaxed mb-10 uppercase tracking-tight">
                                Mari kembangkan ekosistem dengan menambahkan mitra institusi baru dalam satu langkah mudah.
                            </p>

                            <div className="mt-auto space-y-4">
                                <Link href="/dashboard/admin/orgs">
                                    <button className="w-full bg-unelma-orange hover:bg-[#ffb340] text-unelma-navy font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-unelma-orange/20 transition-all flex justify-center items-center gap-3 active:scale-[0.98]">
                                        Daftar Sekolah Baru <ArrowRight size={16} />
                                    </button>
                                </Link>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-4">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                                        ))}
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                        Data sinkron dengan ekosistem real-time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
