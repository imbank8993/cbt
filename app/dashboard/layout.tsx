"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import MobileNav from '@/app/components/MobileNav';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Bell, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Role, getUserRole, getDashboardPath } from '@/lib/rbac';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const isExamPage = pathname.includes('/dashboard/siswa/exam/');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // RBAC & Auth State
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<Role | null>(null);

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                // 1. Check Session
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                // 2. Resolve Role
                const role = await getUserRole(session.user.id);
                if (!role) {
                    await supabase.auth.signOut();
                    router.push('/login?error=no_role');
                    return;
                }

                setUserRole(role);

                // 3. Security Check: Path Verification
                const dashboardPath = getDashboardPath(role);

                // If on /dashboard/settings or other common paths, allow it.
                // Otherwise, verify if the current path matches the required role path.
                const pathParts = pathname.split('/');
                const baseModule = pathParts[2]; // e.g. 'proktor', 'guru', 'admin'

                const allowedModules: Record<Role, string> = {
                    'Admin': 'admin',
                    'Proktor': 'proktor',
                    'Guru': 'guru',
                    'Siswa': 'siswa',
                    'Pengawas': 'pengawas'
                };

                const expectedModule = allowedModules[role];

                // Check if user is trying to access a restricted module
                const restrictedModules = ['admin', 'proktor', 'guru', 'siswa', 'pengawas'];

                if (restrictedModules.includes(baseModule) && baseModule !== expectedModule) {
                    console.warn(`RBAC: Unauthorized access attempt to /${baseModule} by ${role}. Redirecting...`);
                    router.push(dashboardPath);
                    return;
                }

            } catch (err) {
                console.error("RBAC Layout Error:", err);
            } finally {
                setLoading(false);
            }
        };

        verifyAccess();
    }, [pathname, router]);

    // Sync collapse state with path changes
    useEffect(() => {
        if (isExamPage) {
            setIsCollapsed(true);
        }
    }, [pathname, isExamPage]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30">
                        <Loader2 className="w-10 h-10 text-white animate-spin" strokeWidth={3} />
                    </div>
                </div>
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h3 className="text-2xl font-black text-primary tracking-tight uppercase flex items-center justify-center gap-3">
                        <ShieldCheck className="text-accent" /> Secure Verification
                    </h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-loose">
                        Memverifikasi kredensial dan hak akses Anda <br /> <span className="text-accent italic font-black">Sistem Keamanan Unelma Portal</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary/20">
            {!isExamPage && (
                <>
                    {/* Mobile Header - High End Design */}
                    <header className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/70 backdrop-blur-xl border-b border-white/20 z-40 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="w-12 h-12 flex items-center justify-center text-primary bg-white shadow-premium rounded-2xl border border-slate-100 active:scale-90 transition-all"
                            >
                                <Menu size={22} strokeWidth={2.5} />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-primary tracking-[0.2em] uppercase leading-none">Unelma</span>
                                <span className="text-[10px] font-black text-unelma-orange mt-1">Computer Based Test</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="w-12 h-12 flex items-center justify-center text-slate-400 bg-white shadow-premium rounded-2xl border border-slate-100">
                                <Bell size={20} />
                            </button>
                            <div className="w-12 h-12 bg-primary rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-[10px]">
                                U
                            </div>
                        </div>
                    </header>

                    <Sidebar
                        isCollapsed={isCollapsed}
                        setIsCollapsed={setIsCollapsed}
                        isOpen={isSidebarOpen}
                        setIsOpen={setIsSidebarOpen}
                    />
                    <MobileNav />
                </>
            )}
            <main className={`${isExamPage ? 'ml-0 p-0' : isCollapsed ? 'lg:ml-24 p-6 md:p-12' : 'lg:ml-72 p-6 md:p-12'} transition-all duration-300 min-h-screen relative ${!isExamPage ? 'pt-28 lg:pt-12 pb-24 lg:pb-12' : ''}`}>
                {/* Subtle Background Decorative Elements */}
                {!isExamPage && (
                    <>
                        <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/2 blur-[120px] rounded-full -z-10 animate-pulse"></div>
                        <div className="fixed bottom-0 left-[20%] w-[600px] h-[600px] bg-accent/2 blur-[120px] rounded-full -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
                    </>
                )}

                <div className="relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
