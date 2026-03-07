"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { School, ArrowRight, ShieldCheck, Users, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SchoolLandingPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const [org, setOrg] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchool = async () => {
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !data) {
                router.push('/404');
                return;
            }

            setOrg(data);
            setLoading(false);
        };

        fetchSchool();
    }, [slug, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-white selection:bg-indigo-500/30">
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500 blur-[120px] rounded-full"></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8"
                    >
                        <School size={14} /> Official School Portal
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
                    >
                        Portal CBT <span className="text-indigo-500">{org.name}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-12"
                    >
                        Selamat datang di sistem ujian daring resmi {org.name}. Masuk sesuai peran Anda untuk memulai.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap justify-center gap-6"
                    >
                        <Link href={`/${slug}/login`}>
                            <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-12 py-5 rounded-2xl shadow-2xl shadow-indigo-500/20 transition-all flex items-center gap-3 active:scale-95 text-lg">
                                Masuk ke Portal <ArrowRight size={20} />
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Role Cards */}
            <div className="max-w-7xl mx-auto px-6 pb-32">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Siswa', icon: Users, desc: 'Lihat jadwal, kerjakan ujian, dan lihat nilai hasil belajar Anda.', color: 'text-emerald-400' },
                        { title: 'Guru', icon: BookOpen, desc: 'Kelola bank soal, buat paket ujian, dan lakukan verifikasi jawaban.', color: 'text-indigo-400' },
                        { title: 'Proktor', icon: ShieldCheck, desc: 'Monitoring jalannya ujian secara real-time dan kelola akun pengguna.', color: 'text-violet-400' },
                    ].map((role, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-slate-900/40 border border-slate-800/50 p-10 rounded-[2.5rem] hover:border-indigo-500/40 transition-all group backdrop-blur-xl"
                        >
                            <role.icon className={`${role.color} mb-6`} size={40} />
                            <h3 className="text-2xl font-black mb-4 tracking-tight">Portal {role.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">{role.desc}</p>
                            <Link href={`/${slug}/login`} className="flex items-center gap-2 text-white font-bold text-sm">
                                Login Sekarang <ArrowRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800/50 py-12 px-6 text-center">
                <p className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.4em]">Powered by CBT-APP Enterprise</p>
            </footer>
        </div>
    );
}
