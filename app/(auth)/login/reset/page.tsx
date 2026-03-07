"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login/update-password`,
            });

            if (error) throw error;
            setSuccess(true);
        } catch (error: any) {
            setErrorMsg(error.message || 'Gagal mengirim link reset password.');
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
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">RESET PASSWORD</h1>
                    <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.3em] italic">Recovery Portal</p>
                </div>

                <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-premium relative">
                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase italic">Link Dikirim!</h2>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Kami telah mengirimkan langkah-langkah reset password ke email <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam Anda.
                            </p>
                            <Link href="/login" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:text-accent transition-colors pt-4 italic">
                                <ArrowLeft size={14} /> Kembali ke Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            {errorMsg && (
                                <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-[11px] font-black uppercase tracking-wider">
                                    {errorMsg}
                                </div>
                            )}
                            <form onSubmit={handleResetRequest} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Email Terdaftar</label>
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

                                <button
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-blue-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] group"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            Kirim Link Reset
                                        </>
                                    )}
                                </button>

                                <div className="text-center pt-4">
                                    <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors italic">
                                        <ArrowLeft size={14} /> Kembali ke Login
                                    </Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
