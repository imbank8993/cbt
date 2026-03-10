"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
    ChevronLeft,
    Menu,
    X
} from 'lucide-react';

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    isActive: boolean;
    isCollapsed: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, isActive, isCollapsed }: SidebarItemProps) => (
    <Link href={href} className="relative block group">
        {/* Subtle Indicator on the left */}
        {isActive && !isCollapsed && (
            <motion.div
                layoutId="active-indicator-ultra"
                className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-unelma-navy rounded-full"
            />
        )}

        <motion.div
            whileHover={{ x: isCollapsed ? 0 : 4 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-4 py-3.5 rounded-2xl transition-all duration-500 relative ${isActive
                ? 'bg-white text-unelma-navy shadow-[0_10px_25px_-5px_rgba(3,12,77,0.08)] border border-slate-100'
                : 'text-slate-400 hover:text-unelma-navy hover:bg-white/50'
                }`}
        >
            <div className="flex items-center gap-4 relative z-10">
                <div className={`transition-all duration-300 ${isActive ? 'text-unelma-orange' : 'group-hover:text-unelma-navy'}`}>
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`font-black tracking-widest text-[10px] uppercase whitespace-nowrap ${isActive ? 'text-unelma-navy' : 'text-slate-500'}`}
                    >
                        {label}
                    </motion.span>
                )}
            </div>

            {/* Subtle glow dot for active */}
            {!isCollapsed && isActive && (
                <motion.div
                    layoutId="active-dot-ultra"
                    className="ml-auto w-1.5 h-1.5 bg-unelma-orange rounded-full shadow-[0_0_8px_rgba(255,165,0,0.5)] z-10"
                />
            )}
        </motion.div>
    </Link>
);

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { setActiveOrgAction } from '@/app/actions/admin';
import { getProctorOrganization } from '@/app/actions/proktor';
import { getUserRole, getDashboardPath } from '@/lib/rbac';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    isOpen?: boolean;
    setIsOpen?: (v: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed, isOpen, setIsOpen }: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const [managedOrgData, setManagedOrgData] = React.useState<any>(null);
    const [userData, setUserData] = React.useState<any>(null);
    const [isMobile, setIsMobile] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    React.useEffect(() => {
        const loadUserInfo = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch profile dari database (berisi avatar_url terbaru)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                setUserData({
                    ...user,
                    profile: profile || null
                });

                // Fetch role sebenarnya dari database
                const dbRole = await getUserRole(user.id);
                if (dbRole) {
                    setDbUserRole(dbRole);
                }

                const org = await getProctorOrganization(user.id);
                if (org?.isManaged) {
                    setManagedOrgData(org);
                }
            }
        };
        loadUserInfo();
    }, [pathname]);

    // Close on navigation
    React.useEffect(() => {
        if (setIsOpen) setIsOpen(false);
    }, [pathname]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const [dbUserRole, setDbUserRole] = React.useState<string | null>(null);

    const getRole = () => {
        if (pathname.includes('/admin')) return 'Admin';
        if (pathname.includes('/proktor')) return 'Proktor';
        if (pathname.includes('/guru')) return 'Guru';
        if (pathname.includes('/siswa')) return 'Siswa';
        if (pathname.includes('/pengawas')) return 'Pengawas';
        // Untuk halaman bersama (misal /settings), gunakan role dari database
        if (dbUserRole) return dbUserRole;
        return 'User';
    };

    const role = getRole();

    const menuConfig: Record<string, any[]> = {
        'Admin': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
            { icon: Users, label: 'Sekolah', href: '/dashboard/admin/orgs' },
            { icon: Users, label: 'User Master', href: '/dashboard/admin/users' },
            { icon: Globe, label: 'Unelma Hub', href: '/dashboard/admin/unelma' },
            { icon: Settings, label: 'Setelan', href: '/dashboard/settings' },
        ],
        'Proktor': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/proktor' },
            { icon: Users, label: 'Anggota', href: '/dashboard/proktor/members' },
            { icon: BookOpen, label: 'Bank Soal', href: '/dashboard/proktor/questions' },
            { icon: ClipboardCheck, label: 'Manajemen Ujian', href: '/dashboard/proktor/exams' },
            { icon: Activity, label: 'Monitoring', href: '/dashboard/proktor/monitoring' },
            { icon: Settings, label: 'Setelan', href: '/dashboard/settings' },
        ],
        'Guru': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/guru' },
            { icon: Users, label: 'Kelas Saya', href: '/dashboard/guru/classes' },
            { icon: BookOpen, label: 'Bank Soal', href: '/dashboard/guru/questions' },
            { icon: ClipboardCheck, label: 'Manajemen Ujian', href: '/dashboard/guru/exams' },
            { icon: GraduationCap, label: 'Penilaian', href: '/dashboard/guru/grading' },
            { icon: Settings, label: 'Setelan', href: '/dashboard/settings' },
        ],
        'Siswa': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/siswa' },
            { icon: Users, label: 'Kelas Saya', href: '/dashboard/siswa/classes' },
            { icon: Calendar, label: 'Jadwal', href: '/dashboard/siswa/schedule' },
            { icon: BarChart3, label: 'Hasil Ujian', href: '/dashboard/siswa/results' },
            { icon: Settings, label: 'Setelan', href: '/dashboard/settings' },
        ],
        'Pengawas': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/pengawas' },
            { icon: Eye, label: 'Monitoring Sesi', href: '/dashboard/pengawas/monitoring' },
            { icon: Settings, label: 'Setelan', href: '/dashboard/settings' },
        ],
        'User': [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        ]
    };

    const menuItems = menuConfig[role] || [];

    return (
        <>
            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen && setIsOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{
                    width: isCollapsed ? 96 : 300,
                    x: (isOpen || !isMobile) ? 0 : -320
                }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className={`h-screen bg-slate-50/80 backdrop-blur-2xl border-r border-slate-200/50 p-6 flex flex-col fixed left-0 top-0 z-50 shadow-[5px_0_30px_-15px_rgba(0,0,0,0.02)] overflow-hidden lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >

                {/* Refined Branding Section - Interactive Toggle */}
                <div
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-5'} mb-16 px-1 relative group cursor-pointer hover:opacity-80 transition-all`}
                >
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 bg-white rounded-[1.25rem] flex-shrink-0 flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(3,12,77,0.15)] relative overflow-hidden border border-slate-100 p-2.5 transition-all"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-unelma-orange/10 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
                        <img src="/unelma.png" alt="Unelma Logo" className="w-full h-full object-contain relative z-10" />
                    </motion.div>

                    {(!isCollapsed || isMobile) && mounted && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <h2 className="text-2xl font-black text-unelma-navy tracking-tighter leading-none italic uppercase">Unelma</h2>
                            <div className="flex items-center gap-2 mt-1 whitespace-nowrap overflow-hidden">
                                <span className="w-4 h-[1px] bg-unelma-orange opacity-40 shrink-0"></span>
                                <p className="text-[9px] font-black text-slate-400 leading-none uppercase tracking-[0.2em]">Platform CBT</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Navigation List */}
                <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar -mx-2 px-2 pb-10">
                    {(!isCollapsed || isMobile) && mounted && (
                        <div className="flex items-center gap-3 px-4 mb-6">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] whitespace-nowrap">Explore</span>
                            <div className="h-[1px] w-full bg-slate-100"></div>
                        </div>
                    )}

                    {managedOrgData && (!isCollapsed || isMobile) && mounted && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mx-3 mb-8 p-5 bg-unelma-orange/5 border border-unelma-orange/20 rounded-[1.75rem] relative overflow-hidden group/managed"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-unelma-orange opacity-[0.03] rounded-full blur-xl translate-x-4 -translate-y-4"></div>
                            <p className="text-[8px] font-black text-unelma-orange uppercase tracking-[0.3em] mb-2 opacity-60">Control Center</p>
                            <p className="text-[11px] font-bold text-unelma-navy truncate mb-4 pr-2">{managedOrgData.name}</p>
                            <button
                                onClick={async () => {
                                    await setActiveOrgAction(null);
                                    router.push('/dashboard/admin/orgs');
                                    setManagedOrgData(null);
                                }}
                                className="w-full py-2.5 bg-unelma-navy text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-unelma-orange hover:text-unelma-navy transition-all shadow-lg active:scale-95"
                            >
                                Back to Hub
                            </button>
                        </motion.div>
                    )}

                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.label}
                            {...item}
                            isActive={pathname === item.href}
                            isCollapsed={isCollapsed && !isMobile}
                        />
                    ))}
                </nav>

                {/* Bottom Section: Profile Card - Ultra Light */}
                <div className="mt-auto pt-8 border-t border-slate-200/60 flex flex-col gap-4">
                    {(!isCollapsed || isMobile) && mounted && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-1 px-1.5"
                        >
                            <div className="group/profile relative p-3.5 bg-white border border-slate-200 rounded-[1.75rem] shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden">
                                <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover/profile:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-11 h-11 bg-slate-50 shadow-inner text-unelma-navy rounded-2xl border border-slate-100 flex items-center justify-center font-black relative overflow-hidden shrink-0 group-hover/profile:scale-105 transition-transform">
                                        {userData?.profile?.avatar_url ? (
                                            <img src={userData.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : userData?.user_metadata?.avatar_url ? (
                                            <img src={userData.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-unelma-navy/5 text-unelma-navy flex items-center justify-center text-sm font-black italic">
                                                {role[0]}
                                            </div>
                                        )}
                                        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    </div>

                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[11px] font-black text-unelma-navy leading-none mb-1.5 truncate uppercase tracking-tight">{userData?.profile?.full_name || userData?.user_metadata?.full_name || 'System Access'}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-unelma-orange bg-unelma-orange/10 px-1.5 py-0.5 rounded leading-none uppercase tracking-widest">{role}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <button
                        suppressHydrationWarning
                        onClick={handleSignOut}
                        className={`group w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-5 py-4 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-black text-[9px] uppercase tracking-[0.2em] relative overflow-hidden`}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
                            {(!isCollapsed || isMobile) && mounted && <span className="whitespace-nowrap italic text-slate-300">Sign out</span>}
                        </div>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
