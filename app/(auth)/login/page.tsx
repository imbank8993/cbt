"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Role, getDashboardPath, getUserRole } from '@/lib/rbac';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            const user = data.user;
            if (!user) throw new Error("User tidak ditemukan");

            const role = await getUserRole(user.id);

            if (!role) {
                setErrorMsg('Akun Anda belum dikaitkan dengan peran apa pun. Hubungi admin.');
                await supabase.auth.signOut();
                return;
            }

            router.push(getDashboardPath(role));
        } catch (error: any) {
            setErrorMsg(error.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] gaussian-blur blur-navy-white opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] gaussian-blur blur-orange-white opacity-30"></div>
            <div className="noise-bg opacity-[0.02]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-[1.75rem] shadow-2xl shadow-primary/20 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-full -mr-4 -mt-4"></div>
                        <span className="text-4xl font-black text-white italic">U</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">UNELMA<span className="text-accent">CBT</span></h1>
                    <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.3em] italic">Precision Assessment Portal</p>
                </div>

                <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-premium relative">
                    {errorMsg && (
                        <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-[11px] font-black uppercase tracking-wider animate-shake">
                            {errorMsg}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Credential ID / Email</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300 italic"
                                    placeholder="your@school.id"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Security Code / Password</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="text-right mt-3">
                                <Link href="/login/reset" className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-accent transition-colors italic">
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-primary hover:bg-blue-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] group"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Enter Portal
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-50 text-center">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                            New Institution?{' '}
                            <Link href="/register" className="text-primary font-black hover:text-accent transition-colors px-1 underline underline-offset-4">
                                Register Here
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-12 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-relaxed">
                    © 2026 UNELMA TECHNOLOGIES <br /> TRUSTED BY 1000+ SCHOOLS
                </p>
            </motion.div>
        </div>
    );
}
