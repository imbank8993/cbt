"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Target, Heart } from 'lucide-react';

const AboutUnelma = () => {
    return (
        <section id="about" className="relative py-32 bg-transparent overflow-hidden">
            {/* Smooth Mixed Blurs */}
            <div className="gaussian-blur blur-navy-white w-[800px] h-[600px] bottom-[-10%] right-[-10%] opacity-20"></div>
            <div className="gaussian-blur blur-orange-white w-[500px] h-[500px] top-[10%] left-[-5%] opacity-15"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-black text-unelma-navy leading-tight mb-10 tracking-tighter">
                            ABOUT <br />
                            <span className="text-gradient-warm">UNELMA.</span>
                        </h2>
                        <p className="text-xl text-unelma-navy/70 font-medium leading-relaxed mb-12">
                            Unelma bukan sekadar platform belajar online. Kami adalah wadah aspirasi bagi setiap anak bangsa untuk berani bermimpi dan bertumbuh dalam ekosistem yang suportif.
                        </p>

                        <div className="space-y-8">
                            {[
                                { icon: <ShieldCheck className="text-unelma-orange" />, title: 'Visi Inklusif', desc: 'Menjangkau setiap pelosok negeri dengan pendidikan berkualitas.' },
                                { icon: <Target className="text-unelma-orange" />, title: 'Misi Berkelanjutan', desc: 'Memberdayakan talenta lokal untuk menjadi tutor kelas dunia.' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 items-start">
                                    <div className="w-12 h-12 glass-warm rounded-xl flex items-center justify-center shrink-0 border border-unelma-navy/5">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-unelma-navy font-bold text-xl mb-2">{item.title}</h4>
                                        <p className="text-unelma-navy/50">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="relative"
                    >
                        <div className="aspect-square glass-warm rounded-[4rem] p-4 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-unelma-orange/20 to-transparent"></div>
                            <div className="w-full h-full bg-white/40 rounded-[3.5rem] border border-unelma-navy/5 flex items-center justify-center p-12 shadow-sm">
                                <div className="text-center group-hover:scale-110 transition-transform duration-700">
                                    <div className="w-24 h-24 bg-unelma-orange rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-unelma-orange/40">
                                        <Heart size={48} className="text-unelma-navy" fill="currentColor" />
                                    </div>
                                    <span className="text-4xl font-black text-unelma-navy tracking-tighter">WE CARE.</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AboutUnelma;
