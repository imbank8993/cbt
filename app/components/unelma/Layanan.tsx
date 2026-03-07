"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import { LayananItem, fetchLayanan, getIcon } from '@/lib/unelma';
import { createTransactionAction } from '@/app/actions/payment';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

declare global {
    interface Window {
        snap: any;
    }
}

const Layanan = () => {
    const [layanan, setLayanan] = useState<LayananItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<'bimbel' | 'cbt' | 'digital'>('bimbel');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchLayanan();
            if (data && data.length > 0) {
                setLayanan(data);
            }
            setIsLoading(false);
        };
        loadData();

        // Load Midtrans Snap Script
        const script = document.createElement('script');
        script.src = process.env.MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handleCheckout = async (item: LayananItem) => {
        try {
            let userData: { userId?: string, email: string, fullName: string, organizationName?: string };
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Prompt for Guest Info using SweetAlert2
                const { value: formValues } = await Swal.fire({
                    title: 'Data Pembelian',
                    html:
                        '<div class="flex flex-col gap-4 p-4">' +
                        '<input id="swal-input-name" class="swal2-input !m-0" placeholder="Nama Lengkap">' +
                        '<input id="swal-input-email" class="swal2-input !m-0" placeholder="Email (Wajib)">' +
                        '<input id="swal-input-org" class="swal2-input !m-0" placeholder="Nama Organisasi / Sekolah">' +
                        '</div>',
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonText: 'Lanjut Pembayaran',
                    confirmButtonColor: '#ff6b00',
                    preConfirm: () => {
                        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
                        const email = (document.getElementById('swal-input-email') as HTMLInputElement).value;
                        const orgName = (document.getElementById('swal-input-org') as HTMLInputElement).value;
                        if (!name || !email || !orgName) {
                            Swal.showValidationMessage('Nama, Email, dan Nama Organisasi wajib diisi!');
                        } else if (!email.includes('@')) {
                            Swal.showValidationMessage('Email tidak valid!');
                        }
                        return { name, email, orgName };
                    }
                });

                if (formValues) {
                    userData = {
                        email: formValues.email,
                        fullName: formValues.name,
                        organizationName: formValues.orgName
                    };
                } else {
                    return; // User cancelled
                }
            } else {
                userData = {
                    userId: user.id,
                    email: user.email!,
                    fullName: user.user_metadata?.full_name || 'User'
                };
            }

            const res = await createTransactionAction({
                id: item.id,
                type: 'layanan',
                name: item.title,
                price: 50000 // Fixed test price for Layanan
            }, userData);

            if (res.success && res.token) {
                window.snap.pay(res.token, {
                    onSuccess: (result: any) => {
                        if (!userData.userId) {
                            Swal.fire({
                                title: 'Pembayaran Berhasil!',
                                html: `Akun Proktor Anda sedang dibuat.<br>Silakan login menggunakan:<br><b>Email:</b> ${userData.email}<br><b>Password:</b> Unelma123`,
                                icon: 'success'
                            });
                        } else {
                            Swal.fire('Berhasil!', 'Pembayaran Berhasil!', 'success');
                        }
                    },
                    onPending: (result: any) => {
                        Swal.fire('Pending', 'Pembayaran Menunggu Konfirmasi...', 'info');
                    },
                    onError: (result: any) => {
                        Swal.fire('Gagal', 'Pembayaran Gagal!', 'error');
                    }
                });
            } else {
                Swal.fire('Error', 'Gagal membuat transaksi: ' + res.error, 'error');
            }
        } catch (error: any) {
            Swal.fire('Error', 'Terjadi kesalahan: ' + error.message, 'error');
        }
    };

    return (
        <section id="layanan" className="relative py-32 bg-transparent overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center space-x-2 px-6 py-2 rounded-full glass-warm border-unelma-navy/10 text-unelma-navy text-sm font-bold mb-8"
                    >
                        <Heart size={16} fill="currentColor" />
                        <span>Ekosistem Pendidikan</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-black text-unelma-navy mb-8 tracking-tighter"
                    >
                        LAYANAN <span className="text-gradient-warm">UNGGULAN.</span>
                    </motion.h2>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap justify-center gap-4 mt-12">
                        {[
                            { id: 'bimbel', label: 'Bimbingan Belajar' },
                            { id: 'cbt', label: 'Unelma CBT' },
                            { id: 'digital', label: 'Layanan Digital' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveCategory(tab.id as any)}
                                className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${activeCategory === tab.id
                                    ? 'bg-unelma-navy text-white shadow-xl shadow-unelma-navy/20 scale-105'
                                    : 'glass-warm text-unelma-navy/60 hover:text-unelma-navy'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-unelma-orange/20 border-t-unelma-orange rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <motion.div
                        key={activeCategory}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {layanan.filter(item => (item.category || 'digital') === activeCategory).length > 0 ? (
                            layanan.filter(item => (item.category || 'digital') === activeCategory).map((feature) => (
                                <div
                                    key={feature.id}
                                    className="glass-warm p-10 rounded-[2.5rem] hover:bg-white transition-all duration-500 group border-unelma-navy/5 shadow-sm hover:shadow-xl flex flex-col items-center text-center"
                                >
                                    <div className="w-20 h-20 bg-unelma-orange/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 soft-shadow">
                                        {getIcon(feature.icon_name, 32)}
                                    </div>
                                    <h3 className="text-2xl font-bold text-unelma-navy mb-4 tracking-tight">{feature.title}</h3>
                                    <p className="text-unelma-navy/60 leading-relaxed font-medium mb-8 flex-1">
                                        {feature.description}
                                    </p>
                                    <div className="w-full space-y-3">
                                        <button
                                            onClick={() => {
                                                const pricingSection = document.getElementById('pricing');
                                                if (pricingSection) {
                                                    pricingSection.scrollIntoView({ behavior: 'smooth' });
                                                }
                                            }}
                                            className="w-full py-4 rounded-xl glass-warm border-unelma-navy/10 text-unelma-navy font-black text-[10px] uppercase tracking-widest hover:bg-unelma-navy hover:text-white transition-all active:scale-95"
                                        >
                                            Selengkapnya
                                        </button>
                                        <button
                                            onClick={() => handleCheckout(feature)}
                                            className="w-full py-4 rounded-xl bg-unelma-orange text-unelma-navy font-bold flex items-center justify-center gap-2 hover:bg-orange-500 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                                        >
                                            <ShoppingCart size={18} />
                                            PESAN SEKARANG
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-unelma-navy/10">
                                <p className="text-unelma-navy/40 font-bold text-xl uppercase tracking-widest">Segera Hadir</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default Layanan;
