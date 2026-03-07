"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Heart, Users, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
    return (
        <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-transparent">
            {/* Smooth Mixed Blurs */}
            <div className="gaussian-blur blur-navy-white w-[800px] h-[800px] top-[-20%] left-[-10%] animate-pulse-warm"></div>
            <div className="gaussian-blur blur-orange-white w-[600px] h-[600px] bottom-[-10%] right-[-5%] opacity-20"></div>
            <div className="gaussian-blur blur-navy-white w-[400px] h-[400px] top-[10%] right-[10%] opacity-15"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-8xl font-black text-unelma-navy leading-[0.9] mb-8 tracking-tighter"
                    >
                        SOLUSI DIGITAL <br />
                        <span className="text-gradient-warm">TERPADU.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl md:text-2xl text-unelma-navy/60 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
                    >
                        Partner strategis untuk sukses masuk MAN Insan Cendekia, penyedia aplikasi CBT profesional, dan ekosistem layanan digital madrasah terpercaya.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <Link href="/login">
                            <button className="btn-unelma px-10 py-5 rounded-2xl text-lg flex items-center gap-3 w-full sm:w-auto justify-center group">
                                <span>Selengkapnya</span>
                                <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </Link>
                        <button className="px-10 py-5 rounded-2xl text-lg font-bold border-2 border-unelma-navy/10 text-unelma-navy hover:bg-unelma-navy/5 transition-all w-full sm:w-auto flex items-center justify-center gap-3">
                            <ShoppingCart size={22} />
                            <span>Pesan Layanan</span>
                        </button>
                    </motion.div>
                </div>

            </div>
        </section>
    );
};

export default Hero;
