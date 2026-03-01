"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    School,
    ShieldCheck,
    Settings2,
    Activity,
    PlusCircle,
    Database,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const QuickAction = ({ label, desc, icon: Icon, href, color, shadow }: any) => (
    <Link href={href}>
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:border-primary/20 transition-all group flex flex-col h-full shadow-sm hover:shadow-premium relative overflow-hidden"
        >
            <div className={`absolute top-0 left-0 w-2 h-full ${color.replace('text', 'bg')}`}></div>
            <div className={`w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center ${color} shadow-sm mb-6 group-hover:rotate-6 transition-transform`}>
                <Icon size={32} />
            </div>
            <h3 className="text-xl font-black text-primary uppercase italic tracking-tight mb-2 group-hover:text-accent transition-colors">{label}</h3>
            <p className="text-slate-500 text-sm font-medium mb-8 flex-1">{desc}</p>
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest group-hover:text-accent transition-colors">
                Buka Sekarang <ArrowRight size={16} />
            </div>
        </motion.div>
    </Link>
);

export default function AdminDashboard() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <header className="relative p-10 md:p-14 overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary via-primary-light to-[#051163] text-white shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-5 blur-[80px] -ml-20 -mb-20 rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                        >
                            <ShieldCheck size={12} className="text-accent" /> System Administrator
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase italic">
                            Owner <span className="text-accent">Control</span>
                        </h1>
                        <p className="text-white/60 font-bold max-w-md italic text-lg">
                            Selamat datang. Kendalikan seluruh ekosistem UNELMACBT di sini.
                        </p>
                    </div>

                    <div className="flex bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 items-center">
                        <div className="px-6 py-4 flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-widest border-r border-white/10">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                            System Online
                        </div>
                        <div className="px-6 py-4 flex items-center gap-3 text-white/70 font-black text-[10px] uppercase tracking-widest">
                            <Database size={16} className="text-accent" />
                            Node-01 JKT
                        </div>
                    </div>
                </div>
            </header>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Organisasi', value: '12', icon: School, color: 'text-primary' },
                    { label: 'Total Siswa', value: '4.5k', icon: Users, color: 'text-accent' },
                    { label: 'Kapasitas', value: '98%', icon: Activity, color: 'text-green-600' },
                    { label: 'Security', value: 'Active', icon: ShieldCheck, color: 'text-primary' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white border border-slate-100 p-8 rounded-[2.5rem] group hover:border-primary/20 hover:shadow-premium transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <stat.icon size={60} />
                        </div>
                        <stat.icon className={`${stat.color} mb-4`} size={28} strokeWidth={2.5} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{stat.label}</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter italic">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
                    <QuickAction
                        label="Manajemen Sekolah"
                        desc="Daftarkan institusi baru, atur subdomain, dan kelola lisensi penggunaan platform secara terpusat."
                        icon={School}
                        href="/dashboard/admin/orgs"
                        color="text-primary"
                    />
                    <QuickAction
                        label="Pengaturan Global"
                        desc="Konfigurasi sistem, backup database, dan manajemen API key platform pusat backend."
                        icon={Settings2}
                        href="/dashboard/admin/settings"
                        color="text-accent"
                    />
                </div>

                <div className="bg-primary border border-primary-light rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-primary/20">
                    <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-accent/20 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                            <PlusCircle className="text-accent" size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-white leading-none mb-4 tracking-tighter uppercase italic">Ekspansi <br /><span className="text-accent">Jaringan</span></h2>
                        <p className="text-white/60 font-medium text-sm leading-relaxed mb-8 italic">
                            Mulai ekspansi ekosistem Anda dengan menambahkan sekolah mitra dalam hitungan detik.
                        </p>
                    </div>
                    <Link href="/dashboard/admin/orgs" className="relative z-10">
                        <button className="w-full bg-accent hover:bg-orange-500 text-white tracking-widest uppercase text-[10px] font-black py-5 rounded-2xl shadow-xl shadow-accent/20 transition-all flex justify-center items-center gap-2">
                            Daftarkan Sekarang <ArrowRight size={16} />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
