"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { PricelistItem, fetchPricelist } from '../../lib/content';

const PriceList = () => {
    const [prices, setPrices] = useState<PricelistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchPricelist();
            if (data && data.length > 0) {
                setPrices(data);
            }
            setIsLoading(false);
        };
        loadData();
    }, []);

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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {prices.map((plan) => (
                        <div
                            key={plan.id}
                            className={`glass-warm p-10 rounded-[3rem] relative flex flex-col transition-all duration-500 hover:shadow-2xl ${plan.is_popular ? 'border-2 border-unelma-orange shadow-xl scale-105 z-10' : 'border-unelma-navy/5'}`}
                        >
                            {plan.is_popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-unelma-orange text-unelma-navy px-6 py-2 rounded-full text-sm font-black tracking-widest uppercase shadow-lg">
                                    Paling Populer
                                </div>
                            )}

                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-unelma-navy mb-4 tracking-tighter uppercase">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-unelma-navy/40">Rp</span>
                                    <span className="text-5xl font-black text-unelma-navy tracking-tighter">
                                        {plan.price.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-unelma-navy/40 font-bold">/{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-12 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-unelma-navy/60 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-unelma-orange/20 flex items-center justify-center shrink-0">
                                            <Check size={12} className="text-unelma-orange" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${plan.is_popular ? 'btn-unelma' : 'bg-unelma-navy text-white hover:bg-unelma-navy-light'}`}>
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
