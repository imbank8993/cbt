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
    Shield
} from 'lucide-react';
import { getProctorOrganization, getOrganizationStats, listOrganizationExams } from '@/app/actions/proktor';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProktorDashboard() {
    const router = useRouter();
    const [org, setOrg] = useState<any>(null);
    const [stats, setStats] = useState({ totalMembers: 0, totalExams: 0, activeAttempts: 0 });
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
                }
            }
            setLoading(false);
        };
        loadInitialData();
    }, []);

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
            <header className="relative p-10 md:p-14 overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary via-primary-light to-[#051163] text-white shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-5 blur-[80px] -ml-20 -mb-20 rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                        >
                            <Shield size={12} className="text-accent" /> Secured by Unelma Gate
                        </motion.div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 uppercase italic">
                            Academy <span className="text-accent">Control</span>
                        </h1>
                        <p className="text-white/60 font-bold max-w-md italic text-lg">
                            {org?.name || 'Sekolah'} — Institutional Oversight & Assessment Hub.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button onClick={() => router.push('/dashboard/proktor/members')} className="px-8 py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all backdrop-blur-sm active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2">
                            Batch Guru
                        </button>
                        <button onClick={() => router.push('/dashboard/proktor/members')} className="px-8 py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all backdrop-blur-sm active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2">
                            Batch Siswa
                        </button>
                        <button onClick={() => router.push('/dashboard/proktor/exams')} className="px-10 py-5 bg-accent hover:bg-orange-500 text-primary font-black rounded-2xl shadow-xl shadow-accent/20 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-3">
                            <Plus size={18} strokeWidth={3} /> Jadwal Baru
                        </button>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Total Members', value: stats.totalMembers, icon: Users, accent: 'bg-primary/5 text-primary', trend: '+12% Since last month' },
                    { label: 'Today Assessments', value: stats.totalExams, icon: ClipboardCheck, accent: 'bg-green-50 text-green-600', trend: 'Active Schedule' },
                    { label: 'Live Sessions', value: stats.activeAttempts, icon: Activity, accent: 'bg-accent/5 text-accent', trend: 'In-progress now' },
                ].map((item, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-white border border-slate-100 p-10 rounded-[2.5rem] hover:border-primary/20 transition-all shadow-premium group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <item.icon size={80} strokeWidth={1} />
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-14 h-14 rounded-2xl ${item.accent} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                                    <item.icon size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{item.label}</span>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-bold">
                                        <TrendingUp size={12} /> {item.trend}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-primary italic tracking-tighter">{item.value}</span>
                                <div className="w-1.5 h-1.5 bg-accent rounded-full mb-2"></div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content: Live Monitoring Table */}
            <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-premium">
                <div className="p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-black text-primary uppercase italic tracking-tighter">Live Monitor</h2>
                            <span className="px-4 py-1.5 bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 bg-accent rounded-full animate-ping"></span> Real-time
                            </span>
                        </div>
                        <p className="text-slate-400 font-bold italic text-sm">Pemantauan aktivitas ujian aktif hari ini.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex -space-x-3">
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

                <div className="p-8">
                    {exams.length > 0 ? (
                        <div className="overflow-x-auto">
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
                                                        <p className="font-black text-primary uppercase italic text-lg tracking-tight leading-none mb-1">{exam.title}</p>
                                                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">ID: {exam.id.split('-')[0]}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-8 bg-slate-50/50 border-y border-slate-100/50 group-hover:bg-slate-100/80 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-primary text-sm uppercase italic">{exam.duration_minutes} Mins</span>
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
                    ) : (
                        <div className="py-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                                <Activity size={32} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter mb-2">No Active Assessment</h3>
                            <p className="text-slate-400 font-bold italic text-sm">Hening di jalur monitoring. Jadwalkan ujian untuk memulai.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
