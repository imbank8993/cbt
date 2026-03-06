"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updateUserPasswordAction } from '@/app/actions/user';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Check if we have a recovery session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session from recovery link, redirect to login
                router.push('/login');
            }
        };
        checkSession();
    }, [router]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setErrorMsg('Password tidak cocok.');
            return;
        }
        if (password.length < 6) {
            setErrorMsg('Password minimal 6 karakter.');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User tidak ditemukan.");

            // Use our server action which also performs Global Logout
            const result = await updateUserPasswordAction(user.id, password);

            if (!result.success) throw new Error(result.error);

            setSuccess(true);
            // Sign out locally as well to be sure
            await supabase.auth.signOut();

            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (error: any) {
            setErrorMsg(error.message || 'Gagal memperbarui password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6 relative overflow-hidden font-sans">
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
                        <span className="text-4xl font-black text-white italic">U</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">UPDATE PASSWORD</h1>
                    <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.3em] italic">Security Update</p>
                </div>

                <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-premium relative">
                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <Check size={40} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase italic">Berhasil!</h2>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Password Anda telah berhasil diperbarui. Anda telah dikeluarkan dari semua perangkat untuk keamanan.
                                <br /><br />
                                Mengalihkan ke halaman login...
                            </p>
                        </div>
                    ) : (
                        <>
                            {errorMsg && (
                                <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-[11px] font-black uppercase tracking-wider">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 mb-8">
                                <AlertCircle className="text-amber-500 mt-0.5" size={16} />
                                <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tighter">
                                    Setelah mengganti password, semua sesi aktif Anda di perangkat lain akan dihentikan.
                                </p>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Password Baru</label>
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
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Konfirmasi Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-blue-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] group"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            Update & Logout Global
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
