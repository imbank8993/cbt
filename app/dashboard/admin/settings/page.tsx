"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    CreditCard,
    Globe,
    ShieldCheck,
    Save,
    AlertCircle,
    Server,
    Mail,
    Phone,
    CheckCircle2
} from 'lucide-react';
import { getSettingsAction, updateSettingAction } from '@/app/actions/settings';

const SettingRow = ({ icon: Icon, title, description, children, onSave, isSaving }: any) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="group bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden hover:shadow-xl hover:border-unelma-navy/10 transition-all duration-300 shadow-sm"
    >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
            {/* Left: Info Section - CLEAN LIGHT */}
            <div className="lg:w-1/3 p-8 bg-slate-50/50 border-r border-slate-100 flex items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-unelma-navy shadow-sm border border-slate-100 shrink-0 group-hover:scale-110 group-hover:border-unelma-navy/30 transition-transform duration-300">
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-unelma-navy uppercase tracking-tight leading-none mb-1.5">{title}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{description}</p>
                </div>
            </div>

            {/* Middle: Inputs Section - LIGHT */}
            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center bg-white">
                {children}
            </div>

            {/* Right: Action Section - LIGHT */}
            <div className="p-6 bg-slate-50 border-l border-slate-100 flex items-center justify-center">
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="w-full lg:w-auto flex items-center gap-3 px-8 py-4 bg-unelma-navy text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-unelma-orange hover:text-unelma-navy transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? 'Sav...' : <><Save size={14} /> Update</>}
                </button>
            </div>
        </div>
    </motion.div>
);

const SlimInput = ({ label, value, onChange, placeholder, type = "text" }: any) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 block">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-unelma-navy font-bold text-xs outline-none focus:ring-4 focus:ring-unelma-navy/5 focus:border-unelma-navy/20 transition-all placeholder:text-slate-300 shadow-sm"
        />
    </div>
);

const ToggleSwitch = ({ label, subLabel, isOn, onToggle, activeColor = "bg-unelma-orange" }: any) => (
    <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex-1 overflow-hidden">
            <p className="text-[9px] font-black text-unelma-navy uppercase tracking-tight truncate">{label}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{subLabel}</p>
        </div>
        <button
            onClick={onToggle}
            className={`w-10 h-6 rounded-full transition-all flex items-center px-1 shrink-0 ${isOn ? activeColor : 'bg-slate-300'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${isOn ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
    </div>
);

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const [midtrans, setMidtrans] = useState({ server_key: '', client_key: '', is_production: false });
    const [appConfig, setAppConfig] = useState({ app_name: '', maintenance_mode: false });
    const [contact, setContact] = useState({ email: '', whatsapp: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const result = await getSettingsAction();
        if (result.success && result.settings) {
            const m = result.settings.find((s: any) => s.key === 'midtrans_config');
            if (m) setMidtrans(m.value);
            const a = result.settings.find((s: any) => s.key === 'app_config');
            if (a) setAppConfig(a.value);
            const c = result.settings.find((s: any) => s.key === 'contact_config');
            if (c) setContact(c.value);
        }
        setLoading(false);
    };

    const handleSave = async (key: string, value: any) => {
        setSavingKey(key);
        const result = await updateSettingAction(key, value);
        if (result.success) {
            // Re-fetch to confirm
            fetchSettings();
        } else {
            alert('Failed to save: ' + result.error);
        }
        setSavingKey(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-unelma-orange rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-unelma-navy/20 uppercase tracking-[0.5em]">Synchronizing Core Systems...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20">
            {/* Header Section - Premium BLUE Card */}
            <header className="relative p-12 overflow-hidden rounded-[3rem] bg-unelma-navy text-white shadow-2xl shadow-unelma-navy/10 border border-white/5">
                {/* Abstract Background Accents */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-unelma-orange/10 to-transparent"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-unelma-orange opacity-10 blur-[90px] rounded-full"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-5 blur-[80px] rounded-full"></div>

                <div className="relative">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase leading-none">
                            GLOBAL <span className="text-unelma-orange">CONFIG</span>
                        </h1>
                        <p className="text-white/50 font-bold max-w-md text-sm leading-relaxed uppercase tracking-wide">
                            Konfigurasi parameter sistem, integrasi payment gateway, dan manajemen identitas platform.
                        </p>
                    </div>
                </div>
            </header>

            <div className="space-y-6">
                {/* Row 1: Midtrans */}
                <SettingRow
                    icon={CreditCard}
                    title="Midtrans Integration"
                    description="Payment API & Sandbox config"
                    isSaving={savingKey === 'midtrans_config'}
                    onSave={() => handleSave('midtrans_config', midtrans)}
                >
                    <SlimInput
                        label="Server Key"
                        value={midtrans.server_key}
                        onChange={(v: any) => setMidtrans({ ...midtrans, server_key: v })}
                        placeholder="SB-Mid-..."
                    />
                    <SlimInput
                        label="Client Key"
                        value={midtrans.client_key}
                        onChange={(v: any) => setMidtrans({ ...midtrans, client_key: v })}
                        placeholder="SB-Mid-..."
                    />
                    <ToggleSwitch
                        label="Production"
                        subLabel="Live Mode"
                        isOn={midtrans.is_production}
                        onToggle={() => setMidtrans({ ...midtrans, is_production: !midtrans.is_production })}
                    />
                </SettingRow>

                {/* Row 2: App Config */}
                <SettingRow
                    icon={Globe}
                    title="Global Identity"
                    description="Branding & Access control"
                    isSaving={savingKey === 'app_config'}
                    onSave={() => handleSave('app_config', appConfig)}
                >
                    <SlimInput
                        label="Platform Name"
                        value={appConfig.app_name}
                        onChange={(v: any) => setAppConfig({ ...appConfig, app_name: v })}
                        placeholder="Unelma CBT"
                    />
                    <div className="lg:col-span-2">
                        <ToggleSwitch
                            label="Maintenance Mode"
                            subLabel="Restrict all institution access"
                            isOn={appConfig.maintenance_mode}
                            onToggle={() => setAppConfig({ ...appConfig, maintenance_mode: !appConfig.maintenance_mode })}
                            activeColor="bg-rose-500"
                        />
                    </div>
                </SettingRow>

                {/* Row 3: Support Contact */}
                <SettingRow
                    icon={Mail}
                    title="Communication Hub"
                    description="Support & Business channels"
                    isSaving={savingKey === 'contact_config'}
                    onSave={() => handleSave('contact_config', contact)}
                >
                    <SlimInput
                        label="Support Email"
                        value={contact.email}
                        onChange={(v: any) => setContact({ ...contact, email: v })}
                        placeholder="support@unelma.id"
                        type="email"
                    />
                    <SlimInput
                        label="WhatsApp Business"
                        value={contact.whatsapp}
                        onChange={(v: any) => setContact({ ...contact, whatsapp: v })}
                        placeholder="+62..."
                    />
                    <div className="p-4 bg-unelma-navy/5 rounded-2xl flex items-center gap-4 border border-slate-100">
                        <Phone size={18} className="text-unelma-navy opacity-40" />
                        <p className="text-[9px] font-black text-unelma-navy/50 uppercase tracking-widest leading-tight">Channels are synchronized with institution footer.</p>
                    </div>
                </SettingRow>

                {/* Security Footer - Light & Slim */}
                <div className="flex flex-col md:flex-row items-center justify-between px-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] relative overflow-hidden group shadow-sm transition-all hover:bg-slate-50">
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-unelma-navy group-hover:text-white transition-all">
                            <ShieldCheck size={20} className="text-unelma-navy group-hover:text-unelma-orange" />
                        </div>
                        <div>
                            <h2 className="text-base font-black uppercase tracking-tight text-unelma-navy leading-none mb-1">Platform <span className="text-unelma-orange">Security</span></h2>
                            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">All encryption keys are managed within root-level secure infrastructure.</p>
                        </div>
                    </div>
                    <div className="relative z-10 mt-4 md:mt-0 flex gap-8 text-right items-center">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Last Audit</p>
                            <p className="text-[9px] font-black uppercase text-unelma-navy">{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                Secured
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
