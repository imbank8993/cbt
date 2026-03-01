"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl mb-6">
                        <span className="text-3xl font-black text-white">C</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Buat Akun Baru</h1>
                    <p className="text-slate-400 mt-2">Mulai revolusi pendidikan digital Anda</p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Nama Lengkap</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="text"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="email"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    placeholder="name@school.id"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    type="password"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Daftar Sekarang
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-700/50 text-center">
                        <p className="text-slate-400 text-sm">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                                Masuk di sini
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
