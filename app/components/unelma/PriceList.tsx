"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { PricelistItem, fetchPricelist } from '@/lib/unelma';
import { createTransactionAction } from '@/app/actions/payment';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

declare global {
    interface Window {
        snap: any;
    }
}

const PriceList = () => {
    const [prices, setPrices] = useState<PricelistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchPricelist();
            if (data && data.length > 0) {
                setPrices(data);
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

    const handleCheckout = async (item: PricelistItem) => {
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
                type: 'pricelist',
                name: item.name,
                price: item.price
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

    if (!isLoading && prices.length === 0) return null;

    return (
        <section id="pricing" className="relative py-32 bg-transparent overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-6xl font-black text-unelma-navy mb-8 tracking-tighter">
                        HARGA <span className="text-gradient-warm">LAYANAN.</span>
                    </h2>
                    <p className="text-unelma-navy/60 text-xl font-medium">
                        Pilih paket yang paling sesuai dengan kebutuhan institusi pendidikan Anda.
                    </p>

                    {/* Category Selector */}
                    <div className="flex flex-wrap justify-center gap-4 mt-12">
                        {[
                            { id: 'all', label: 'Semua Paket' },
                            { id: 'cbt', label: 'Unelma CBT' },
                            { id: 'to', label: 'Paket TO' },
                            { id: 'bimbingan', label: 'Bimbingan' },
                            { id: 'custom', label: 'Aplikasi Custom' }
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat.id
                                    ? 'bg-unelma-navy text-white shadow-lg'
                                    : 'glass-warm text-unelma-navy/40 hover:text-unelma-navy'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {prices
                        .filter(p => activeCategory === 'all' || p.category === activeCategory || (!p.category && activeCategory === 'cbt'))
                        .map((plan) => (
                            <div
                                key={plan.id}
                                className={`glass-warm p-10 rounded-[3rem] relative flex flex-col transition-all duration-500 hover:shadow-2xl ${plan.is_popular ? 'border-2 border-unelma-orange shadow-xl scale-105 z-10' : 'border-unelma-navy/5'}`}
                            >
                                {plan.is_popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-unelma-orange text-unelma-navy px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg">
                                        Paling Populer
                                    </div>
                                )}

                                <div className="mb-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-2xl font-black text-unelma-navy tracking-tighter uppercase leading-tight">{plan.name}</h3>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="bg-unelma-navy/5 text-unelma-navy px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-unelma-navy/5 whitespace-nowrap">
                                                {plan.duration_days} HARI
                                            </span>
                                            <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100 whitespace-nowrap">
                                                {plan.category?.toUpperCase() || 'CBT'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold text-unelma-navy/40">Rp</span>
                                        <span className="text-4xl font-black text-unelma-navy tracking-tighter">
                                            {plan.price.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-unelma-navy/40 font-bold">/{plan.period}</span>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-12 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-unelma-navy/60 font-medium text-sm">
                                            <div className="w-5 h-5 rounded-full bg-unelma-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={12} className="text-unelma-orange" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleCheckout(plan)}
                                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${plan.is_popular ? 'btn-unelma' : 'bg-unelma-navy text-white hover:bg-unelma-navy-light'}`}
                                >
                                    <Zap size={20} />
                                    PILIH PAKET
                                </button>
                            </div>
                        ))}
                </div>
            </div>
        </section>
    );
};

export default PriceList;
