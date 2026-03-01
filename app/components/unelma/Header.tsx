"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { name: 'Home', href: '#' },
        { name: 'Layanan', href: '#layanan' },
        { name: 'Event', href: '#event' },
        { name: 'Testimoni', href: '#testimoni' },
        { name: 'About Unelma', href: '#about' },
    ];

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-4' : 'py-8'}`}>
            <div className="container mx-auto px-6">
                <nav className={`glass-warm rounded-full px-8 py-4 flex items-center justify-between transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-unelma-navy/5 shadow-lg' : 'bg-white/40 border-white/20'}`}>
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-unelma-orange flex items-center justify-center soft-shadow group-hover:scale-110 transition-transform duration-300">
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

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-10">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="text-sm font-bold uppercase tracking-widest text-unelma-navy/70 hover:text-unelma-orange transition-colors relative group"
                            >
                                {item.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-unelma-orange transition-all duration-300 group-hover:w-full"></span>
                            </a>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className="hidden md:block">
                        <Link href="/login">
                            <button className="btn-unelma px-8 py-3 rounded-full text-sm font-black tracking-tighter shadow-xl shadow-unelma-orange/20">
                                CBT (Login)
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-unelma-navy"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </nav>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-24 left-6 right-6 glass-warm p-8 rounded-3xl z-40"
                    >
                        <div className="flex flex-col gap-6">
                            {navItems.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="text-lg font-bold text-unelma-navy hover:text-unelma-orange transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </a>
                            ))}
                            <Link href="/login" className="w-full">
                                <button className="btn-unelma w-full py-4 rounded-xl mt-4 font-black">
                                    CBT (Login)
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
