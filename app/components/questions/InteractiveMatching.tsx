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
            <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-primary" /> Item Terpilih
                </div>
                <div className="w-[1px] h-4 bg-slate-200 mx-2" />
                <span>Klik item kiri lalu klik pasangan di kanan</span>
            </div>

            {/* CONTAINER FOR SVG AND GRID */}
            <div ref={containerRef} className="space-y-8 py-4 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* SVG CONNECTORS - Now a direct sibling of the grid for perfect absolute anchoring */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible hidden md:block">
                    <defs>
                        <marker id={`arrowhead-${questionId}`} markerWidth="6" markerHeight="4" refX="5" refY="2" orientation="auto">
                            <polygon points="0 0, 6 2, 0 4" fill="#f8a01b" />
                        </marker>
                        <marker id={`arrowhead-correct-${questionId}`} markerWidth="6" markerHeight="4" refX="5" refY="2" orientation="auto">
                            <polygon points="0 0, 6 2, 0 4" fill="#10b981" />
                        </marker>
                        <marker id={`arrowhead-wrong-${questionId}`} markerWidth="6" markerHeight="4" refX="5" refY="2" orientation="auto">
                            <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
                        </marker>
                    </defs>
                    {links.map((link, i) => (
                        <motion.path
                            key={i}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            d={`M ${link.x1} ${link.y1} L ${link.x2} ${link.y2}`}
                            stroke={link.isCorrect === null ? "#f8a01b" : (link.isCorrect ? "#10b981" : "#ef4444")}
                            strokeWidth="2"
                            strokeLinecap="round"
                            fill="none"
                            markerEnd={link.isCorrect === null ? `url(#arrowhead-${questionId})` : (link.isCorrect ? `url(#arrowhead-correct-${questionId})` : `url(#arrowhead-wrong-${questionId})`)}
                            className="drop-shadow-sm opacity-70"
                        />
                    ))}
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4 relative z-10">
                    {/* LEFT ITEMS (DOMAIN) */}
                    <div className="md:col-span-12 lg:col-span-5 space-y-4">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
                            <div className="w-2 h-2 rounded-sm bg-primary" /> Item Domain
                        </h4>
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
                                            className={`flex-1 p-5 pr-10 rounded-2xl border-2 text-left font-bold transition-all relative z-10 overflow-hidden text-[15px] ${isSelected ? (showFeedback ? 'border-primary bg-primary/5' : 'border-primary bg-primary/5 shadow-lg shadow-primary/5 -translate-y-0.5') : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}
                                        >
                                            <div className="relative z-10 leading-relaxed text-[#030c4d] font-bold">
                                                <LatexRenderer text={opt.option_text || opt.text} />
                                            </div>
                                        </button>

                                        <div
                                            id={getScopedId('box-left', opt.id)}
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${isSelected ? 'bg-primary border-primary scale-110 shadow-lg shadow-primary/20 rotate-0' : 'bg-white border-slate-200 group-hover:border-primary/40 rotate-45 group-hover:rotate-0'}`}
                                            onClick={() => !showFeedback && onSelectLeft(isSelected ? null : opt.id)}
                                        >
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-sm animate-pulse" />}
                                        </div>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2 px-1">
                                        {matches.map((m, mi) => (
                                            <span key={mi} className="bg-[#f8a01b]/10 text-[#f8a01b] text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-[#f8a01b]/20 animate-in zoom-in-50 flex items-center gap-1.5 shadow-sm">
                                                <div className="w-1 h-1 bg-[#f8a01b] rounded-full" /> {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="hidden lg:block lg:col-span-2" />

                    {/* RIGHT ITEMS (KODOMAIN) */}
                    <div className="md:col-span-12 lg:col-span-5 space-y-4">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
                            <div className="w-2 h-2 rounded-sm bg-[#f8a01b]" /> Item Kodomain
                        </h4>
                        {rightItems.map((rightItem: string) => {
                            const isBeingMatched = selectedLeft && !showFeedback;

                            return (
                                <div key={rightItem} className="flex items-center gap-3 group">
                                    <div
                                        id={getScopedId('box-right', rightItem)}
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${isBeingMatched ? 'border-primary/40 group-hover:border-[#f8a01b] group-hover:bg-[#f8a01b] group-hover:scale-110 group-hover:rotate-0' : 'bg-white border-slate-200 rotate-45'}`}
                                        onClick={() => {
                                            if (!selectedLeft || showFeedback) return;
                                            onAnswerChange(selectedLeft, rightItem);
                                        }}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-sm transition-all ${isBeingMatched ? 'bg-primary/20 group-hover:bg-white' : 'bg-slate-100'}`} />
                                    </div>

                                    <button
                                        id={getScopedId('btn-right', rightItem)}
                                        disabled={!selectedLeft || showFeedback}
                                        onClick={() => {
                                            if (!selectedLeft) return;
                                            onAnswerChange(selectedLeft, rightItem);
                                        }}
                                        className={`flex-1 p-5 rounded-2xl border-2 text-left font-bold transition-all text-[15px] ${!selectedLeft || showFeedback ? 'opacity-40 cursor-not-allowed border-slate-50 bg-slate-50/50' : 'border-slate-100 bg-white hover:border-[#f8a01b]/40 hover:bg-[#f8a01b]/5 hover:-translate-x-0.5 shadow-sm'}`}
                                    >
                                        <div className="leading-relaxed text-[#030c4d] font-bold">{rightItem}</div>
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
