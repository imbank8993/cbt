"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    ClipboardCheck,
    Activity,
    Settings,
    BookOpen,
    Users,
    BarChart3,
    Calendar
} from 'lucide-react';

const MobileNav = () => {
    const pathname = usePathname();

    const getRole = () => {
        if (pathname.includes('/admin')) return 'Admin';
        if (pathname.includes('/proktor')) return 'Proktor';
        if (pathname.includes('/guru')) return 'Guru';
        if (pathname.includes('/siswa')) return 'Siswa';
        return 'User';
    };

    const role = getRole();

    const navConfig: Record<string, any[]> = {
        'Admin': [
            { icon: LayoutDashboard, label: 'Dash', href: '/dashboard/admin' },
            { icon: Users, label: 'Orgs', href: '/dashboard/admin/orgs' },
            { icon: BookOpen, label: 'Hub', href: '/dashboard/admin/unelma' },
            { icon: Settings, label: 'Set', href: '/dashboard/settings' },
        ],
        'Proktor': [
            { icon: LayoutDashboard, label: 'Dash', href: '/dashboard/proktor' },
            { icon: ClipboardCheck, label: 'Exams', href: '/dashboard/proktor/exams' },
            { icon: Activity, label: 'Monitor', href: '/dashboard/proktor/monitoring' },
            { icon: Settings, label: 'Set', href: '/dashboard/settings' },
        ],
        'Guru': [
            { icon: LayoutDashboard, label: 'Dash', href: '/dashboard/guru' },
            { icon: BookOpen, label: 'Bank', href: '/dashboard/guru/questions' },
            { icon: ClipboardCheck, label: 'Exams', href: '/dashboard/guru/exams' },
            { icon: Settings, label: 'Set', href: '/dashboard/settings' },
        ],
        'Siswa': [
            { icon: LayoutDashboard, label: 'Dash', href: '/dashboard/siswa' },
            { icon: Calendar, label: 'Jadwal', href: '/dashboard/siswa/schedule' },
            { icon: BarChart3, label: 'Hasil', href: '/dashboard/siswa/results' },
            { icon: Settings, label: 'Set', href: '/dashboard/settings' },
        ],
        'User': [
            { icon: LayoutDashboard, label: 'Dash', href: '/dashboard' },
            { icon: Settings, label: 'Set', href: '/dashboard/settings' },
        ]
    };

    const navItems = navConfig[role] || navConfig['User'];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-40 px-6 pb-2">
            <div className="flex items-center justify-between h-full">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center gap-1 min-w-[60px] relative">
                            <motion.div
                                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                                className={`w-12 h-8 flex items-center justify-center rounded-2xl transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400'}`}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-pill"
                                        className="absolute inset-0 bg-primary/10 rounded-2xl -z-10"
                                    />
                                )}
                            </motion.div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
