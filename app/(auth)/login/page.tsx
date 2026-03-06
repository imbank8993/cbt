"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Role, getDashboardPath, getUserRole } from '@/lib/rbac';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = await getUserRole(session.user.id);
        if (role) {
          router.push(getDashboardPath(role));
          return;
        }
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("User tidak ditemukan");

      const role = await getUserRole(user.id);

      if (!role) {
        setErrorMsg('Akun Anda belum dikaitkan dengan peran apa pun. Hubungi admin.');
        await supabase.auth.signOut();
        return;
      }

      router.push(getDashboardPath(role));
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb]">
        <Loader2 className="w-12 h-12 text-[#0038A8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Left Side - Branding */}
      <div id="login-left">
        <div className="logo-wrapper w-28 h-28 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center p-5 mb-[30px] border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden ring-4 ring-white/10">
          <img src="/unelma.png" alt="Unelma Logo" className="w-full h-auto drop-shadow-xl" />
        </div>
        <h1>Unelma <span className="text-orange">CBT</span></h1>
        <p>Computer Based Test Platform</p>
      </div>

      {/* Right Side - Login Form */}
      <div id="login-right">
        <div className="login-card">
          <h3>Login CBT</h3>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                required
                suppressHydrationWarning
              />
            </div>

            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
                suppressHydrationWarning
              />
              <span
                id="togglePassword"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>

            {errorMsg && (
              <div className="error-message">
                <AlertCircle className="me-2 flex-shrink-0" size={16} />
                {errorMsg}
              </div>
            )}

            <button type="submit" id="btnLogin" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-bars-inline mr-2">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                  Memproses...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2" size={18} />
                  Login
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          font-family: 'Poppins', 'Outfit', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #0b1220;
          background: #f5f7fb;
          min-height: 100%;
          height: auto;
          overflow-x: hidden;
        }

        .login-container {
          display: flex;
          width: 100%;
          min-height: 100vh;
          background: #f5f7fb;
          animation: fadeIn 0.8s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        #login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          /* Base blue logo color dominates around 75% */
          background-color: #030c4d; 
          /* Subtle blurry edges */
          background-image: 
            radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.15) 0%, transparent 30%),
            radial-gradient(circle at 90% 90%, rgba(245, 158, 11, 0.15) 0%, transparent 30%);
          color: #eaf2ff;
          padding: 60px 40px;
          text-align: center;
          overflow: hidden;
          position: relative;
        }

        /* Animated Glowing Orbs scaled down to respect the 75% blue dominance */
        #login-left::before {
          content: "";
          position: absolute;
          top: -15%;
          left: -15%;
          width: 40vw;
          height: 40vw;
          max-width: 400px;
          max-height: 400px;
          background: rgba(245, 158, 11, 0.25); /* Accented Orange */
          filter: blur(100px);
          border-radius: 50%;
          animation: floatOrb 20s infinite cubic-bezier(0.4, 0, 0.2, 1) alternate;
          pointer-events: none;
        }

        #login-left::after {
          content: "";
          position: absolute;
          bottom: -15%;
          right: -15%;
          width: 35vw;
          height: 35vw;
          max-width: 350px;
          max-height: 350px;
          background: rgba(255, 255, 255, 0.2); /* Soft White */
          filter: blur(100px);
          border-radius: 50%;
          animation: floatOrb2 25s infinite cubic-bezier(0.4, 0, 0.2, 1) alternate-reverse;
          pointer-events: none;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30%, 30%) scale(1.2); }
        }
        @keyframes floatOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-20%, -30%) scale(1.1); }
        }

        .logo-wrapper {
          position: relative;
          display: inline-flex;
          margin-bottom: 25px;
          z-index: 2;
        }

        #login-left h1 {
          font-size: clamp(1.6rem, 5vw, 2.8rem);
          font-weight: 900;
          margin-top: 5px;
          margin-bottom: 10px;
          text-shadow: 0 4px 15px rgba(0,0,0,0.4);
          z-index: 2;
          position: relative;
        }

        #login-left h1 span.text-orange {
           color: #F59E0B;
           text-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
        }

        #login-left p {
          font-size: clamp(.95rem, 3.5vw, 1.1rem);
          line-height: 1.5;
          max-width: 400px;
          margin: 0 auto;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 500;
          z-index: 2;
          position: relative;
        }



        #login-right {
          flex: 1;
          background: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px 16px;
          position: relative;
        }

        #login-right::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000b44' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
            opacity: 0.5;
            pointer-events: none;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          padding: 55px 40px;
          border-radius: 30px;
          border: 1px solid rgba(0, 11, 68, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 11, 68, 0.15), 0 0 0 1px rgba(0, 11, 68, 0.02);
          z-index: 10;
        }

        .login-card h3 {
          margin-bottom: 40px;
          text-align: center;
          color: #000B44;
          font-weight: 900;
          font-size: clamp(1.2rem, 4vw, 1.5rem);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .input-group {
          position: relative;
          margin-bottom: 24px;
        }

        .input-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          z-index: 1;
          transition: color 0.3s ease;
        }

        .login-card input {
          width: 100%;
          padding: 16px 20px 16px 54px;
          border-radius: 16px;
          border: 1.5px solid #e2e8f0;
          font-size: 1rem;
          font-weight: 500;
          color: #000B44;
          transition: all cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
          outline: none;
          background: #f8fafc;
        }

        .login-card input:focus {
          border-color: #F59E0B;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
        }

        .login-card input:focus ~ .input-icon {
          color: #F59E0B;
        }

        .login-card input:disabled {
          background: #f1f5f9;
          color: #cbd5e1;
          cursor: not-allowed;
        }

        .input-group input {
          padding-right: 60px !important;
        }

        #togglePassword {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          cursor: pointer;
          z-index: 10;
          user-select: none;
          transition: color 0.3s ease;
          background: transparent;
          border: none;
          padding: 0;
        }

        #togglePassword:hover {
          color: #F59E0B;
        }

        .login-card input:focus ~ #togglePassword {
          color: #F59E0B;
        }

        .error-message {
          padding: 14px 18px;
          margin-bottom: 24px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #ef4444;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        #btnLogin {
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          background: linear-gradient(135deg, #000B44 0%, #001366 100%);
          color: #fff;
          border: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 25px -5px rgba(0, 11, 68, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }

        /* Shine effect on button */
        #btnLogin::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }

        #btnLogin:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(0, 11, 68, 0.4);
          background: linear-gradient(135deg, #001366 0%, #001b99 100%);
        }

        #btnLogin:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-bars-inline {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .loading-bars-inline .bar {
          width: 3px;
          height: 12px;
          background: #F59E0B;
          border-radius: 99px;
          animation: waveInline 1s infinite ease-in-out;
        }

        .loading-bars-inline .bar:nth-child(2) { animation-delay: 0.1s; }
        .loading-bars-inline .bar:nth-child(3) { animation-delay: 0.2s; }

        @keyframes waveInline {
          0%, 40%, 100% { transform: scaleY(0.5); opacity: 0.5; }
          20% { transform: scaleY(1.2); opacity: 1; }
        }

        @media (max-width: 992px) {
          .login-container {
            flex-direction: column;
            min-height: 100dvh;
            background: #ffffff;
            padding: 0;
            gap: 0;
          }

          #login-left {
            flex: none;
            width: 100%;
            padding: 40px 20px;
            border-radius: 0 0 30px 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            z-index: 20;
          }

          #login-left h1 {
            font-size: 1.8rem;
          }

          #login-right {
            width: 100%;
            padding: 30px 20px;
            align-items: flex-start;
          }

          .login-card {
            width: 100%;
            padding: 35px 24px;
            border-radius: 20px;
            box-shadow: none;
            border: 1px solid rgba(0,0,0,0.05);
          }
        }
      `}</style>
    </div>
  );

}
