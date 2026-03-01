"use client";
import React from 'react';
import { motion } from 'framer-motion';

const Event = () => {
    return (
        <section id="event" className="relative py-32 overflow-hidden bg-transparent">
            {/* Smooth Mixed Blurs */}
            <div className="gaussian-blur blur-navy-white w-[800px] h-[800px] top-[50%] left-[-20%] translate-y-[-50%] animate-pulse-warm"></div>
            <div className="gaussian-blur blur-orange-white w-[600px] h-[600px] bottom-[-20%] right-[-10%] opacity-20"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="glass-warm border-unelma-navy/5 rounded-[4rem] p-12 md:p-24 relative overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-unelma-navy/5 pointer-events-none"></div>

                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-4xl md:text-7xl font-black text-unelma-navy leading-none mb-10 tracking-tighter">
                                EVENT <br />
                                UNELMA <br />
                                <span className="text-gradient-warm">TERBARU.</span>
                            </h2>
                            {/* Statistics section updated to look like event info or just stats */}
                            <div className="space-y-12">
                                {[
                                    { label: 'Peserta', value: '10K+', color: 'text-unelma-orange' },
                                    { label: 'Webinar', value: '500+', color: 'text-unelma-navy' },
                                    { label: 'Bootcamp', value: '25+', color: 'text-unelma-orange' },
                                ].map((stat, i) => (
                                    <div key={i} className="flex items-center gap-8">
                                        <div className="text-sm font-black uppercase tracking-[0.3em] text-unelma-navy/20 rotate-180 [writing-mode:vertical-lr]">
                                            {stat.label}
                                        </div>
                                        <div className={`text-6xl md:text-8xl font-black ${stat.color} tracking-tighter`}>
                                            {stat.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="aspect-[4/5] bg-white rounded-[3.5rem] overflow-hidden border border-unelma-navy/5 shadow-2xl relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-unelma-orange/10 via-transparent to-transparent"></div>
                                <div className="w-full h-full p-12 flex flex-col justify-end">
                                    <div className="w-2/3 h-2 bg-unelma-orange mb-4 rounded-full shadow-lg shadow-unelma-orange/40"></div>
                                    <div className="w-1/2 h-2 bg-unelma-navy/10 rounded-full"></div>
                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        <div className="h-24 glass-orange rounded-2xl flex items-center justify-center">
                                            <span className="text-unelma-orange font-black text-xl">DEC</span>
                                        </div>
                                        <div className="h-24 glass-warm rounded-2xl flex items-center justify-center border-unelma-navy/5">
                                            <span className="text-unelma-navy font-black text-2xl">2026</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Event;
