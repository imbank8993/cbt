"use client";
import React from 'react';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-transparent pt-32 pb-12 border-t border-unelma-navy/5 relative overflow-hidden">
            <div className="gaussian-blur blur-orange-white w-[600px] h-[600px] bottom-[-10%] left-[-10%]"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-unelma-orange flex items-center justify-center soft-shadow">
                                <Image
                                    src="/unelma.png"
                                    alt="Unelma Logo"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) parent.innerHTML = '<span class="text-unelma-navy font-black text-xl">U</span>';
                                    }}
                                />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-unelma-navy">
                                UNELMA<span className="text-unelma-orange">.ID</span>
                            </span>
                        </div>
                        <p className="text-unelma-navy/60 leading-relaxed font-medium text-lg">
                            Membangun masa depan pendidikan digital dengan sentuhan kasih sayang dan teknologi terdepan.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Instagram, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className="w-12 h-12 glass-warm rounded-full flex items-center justify-center text-unelma-navy/60 hover:text-unelma-orange hover:bg-unelma-orange/10 transition-all duration-300 border border-unelma-navy/5">
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-unelma-navy font-bold text-xl mb-8 tracking-tight">Eksplorasi</h4>
                        <ul className="space-y-4">
                            {['Home', 'Layanan', 'Event', 'Testimoni', 'About Unelma'].map((item) => (
                                <li key={item}>
                                    <a href={`#${item.toLowerCase().replace(' ', '')}`} className="text-unelma-navy/50 hover:text-unelma-orange transition-colors font-medium">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-unelma-navy font-bold text-xl mb-8 tracking-tight">Layanan</h4>
                        <ul className="space-y-4">
                            {['Bimbingan Online', 'Materi E-Learning', 'Konsultasi Privat', 'Ujian Tryout'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-unelma-navy/50 hover:text-unelma-orange transition-colors font-medium">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-unelma-navy font-bold text-xl mb-8 tracking-tight">Hubungi Kami</h4>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-4 text-unelma-navy/50">
                                <Mail size={20} className="text-unelma-orange shrink-0 mt-1" />
                                <span className="font-medium">halo@unelma.app</span>
                            </li>
                            <li className="flex items-start gap-4 text-unelma-navy/50">
                                <Phone size={20} className="text-unelma-orange shrink-0 mt-1" />
                                <span className="font-medium">+62 812 3456 7890</span>
                            </li>
                            <li className="flex items-start gap-4 text-unelma-navy/50">
                                <MapPin size={20} className="text-unelma-orange shrink-0 mt-1" />
                                <span className="font-medium">Visi Edukasi Digital, <br />Jakarta, Indonesia</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-unelma-navy/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-unelma-navy/40 font-medium flex items-center gap-2">
                        © 2026 Unelma.Id. Dibuat dengan <Heart size={16} fill="#f8a01b" className="text-unelma-orange" /> untuk Pendidikan Indonesia.
                    </p>
                    <div className="flex gap-10 text-unelma-navy/40 font-medium">
                        <a href="#" className="hover:text-unelma-navy transition-colors">Syarat & Ketentuan</a>
                        <a href="#" className="hover:text-unelma-navy transition-colors">Kebijakan Privasi</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
