"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, LogIn, School, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { listStudentClasses, joinClassAction } from '@/app/actions/siswa';

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

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-4">
                        <Users size={36} className="text-primary" />
                        Kelas Saya
                    </h2>
                    <p className="text-slate-500 font-medium italic uppercase tracking-tighter">Daftar kelas yang Anda ikuti.</p>
                </div>
            </header>

            {/* Gabung Kelas Section */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50">
                <div className="max-w-xl">
                    <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tight mb-2">Gabung Kelas Baru</h3>
                    <p className="text-slate-500 text-sm font-medium mb-6">Masukkan kode kelas dari Guru atau Proktor Anda untuk bergabung.</p>

                    <form onSubmit={handleJoinClass} className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                required
                                type="text"
                                placeholder="Masukkan Kode (Misal: X9A2B1)"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-4 focus:ring-2 focus:ring-primary/50 outline-none font-bold text-slate-900 font-mono tracking-widest uppercase shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !joinCode.trim()}
                            className="bg-accent hover:bg-orange-600 text-white font-black px-8 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                            Gabung
                        </button>
                    </form>
                </div>
            </div>

            {/* Daftar Kelas */}
            <div>
                <div className="flex justify-between items-center mb-4 ml-2">
                    <h3 className="text-sm font-black text-slate-400 italic uppercase tracking-widest">Kelas Anda Saat Ini</h3>
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
                                <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tight mb-2">{cls.name}</h3>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organisasi</div>
                                    <div className="text-sm font-black text-slate-700 italic">{cls.orgName}</div>
                                </div>
                            </motion.div>
                        ))}
                        {classes.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[2rem]">
                                <School size={48} className="text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold italic uppercase tracking-tighter">Anda belum bergabung dengan kelas manapun.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
