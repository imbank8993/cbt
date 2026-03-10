"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LatexRenderer } from './LatexRenderer';

interface InteractiveMatchingProps {
    questionId: string;
    options: any[]; // left items
    rightItems: string[];
    answers: Record<string, string[]>; // leftId -> rightText[]
    onAnswerChange: (leftId: string, rightText: string) => void;
    selectedLeft: string | null;
    onSelectLeft: (id: string | null) => void;
    showFeedback?: boolean;
}

export const InteractiveMatching: React.FC<InteractiveMatchingProps> = ({
    questionId,
    options,
    rightItems,
    answers,
    onAnswerChange,
    selectedLeft,
    onSelectLeft,
    showFeedback = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [links, setLinks] = useState<{ x1: number, y1: number, x2: number, y2: number, isCorrect: boolean | null }[]>([]);

    // Scoped ID helper to prevent collisions on pages with multiple questions
    const getScopedId = useCallback((prefix: string, itemKey: string) => {
        const safeKey = typeof itemKey === 'string' ? btoa(encodeURIComponent(itemKey)).replace(/=/g, '').substring(0, 12) : itemKey;
        return `${prefix}-${questionId}-${safeKey}`;
    }, [questionId]);

    const updateLines = useCallback(() => {
        if (!containerRef.current) return;

        // Get the top-level container position
        const containerRect = containerRef.current.getBoundingClientRect();

        const newLinks: { x1: number, y1: number, x2: number, y2: number, isCorrect: boolean | null }[] = [];

        Object.entries(answers).forEach(([leftId, rights]) => {
            const leftItem = options.find(o => o.id === leftId);
            const correctRights = leftItem?.metadata?.matching_texts || [];

            const leftBoxEl = document.getElementById(getScopedId('box-left', leftId));
            if (!leftBoxEl) return;
            const leftBoxRect = leftBoxEl.getBoundingClientRect();

            // Start from the exact visual right-center edge of the left box
            const x1 = leftBoxRect.right - containerRect.left;
            const y1 = (leftBoxRect.top + leftBoxRect.height / 2) - containerRect.top;

            rights.forEach((rightText: string) => {
                const rightBoxEl = document.getElementById(getScopedId('box-right', rightText));
                if (!rightBoxEl) return;
                const rightBoxRect = rightBoxEl.getBoundingClientRect();

                // End at the exact visual left-center edge of the right box
                const x2 = rightBoxRect.left - containerRect.left;
                const y2 = (rightBoxRect.top + rightBoxRect.height / 2) - containerRect.top;

                newLinks.push({
                    x1, y1, x2, y2,
                    isCorrect: showFeedback ? correctRights.includes(rightText) : null
                });
            });
        });
        setLinks(newLinks);
    }, [answers, options, getScopedId, showFeedback]);

    useEffect(() => {
        // Run immediately
        updateLines();

        // Follow-up checks to ensure layout finalization
        const timer1 = setTimeout(updateLines, 100);
        const timer2 = setTimeout(updateLines, 500);
        const timer3 = setTimeout(updateLines, 1500);

        const handleLayoutChange = () => updateLines();
        window.addEventListener('resize', handleLayoutChange);
        window.addEventListener('scroll', handleLayoutChange, true);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            window.removeEventListener('resize', handleLayoutChange);
            window.removeEventListener('scroll', handleLayoutChange, true);
        };
    }, [updateLines, selectedLeft]);

    return (
        <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header / Info */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 flex items-center justify-center gap-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-primary" /> Item Terpilih
                </div>
                <div className="w-[1px] h-4 bg-slate-200 mx-2" />
                <span>Klik item kiri lalu klik pasangan di kanan</span>
            </div>

            {/* CONTAINER FOR SVG AND GRID */}
            <div ref={containerRef} className="space-y-8 py-4 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* SVG CONNECTORS - Smooth Curves */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                    <defs>
                        <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f8a01b" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#f8a01b" stopOpacity="0.4" />
                        </linearGradient>
                        <marker id={`arrowhead-${questionId}`} markerWidth="4" markerHeight="3" refX="3.5" refY="1.5" orientation="auto">
                            <path d="M0,0 L4,1.5 L0,3 Z" fill="#f8a01b" />
                        </marker>
                        <marker id={`arrowhead-correct-${questionId}`} markerWidth="4" markerHeight="3" refX="3.5" refY="1.5" orientation="auto">
                            <path d="M0,0 L4,1.5 L0,3 Z" fill="#10b981" />
                        </marker>
                        <marker id={`arrowhead-wrong-${questionId}`} markerWidth="4" markerHeight="3" refX="3.5" refY="1.5" orientation="auto">
                            <path d="M0,0 L4,1.5 L0,3 Z" fill="#ef4444" />
                        </marker>
                    </defs>
                    {links.map((link, i) => {
                        // Calculate control points for a smooth curve
                        const dx = Math.abs(link.x2 - link.x1);
                        const midX = (link.x1 + link.x2) / 2;
                        const midY = (link.y1 + link.y2) / 2;

                        // We use a curve that bows slightly outwards
                        const pathData = `M ${link.x1} ${link.y1} C ${midX + dx / 4} ${link.y1}, ${midX - dx / 4} ${link.y2}, ${link.x2} ${link.y2}`;

                        return (
                            <motion.path
                                key={i}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                d={pathData}
                                stroke={link.isCorrect === null ? "url(#line-gradient)" : (link.isCorrect ? "#10b981" : "#ef4444")}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                                markerEnd={link.isCorrect === null ? `url(#arrowhead-${questionId})` : (link.isCorrect ? `url(#arrowhead-correct-${questionId})` : `url(#arrowhead-wrong-${questionId})`)}
                                className="drop-shadow-[0_2px_4px_rgba(248,160,27,0.2)]"
                            />
                        );
                    })}
                </svg>

                <div className="grid grid-cols-2 gap-4 md:gap-4 lg:grid-cols-12 relative z-10">
                    {/* LEFT ITEMS (DOMAIN) */}
                    <div className="md:col-span-1 lg:col-span-5 space-y-3">
                        <h3 className="text-[10px] font-black text-unelma-navy/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2 px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-unelma-orange shadow-[0_0_10px_rgba(248,160,27,0.5)]" /> Kolom Pertanyaan
                        </h3>
                        {options.map((opt: any) => {
                            const isSelected = selectedLeft === opt.id;
                            const matches = answers[opt.id] || [];

                            return (
                                <div key={opt.id} className="relative group">
                                    <div className="flex items-center gap-3">
                                        <button
                                            id={getScopedId('btn-left', opt.id)}
                                            disabled={showFeedback}
                                            onClick={() => onSelectLeft(isSelected ? null : opt.id)}
                                            className={`flex-1 p-3 md:p-6 pr-8 md:pr-12 rounded-2xl md:rounded-3xl border-2 text-left font-semibold transition-all relative z-10 overflow-hidden text-[10px] md:text-[13px] ${isSelected ? 'border-unelma-orange bg-unelma-orange/5 shadow-premium scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
                                        >
                                            <div className="rich-content relative z-10 leading-relaxed text-unelma-navy font-normal w-full overflow-hidden">
                                                <LatexRenderer text={opt.option_text || opt.text} />
                                            </div>
                                        </button>

                                        <div
                                            id={getScopedId('box-left', opt.id)}
                                            className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm ${isSelected ? 'bg-unelma-orange border-unelma-orange scale-110 shadow-lg shadow-unelma-orange/20' : 'bg-white border-slate-100 group-hover:border-unelma-orange/30'}`}
                                            onClick={() => !showFeedback && onSelectLeft(isSelected ? null : opt.id)}
                                        >
                                            {isSelected && <div className="w-2.5 h-2.5 bg-unelma-navy rounded-full animate-pulse" />}
                                        </div>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2 px-1">
                                        {matches.map((m, mi) => (
                                            <span key={mi} className="bg-unelma-orange/10 text-unelma-navy text-[9px] font-black px-3 py-2 rounded-xl uppercase tracking-wider border border-unelma-orange/20 animate-in zoom-in-50 flex items-center gap-2 shadow-sm">
                                                <div className="w-1 h-1 bg-unelma-orange rounded-full" /> {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="hidden lg:block lg:col-span-2" />

                    {/* RIGHT ITEMS (KODOMAIN) */}
                    <div className="md:col-span-1 lg:col-span-5 space-y-3">
                        <h3 className="text-[10px] font-black text-unelma-navy/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2 px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-unelma-orange shadow-[0_0_10px_rgba(248,160,27,0.5)]" /> Kolom Jawaban
                        </h3>
                        {rightItems.map((rightItem: string) => {
                            const isBeingMatched = selectedLeft && !showFeedback;

                            return (
                                <div key={rightItem} className="flex items-center gap-3 group">
                                    <div
                                        id={getScopedId('box-right', rightItem)}
                                        className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm ${isBeingMatched ? 'border-unelma-orange/40 group-hover:border-unelma-orange group-hover:bg-unelma-orange group-hover:scale-110' : 'bg-white border-slate-100'}`}
                                        onClick={() => {
                                            if (!selectedLeft || showFeedback) return;
                                            onAnswerChange(selectedLeft, rightItem);
                                        }}
                                    >
                                        <div className={`w-2 h-2 rounded-full transition-all ${isBeingMatched ? 'bg-unelma-navy/20 group-hover:bg-unelma-navy' : 'bg-slate-100'}`} />
                                    </div>

                                    <button
                                        id={getScopedId('btn-right', rightItem)}
                                        disabled={!selectedLeft || showFeedback}
                                        onClick={() => {
                                            if (!selectedLeft) return;
                                            onAnswerChange(selectedLeft, rightItem);
                                        }}
                                        className={`flex-1 p-3 md:p-6 rounded-2xl md:rounded-3xl border-2 text-left font-semibold transition-all text-[10px] md:text-[13px] ${!selectedLeft || showFeedback ? 'opacity-40 cursor-not-allowed border-slate-50 bg-slate-50/50' : 'border-slate-100 bg-white hover:border-unelma-orange/40 hover:bg-unelma-orange/5 hover:-translate-x-1 shadow-sm'}`}
                                    >
                                        <div className="rich-content leading-relaxed text-unelma-navy font-normal w-full overflow-hidden">{rightItem}</div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
