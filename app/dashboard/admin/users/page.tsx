"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Shield, School, Plus, Search,
    MoreVertical, Trash2, UserPlus, X, Loader2, Check, ArrowRight, ShieldCheck
} from 'lucide-react';
import { listAllUsersAction, getOrgsAndRolesAction, updateUserRoleAction } from '@/app/actions/user';

const UsersManagementPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [orgs, setOrgs] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Form States
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [selectedRoleName, setSelectedRoleName] = useState('Guru');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [userData, configData] = await Promise.all([
            listAllUsersAction(),
            getOrgsAndRolesAction()
        ]);
        setUsers(userData);
        setOrgs(configData.orgs);
        setRoles(configData.roles);
        setIsLoading(false);
    };

    const handleToggleAdmin = async (user: any) => {
        setProcessingId(user.id);
        const result = await updateUserRoleAction(user.id, user.email, {
            type: 'admin',
            action: user.isAdmin ? 'remove' : 'add'
        });
        if (result.success) {
            await loadData();
        } else {
            alert('Gagal mengubah status admin: ' + result.error);
        }
        setProcessingId(null);
    };

    const handleAddMembership = async () => {
        if (!selectedOrgId || !selectedUser) return;
        setProcessingId(selectedUser.id);
        const result = await updateUserRoleAction(selectedUser.id, selectedUser.email, {
            type: 'org',
            action: 'add',
            orgId: selectedOrgId,
            roleName: selectedRoleName as any
        });
        if (result.success) {
            setIsRoleModalOpen(false);
            await loadData();
        } else {
            alert('Gagal menambah role: ' + result.error);
        }
        setProcessingId(null);
    };

    const handleRemoveMembership = async (user: any, orgName: string) => {
        // Cari orgId dari orgName (untuk demo, idealnya simpan orgId di memberships)
        const org = orgs.find(o => o.name === orgName);
        if (!org) return;

        setProcessingId(user.id);
        const result = await updateUserRoleAction(user.id, user.email, {
            type: 'org',
            action: 'remove',
            orgId: org.id
        });
        if (result.success) {
            await loadData();
        }
        setProcessingId(null);
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20 font-['Outfit']">
            <header className="relative p-12 overflow-hidden rounded-[3rem] bg-unelma-navy text-white shadow-2xl shadow-unelma-navy/10 border border-white/5">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-unelma-orange/10 to-transparent"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-unelma-orange opacity-10 blur-[90px] rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10 shadow-xl"
                        >
                            <ShieldCheck size={12} className="text-unelma-orange" /> Access Control Matrix
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2 uppercase leading-none">
                            User <span className="text-unelma-orange">Control</span>
                        </h2>
                        <p className="text-white/50 font-bold max-w-sm text-sm uppercase tracking-wide">
                            Manajemen hak akses Admin, Proktor, Guru, dan Siswa
                        </p>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-unelma-orange transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="CARI EMAIL ATAU NAMA PENGGUNA..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-5 pl-16 pr-6 text-unelma-navy text-xs focus:outline-none focus:ring-4 focus:ring-unelma-navy/5 focus:border-unelma-navy/20 transition-all placeholder:text-slate-400 font-bold uppercase tracking-widest shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredUsers.map((user) => (
                        <motion.div
                            layout
                            key={user.id}
                            className="bg-white p-7 rounded-[2.5rem] border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-unelma-navy/10 transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(3,12,77,0.1)]"
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-all group-hover:scale-105 ${user.isAdmin ? 'bg-unelma-navy text-unelma-orange border-unelma-navy shadow-lg shadow-unelma-navy/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    <Users size={28} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center flex-wrap gap-2 mb-2">
                                        <h4 className="text-xl font-black text-unelma-navy tracking-tight uppercase leading-none">{user.full_name}</h4>
                                        {user.isAdmin && (
                                            <span className="text-[9px] font-black bg-unelma-orange text-unelma-navy px-3 py-1 rounded-full uppercase tracking-widest border border-unelma-orange/20">
                                                Platform Admin
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 flex-1 md:justify-center">
                                {user.memberships.map((m: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl group/tag hover:bg-white hover:border-unelma-orange/20 transition-all">
                                        <School size={14} className="text-unelma-navy" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-unelma-navy uppercase leading-none mb-1">{m.orgName}</span>
                                            <span className="text-[8px] font-black text-unelma-orange uppercase tracking-[0.2em]">{m.role}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveMembership(user, m.orgName)}
                                            className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover/tag:opacity-100 transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {!user.isAdmin && user.memberships.length === 0 && (
                                    <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic border-2 border-dashed border-slate-100 px-6 py-2 rounded-2xl">
                                        Empty Organization Role
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => handleToggleAdmin(user)}
                                    disabled={processingId === user.id}
                                    className={`flex-1 md:flex-none px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 shadow-sm ${user.isAdmin
                                        ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white'
                                        : 'bg-unelma-navy border-unelma-navy text-white hover:bg-unelma-navy-light shadow-xl shadow-unelma-navy/10'}`}
                                >
                                    {processingId === user.id ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                                    {user.isAdmin ? 'Revoke Admin' : 'Assign Admin'}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setIsRoleModalOpen(true);
                                    }}
                                    className="p-4 bg-slate-50 border border-slate-200 text-unelma-navy hover:bg-unelma-orange hover:border-unelma-orange transition-all rounded-xl shadow-sm group-hover:scale-105"
                                >
                                    <UserPlus size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Role Assignment Modal */}
            <AnimatePresence>
                {isRoleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsRoleModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0F172A] w-full max-w-md rounded-[2.5rem] p-10 relative z-10 border border-slate-800 shadow-2xl">
                            <button onClick={() => setIsRoleModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all"><X size={24} /></button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Assign Role</h3>
                                <p className="text-sm text-slate-400 font-medium">User: {selectedUser?.full_name}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Pilih Organisasi</label>
                                    <select
                                        value={selectedOrgId}
                                        onChange={e => setSelectedOrgId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-white"
                                    >
                                        <option value="">-- Pilih Sekolah/Instansi --</option>
                                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Pilih Peran (Role)</label>
                                    <select
                                        value={selectedRoleName}
                                        onChange={e => setSelectedRoleName(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-white"
                                    >
                                        <option value="Proktor">Proktor</option>
                                        <option value="Guru">Guru</option>
                                        <option value="Siswa">Siswa</option>
                                        <option value="Pengawas">Pengawas</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleAddMembership}
                                    disabled={!selectedOrgId || processingId === selectedUser?.id}
                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-primary transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {processingId === selectedUser?.id ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    ASSIGN ROLE SEKARANG
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UsersManagementPage;
