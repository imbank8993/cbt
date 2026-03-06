"use client";
import React from 'react';
import Sidebar from '@/app/components/Sidebar';

export default function TestSidebarPage() {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className="flex-1 p-20 ml-72">
                <h1 className="text-3xl font-bold">Sidebar Verification Page</h1>
                <p className="mt-4 text-slate-500">Checking the logo branding in the sidebar.</p>
            </div>
        </div>
    );
}
