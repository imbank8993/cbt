"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, School } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserRole, getDashboardPath } from '@/lib/rbac';

export default function SchoolLoginPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [org, setOrg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setErrorMsg('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            const user = data.user;
            if (!user) throw new Error("User tidak ditemukan");

            // Check if user is member of THIS organization
            const { data: membership, error: memberError } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', org.id)
                .eq('user_id', user.id)
                .maybeSingle();

            // Check for Platform Admin bypass
            const { data: adminUser } = await supabase.from('platform_admins').select('id').eq('id', user.id).maybeSingle();

            if (!membership && !adminUser) {
                setErrorMsg('Akun Anda tidak terdaftar di sekolah ini.');
                await supabase.auth.signOut();
                return;
            }

            const role = await getUserRole(user.id);
            if (!role) {
                setErrorMsg('Akun Anda belum memiliki role.');
                await supabase.auth.signOut();
                return;
            }

            router.push(getDashboardPath(role));
        } catch (error: any) {
            setErrorMsg(error.message || 'Gagal masuk.');
        } finally {
            setAuthLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6 relative overflow-hidden font-sans">
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 border border-white/10 rounded-2xl shadow-2xl mb-6 backdrop-blur-xl">
                        <School className="text-indigo-400" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{org.name}</h1>
                    <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-[0.3em]">Official Portal Login</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/50 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl">
                    {errorMsg && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] font-bold uppercase tracking-wider text-center">
                            {errorMsg}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-14 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Code</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-14 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            disabled={authLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] group"
                        >
                            {authLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Log In Portal
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <button onClick={() => router.push(`/${slug}`)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                        ← Back to School Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
