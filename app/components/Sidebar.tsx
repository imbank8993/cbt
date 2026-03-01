"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Settings,
    ClipboardCheck,
    BarChart3,
    ShieldAlert,
    GraduationCap,
    LogOut,
    ChevronRight,
    BookOpen,
    Eye,
    Activity,
    Calendar,
    Globe,
    ChevronLeft
} from 'lucide-react';

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    isActive: boolean;
    isCollapsed: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, isActive, isCollapsed }: SidebarItemProps) => (
    <Link href={href}>
        <motion.div
            whileHover={{ x: isCollapsed ? 0 : 5, scale: isCollapsed ? 1.05 : 1 }}
            whileTap={{ scale: 0.98 }}
            className={`group flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                ? 'bg-primary text-white shadow-xl shadow-primary/20'
                : 'text-slate-500 hover:text-primary hover:bg-slate-50'
                }`}
        >
            <div className="flex items-center gap-3.5">
                <Icon size={18} className={isActive ? 'text-white' : 'group-hover:text-primary transition-colors'} strokeWidth={2.5} />
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="font-bold tracking-tight text-[12px] uppercase whitespace-nowrap"
                    >
                        {label}
                    </motion.span>
                )}
            </div>
            {!isCollapsed && isActive && <motion.div layoutId="active-indicator" className="w-1 h-1 bg-white rounded-full shadow-sm" />}
        </motion.div>
    </Link>
);

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { setActiveOrgAction } from '@/app/actions/admin';
import { getProctorOrganization } from '@/app/actions/proktor';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const [managedOrgData, setManagedOrgData] = React.useState<any>(null);

    React.useEffect(() => {
        const checkManaged = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const org = await getProctorOrganization(user.id);
                if (org?.isManaged) {
                    setManagedOrgData(org);
                }
            }
        };
        checkManaged();
    }, [pathname]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const getRole = () => {
        if (pathname.includes('/admin')) return 'Admin';
        if (pathname.includes('/proktor')) return 'Proktor';
        if (pathname.includes('/guru')) return 'Guru';
        if (pathname.includes('/siswa')) return 'Siswa';
        if (pathname.includes('/pengawas')) return 'Pengawas';
        return 'User';
    };

    const role = getRole();

    const menuConfig: Record<string, any[]> = {
        'Admin': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
            { icon: Users, label: 'Sekolah', href: '/dashboard/admin/orgs' },
            { icon: Users, label: 'User Master', href: '/dashboard/admin/users' },
            { icon: Globe, label: 'Unelma Hub', href: '/dashboard/admin/unelma' },
            { icon: Settings, label: 'Setelan', href: '/dashboard/admin/settings' },
        ],
        'Proktor': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/proktor' },
            { icon: Users, label: 'Anggota', href: '/dashboard/proktor/members' },
            { icon: BookOpen, label: 'Bank Soal', href: '/dashboard/proktor/questions' },
            { icon: ClipboardCheck, label: 'Manajemen Ujian', href: '/dashboard/proktor/exams' },
            { icon: Activity, label: 'Monitoring', href: '/dashboard/proktor/monitoring' },
        ],
        'Guru': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/guru' },
            { icon: Users, label: 'Kelas Saya', href: '/dashboard/guru/classes' },
            { icon: BookOpen, label: 'Bank Soal', href: '/dashboard/guru/questions' },
            { icon: ClipboardCheck, label: 'Manajemen Ujian', href: '/dashboard/guru/exams' },
            { icon: GraduationCap, label: 'Penilaian', href: '/dashboard/guru/grading' },
        ],
        'Siswa': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/siswa' },
            { icon: Users, label: 'Kelas Saya', href: '/dashboard/siswa/classes' },
            { icon: Calendar, label: 'Jadwal', href: '/dashboard/siswa/schedule' },
            { icon: BarChart3, label: 'Hasil Ujian', href: '/dashboard/siswa/results' },
        ],
        'Pengawas': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/pengawas' },
            { icon: Eye, label: 'Monitoring Sesi', href: '/dashboard/pengawas/monitoring' },
        ],
        'User': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        ]
    };

    const menuItems = menuConfig[role] || [];

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 96 : 288 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-screen bg-white border-r border-slate-100 p-6 flex flex-col fixed left-0 top-0 z-30 shadow-sm overflow-hidden"
        >
            {/* Toggle Button */}
            <button
                suppressHydrationWarning
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-8 -right-3 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40 border-2 border-white"
            >
                {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
            </button>
            {/* Branding Section */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-10 px-1`}>
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="w-10 h-10 bg-primary rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-white text-xl shadow-xl shadow-primary/20 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-5 h-5 bg-white/20 rounded-full -mr-2.5 -mt-2.5"></div>
                    <span>U</span>
                </motion.div>
                {!isCollapsed && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                        <h2 className="text-xl font-black text-primary tracking-tighter leading-none">UNELMA<span className="text-accent">CBT</span></h2>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">{role} Control</p>
                    </motion.div>
                )}
            </div>

            {/* Navigation List */}
            <nav className="flex-1 space-y-3">
                {!isCollapsed && (
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4 opacity-50 whitespace-nowrap">Main Navigation</p>
                )}

                {managedOrgData && !isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mx-4 mb-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl"
                    >
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2">Managed Mode</p>
                        <p className="text-[10px] font-bold text-slate-700 truncate mb-3">{managedOrgData.name}</p>
                        <button
                            onClick={async () => {
                                await setActiveOrgAction(null);
                                router.push('/dashboard/admin/orgs');
                                setManagedOrgData(null);
                            }}
                            className="w-full py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-light transition-all shadow-lg shadow-primary/10"
                        >
                            Back to Admin
                        </button>
                    </motion.div>
                )}
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.label}
                        {...item}
                        isActive={pathname === item.href}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>

            {/* Bottom Section: Profile & Actions */}
            <div className="mt-auto space-y-6">
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-1 bg-slate-50 border border-slate-100 rounded-[1.75rem]"
                    >
                        <div className="flex items-center gap-3 p-4">
                            <div className="w-10 h-10 bg-white shadow-premium text-primary rounded-xl border border-slate-100 flex items-center justify-center font-black relative">
                                <span>{role[0]}</span>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[11px] font-black text-primary leading-none mb-1 truncate uppercase">{role === 'Admin' ? 'Imran Master' : 'User Access'}</p>
                                <p className="text-[9px] text-slate-400 font-bold truncate">System Online</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="flex flex-col gap-2">
                    <button
                        suppressHydrationWarning
                        onClick={handleSignOut}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-6 py-4 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all font-black text-[10px] uppercase tracking-widest group`}
                    >
                        <div className="flex items-center gap-3">
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                            {!isCollapsed && <span className="whitespace-nowrap">Sign Out Portal</span>}
                        </div>
                        {!isCollapsed && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>

                    {!isCollapsed ? (
                        <button className="w-full py-5 bg-accent text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-accent/20 border-none hover:bg-orange-600 active:scale-95 text-center px-4">
                            Contact Support
                        </button>
                    ) : (
                        <button className="w-full py-4 bg-accent text-white rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 hover:bg-orange-600 active:scale-95">
                            <Activity size={18} />
                        </button>
                    )}
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
