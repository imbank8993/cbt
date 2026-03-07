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

const AdminDashboard = () => {
    const [layanan, setLayanan] = useState<LayananItem[]>([]);
    const [prices, setPrices] = useState<PricelistItem[]>([]);
    const [produk, setProduk] = useState<ProdukItem[]>([]);
    const [activeTab, setActiveTab] = useState('layanan');
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
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [lData, pData, prData] = await Promise.all([fetchLayanan(), fetchPricelist(), fetchProduk()]);
        setLayanan(lData);
        setPrices(pData);
        setProduk(prData);
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
        <div className="min-h-screen bg-[#f0f4f8] flex font-['Outfit']">
            {/* Sidebar */}
            <aside className="w-80 bg-unelma-navy p-8 flex flex-col hidden lg:flex fixed h-full z-10">
                <div className="flex items-center gap-3 mb-16">
                    <div className="w-10 h-10 bg-unelma-orange rounded-xl flex items-center justify-center">
                        <span className="text-unelma-navy font-black text-xl">U</span>
                    </div>
                    <span className="text-xl font-black text-white tracking-tighter">
                        UNELMA<span className="text-unelma-orange">.ID</span>
                    </span>
                </div>

                <nav className="flex-1 space-y-4">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'dashboard' ? 'bg-unelma-orange text-unelma-navy' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('layanan')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'layanan' ? 'bg-unelma-orange text-unelma-navy' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        <List size={20} />
                        Layanan
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'pricing' ? 'bg-unelma-orange text-unelma-navy' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        <DollarSign size={20} />
                        Price List
                    </button>
                    <button
                        onClick={() => setActiveTab('produk')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'produk' ? 'bg-unelma-orange text-unelma-navy' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        <Package size={20} />
                        Produk
                    </button>
                </nav>

                <div className="pt-8 border-t border-white/10">
                    <Link href="/admin/login" className="flex items-center gap-4 px-6 py-4 rounded-2xl text-white/40 font-bold hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <LogOut size={20} />
                        Keluar
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-80 p-8 md:p-12 min-h-screen">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h2 className="text-3xl font-black text-unelma-navy tracking-tight uppercase">
                            {activeTab === 'layanan' ? 'Manajemen Layanan' :
                                activeTab === 'pricing' ? 'Manajemen Price List' :
                                    activeTab === 'produk' ? 'Manajemen Produk' : 'Informasi Panel'}
                        </h2>
                        <p className="text-unelma-navy/40 font-medium">Kelola konten landing page secara real-time.</p>
                    </div>
                    {activeTab !== 'dashboard' && (
                        <button
                            onClick={() => {
                                if (activeTab === 'layanan') {
                                    setCurrentLayanan({ title: '', description: '', icon_name: 'BookOpen' });
                                    setIsLayananModalOpen(true);
                                } else if (activeTab === 'pricing') {
                                    setCurrentPrice({ name: '', price: 0, period: 'bulan', features: [], is_popular: false });
                                    setIsPriceModalOpen(true);
                                } else if (activeTab === 'produk') {
                                    setCurrentProduk({ name: '', description: '', image_url: '', price: 0 });
                                    setIsProdukModalOpen(true);
                                }
                            }}
                            className="btn-unelma px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-unelma-orange/20"
                        >
                            <Plus size={20} />
                            TAMBAH {activeTab === 'layanan' ? 'LAYANAN' : activeTab === 'pricing' ? 'PAKET' : 'PRODUK'}
                        </button>
                    )}
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-unelma-orange/20 border-t-unelma-orange rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'layanan' && (
                            <div className="grid grid-cols-1 gap-6">
                                {layanan.map((item) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className="bg-white p-8 rounded-3xl shadow-sm border border-unelma-navy/5 flex items-center justify-between group hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className="w-16 h-16 bg-unelma-orange/10 rounded-2xl flex items-center justify-center">
                                                {getIcon(item.icon_name)}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-unelma-navy mb-1 tracking-tight">{item.title}</h4>
                                                <p className="text-unelma-navy/40 font-medium max-w-md">{item.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setCurrentLayanan(item);
                                                    setIsLayananModalOpen(true);
                                                }}
                                                className="p-4 rounded-xl hover:bg-blue-50 text-unelma-navy/20 hover:text-blue-600 transition-all"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLayanan(item.id)}
                                                className="p-4 rounded-xl hover:bg-red-50 text-unelma-navy/20 hover:text-red-600 transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'pricing' && (
                            <div className="grid grid-cols-1 gap-6">
                                {prices.map((item) => (
                                    <div key={item.id} className="bg-white p-8 rounded-3xl shadow-sm border border-unelma-navy/5 flex items-center justify-between">
                                        <div className="flex items-center gap-8">
                                            <div className="w-16 h-16 bg-unelma-navy/5 rounded-2xl flex items-center justify-center text-unelma-navy">
                                                <DollarSign size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="text-xl font-bold text-unelma-navy tracking-tight">{item.name}</h4>
                                                    {item.is_popular && <span className="text-[10px] font-black bg-unelma-orange text-unelma-navy px-2 py-0.5 rounded-full uppercase">Populer</span>}
                                                </div>
                                                <p className="text-unelma-navy/40 font-bold">Rp {item.price.toLocaleString('id-ID')} / {item.period}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setCurrentPrice(item);
                                                    setIsPriceModalOpen(true);
                                                }}
                                                className="p-4 rounded-xl hover:bg-blue-50 text-unelma-navy/20 hover:text-blue-600 transition-all"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePrice(item.id)}
                                                className="p-4 rounded-xl hover:bg-red-50 text-unelma-navy/20 hover:text-red-600 transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'produk' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {produk.map((item) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className="bg-white rounded-3xl shadow-sm border border-unelma-navy/5 overflow-hidden group hover:shadow-md transition-all flex flex-col"
                                    >
                                        <div className="aspect-[4/3] bg-slate-50 relative border-b border-unelma-navy/5">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-unelma-navy/20">
                                                    <ImageIcon size={48} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <h4 className="text-xl font-bold text-unelma-navy mb-2 tracking-tight line-clamp-1">{item.name}</h4>
                                            <p className="text-unelma-navy/40 font-medium mb-4 line-clamp-2 text-sm flex-1">{item.description}</p>
                                            <p className="text-unelma-orange font-black mb-6">Rp {item.price?.toLocaleString('id-ID') || 0}</p>
                                            <div className="flex gap-2 border-t border-unelma-navy/5 pt-4">
                                                <button
                                                    onClick={() => {
                                                        setCurrentProduk(item);
                                                        setIsProdukModalOpen(true);
                                                    }}
                                                    className="flex-1 p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Edit2 size={16} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduk(item.id)}
                                                    className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold text-sm transition-all flex items-center justify-center"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

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
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-unelma-navy/40 uppercase tracking-widest ml-2">Fitur (Pisahkan dengan koma)</label>
                                    <textarea value={currentPrice.features?.join(', ')} onChange={e => setCurrentPrice({ ...currentPrice, features: e.target.value.split(',').map(f => f.trim()) })} className="w-full bg-[#f8faff] border border-unelma-navy/5 rounded-2xl p-4 focus:ring-2 focus:ring-unelma-orange/20 outline-none font-medium text-unelma-navy h-24" placeholder="Fitur 1, Fitur 2, ..." required />
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
        </div>
    );
};


export default AdminDashboard;
