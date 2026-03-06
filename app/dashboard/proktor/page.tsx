"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardCheck,
    Users,
    Clock,
    Play,
    Plus,
    Activity,
    ArrowUpRight,
    TrendingUp,
    Shield,
    Database,
    CheckCircle2
} from 'lucide-react';
import { getProctorOrganization, getOrganizationStats, listOrganizationExams } from '@/app/actions/proktor';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProktorDashboard() {
    const router = useRouter();
    const [org, setOrg] = useState<any>(null);
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalBanks: 0,
        ongoingExams: 0,
        upcomingExams: 0,
        finishedExams: 0
    });
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const organization = await getProctorOrganization(user.id);
                if (organization) {
                    setOrg(organization);
                    const [statData, examData] = await Promise.all([
                        getOrganizationStats(organization.id),
                        listOrganizationExams(organization.id)
                    ]);
                    setStats(statData);
                    setExams(examData);
                } else {
                    // Jika tidak ada organisasi aktif (misal Platform Admin belum memilih)
                    // Redirect kembali ke Orgs Management
                    router.push('/dashboard/admin/orgs');
                }
            }
            setLoading(false);
        };
        loadInitialData();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-accent rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <header className="relative p-10 md:p-14 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-unelma-navy via-primary-light to-[#051163] text-white shadow-2xl shadow-primary/20">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 blur-[120px] -mr-40 -mt-40 rounded-full animate-pulse-warm"></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 blur-[80px] rounded-full"></div>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>

                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <div className="max-w-2xl">
                        <div className="space-y-1">
                            <h1 className="text-xl md:text-2xl font-medium text-white/80 tracking-tight">
                                Selamat Datang di Dashboard,
                            </h1>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
                                {org?.name || 'Sekolah'}
                            </h2>
                        </div>

                        <div className="mt-8 flex items-center gap-4 text-white/50 text-xs font-bold uppercase tracking-widest">
                            <div className="h-[1px] w-12 bg-accent/50"></div>
                            <span>Pusat Kendali Akademik Terpadu</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {[
                    { label: 'Total Anggota', value: stats.totalMembers, icon: Users, accent: 'bg-primary/5 text-primary', sub: 'Guru & Siswa' },
                    { label: 'Bank Soal', value: stats.totalBanks, icon: Database, accent: 'bg-blue-50 text-blue-600', sub: 'Koleksi Soal' },
                    { label: 'Berlangsung', value: stats.ongoingExams, icon: Activity, accent: 'bg-green-50 text-green-600', sub: 'Ujian Aktif' },
                    { label: 'Mendatang', value: stats.upcomingExams, icon: Clock, accent: 'bg-orange-50 text-orange-600', sub: 'Terjadwal' },
                    { label: 'Selesai', value: stats.finishedExams, icon: CheckCircle2, accent: 'bg-slate-50 text-slate-600', sub: 'Arsip Ujian' },
                ].map((item, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white border border-slate-100 p-6 rounded-[2rem] hover:border-primary/20 transition-all shadow-lg group relative overflow-hidden"
                    >
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl ${item.accent} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                                    <item.icon size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{item.label}</span>
                                    <div className="text-[8px] text-slate-300 font-bold uppercase tracking-wider">
                                        {item.sub}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black text-primary tracking-tighter">{item.value}</span>
                                <div className="w-1.5 h-1.5 bg-accent rounded-full mb-1"></div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content: Live Monitoring */}
            <div className="bg-white border border-slate-100 rounded-[3rem] lg:rounded-[3.5rem] overflow-hidden shadow-premium">
                <div className="p-8 lg:p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                            <h2 className="text-2xl lg:text-3xl font-black text-primary uppercase tracking-tighter">Live Monitor</h2>
                            <span className="px-4 py-1.5 bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 bg-accent rounded-full animate-ping"></span> Real-time
                            </span>
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Pemantauan aktivitas ujian aktif hari ini.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="hidden md:flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 border-2 border-white rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">?</div>
                            ))}
                            <div className="w-10 h-10 border-2 border-white rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black">+8</div>
                        </div>
                        <button onClick={() => router.push('/dashboard/proktor/monitoring')} className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-primary font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
                            View All Monitor
                        </button>
                    </div>
                </div>

                <div className="p-4 lg:p-8">
                    {exams.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">
                                            <th className="px-8 pb-4">Assesment Details</th>
                                            <th className="px-8 pb-4 text-center">Timing</th>
                                            <th className="px-8 pb-4 text-center">Activity</th>
                                            <th className="px-8 pb-4 text-right">Gate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exams.map((exam) => (
                                            <tr key={exam.id} className="group cursor-pointer">
                                                <td className="px-8 py-8 bg-slate-50/50 rounded-l-[2rem] border-y border-l border-slate-100/50 group-hover:bg-slate-100/80 transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary border border-slate-100">
                                                            <ClipboardCheck size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-primary uppercase text-lg tracking-tight leading-none mb-1">{exam.title}</p>
                                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">ID: {exam.id.split('-')[0]}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 bg-slate-50/50 border-y border-slate-100/50 group-hover:bg-slate-100/80 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-black text-primary text-sm uppercase">{exam.duration_minutes} Mins</span>
                                                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Duration</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 bg-slate-50/50 border-y border-slate-100/50 group-hover:bg-slate-100/80 text-center">
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-sm">
                                                        <span className={`w-2 h-2 rounded-full ${exam.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{exam.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 bg-slate-50/50 rounded-r-[2rem] border-y border-r border-slate-100/50 group-hover:bg-slate-100/80 text-right">
                                                    <button onClick={() => router.push('/dashboard/proktor/monitoring?exam=' + exam.id)} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary-light transition-all active:scale-95 shadow-lg shadow-primary/10 group/btn">
                                                        Monitor Hub <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards (Eden Style) */}
                            <div className="lg:hidden space-y-4 px-4 pb-8">
                                {exams.map((exam) => (
                                    <div key={exam.id} className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2rem] space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary border border-slate-100 shrink-0">
                                                <ClipboardCheck size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-primary uppercase text-sm tracking-tight truncate">{exam.title}</p>
                                                <p className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">ID: {exam.id.split('-')[0]}</p>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-100 shadow-sm shrink-0">
                                                <span className={`w-1.5 h-1.5 rounded-full ${exam.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                                <span className="text-[8px] font-black text-primary uppercase tracking-tighter">{exam.status}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Duration</p>
                                                <p className="font-black text-primary text-xs uppercase">{exam.duration_minutes} Mins</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">Timing</p>
                                                <p className="font-black text-primary text-xs uppercase">Schedule</p>
                                            </div>
                                        </div>

                                        <button onClick={() => router.push('/dashboard/proktor/monitoring?exam=' + exam.id)} className="w-full py-4 bg-primary text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2">
                                            Enter Monitoring <ArrowUpRight size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="py-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                                <Activity size={32} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-tighter mb-2">No Active Assessment</h3>
                            <p className="text-slate-400 font-bold text-sm">Hening di jalur monitoring. Jadwalkan ujian untuk memulai.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
