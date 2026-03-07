"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Shield, School, Plus, Search,
    MoreVertical, Trash2, UserPlus, X, Loader2, Check
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
        <div className="space-y-10 pb-20">
            <header className="relative p-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0c1425] via-slate-900 to-[#020617] text-white border border-slate-800 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 blur-[80px] -mr-20 -mt-20 rounded-full"></div>

                <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest mb-4 border border-white/10"
                        >
                            <Shield size={10} className="text-primary" /> System Administration
                        </motion.div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 uppercase flex items-center justify-center md:justify-start gap-4">
                            User <span className="text-primary">Control</span>
                        </h2>
                        <p className="text-slate-400 font-bold max-w-sm text-sm uppercase tracking-tight">
                            Kelola hak akses Admin, Proktor, Guru, dan Siswa
                        </p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                            type="text"
                            placeholder="CARI EMAIL ATAU NAMA..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/50 outline-none font-black text-[10px] uppercase tracking-widest shadow-inner transition-all"
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredUsers.map((user) => (
                        <motion.div
                            layout
                            key={user.id}
                            className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-primary/20 transition-all shadow-lg"
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${user.isAdmin ? 'bg-primary/10 border-primary/30 text-primary-light' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                    <Users size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-lg font-bold text-white tracking-tight">{user.full_name}</h4>
                                        {user.isAdmin && <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">PLATFORM ADMIN</span>}
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1 md:justify-center">
                                {user.memberships.map((m: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
                                        <School size={14} className="text-emerald-400" />
                                        <span className="text-xs font-bold text-slate-300">{m.orgName}</span>
                                        <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-md uppercase font-black">{m.role}</span>
                                        <button
                                            onClick={() => handleRemoveMembership(user, m.orgName)}
                                            className="text-slate-600 hover:text-rose-400 p-0.5"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {!user.isAdmin && user.memberships.length === 0 && (
                                    <span className="text-xs text-slate-600 font-medium">Belum ada role organisasi</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleToggleAdmin(user)}
                                    disabled={processingId === user.id}
                                    className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${user.isAdmin ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 shadow-lg shadow-rose-500/5' : 'bg-primary/10 border-primary/20 text-primary-light hover:bg-primary/20 shadow-lg shadow-primary/5'}`}
                                >
                                    {processingId === user.id ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                                    {user.isAdmin ? 'REVOKE ADMIN' : 'MAKE ADMIN'}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setIsRoleModalOpen(true);
                                    }}
                                    className="p-2.5 bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all shadow-md group-hover:border-primary/30"
                                >
                                    <UserPlus size={16} />
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
