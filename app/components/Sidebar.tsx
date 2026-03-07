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
                    width: isCollapsed ? 96 : 288,
                    x: (isOpen || !isMobile) ? 0 : -300
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`h-screen bg-white border-r border-slate-100 p-6 flex flex-col fixed left-0 top-0 z-50 shadow-sm overflow-hidden lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Toggle Button - Only Desktop */}
                <button
                    suppressHydrationWarning
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`absolute top-8 ${isCollapsed ? 'right-1/2 translate-x-1/2' : 'right-4'} w-8 h-8 bg-white border border-slate-100 text-primary rounded-full hidden lg:flex items-center justify-center shadow-premium hover:scale-110 active:scale-90 transition-all z-40`}
                >
                    {isCollapsed ? <ChevronRight size={16} strokeWidth={3} /> : <ChevronLeft size={16} strokeWidth={3} />}
                </button>

                {/* Branding Section */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} mb-12 px-1 relative`}>
                    <motion.div
                        animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        className="w-12 h-12 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center shadow-2xl shadow-slate-200 relative overflow-hidden border border-slate-100 p-2"
                    >
                        <img src="/unelma.png" alt="Unelma Logo" className="w-full h-full object-contain" />
                    </motion.div>
                    {(!isCollapsed || isMobile) && mounted && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <h2 className="text-2xl font-black text-[#030c4d] tracking-widest leading-none">Unelma</h2>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <p className="text-[10px] font-black text-unelma-orange leading-none">Computer Based Test</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Navigation List */}
                <nav className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {(!isCollapsed || isMobile) && mounted && (
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4 opacity-50 whitespace-nowrap">Main Navigation</p>
                    )}

                    {managedOrgData && (!isCollapsed || isMobile) && mounted && (
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
                            isCollapsed={isCollapsed && !isMobile}
                        />
                    ))}
                </nav>

                {/* Bottom Section: Profile & Actions */}
                <div className="mt-auto space-y-6 pt-6 border-t border-slate-50">
                    {(!isCollapsed || isMobile) && mounted && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-1 bg-slate-50 border border-slate-100 rounded-[1.75rem]"
                        >
                            <div className="flex items-center gap-3 p-4">
                                <div className="w-10 h-10 bg-white shadow-premium text-primary rounded-xl border border-slate-100 flex items-center justify-center font-black relative overflow-hidden">
                                    {userData?.profile?.avatar_url ? (
                                        <img src={userData.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : userData?.user_metadata?.avatar_url ? (
                                        <img src={userData.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{userData?.profile?.full_name?.charAt(0) || userData?.user_metadata?.full_name?.charAt(0) || role[0]}</span>
                                    )}
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[11px] font-black text-primary leading-none mb-1 truncate uppercase">{userData?.profile?.full_name || userData?.user_metadata?.full_name || 'User Access'}</p>
                                    <p className="text-[9px] text-slate-400 font-bold truncate">{role} - System Online</p>
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
                                {(!isCollapsed || isMobile) && mounted && <span className="whitespace-nowrap">Sign Out Portal</span>}
                            </div>
                            {(!isCollapsed || isMobile) && mounted && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </button>
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
