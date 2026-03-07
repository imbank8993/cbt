"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, List, Settings, LogOut, Plus, Edit2, Trash2,
    Heart, X, Save, Tag, DollarSign, Clock, Layers, Package, ImageIcon
} from 'lucide-react';
import {
    LayananItem, PricelistItem, getIcon,
    fetchLayanan, saveLayanan, updateLayanan, deleteLayanan,
    fetchPricelist, savePricelist, updatePricelist, deletePricelist,
    ProdukItem, fetchProduk, saveProduk, updateProduk, deleteProduk
} from '@/lib/unelma';
import Link from 'next/link';
import { createTransactionAction } from '@/app/actions/payment';
import { supabase } from '@/lib/supabase';

declare global {
    interface Window {
        snap: any;
    }
}

const AdminDashboard = () => {
    const [layanan, setLayanan] = useState<LayananItem[]>([]);
    const [prices, setPrices] = useState<PricelistItem[]>([]);
    const [produk, setProduk] = useState<ProdukItem[]>([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isLayananModalOpen, setIsLayananModalOpen] = useState(false);
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [isProdukModalOpen, setIsProdukModalOpen] = useState(false);
    const [currentLayanan, setCurrentLayanan] = useState<Partial<LayananItem>>({});
    const [currentPrice, setCurrentPrice] = useState<Partial<PricelistItem>>({});
    const [currentProduk, setCurrentProduk] = useState<Partial<ProdukItem>>({});

    useEffect(() => {
        loadData();
        // Load Midtrans Snap Script
        const script = document.createElement('script');
        script.src = process.env.MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [lData, pData, prData] = await Promise.all([fetchLayanan(), fetchPricelist(), fetchProduk()]);
        setLayanan(lData);
        setPrices(pData);
        setProduk(prData);
        setIsLoading(false);
    };

    const handleCheckout = async (item: { id: string, type: 'layanan' | 'pricelist' | 'produk', name: string, price: number }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Sesi login tidak ditemukan. Silakan refresh halaman atau login kembali.');
                return;
            }

            const res = await createTransactionAction(item, {
                userId: user.id,
                email: user.email!,
                fullName: user.user_metadata?.full_name
            });

            if (res.success && res.token) {
                window.snap.pay(res.token, {
                    onSuccess: (result: any) => {
                        alert('Pembayaran Berhasil!');
                        console.log(result);
                    },
                    onPending: (result: any) => {
                        alert('Pembayaran Menunggu Konfirmasi...');
                        console.log(result);
                    },
                    onError: (result: any) => {
                        alert('Pembayaran Gagal!');
                        console.log(result);
                    },
                    onClose: () => {
                        alert('Anda menutup popup pembayaran sebelum selesai.');
                    }
                });
            } else {
                alert('Gagal membuat transaksi: ' + res.error);
            }
        } catch (error: any) {
            alert('Terjadi kesalahan: ' + error.message);
        }
    };

    // --- Layanan Handlers ---
    const handleSaveLayanan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentLayanan.id) {
                await updateLayanan(currentLayanan.id, currentLayanan);
            } else {
                await saveLayanan(currentLayanan as Omit<LayananItem, 'id'>);
            }
            setIsLayananModalOpen(false);
            loadData();
        } catch (err) {
            alert('Gagal menyimpan layanan');
        }
    };

    const handleDeleteLayanan = async (id: string) => {
        if (confirm('Hapus layanan ini?')) {
            await deleteLayanan(id);
            loadData();
        }
    };

    // --- Price Handlers ---
    const handleSavePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentPrice.id) {
                await updatePricelist(currentPrice.id, currentPrice);
            } else {
                await savePricelist(currentPrice as Omit<PricelistItem, 'id'>);
            }
            setIsPriceModalOpen(false);
            loadData();
        } catch (err) {
            alert('Gagal menyimpan harga');
        }
    };

    const handleDeletePrice = async (id: string) => {
        if (confirm('Hapus paket harga ini?')) {
            await deletePricelist(id);
            loadData();
        }
    };

    // --- Produk Handlers ---
    const handleSaveProduk = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentProduk.id) {
                await updateProduk(currentProduk.id, currentProduk);
            } else {
                await saveProduk(currentProduk as Omit<ProdukItem, 'id'>);
            }
            setIsProdukModalOpen(false);
            loadData();
        } catch (err) {
            alert('Gagal menyimpan produk');
        }
    };

    const handleDeleteProduk = async (id: string) => {
        if (confirm('Hapus produk ini?')) {
            await deleteProduk(id);
            loadData();
        }
    };

    return (
        <div className="min-h-[85vh] bg-[#f8faff] rounded-[3rem] p-8 md:p-12 font-['Outfit'] border border-slate-100 shadow-2xl shadow-slate-200/50">
            {/* Horizontal Tabs Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                <div className="flex p-1.5 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-x-auto w-full md:w-max backdrop-blur-md">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                        { id: 'layanan', label: 'Layanan', icon: <List size={16} /> },
                        { id: 'pricing_cbt', label: 'Paket CBT', icon: <DollarSign size={16} /> },
                        { id: 'pricing_to', label: 'Paket TO', icon: <DollarSign size={16} /> },
                        { id: 'pricing_bimbingan', label: 'Bimbingan', icon: <DollarSign size={16} /> },
                        { id: 'pricing_custom', label: 'Custom App', icon: <DollarSign size={16} /> },
                        { id: 'produk', label: 'Produk', icon: <Package size={16} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-unelma-navy text-white shadow-xl shadow-unelma-navy/20'
                                : 'text-slate-400 hover:text-unelma-navy hover:bg-slate-50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

            </div>

            {/* Main Content Area */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h2 className="text-4xl font-black text-unelma-navy tracking-tight uppercase leading-none mb-3">
                        {activeTab === 'layanan' ? 'Layanan Hub' :
                            activeTab.startsWith('pricing') ? 'Price Workspace' :
                                activeTab === 'produk' ? 'Product Center' : 'Panel Analytics'}
                    </h2>
                    <p className="text-unelma-navy/30 font-bold uppercase text-[10px] tracking-[0.3em] ml-1">Layanan Landing Page Real-time</p>
                </div>
                {activeTab !== 'dashboard' && (
                    <button
                        onClick={() => {
                            if (activeTab === 'layanan') {
                                setCurrentLayanan({ title: '', description: '', icon_name: 'BookOpen' });
                                setIsLayananModalOpen(true);
                            } else if (activeTab.startsWith('pricing')) {
                                const cat = activeTab.replace('pricing_', '');
                                setCurrentPrice({ name: '', price: 0, period: 'bulan', features: [], is_popular: false, duration_days: 30, category: cat });
                                setIsPriceModalOpen(true);
                            } else if (activeTab === 'produk') {
                                setCurrentProduk({ name: '', description: '', image_url: '', price: 0 });
                                setIsProdukModalOpen(true);
                            }
                        }}
                        className="bg-unelma-orange hover:bg-orange-500 text-unelma-navy px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-unelma-orange/20 active:scale-95 flex items-center gap-3"
                    >
                        <Plus size={18} />
                        TAMBAH {activeTab === 'layanan' ? 'LAYANAN' : activeTab.startsWith('pricing') ? 'PAKET' : 'PRODUK'}
                    </button>
                )}
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="w-16 h-16 border-4 border-unelma-navy/5 border-t-unelma-orange rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-unelma-navy/20 uppercase tracking-[0.5em]">Synchronizing Data...</p>
                </div>
            ) : (
                <div className="pb-20">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: 'Total Layanan', value: layanan.length, icon: <List className="text-unelma-orange" /> },
                                { label: 'Paket Pricing', value: prices.length, icon: <DollarSign className="text-blue-500" /> },
                                { label: 'Varian Produk', value: produk.length, icon: <Package className="text-emerald-500" /> },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">{stat.icon}</div>
                                        <div className="text-4xl font-black text-unelma-navy tracking-tighter">{stat.value}</div>
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{stat.label}</h4>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'layanan' && (
                        <div className="grid grid-cols-1 gap-6">
                            {layanan.map((item, i) => (
                                <motion.div
                                    layout
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between group hover:shadow-xl transition-all gap-8"
                                >
                                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                                        <div className="w-20 h-20 bg-unelma-orange/10 rounded-3xl flex items-center justify-center text-unelma-navy group-hover:rotate-6 transition-transform">
                                            {getIcon(item.icon_name)}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-unelma-navy mb-2 tracking-tight uppercase">{item.title}</h4>
                                            <p className="text-slate-400 font-bold max-w-xl text-sm leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        <button
                                            onClick={() => handleCheckout({ id: item.id, type: 'layanan', name: item.title, price: 50000 })}
                                            className="p-4 rounded-xl bg-unelma-orange/10 hover:bg-unelma-orange hover:text-white text-unelma-orange shadow-sm transition-all active:scale-95"
                                            title="Test Payment (Rp 50.000)"
                                        >
                                            <DollarSign size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCurrentLayanan(item);
                                                setIsLayananModalOpen(true);
                                            }}
                                            className="p-4 rounded-xl bg-white hover:bg-blue-500 hover:text-white text-slate-400 shadow-sm transition-all active:scale-95"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLayanan(item.id)}
                                            className="p-4 rounded-xl bg-white hover:bg-rose-500 hover:text-white text-slate-400 shadow-sm transition-all active:scale-95"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {activeTab.startsWith('pricing') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {prices.filter(p => p.category === activeTab.replace('pricing_', '') || (!p.category && activeTab === 'pricing_cbt')).map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`bg-white p-10 rounded-[2.5rem] shadow-sm border relative overflow-hidden flex flex-col hover:shadow-2xl transition-all ${item.is_popular ? 'border-unelma-orange border-2' : 'border-slate-100'}`}
                                >
                                    {item.is_popular && (
                                        <div className="absolute top-0 right-0 bg-unelma-orange text-unelma-navy font-black text-[9px] px-6 py-2 rounded-bl-2xl uppercase tracking-[0.2em] shadow-lg">
                                            Sangat Populer
                                        </div>
                                    )}

                                    <div className="mb-10">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-2xl font-black text-unelma-navy tracking-tight uppercase">{item.name}</h4>
                                            <div className="flex flex-col items-end">
                                                <div className="bg-blue-50 text-unelma-navy px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 mb-1">
                                                    {item.duration_days} HARI
                                                </div>
                                                <div className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                                    {item.category?.toUpperCase() || 'CBT'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-unelma-navy">Rp {item.price.toLocaleString('id-ID')}</span>
                                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">/ {item.period}</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-10 flex-1">
                                        {item.features?.map((f, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-500 uppercase tracking-tight">
                                                <div className="w-1.5 h-1.5 rounded-full bg-unelma-orange"></div>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex flex-col gap-2 border-t border-slate-50 pt-8">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleCheckout({ id: item.id, type: 'pricelist', name: item.name, price: item.price })}
                                                className="p-4 rounded-2xl bg-unelma-orange text-unelma-navy font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg active:scale-95"
                                            >
                                                Test Beli
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCurrentPrice(item);
                                                    setIsPriceModalOpen(true);
                                                }}
                                                className="flex-1 p-4 rounded-2xl bg-unelma-navy text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#051163] transition-all shadow-lg active:scale-95"
                                            >
                                                Edit Paket
                                            </button>
                                            <button
                                                onClick={() => handleDeletePrice(item.id)}
                                                className="p-4 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )
                    }

                    {
                        activeTab === 'produk' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {produk.map((item, i) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all flex flex-col"
                                    >
                                        <div className="aspect-video bg-slate-50 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-unelma-navy/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px] z-10">
                                                <div className="flex gap-2 scale-50 group-hover:scale-100 transition-all duration-300">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentProduk(item);
                                                            setIsProdukModalOpen(true);
                                                        }}
                                                        className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-unelma-navy hover:bg-unelma-orange transition-all shadow-xl"
                                                    >
                                                        <Edit2 size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduk(item.id)}
                                                        className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-unelma-navy/5">
                                                    <ImageIcon size={64} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-10 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-xl font-black text-unelma-navy tracking-tight uppercase leading-tight line-clamp-1">{item.name}</h4>
                                                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Ready</div>
                                            </div>
                                            <p className="text-slate-400 font-bold mb-8 line-clamp-2 text-xs leading-relaxed uppercase tracking-tight flex-1">{item.description}</p>
                                            <div className="flex items-center justify-between pt-6 border-t border-slate-50 gap-4">
                                                <button
                                                    onClick={() => handleCheckout({ id: item.id, type: 'produk', name: item.name, price: item.price })}
                                                    className="px-4 py-2 rounded-xl bg-unelma-orange text-unelma-navy font-black text-[9px] uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg active:scale-95"
                                                >
                                                    Test Beli
                                                </button>
                                                <span className="text-xl font-black text-unelma-orange">Rp {item.price?.toLocaleString('id-ID') || 0}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )
                    }
                </div >
            )}

            {/* Layanan Modal */}
            <AnimatePresence>
                {isLayananModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-unelma-navy/60 backdrop-blur-sm" onClick={() => setIsLayananModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative z-10 shadow-2xl">
                            <button onClick={() => setIsLayananModalOpen(false)} className="absolute top-8 right-8 text-unelma-navy/20 hover:text-unelma-navy transition-all"><X size={24} /></button>
                            <h3 className="text-2xl font-black text-unelma-navy mb-8 tracking-tight uppercase">Detail Layanan</h3>
                            <form onSubmit={handleSaveLayanan} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Judul</label>
                                    <input value={currentLayanan.title} onChange={e => setCurrentLayanan({ ...currentLayanan, title: e.target.value })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Deskripsi</label>
                                    <textarea value={currentLayanan.description} onChange={e => setCurrentLayanan({ ...currentLayanan, description: e.target.value })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-medium text-unelma-navy h-32" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Icon</label>
                                    <select value={currentLayanan.icon_name} onChange={e => setCurrentLayanan({ ...currentLayanan, icon_name: e.target.value })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy">
                                        <option value="BookOpen">Buku</option>
                                        <option value="Users">Komunitas</option>
                                        <option value="Star">Bintang</option>
                                        <option value="MessageCircle">Chat</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-unelma w-full py-5 rounded-2xl font-black flex items-center justify-center gap-2 mt-4"><Save size={20} /> SIMPAN LAYANAN</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Price Modal */}
            <AnimatePresence>
                {isPriceModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-unelma-navy/60 backdrop-blur-sm" onClick={() => setIsPriceModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <button onClick={() => setIsPriceModalOpen(false)} className="absolute top-8 right-8 text-unelma-navy/20 hover:text-unelma-navy transition-all"><X size={24} /></button>
                            <h3 className="text-2xl font-black text-unelma-navy mb-8 tracking-tight uppercase">Detail Paket</h3>
                            <form onSubmit={handleSavePrice} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Nama Paket</label>
                                    <input value={currentPrice.name} onChange={e => setCurrentPrice({ ...currentPrice, name: e.target.value })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Harga (Rp)</label>
                                        <input
                                            type="number"
                                            value={isNaN(currentPrice.price as number) ? '' : currentPrice.price}
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                setCurrentPrice({ ...currentPrice, price: isNaN(val) ? 0 : val });
                                            }}
                                            className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Periode</label>
                                        <input value={currentPrice.period} onChange={e => setCurrentPrice({ ...currentPrice, period: e.target.value })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy" placeholder="bulan / tahun" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Kategori</label>
                                        <select value={currentPrice.category} onChange={e => setCurrentPrice({ ...currentPrice, category: e.target.value })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy">
                                            <option value="cbt">Unelma CBT</option>
                                            <option value="to">Paket TO</option>
                                            <option value="bimbingan">Bimbingan</option>
                                            <option value="custom">Aplikasi Custom</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Durasi (Hari)</label>
                                        <input
                                            type="number"
                                            value={currentPrice.duration_days || 30}
                                            onChange={e => setCurrentPrice({ ...currentPrice, duration_days: parseInt(e.target.value) || 30 })}
                                            className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-2">
                                    <input type="checkbox" id="popular" checked={currentPrice.is_popular} onChange={e => setCurrentPrice({ ...currentPrice, is_popular: e.target.checked })} className="w-5 h-5 accent-unelma-orange" />
                                    <label htmlFor="popular" className="text-sm font-bold text-unelma-navy/70 uppercase">Tandai sebagai Populer</label>
                                </div>
                                <button type="submit" className="btn-unelma w-full py-5 rounded-2xl font-black flex items-center justify-center gap-2 mt-4"><Save size={20} /> SIMPAN PAKET</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Produk Modal */}
            <AnimatePresence>
                {isProdukModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-unelma-navy/60 backdrop-blur-sm" onClick={() => setIsProdukModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <button onClick={() => setIsProdukModalOpen(false)} className="absolute top-8 right-8 text-unelma-navy/20 hover:text-unelma-navy transition-all"><X size={24} /></button>
                            <h3 className="text-2xl font-black text-unelma-navy mb-8 tracking-tight uppercase">Detail Produk</h3>
                            <form onSubmit={handleSaveProduk} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Nama Produk</label>
                                    <input value={currentProduk.name} onChange={e => setCurrentProduk({ ...currentProduk, name: e.target.value })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Harga Produk</label>
                                    <input
                                        type="number"
                                        value={isNaN(currentProduk.price as number) ? '' : currentProduk.price}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setCurrentProduk({ ...currentProduk, price: isNaN(val) ? 0 : val });
                                        }}
                                        className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Image URL</label>
                                    <input value={currentProduk.image_url} onChange={e => setCurrentProduk({ ...currentProduk, image_url: e.target.value })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-bold text-unelma-navy" placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Deskripsi Produk</label>
                                    <textarea value={currentProduk.description} onChange={e => setCurrentProduk({ ...currentProduk, description: e.target.value })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-medium text-unelma-navy h-32" required />
                                </div>
                                <button type="submit" className="btn-unelma w-full py-5 rounded-2xl font-black flex items-center justify-center gap-2 mt-4"><Save size={20} /> SIMPAN PRODUK</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};


export default AdminDashboard;
