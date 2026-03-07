"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Monitor, Cloud, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const pillars = [
    {
        title: "Bimbingan Belajar",
        description: "Persiapan intensif masuk MAN Insan Cendekia & Sekolah Unggulan untuk siswa Kelas IX.",
        icon: <GraduationCap size={40} />,
        color: "from-orange-400 to-unelma-orange",
        link: "#layanan",
        category: "bimbel"
    },
    {
        title: "Unelma CBT",
        description: "Solusi aplikasi ujian berbasis komputer yang handal, aman, dan mudah digunakan.",
        icon: <Monitor size={40} />,
        color: "from-blue-600 to-unelma-navy",
        link: "#layanan",
        category: "cbt"
    },
    {
        title: "Layanan Digital",
        description: "Hosting RDM, Pembuatan PTSP, dan integrasi ekosistem digital Madrasah.",
        icon: <Cloud size={40} />,
        color: "from-blue-400 to-blue-600",
        link: "#layanan",
        category: "digital"
    }
];

const ServicePillars = () => {
    return (
        <section className="py-20 relative bg-transparent">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pillars.map((pillar, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group relative"
                        >
                            <div className="h-full glass-warm p-10 rounded-[2.5rem] border-unelma-navy/5 hover:border-unelma-orange/20 transition-all duration-500 hover:shadow-2xl flex flex-col items-center text-center overflow-hidden">
                                {/* Background Accent */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${pillar.color} opacity-[0.03] rounded-bl-full group-hover:opacity-10 transition-opacity duration-500`}></div>

                                <div className={`w-20 h-20 bg-gradient-to-br ${pillar.color} rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-orange-500/10 group-hover:scale-110 transition-transform duration-500`}>
                                    {pillar.icon}
                                </div>

                                <h3 className="text-2xl font-black text-unelma-navy mb-4 tracking-tight uppercase">
                                    {pillar.title}
                                </h3>

                                <p className="text-unelma-navy/60 font-medium leading-relaxed mb-8 flex-1">
                                    {pillar.description}
                                </p>

                                <Link href={pillar.link} className="inline-flex items-center gap-2 text-unelma-orange font-bold hover:gap-4 transition-all uppercase tracking-wider text-sm">
                                    Lihat Selengkapnya <ArrowRight size={18} />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicePillars;
