"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, LogIn, School, Loader2, Check, LogOut, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { listStudentClasses, joinClassAction, leaveClassAction } from '@/app/actions/siswa';

export default function SiswaClassesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            const classList = await listStudentClasses(user.id);
            setClasses(classList);
        }
        setIsLoading(false);
    };

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !joinCode.trim()) return;

        setIsSubmitting(true);
        const result = await joinClassAction(userId, joinCode);
        if (result.success) {
            alert(`Berhasil bergabung dengan kelas: ${result.className}`);
            setJoinCode('');
            loadData();
        } else {
            alert('Gagal bergabung: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const handleLeaveClass = async (classId: string, className: string, type: string) => {
        if (type === 'reguler') {
            alert('Anda tidak bisa keluar dari kelas reguler. Hubungi proktor.');
            return;
        }

        if (confirm(`Apakah Anda yakin ingin keluar dari kelas tambahan "${className}"?`)) {
            setIsLoading(true);
            const result = await leaveClassAction(userId!, classId);
            if (result.success) {
                alert(`Berhasil keluar dari kelas: ${result.className}`);
                loadData();
            } else {
                alert(`Gagal keluar: ${result.error}`);
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <header className="relative p-8 md:p-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-light to-[#051163] text-white shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-10 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-5 blur-[80px] -ml-20 -mb-20 rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4 mb-2">
                            <Users size={36} className="text-accent" />
                            Kelas Saya
                        </h2>
                        <p className="text-white/60 font-bold max-w-md text-base">
                            Daftar kelas yang Anda ikuti.
                        </p>
                    </div>
                </div>
            </header>

            {/* Gabung Kelas Section */}
            <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-premium flex flex-col lg:flex-row items-center justify-between gap-5">
                <div className="w-full lg:w-auto text-center lg:text-left flex-1">
                    <h3 className="text-lg font-black text-primary uppercase tracking-tight mb-1 flex items-center justify-center lg:justify-start gap-2">
                        <LogIn size={20} className="text-accent" /> Gabung Kelas
                    </h3>
                    <p className="text-slate-500 text-[11px] font-bold">Masukkan kode dari Guru atau Proktor.</p>
                </div>

                <form onSubmit={handleJoinClass} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-[260px]">
                        <input
                            required
                            type="text"
                            placeholder="KODE (MISAL: X9A)"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-[1rem] py-3 px-5 focus:ring-2 focus:ring-primary/50 outline-none font-bold text-slate-900 placeholder:text-slate-400 font-mono tracking-widest uppercase transition-all text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !joinCode.trim()}
                        className="bg-accent hover:bg-orange-600 text-white font-black px-6 py-3 rounded-[1rem] shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-widest whitespace-nowrap shrink-0"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Gabung
                    </button>
                </form>
            </div>

            {/* Daftar Kelas */}
            <div>
                <div className="flex justify-between items-center mb-4 ml-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Kelas Anda Saat Ini</h3>
                    <button onClick={loadData} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-accent transition-colors flex items-center gap-2">
                        <Loader2 size={12} className={isLoading ? 'animate-spin' : ''} />
                        Segarkan List
                    </button>
                </div>
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
                                className="bg-white border border-slate-100 rounded-[2rem] p-8 group hover:border-primary/30 transition-all hover:shadow-xl shadow-slate-200/50"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${cls.type === 'reguler' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
                                        KELAS {cls.type}
                                    </span>
                                    <School size={18} className="text-slate-400 mt-2" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{cls.name}</h3>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4">
                                    <div className="flex-1">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pembuat</div>
                                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-1">
                                            <Info size={12} className="text-blue-500" />
                                            {cls.type === 'reguler' ? 'Dibuat oleh Proktor' : 'Guru / Proktor'}
                                        </div>
                                    </div>
                                    <div className="flex-1 border-l border-slate-100 pl-4">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Organisasi</div>
                                        <div className="text-xs font-bold text-slate-700 mt-1 truncate">{cls.orgName}</div>
                                    </div>
                                </div>

                                {cls.type !== 'reguler' && (
                                    <div className="mt-6">
                                        <button
                                            onClick={() => handleLeaveClass(cls.id, cls.name, cls.type)}
                                            className="w-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <LogOut size={14} /> Keluar Kelas
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {classes.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[2rem]">
                                <School size={48} className="text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-tighter">Anda belum bergabung dengan kelas manapun.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
