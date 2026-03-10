"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { LatexRenderer } from './LatexRenderer';
import { InteractiveMatching } from './InteractiveMatching';

interface QuestionRendererProps {
    question: any;
    answer: any; // The raw answer from the database or state
    onAnswerChange: (newAnswer: any) => void;
    isPreview?: boolean;
    showFeedback?: boolean; // New: show correct/wrong markers
    showQuestion?: boolean;
    showOptions?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
    question,
    answer,
    onAnswerChange,
    isPreview = false,
    showFeedback = false,
    showQuestion = true,
    showOptions = true
}) => {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

    if (!question) return null;

    const type = question.type;
    const options = question.bank_question_options || question.options || [];

    // Safely parse metadata if it's a string
    const metadata = (() => {
        const raw = question.metadata || {};
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            } catch (e) {
                return {};
            }
        }
        return raw;
    })();

    // Helper to parse JSON answers
    const parseAnswer = (val: any, fallback: any = {}) => {
        if (!val) return fallback;
        if (typeof val !== 'string') return val;
        try {
            return JSON.parse(val);
        } catch (e) {
            return val;
        }
    };

    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case 'mcq': return 'Pilihan Ganda';
            case 'mcq_complex': return 'Pilihan Ganda Kompleks';
            case 'true_false': return 'Benar / Salah';
            case 'matching': return 'Menjodohkan';
            case 'categorization': return 'Kategorisasi';
            case 'short_answer': return 'Isian Singkat';
            case 'essay':
            case 'esay':
            case 'uraian': return 'Uraian';
            default: return 'Pertanyaan';
        }
    };

    return (
        <div className="relative w-full">
            {/* QUESTION TEXT */}
            {showQuestion && (
                <div className="ql-snow relative z-10 w-full max-w-[21cm] mb-8">
                    <div className="ql-editor rich-content !p-0 !min-h-0 text-[13px] text-slate-900">
                        <LatexRenderer text={question.question_text} />
                    </div>
                </div>
            )}

            {/* OPTIONS RENDERING */}
            {showOptions && (
                <div className="grid grid-cols-1 gap-3 relative z-10">
                    {/* MCQ */}
                    {type === 'mcq' && options.filter((opt: any) => (opt.option_text || opt.text || '').trim().length > 0).map((opt: any, idx: number) => {
                        const isSelected = answer === opt.id;
                        const letters = ['A', 'B', 'C', 'D', 'E'];
                        const label = letters[idx];
                        const isCorrect = opt.is_correct || opt.isCorrect;
                        const feedbackClass = showFeedback
                            ? (isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-rose-500 bg-rose-50/50') : (isCorrect ? 'border-emerald-200 bg-emerald-50/20 opacity-80' : 'opacity-40'))
                            : (isSelected ? 'border-[#f8a01b] bg-[#f8a01b]/5 shadow-md shadow-[#f8a01b]/5' : 'border-slate-200 bg-white hover:border-[#f8a01b]/30 hover:bg-slate-50');

                        return (
                            <label key={opt.id} className={`flex items-center p-3 rounded-2xl border transition-all duration-300 group relative overflow-hidden cursor-pointer ${feedbackClass}`}>
                                <input
                                    type="radio"
                                    className="hidden"
                                    checked={isSelected}
                                    disabled={showFeedback}
                                    onChange={() => onAnswerChange(opt.id)}
                                />
                                <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-black mr-6 transition-all duration-300 border-2 text-[15px] 
                                ${showFeedback
                                        ? (isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : isSelected ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-300 border-slate-100')
                                        : (isSelected ? 'bg-[#f8a01b] text-white border-[#f8a01b] scale-105' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:border-[#f8a01b]/20 group-hover:text-slate-600')}`}>
                                    {label}
                                </div>
                                <div className={`flex-1 text-[11pt] rich-content font-normal transition-colors duration-300 
                                ${showFeedback
                                        ? (isCorrect ? 'text-emerald-900' : isSelected ? 'text-rose-900' : 'text-slate-400')
                                        : (isSelected ? 'text-[#f8a01b]' : 'text-slate-950 group-hover:text-[#f8a01b]')}`}>
                                    <div className="ql-snow"><div className="ql-editor !p-0 !min-h-0 !text-[11pt]"><LatexRenderer text={opt.option_text || opt.text} /></div></div>
                                </div>
                                <div className="w-8 h-8 shrink-0 rounded-full ml-4 flex items-center justify-center transition-all duration-300">
                                    {showFeedback ? (
                                        isCorrect ? (
                                            <div className="w-full h-full bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                                                <Check size={14} strokeWidth={4} />
                                            </div>
                                        ) : isSelected ? (
                                            <div className="w-full h-full bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md">
                                                <AlertTriangle size={14} strokeWidth={4} />
                                            </div>
                                        ) : null
                                    ) : isSelected && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-full h-full bg-[#f8a01b] text-white rounded-full flex items-center justify-center shadow-md">
                                            <Check size={14} strokeWidth={4} />
                                        </motion.div>
                                    )}
                                </div>
                            </label>
                        );
                    })}

                    {/* TRUE_FALSE */}
                    {type === 'true_false' && (
                        <div className="space-y-1">
                            {options.filter((opt: any) => (opt.option_text || opt.text || '').trim().length > 0).map((opt: any, idx: number) => {
                                const studentAnswers = parseAnswer(answer, {});
                                const currentVal = studentAnswers[opt.id]; // 'benar' | 'salah'
                                const isCorrectAnswer = opt.is_correct || opt.isCorrect; // Assuming the statement is 'Benar' if is_correct is true

                                return (
                                    <div key={opt.id} className="flex flex-col md:flex-row md:items-center gap-6 py-3 px-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all">
                                        <div className="rich-content flex-1 text-[11pt] font-normal text-slate-950 leading-relaxed ql-snow">
                                            <div className="ql-editor !p-0 !min-h-0 !text-[11pt]"><LatexRenderer text={opt.option_text || opt.text} /></div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* BENAR BUTTON */}
                                            <button
                                                disabled={showFeedback}
                                                onClick={() => {
                                                    const next = { ...studentAnswers, [opt.id]: 'benar' };
                                                    onAnswerChange(JSON.stringify(next));
                                                }}
                                                className={`px-8 py-3 rounded-xl text-[10px] font-medium uppercase tracking-widest transition-all
                                                ${currentVal === 'benar'
                                                        ? (showFeedback ? (isCorrectAnswer ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white') : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20')
                                                        : (showFeedback && isCorrectAnswer ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500')
                                                    }`}
                                            >
                                                Benar
                                            </button>

                                            {/* SALAH BUTTON */}
                                            <button
                                                disabled={showFeedback}
                                                onClick={() => {
                                                    const next = { ...studentAnswers, [opt.id]: 'salah' };
                                                    onAnswerChange(JSON.stringify(next));
                                                }}
                                                className={`px-8 py-3 rounded-xl text-[10px] font-medium uppercase tracking-widest transition-all
                                                ${currentVal === 'salah'
                                                        ? (showFeedback ? (!isCorrectAnswer ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white') : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20')
                                                        : (showFeedback && !isCorrectAnswer ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500')
                                                    }`}
                                            >
                                                Salah
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* MCQ COMPLEX */}
                    {type === 'mcq_complex' && options.filter((opt: any) => (opt.option_text || opt.text || '').trim().length > 0).map((opt: any, idx: number) => {
                        const selectedIds = parseAnswer(answer, []);
                        const isSelected = Array.isArray(selectedIds) && selectedIds.includes(opt.id);
                        const letters = ['A', 'B', 'C', 'D', 'E'];
                        const isCorrect = opt.is_correct || opt.isCorrect;

                        const feedbackClass = showFeedback
                            ? (isSelected ? (isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-rose-500 bg-rose-50/50') : (isCorrect ? 'border-emerald-200 bg-emerald-50/20 opacity-80' : 'opacity-40'))
                            : (isSelected ? 'border-[#f8a01b] bg-[#f8a01b]/5 shadow-md shadow-[#f8a01b]/5' : 'border-slate-200 bg-white hover:border-[#f8a01b]/30 hover:bg-slate-50');

                        return (
                            <label key={opt.id} className={`flex items-center p-3 rounded-2xl border transition-all duration-300 group relative overflow-hidden cursor-pointer ${feedbackClass}`}>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected}
                                    disabled={showFeedback}
                                    onChange={() => {
                                        let next;
                                        if (isSelected) next = selectedIds.filter((id: string) => id !== opt.id);
                                        else next = [...selectedIds, opt.id];
                                        onAnswerChange(JSON.stringify(next));
                                    }}
                                />
                                <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-black mr-6 transition-all duration-300 border-2 text-base 
                                ${showFeedback
                                        ? (isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : isSelected ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-50 text-slate-300 border-slate-100')
                                        : (isSelected ? 'bg-[#f8a01b] text-white border-[#f8a01b] scale-105' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:border-[#f8a01b]/20 group-hover:text-slate-600')}`}>
                                    {letters[idx] || '?'}
                                </div>
                                <div className={`flex-1 text-[11pt] rich-content font-normal transition-colors duration-300 
                                ${showFeedback
                                        ? (isCorrect ? 'text-emerald-900' : isSelected ? 'text-rose-900' : 'text-slate-400')
                                        : (isSelected ? 'text-[#f8a01b]' : 'text-slate-950 group-hover:text-[#f8a01b]')}`}>
                                    <div className="ql-snow"><div className="ql-editor !p-0 !min-h-0 !text-[11pt]"><LatexRenderer text={opt.option_text || opt.text} /></div></div>
                                </div>
                                <div className={`w-8 h-8 shrink-0 rounded-md border-2 ml-4 flex items-center justify-center transition-all duration-300 
                                ${showFeedback
                                        ? (isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-200')
                                        : (isSelected ? 'bg-[#f8a01b] border-[#f8a01b]' : 'bg-white border-slate-200')}`}>
                                    {(showFeedback ? (isCorrect || isSelected) : isSelected) && <Check size={14} strokeWidth={4} className="text-white" />}
                                </div>
                            </label>
                        );
                    })}

                    {/* PREMIUM TABLE CATEGORIZATION */}
                    {type === 'categorization' && (
                        <div className="overflow-x-auto -mx-4 md:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <table className="w-full border-separate border-spacing-y-1 table-fixed">
                                <thead>
                                    <tr>
                                        <th className="p-2 text-left border-b border-slate-200 w-[40%]">
                                            <span className="text-[9px] font-normal text-slate-500 uppercase tracking-widest">Pernyataan</span>
                                        </th>
                                        {(metadata.categories && metadata.categories.length > 0
                                            ? metadata.categories
                                            : Array.from(new Set(options.flatMap((o: any) => o.metadata?.category_names || (o.metadata?.category_name ? [o.metadata.category_name] : []))))
                                        ).map((cat: string) => (
                                            <th key={cat} className="p-2 text-center border-b border-slate-200">
                                                <span className="text-[9px] font-medium text-[#030c4d] uppercase tracking-widest">{cat}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {options.filter((opt: any) => (opt.option_text || opt.text || '').trim().length > 0).map((opt: any, optIdx: number) => {
                                        const studentSelection = parseAnswer(answer, {});
                                        const selectedCats = studentSelection[opt.id] || [];
                                        const correctCats = opt.category_names || [];
                                        const availableCategories = metadata.categories && metadata.categories.length > 0
                                            ? metadata.categories
                                            : Array.from(new Set(options.flatMap((o: any) => o.metadata?.category_names || (o.metadata?.category_name ? [o.metadata.category_name] : []))));

                                        return (
                                            <motion.tr
                                                key={opt.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: optIdx * 0.05 }}
                                                className="group"
                                            >
                                                <td className="bg-white border-b border-slate-100 py-3 px-4 transition-all group-hover:bg-slate-50/50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#030c4d] font-normal text-[10px] border border-slate-200 group-hover:bg-white transition-colors">
                                                            {optIdx + 1}
                                                        </div>
                                                        <div className="text-[11pt] font-medium text-[#030c4d] leading-relaxed ql-snow">
                                                            <div className="ql-editor !p-0 !min-h-0 !text-[11pt]"><LatexRenderer text={opt.option_text || opt.text} /></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {availableCategories.map((cat: string, catIdx: number) => {
                                                    const isChecked = selectedCats.includes(cat);
                                                    const shouldBeChecked = correctCats.includes(cat);

                                                    let cellStatus = 'idle';
                                                    if (showFeedback) {
                                                        if (isChecked && shouldBeChecked) cellStatus = 'correct';
                                                        else if (isChecked && !shouldBeChecked) cellStatus = 'wrong';
                                                        else if (!isChecked && shouldBeChecked) cellStatus = 'missing';
                                                    } else if (isChecked) {
                                                        cellStatus = 'selected';
                                                    }

                                                    return (
                                                        <td
                                                            key={cat}
                                                            className="bg-white border-b border-slate-200 p-1 transition-all group-hover:bg-slate-50/50"
                                                        >
                                                            <div className="flex items-center justify-center">
                                                                <button
                                                                    disabled={showFeedback}
                                                                    onClick={() => {
                                                                        const nextCats = isChecked
                                                                            ? selectedCats.filter((c: string) => c !== cat)
                                                                            : [...selectedCats, cat];
                                                                        const next = { ...studentSelection, [opt.id]: nextCats };
                                                                        onAnswerChange(JSON.stringify(next));
                                                                    }}
                                                                    className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all active:scale-90
                                                                    ${cellStatus === 'idle' ? 'bg-white border-slate-300 text-transparent hover:border-[#f8a01b] shadow-sm' : ''}
                                                                    ${cellStatus === 'selected' ? 'bg-[#f8a01b] border-[#f8a01b] text-white shadow-md shadow-[#f8a01b]/20' : ''}
                                                                    ${cellStatus === 'correct' ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
                                                                    ${cellStatus === 'wrong' ? 'bg-rose-500 border-rose-500 text-white' : ''}
                                                                    ${cellStatus === 'missing' ? 'bg-emerald-50 border-emerald-300 text-emerald-500 ring-2 ring-emerald-500/10' : ''}
                                                                `}
                                                                >
                                                                    {cellStatus === 'correct' && <Check size={18} strokeWidth={4} />}
                                                                    {cellStatus === 'wrong' && <AlertTriangle size={18} strokeWidth={4} />}
                                                                    {cellStatus === 'missing' && <Check size={18} strokeWidth={4} className="opacity-50" />}
                                                                    {cellStatus === 'selected' && <Check size={18} strokeWidth={4} />}
                                                                    {cellStatus === 'idle' && <div className="w-2 h-2 rounded-full bg-slate-400" />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* MATCHING */}
                    {type === 'matching' && (
                        <InteractiveMatching
                            questionId={question.id}
                            options={options}
                            rightItems={metadata.right_items && metadata.right_items.length > 0
                                ? metadata.right_items
                                : Array.from(new Set(options.flatMap((o: any) => o.metadata?.match_texts || (o.metadata?.match_text ? [o.metadata.match_text] : []))))}
                            answers={parseAnswer(answer, {})}
                            onAnswerChange={(leftId, rightText) => {
                                const studentPairs = parseAnswer(answer, {});
                                const current = studentPairs[leftId] || [];
                                const next = current.includes(rightText)
                                    ? current.filter((m: string) => m !== rightText)
                                    : [...current, rightText];
                                const nextPairs = { ...studentPairs, [leftId]: next };
                                onAnswerChange(JSON.stringify(nextPairs));
                            }}
                            selectedLeft={selectedLeft}
                            onSelectLeft={setSelectedLeft}
                        />
                    )}

                    {/* SHORT ANSWER */}
                    {type === 'short_answer' && (
                        <div className="space-y-8 py-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {(metadata.blanks || [{ variations: [] }]).map((blank: any, bIdx: number) => {
                                const studentInputs = parseAnswer(answer, []);
                                return (
                                    <div key={bIdx} className="space-y-4 max-w-2xl mx-auto">
                                        <label className="text-[10px] font-normal text-slate-400 uppercase tracking-[0.4em] pl-2">Isian #{bIdx + 1}</label>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                            <input
                                                type="text"
                                                value={studentInputs[bIdx] || ''}
                                                disabled={showFeedback}
                                                onChange={(e) => {
                                                    const next = [...studentInputs];
                                                    next[bIdx] = e.target.value;
                                                    onAnswerChange(JSON.stringify(next));
                                                }}
                                                placeholder="Tuliskan jawaban singkat anda di sini..."
                                                className={`w-full bg-white border-2 rounded-[2rem] px-10 py-6 text-[15px] font-medium shadow-premium focus:border-primary outline-none transition-all placeholder:text-slate-200 placeholder:font-normal tracking-tight relative z-10 
                                                ${showFeedback
                                                        ? (blank.variations?.map((v: string) => v.toLowerCase()).includes((studentInputs[bIdx] || '').toLowerCase())
                                                            ? 'border-emerald-500 text-emerald-600 bg-emerald-50/10'
                                                            : 'border-rose-500 text-rose-600 bg-rose-50/10')
                                                        : 'border-slate-100 text-[#030c4d]'}`}
                                            />
                                            {showFeedback && (
                                                <div className="mt-2 text-xs font-medium text-emerald-600 px-4">
                                                    Kunci: {blank.variations?.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ESSAY */}
                    {(type === 'essay' || type === 'esay' || type === 'uraian') && (
                        <div className="space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                            <textarea
                                value={answer || ''}
                                onChange={(e) => onAnswerChange(e.target.value)}
                                placeholder="Tuliskan jawaban lengkap anda di sini secara detail..."
                                className="w-full min-h-[350px] bg-white border-2 border-slate-200 rounded-[2.5rem] p-10 text-[15px] font-black text-slate-900 shadow-premium focus:border-primary outline-none transition-all placeholder:text-slate-200 leading-relaxed custom-scrollbar"
                            />
                            <div className="bg-[#f8a01b]/5 border border-[#f8a01b]/10 p-5 rounded-2xl flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#f8a01b]/10 text-[#f8a01b] flex items-center justify-center">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-normal text-[#f8a01b] uppercase tracking-widest mb-0.5">Pertanyaan Uraian</h4>
                                    <p className="text-[9px] font-normal text-slate-400 uppercase tracking-widest leading-none">Nilai akan diperbarui setelah dikoreksi oleh guru.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
