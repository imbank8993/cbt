"use client";
import React from 'react';
import Sidebar from '@/app/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary/20">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main className={`${isCollapsed ? 'ml-24' : 'ml-72'} transition-all duration-300 min-h-screen relative p-8 md:p-12`}>
                {/* Subtle Background Decorative Elements */}
                <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/2 blur-[120px] rounded-full -z-10 animate-pulse"></div>
                <div className="fixed bottom-0 left-[20%] w-[600px] h-[600px] bg-accent/2 blur-[120px] rounded-full -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

                <div className="relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
