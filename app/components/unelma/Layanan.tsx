"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { LayananItem, fetchLayanan, getIcon } from '../../lib/content';

const Layanan = () => {
    const [layanan, setLayanan] = useState<LayananItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchLayanan();
            if (data && data.length > 0) {
                setLayanan(data);
            }
            setIsLoading(false);
        };
        loadData();
    }, []);

    return (
        <section id="layanan" className="relative py-32 bg-transparent overflow-hidden">
            {/* Smooth Mixed Blurs */}
            <div className="gaussian-blur blur-navy-white w-[600px] h-[600px] bottom-[10%] left-[-5%]"></div>
            <div className="gaussian-blur blur-orange-white w-[400px] h-[400px] top-[20%] right-[5%] opacity-10"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center space-x-2 px-6 py-2 rounded-full glass-orange text-unelma-orange text-sm font-bold mb-8"
                    >
                        <Heart size={16} fill="currentColor" />
                        <span>Pilihan Terbaik</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-black text-unelma-navy mb-8 tracking-tighter"
                    >
                        LAYANAN <span className="text-gradient-warm">KAMI.</span>
                    </motion.h2>
                    <p className="text-unelma-navy/60 text-xl font-medium">
                        Berbagai layanan pendidikan digital yang dirancang untuk mendukung tumbuh kembang setiap siswa.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-unelma-orange/20 border-t-unelma-orange rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {layanan.map((feature) => (
                            <div
                                key={feature.id}
                                className="glass-warm p-10 rounded-[2.5rem] hover:bg-white transition-all duration-500 group border-unelma-navy/5 shadow-sm hover:shadow-xl"
                            >
                                <div className="w-16 h-16 bg-unelma-orange/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 soft-shadow">
                                    {getIcon(feature.icon_name)}
                                </div>
                                <h3 className="text-2xl font-bold text-unelma-navy mb-4 tracking-tight">{feature.title}</h3>
                                <p className="text-unelma-navy/60 leading-relaxed font-medium">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Layanan;
