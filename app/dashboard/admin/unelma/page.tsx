"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, List, Settings, LogOut, Plus, Edit2, Trash2,
    Heart, X, Save, Tag, DollarSign, Clock, Layers, Globe, Star, MessageCircle, BookOpen
} from 'lucide-react';
import {
    LayananItem, PricelistItem, getIcon,
    fetchLayanan, saveLayanan, updateLayanan, deleteLayanan,
    fetchPricelist, savePricelist, updatePricelist, deletePricelist
} from '@/lib/unelma';

const UnelmaManagement = () => {
    const [layanan, setLayanan] = useState<LayananItem[]>([]);
    const [prices, setPrices] = useState<PricelistItem[]>([]);
    const [activeTab, setActiveTab] = useState('layanan');
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isLayananModalOpen, setIsLayananModalOpen] = useState(false);
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [currentLayanan, setCurrentLayanan] = useState<Partial<LayananItem>>({});
    const [currentPrice, setCurrentPrice] = useState<Partial<PricelistItem>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [lData, pData] = await Promise.all([fetchLayanan(), fetchPricelist()]);
            setLayanan(lData || []);
            setPrices(pData || []);
        } catch (err) {
            console.error(err);
        }
        setIsLoading(false);
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

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="text-primary" size={20} />
                        <span className="text-xs font-black text-primary uppercase tracking-widest">Unelma.Id CMS</span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">
                        {activeTab === 'layanan' ? 'Manajemen Layanan' : 'Manajemen Price List'}
                    </h2>
                    <p className="text-slate-400 font-medium">Kelola konten landing page Unelma langsung dari sini.</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab(activeTab === 'layanan' ? 'pricing' : 'layanan')}
                        className="px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700"
                    >
                        Pindah ke {activeTab === 'layanan' ? 'Price List' : 'Layanan'}
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab === 'layanan') {
                                setCurrentLayanan({ title: '', description: '', icon_name: 'BookOpen' });
                                setIsLayananModalOpen(true);
                            } else {
                                setCurrentPrice({ name: '', price: 0, period: 'bulan', features: [], is_popular: false });
                                setIsPriceModalOpen(true);
                            }
                        }}
                        className="px-8 py-3 bg-primary text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary transition-all"
                    >
                        <Plus size={20} />
                        TAMBAH {activeTab === 'layanan' ? 'LAYANAN' : 'PAKET'}
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {activeTab === 'layanan' && (
                        layanan.map((item) => (
                            <motion.div
                                layout
                                key={item.id}
                                className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center justify-between group hover:border-primary/50 transition-all"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary-light border border-primary/20">
                                        {getIcon(item.icon_name, 24)}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-1 tracking-tight">{item.title}</h4>
                                        <p className="text-slate-400 text-sm font-medium max-w-md line-clamp-1">{item.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setCurrentLayanan(item);
                                            setIsLayananModalOpen(true);
                                        }}
                                        className="p-3 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-primary-light transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLayanan(item.id)}
                                        className="p-3 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}

                    {activeTab === 'pricing' && (
                        prices.map((item) => (
                            <div key={item.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center justify-between group hover:border-primary/50 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                        <DollarSign size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-lg font-bold text-white tracking-tight">{item.name}</h4>
                                            {item.is_popular && <span className="text-[10px] font-black bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded-full uppercase">Populer</span>}
                                        </div>
                                        <p className="text-slate-400 text-sm font-bold">Rp {item.price.toLocaleString('id-ID')} / {item.period}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setCurrentPrice(item);
                                            setIsPriceModalOpen(true);
                                        }}
                                        className="p-3 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-primary-light transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePrice(item.id)}
                                        className="p-3 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modals are simplified for brevity as per instructions, using basic UI logic */}
            <AnimatePresence>
                {isLayananModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsLayananModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0F172A] w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 border border-slate-800 shadow-2xl">
                            <button onClick={() => setIsLayananModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                            <h3 className="text-2xl font-black text-white mb-8 tracking-tight uppercase italic">Detail Layanan</h3>
                            <form onSubmit={handleSaveLayanan} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Judul</label>
                                    <input value={currentLayanan.title} onChange={e => setCurrentLayanan({ ...currentLayanan, title: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-white" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Deskripsi</label>
                                    <textarea value={currentLayanan.description} onChange={e => setCurrentLayanan({ ...currentLayanan, description: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-300 h-32" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Icon</label>
                                    <select value={currentLayanan.icon_name} onChange={e => setCurrentLayanan({ ...currentLayanan, icon_name: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-white">
                                        <option value="BookOpen">Buku</option>
                                        <option value="Users">Komunitas</option>
                                        <option value="Star">Bintang</option>
                                        <option value="MessageCircle">Chat</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-5 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-primary transition-all shadow-lg shadow-primary/20"><Save size={20} /> SIMPAN DATA</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isPriceModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsPriceModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0F172A] w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 border border-slate-800 shadow-2xl">
                            <button onClick={() => setIsPriceModalOpen(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                            <h3 className="text-2xl font-black text-white mb-8 tracking-tight uppercase italic">Detail Paket Harga</h3>
                            <form onSubmit={handleSavePrice} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Nama Paket</label>
                                    <input value={currentPrice.name} onChange={e => setCurrentPrice({ ...currentPrice, name: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-white" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Harga (Rp)</label>
                                        <input type="number" value={currentPrice.price} onChange={e => setCurrentPrice({ ...currentPrice, price: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-white" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Periode</label>
                                        <input value={currentPrice.period} onChange={e => setCurrentPrice({ ...currentPrice, period: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-white" placeholder="bulan" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2 text-wrap">Fitur (Pisahkan dengan koma)</label>
                                    <textarea value={currentPrice.features?.join(', ')} onChange={e => setCurrentPrice({ ...currentPrice, features: e.target.value.split(',').map(f => f.trim()) })} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-300 h-24" placeholder="Fitur 1, Fitur 2, ..." required />
                                </div>
                                <div className="flex items-center gap-3 px-2">
                                    <input type="checkbox" id="popular" checked={currentPrice.is_popular} onChange={e => setCurrentPrice({ ...currentPrice, is_popular: e.target.checked })} className="w-5 h-5 accent-primary" />
                                    <label htmlFor="popular" className="text-xs font-bold text-slate-400 uppercase">Tandai sebagai Populer</label>
                                </div>
                                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"><Save size={20} /> SIMPAN PAKET</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UnelmaManagement;
