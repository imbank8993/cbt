"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Heart, Users } from 'lucide-react';
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
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center space-x-2 px-6 py-2 rounded-full glass-warm border-unelma-orange/20 text-unelma-orange text-sm font-bold mb-10"
                    >
                        <Heart size={16} fill="currentColor" />
                        <span>Bimbingan Belajar dengan Nuansa Kekeluargaan</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-8xl font-black text-unelma-navy leading-[0.9] mb-8 tracking-tighter"
                    >
                        BELAJAR JADI <br />
                        <span className="text-gradient-warm">LEBIH NYAMAN.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl md:text-2xl text-unelma-navy/60 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
                    >
                        Unelma menyediakan ekosistem pembelajaran online yang suportif, membuat setiap siswa merasa seperti di rumah sendiri saat mengejar impian.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <Link href="/login">
                            <button className="btn-unelma px-10 py-5 rounded-2xl text-lg flex items-center gap-3 w-full sm:w-auto justify-center group">
                                <span>Mulai Sekarang</span>
                                <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </Link>
                        <button className="px-10 py-5 rounded-2xl text-lg font-bold border-2 border-unelma-navy/10 text-unelma-navy hover:bg-unelma-navy/5 transition-all w-full sm:w-auto flex items-center justify-center gap-3">
                            <Users size={22} />
                            <span>Komunitas Kami</span>
                        </button>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="mt-24 relative"
                >
                    <div className="max-w-5xl mx-auto glass-warm rounded-[3rem] p-6 soft-shadow relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-unelma-orange/10 via-transparent to-transparent pointer-events-none"></div>
                        <div className="aspect-[21/9] rounded-[2rem] bg-white/40 border border-unelma-navy/5 flex items-center justify-center p-12 overflow-hidden shadow-sm">
                            <div className="grid grid-cols-4 gap-8 w-full opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-32 glass-orange rounded-2xl animate-float" style={{ animationDelay: `${i * 0.2}s` }}></div>
                                ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-unelma-orange rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-2xl shadow-unelma-orange/50">
                                        <Sparkles size={40} className="text-unelma-navy" />
                                    </div>
                                    <p className="text-unelma-navy font-bold tracking-widest uppercase">E-Learning Reimagined</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
