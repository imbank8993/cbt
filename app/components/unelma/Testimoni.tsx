"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, Quote } from 'lucide-react';

const testimonials = [
    {
        name: 'Bpk. Ahmad Ronal',
        role: 'Orang Tua Siswa',
        content: 'Belajar di Unelma terasa sangat berbeda. Tutornya begitu hangat dan sabar, seperti keluarga sendiri yang mengajar.',
        avatar: 'AR'
    },
    {
        name: 'Siska Amelia',
        role: 'Siswa Kelas 12',
        content: 'Fitur-fiturnya membantu banget, tapi yang paling aku suka itu kenyamanannya. Gak merasa tertekan sama sekali.',
        avatar: 'SA'
    },
    {
        name: 'Ibu Sarah',
        role: 'Guru & Pembimbing',
        content: 'Ekosistem yang dibangun Unelma mementingkan kedekatan emosional antara guru dan murid, bukan sekadar nilai.',
        avatar: 'IS'
    }
];

const Testimoni = () => {
    return (
        <section id="testimoni" className="relative py-32 bg-transparent overflow-hidden">
            {/* Smooth Mixed Blurs */}
            <div className="gaussian-blur blur-navy-white w-[600px] h-[600px] top-[10%] left-[-10%]"></div>
            <div className="gaussian-blur blur-orange-white w-[400px] h-[400px] bottom-[10%] right-[10%] opacity-10"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center space-x-2 px-6 py-2 rounded-full glass-warm border-unelma-navy/10 text-unelma-navy text-sm font-bold mb-8"
                    >
                        <Star size={16} fill="currentColor" />
                        <span>Cerita dari Keluarga Unelma</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-black text-unelma-navy mb-8 tracking-tighter">
                        SENTUHAN <span className="text-gradient-warm">PERSONAL.</span>
                    </h2>
                    <p className="text-unelma-navy/60 text-xl font-medium">
                        Kenyamanan dan kedekatan adalah kunci keberhasilan belajar yang kami tawarkan.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-warm p-10 rounded-[3rem] border-unelma-navy/5 relative group shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                            <Quote className="absolute top-8 right-8 text-unelma-navy/5 group-hover:text-unelma-navy/10 transition-colors" size={60} />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-unelma-orange rounded-2xl flex items-center justify-center font-black text-unelma-navy text-xl soft-shadow">
                                    {item.avatar}
                                </div>
                                <div>
                                    <h4 className="text-unelma-navy font-bold text-lg">{item.name}</h4>
                                    <p className="text-unelma-orange text-sm font-bold">{item.role}</p>
                                </div>
                            </div>

                            <p className="text-unelma-navy/70 leading-relaxed text-lg font-medium relative z-10">
                                "{item.content}"
                            </p>

                            <div className="mt-8 flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={16} fill="#030c4d" className="text-unelma-navy" />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimoni;
