"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CreditCard, LogOut, MessageCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const ExpiredPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const message = searchParams.get('message') || 'Masa aktif paket Anda telah berakhir.';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-rose-500/10 border border-slate-100 text-center"
            >
                <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-rose-500">
                    <AlertTriangle size={48} strokeWidth={2.5} />
                </div>

                <h2 className="text-3xl font-black text-unelma-navy mb-4 uppercase tracking-tight">
                    Paket Kedaluwarsa
                </h2>
                <p className="text-slate-400 font-bold mb-12 text-lg">
                    {message} <br />
                    <span className="text-sm font-medium mt-2 block">Silakan hubungi administrator atau lakukan perpanjangan paket untuk melanjutkan akses ke layanan Unelma CBT.</span>
                </p>

                <div className="grid grid-cols-1 gap-4">
                    <Link
                        href="/#pricing"
                        className="flex items-center justify-center gap-3 w-full py-5 bg-unelma-orange text-unelma-navy font-black rounded-2xl shadow-xl shadow-unelma-orange/20 hover:bg-orange-500 transition-all active:scale-95 uppercase text-sm tracking-widest"
                    >
                        <CreditCard size={18} />
                        Perbarui Langganan
                    </Link>

                    <a
                        href="https://wa.me/6282195382120"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-5 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 uppercase text-sm tracking-widest"
                    >
                        <MessageCircle size={18} />
                        Bantuan WhatsApp
                    </a>

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 w-full py-5 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 uppercase text-sm tracking-widest mt-4"
                    >
                        <LogOut size={18} />
                        Keluar Akun
                    </button>
                </div>

                <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    Unelma CBT Infrastructure &copy; 2026
                </p>
            </motion.div>
        </div>
    );
};

export default ExpiredPage;
