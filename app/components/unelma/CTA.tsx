"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import Link from 'next/link';

const CTA = () => {
    return (
        <section className="relative py-40 overflow-hidden bg-transparent">
            {/* Smooth Mixed Blurs */}
            <div className="gaussian-blur blur-orange-white w-[1000px] h-[600px] bottom-[-10%] right-[-10%] rotate-45"></div>
            <div className="gaussian-blur blur-navy-white w-[500px] h-[500px] bottom-[-20%] left-[-10%]"></div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto"
                >
                    <h2 className="text-5xl md:text-9xl font-black text-unelma-navy mb-12 leading-[0.85] tracking-tighter">
                        MARI <br />
                        <span className="text-gradient-warm">MELANGKAH.</span>
                    </h2>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-16">
                        <Link href="/login" className="w-full md:w-auto">
                            <button className="w-full btn-unelma px-16 py-8 rounded-[2.5rem] text-lg shadow-2xl flex items-center justify-center gap-4">
                                <span>GABUNG SEKARANG</span>
                                <Send size={24} />
                            </button>
                        </Link>
                        <p className="text-unelma-navy/60 font-medium text-lg text-left px-8">
                            Dapatkan konsultasi gratis <br />
                            <span className="text-unelma-orange font-bold">DUKUNGAN 24/7.</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTA;