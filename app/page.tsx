"use client";
import React from 'react';
import Header from './components/unelma/Header';
import Hero from './components/unelma/Hero';
import Layanan from './components/unelma/Layanan';
import Event from './components/unelma/Event';
import Testimoni from './components/unelma/Testimoni';
import PriceList from './components/unelma/PriceList';
import AboutUnelma from './components/unelma/AboutUnelma';
import CTA from './components/unelma/CTA';
import Footer from './components/unelma/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-unelma-navy selection:bg-unelma-orange selection:text-unelma-navy relative overflow-hidden font-sans">
      <div className="noise-bg"></div>

      <Header />
      <Hero />
      <Layanan />
      <Event />
      <Testimoni />
      <PriceList />
      <AboutUnelma />
      <CTA />

      <Footer />
    </main>
  );
}
