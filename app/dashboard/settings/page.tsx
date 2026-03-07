"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    User,
    Lock,
    Camera,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { updateUserProfileAction, updateUserPasswordAction } from '@/app/actions/user';
import { uploadToHosting, deleteFromHosting } from '@/lib/uploader';
import { useRouter } from 'next/navigation';
import { getUserRole, Role } from '@/lib/rbac';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [role, setRole] = useState<Role | null>(null);

    // Profile Form
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Password Form
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setProfile(profile);
                    setFullName(profile.full_name || '');
                    setAvatarUrl(profile.avatar_url || '');
                }

                // Ambil Role
                const uRole = await getUserRole(user.id);
                setRole(uRole);
            }
            setLoading(false);
        };
        fetchUserData();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSavingProfile(true);
        setMessage(null);

        const result = await updateUserProfileAction(user.id, {
            fullName,
            avatarUrl
        });

        if (result.success) {
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
        } else {
            setMessage({ type: 'error', text: result.error || 'Gagal memperbarui profil.' });
        }
        setSavingProfile(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password minimal 6 karakter.' });
            return;
        }

        setSavingPassword(true);
        setMessage(null);

        const result = await updateUserPasswordAction(user.id, newPassword);

        if (result.success) {
            setMessage({ type: 'success', text: 'Password berhasil diubah. Menghubungkan ulang...' });
            // Defer sign out slightly
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push('/login');
            }, 2000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Gagal mengubah password.' });
            setSavingPassword(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setSavingProfile(true);
        try {
            // Hapus file lama jika punya URL dari hosting eksternal (mengandung icgowa.sch.id)
            let oldUrl = '';
            if (avatarUrl && avatarUrl.includes('icgowa.sch.id')) {
                oldUrl = avatarUrl;
            }

            const result = await uploadToHosting(file, 'avatars', oldUrl);

            if (!result.success || !result.url) {
                throw new Error(result.error || 'Terjadi kesalahan saat upload');
            }

            setAvatarUrl(result.url);
            await updateUserProfileAction(user.id, { avatarUrl: result.url });
            setMessage({ type: 'success', text: 'Foto profil berhasil diupload ke server eksternal.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
        setSavingProfile(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 p-6 md:p-10">
            <header className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-primary">
                    <Settings size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-primary tracking-tight uppercase leading-none">Settings</h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Kelola profil dan keamanan akun Anda</p>
                </div>
            </header>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}
                >
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold text-sm tracking-tight">{message.text}</span>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-premium text-center overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary to-primary-light"></div>

                        <div className="relative pt-6 mb-6">
                            <div className="w-32 h-32 mx-auto rounded-3xl bg-white border-4 border-white shadow-xl overflow-hidden relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-primary uppercase font-black text-4xl">
                                        {fullName[0] || user?.email?.[0]}
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer">
                                    <Camera size={32} className="text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-primary uppercase tracking-tight truncate">{fullName || 'User Access'}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{user?.email}</p>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <User size={12} className="text-primary" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">User ID</span>
                            </div>
                            <p className="text-[9px] font-mono font-bold text-slate-600 truncate">{user?.id}</p>
                        </div>
                    </div>
                </div>

                {/* Forms Section */}
                <div className="md:col-span-2 space-y-8">
                    {/* Profil Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-premium"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <h2 className="text-xl font-black text-primary uppercase tracking-tight">Data Profil</h2>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Lengkap</label>
                                    <input
                                        required
                                        disabled={role !== 'Admin' && role !== 'Proktor'}
                                        type="text"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none font-bold text-primary uppercase tracking-tighter ${role === 'Admin' || role === 'Proktor' ? 'focus:ring-2 focus:ring-primary/20' : 'opacity-60 cursor-not-allowed'}`}
                                    />
                                </div>

                                {role !== 'Admin' && role !== 'Proktor' && (
                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
                                        <AlertCircle className="text-slate-400 mt-0.5" size={16} />
                                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
                                            Nama profil hanya dapat diubah oleh administrator atau proktor sekolah Anda. Silakan hubungi proktor jika terdapat kesalahan penulisan nama.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Perbarui Profil
                            </button>
                        </form>
                    </motion.div>

                    {/* Keamanan Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-premium"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                                <Lock size={20} />
                            </div>
                            <h2 className="text-xl font-black text-primary uppercase tracking-tight">Keamanan</h2>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8 ml-13">Ganti password secara berkala untuk menjaga akun Anda.</p>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password Baru</label>
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-rose-500/20 outline-none font-bold text-primary tracking-tighter shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Konfirmasi Password</label>
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:ring-2 focus:ring-rose-500/20 outline-none font-bold text-primary tracking-tighter shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="text-amber-500 mt-0.5" size={16} />
                                <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tighter">
                                    Setelah mengganti password, Anda akan otomatis logout dari semua perangkat untuk keamanan.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                                Ganti Password & Global Logout
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
