"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, ChevronLeft, ChevronRight,
    Trash2, Edit3,
    Save, X, Check, Loader2,
    BookOpen, Eye, Layout,
    Type, ListChecks, Hash,
    ArrowRight, Sparkles, Activity,
    Upload, Download, FileText, Target
} from 'lucide-react';
import { getBankQuestions, saveQuestionAction, deleteQuestionAction, QuestionType } from '@/app/actions/question';
import { getProctorOrganization } from '@/app/actions/proktor';
import { parseDocxToQuestions } from '@/lib/doc-parser';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Rich Text Editor Support
const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-[220px] w-full bg-slate-50 animate-pulse rounded-[2rem]" />
});
import 'react-quill-new/dist/quill.snow.css';

// LaTeX Support
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * Robust LaTeX & Quran Renderer that supports multiple delimiters
 * Delimiters supported: $$, [% %], $, \[ \], and [q /q] for Quran
 */
const LatexRenderer = ({ text }: { text: string }) => {
    if (!text) return null;

    // Use dangerouslySetInnerHTML for HTML content from Quill
    // and split by LaTeX and Quran delimiters.
    const regex = /(\$\$[\s\S]*?\$\$|\[%[\s\S]*?%\]|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$|\[q\][\s\S]*?\[\/q\])/g;

    // Sanitize common "ffffff" bug residue from editor
    const sanitizedText = text.replace(/ffffff/g, '');
    const parts = sanitizedText.split(regex);

    return (
        <span className="rich-content">
            {parts.map((part, i) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    return <BlockMath key={i} math={part.slice(2, -2)} />;
                }
                if (part.startsWith('[%') && part.endsWith('%]')) {
                    return <BlockMath key={i} math={part.slice(2, -2)} />;
                }
                if (part.startsWith('\\[') && part.endsWith('\\]')) {
                    return <BlockMath key={i} math={part.slice(2, -2)} />;
                }
                if (part.startsWith('$') && part.endsWith('$')) {
                    return <InlineMath key={i} math={part.slice(1, -1)} />;
                }
                if (part.startsWith('[q]') && part.endsWith('[/q]')) {
                    return (
                        <span key={i} className="quran-text" dir="rtl">
                            {part.slice(3, -4)}
                        </span>
                    );
                }
                // Handle HTML from Quill
                return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
            })}
        </span>
    );
};

const InteractiveMatching = ({ question, answers, onAnswerChange, selectedLeft, onSelectLeft }: {
    question: any,
    answers: Record<string, string>,
    onAnswerChange: (leftId: string, rightText: string) => void,
    selectedLeft: string | null,
    onSelectLeft: (id: string | null) => void
}) => {
    const leftItems = question.bank_question_options
        ?.filter((o: any) => o.option_text?.trim() !== '')
        ?.sort((a: any, b: any) => a.order - b.order) || [];

    const [rightItems, setRightItems] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const leftDotsRef = useRef<Record<string, HTMLDivElement | null>>({});
    const rightDotsRef = useRef<Record<string, HTMLDivElement | null>>({});
    const [lines, setLines] = useState<{ id: string; x1: number; y1: number; x2: number; y2: number }[]>([]);

    useEffect(() => {
        const uniqueRights = Array.from(new Set(leftItems.map((o: any) => o.metadata?.match_text).filter(Boolean))) as string[];
        setRightItems([...uniqueRights].sort(() => Math.random() - 0.5));
    }, [question.id]);

    const calculateLines = () => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();

        const newLines = Object.entries(answers).map(([leftId, rightText]) => {
            const leftDot = leftDotsRef.current[leftId];
            const rightIdx = rightItems.indexOf(rightText);
            const rightDot = rightDotsRef.current[rightIdx];

            if (leftDot && rightDot) {
                const lRect = leftDot.getBoundingClientRect();
                const rRect = rightDot.getBoundingClientRect();

                return {
                    id: `${leftId}-${rightText}`,
                    x1: lRect.left + lRect.width / 2 - containerRect.left,
                    y1: lRect.top + lRect.height / 2 - containerRect.top,
                    x2: rRect.left + rRect.width / 2 - containerRect.left,
                    y2: rRect.top + rRect.height / 2 - containerRect.top
                };
            }
            return null;
        }).filter(Boolean) as any[];

        setLines(newLines);
    };

    useEffect(() => {
        calculateLines();
        window.addEventListener('resize', calculateLines);
        const timer = setTimeout(calculateLines, 100);
        return () => {
            window.removeEventListener('resize', calculateLines);
            clearTimeout(timer);
        };
    }, [answers, rightItems, selectedLeft]);

    const handleLeftClick = (id: string) => {
        if (selectedLeft === id) onSelectLeft(null);
        else onSelectLeft(id);
    };

    const handleRightClick = (text: string) => {
        if (selectedLeft) {
            onAnswerChange(selectedLeft, text);
            onSelectLeft(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 py-2 px-1 relative" ref={containerRef}>
            {/* SVG Layer for Arrows */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                    </marker>
                </defs>
                <AnimatePresence>
                    {lines.map((line) => (
                        <motion.path
                            key={line.id}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            d={`M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`}
                            stroke="#10b981"
                            strokeWidth="2"
                            fill="none"
                            markerEnd="url(#arrowhead)"
                            className="drop-shadow-sm"
                        />
                    ))}
                </AnimatePresence>
            </svg>

            <div className="grid grid-cols-2 gap-8 md:gap-16 relative animate-in fade-in duration-700 z-10">
                {/* Left Column */}
                <div className="space-y-3">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Himpunan A
                    </div>
                    {leftItems.map((item: any) => (
                        <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleLeftClick(item.id)}
                            className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedLeft === item.id ? 'border-primary bg-primary/5 shadow-md' : answers[item.id] ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'}`}
                        >
                            <div className="text-[13px] font-bold text-slate-700">
                                <LatexRenderer text={item.option_text} />
                            </div>
                            <div
                                ref={el => { leftDotsRef.current[item.id] = el; }}
                                className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${selectedLeft === item.id ? 'bg-primary border-primary scale-110' : answers[item.id] ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200 group-hover:border-primary'}`}
                            >
                                {answers[item.id] && <Check size={8} className="text-white" />}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Himpunan B
                    </div>
                    {rightItems.map((text: string, idx: number) => {
                        const isMatched = Object.values(answers).includes(text);
                        return (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleRightClick(text)}
                                className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${isMatched ? 'border-orange-100 bg-orange-50/20' : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'}`}
                            >
                                <div
                                    ref={el => { rightDotsRef.current[idx] = el; }}
                                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all shrink-0 ${isMatched ? 'bg-orange-400 border-orange-400' : 'bg-white border-slate-200 group-hover:border-orange-400'}`}
                                />
                                <div className="text-[13px] font-bold text-slate-700">
                                    <LatexRenderer text={text} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Action Bar */}
            <div className="mt-2 p-5 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col gap-4 relative overflow-hidden shadow-2xl z-20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                <div className="flex justify-between items-center relative z-10">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Activity size={12} className="text-primary" />
                        </div>
                        <div>
                            <div className="text-white font-black tracking-widest">PROGRES JAWAB</div>
                            <div className="text-[8px] opacity-60 font-bold uppercase">{Object.keys(answers).length} / {leftItems.length} Terhubung</div>
                        </div>
                    </div>
                    {Object.keys(answers).length > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAnswerChange('', ''); }}
                            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            Reset Semua
                        </button>
                    )}
                </div>

                <div className="relative z-10 pt-2 border-t border-slate-800">
                    {!selectedLeft && Object.keys(answers).length < leftItems.length && (
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2 animate-pulse">
                            <Plus size={10} /> Pilih item di Himpunan A (kiri)
                        </div>
                    )}
                    {selectedLeft && (
                        <div className="text-[9px] font-black text-primary uppercase tracking-widest italic flex items-center gap-2 animate-bounce">
                            <Target size={12} /> Sekarang klik pasangannya di Himpunan B (kanan)
                        </div>
                    )}
                    {Object.keys(answers).length === leftItems.length && leftItems.length > 0 && (
                        <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest italic flex items-center gap-2">
                            <Check size={12} /> Semua sudah terhubung!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function BankDetailPage() {
    const params = useParams();
    const bankId = params.bankId as string;
    const router = useRouter();

    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [org, setOrg] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Editor States
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<QuestionType>('mcq');

    // Form States
    const [questionText, setQuestionText] = useState('');
    const [scoreDefault, setScoreDefault] = useState(1);
    const [options, setOptions] = useState<any[]>([]);
    const [metadata, setMetadata] = useState<any>({});

    // View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingQuestion, setViewingQuestion] = useState<any>(null);
    const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

    // Symbol Picker State
    const [isSymbolPickerOpen, setIsSymbolPickerOpen] = useState(false);
    const [quillInstance, setQuillInstance] = useState<any>(null);

    // Bulk Import State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'csv' | 'docx'>('docx');

    // Visual Equation Builder State (MathType-style)
    const [isEquationBuilderOpen, setIsEquationBuilderOpen] = useState(false);
    const [latexInput, setLatexInput] = useState('');
    const [equationPalette] = useState<any[]>([
        // Basic
        { label: 'Pecahan', latex: '\\frac{a}{b}', icon: '÷' },
        { label: 'Akar', latex: '\\sqrt{x}', icon: '√' },
        { label: 'Eksponen', latex: 'x^{n}', icon: 'xⁿ' },
        { label: 'Subskrip', latex: 'x_{n}', icon: 'xₙ' },
        // Advanced
        { label: 'Akar Derajat', latex: '\\sqrt[n]{x}', icon: 'ⁿ√' },
        { label: 'Integral', latex: '\\int_{a}^{b} f(x) dx', icon: '∫' },
        { label: 'Sigma (Sum)', latex: '\\sum_{i=1}^{n}', icon: '∑' },
        { label: 'Product (Pi)', latex: '\\prod_{i=1}^{n}', icon: '∏' },
        { label: 'Limit', latex: '\\lim_{x \\to \\infty}', icon: 'lim' },
        { label: 'Vektor', latex: '\\vec{v}', icon: '→' },
        { label: 'Matriks 2x2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', icon: '[M]' },
        { label: 'Cases (Fungsi)', latex: 'f(x) = \\begin{cases} a, & x > 0 \\\\ b, & x \\le 0 \\end{cases}', icon: '{f' },
        { label: 'Kurung Kurawal', latex: '\\left\\{ x \\right\\}', icon: '{x}' },
        { label: 'Kurung Siku', latex: '\\left[ x \\right]', icon: '[x]' },
        { label: 'Logaritma', latex: '\\log_{10}(x)', icon: 'log' },
        { label: 'Derivatif', latex: '\\frac{dy}{dx}', icon: 'dy/dx' },
        // Quranic / Arabic
        { label: 'Teks Al-Quran', latex: '[q]بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ[/q]', icon: 'Quran' },
        { label: 'Basmalah', latex: '[q]بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ[/q]', icon: '﷽' },
    ]);

    // Table Configuration State
    const [isTableConfigOpen, setIsTableConfigOpen] = useState(false);
    const [tableRows, setTableRows] = useState(2);
    const [tableCols, setTableCols] = useState(2);

    // Categorization State
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        loadData();
        // Bind Katex to window for Quill formula support
        if (typeof window !== 'undefined') {
            const katex = require('katex');
            (window as any).katex = katex;
        }
    }, [bankId]);

    const loadData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const organization = await getProctorOrganization(user.id);
            if (organization) {
                setOrg(organization);
                const qList = await getBankQuestions(bankId);
                setQuestions(qList);
            }
        }
        setIsLoading(false);
    };

    const handleOpenEditor = (q: any = null) => {
        if (q) {
            setEditingQuestion(q);
            setSelectedType(q.type);
            setQuestionText(q.question_text);
            setScoreDefault(q.score_default || 1);
            setMetadata(q.metadata || {});
            setCategories(q.metadata?.categories || []);
            setOptions(q.bank_question_options.map((o: any) => ({
                id: o.id,
                text: o.option_text,
                isCorrect: o.is_correct,
                order: o.order,
                weight: o.weight,
                match_text: o.metadata?.match_text,
                category_name: o.metadata?.category_name
            })));
        } else {
            setEditingQuestion(null);
            setSelectedType('mcq');
            setQuestionText('');
            setScoreDefault(1);
            setMetadata({});
            setCategories([]);
            setOptions([
                { text: '', isCorrect: true, order: 0, weight: 1 },
                { text: '', isCorrect: false, order: 1, weight: 0 },
                { text: '', isCorrect: false, order: 2, weight: 0 },
                { text: '', isCorrect: false, order: 3, weight: 0 },
                { text: '', isCorrect: false, order: 4, weight: 0 }
            ]);
        }
        setIsEditorOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org) return;
        setIsSubmitting(true);

        const result = await saveQuestionAction({
            id: editingQuestion?.id,
            bankId: bankId,
            orgId: org.id,
            type: selectedType,
            questionText,
            difficulty: 'medium',
            scoreDefault: scoreDefault,
            metadata: {
                ...metadata,
                categories: selectedType === 'categorization' ? categories : []
            },
            options: (selectedType === 'short_answer' || selectedType === 'essay') ? [] : options.map((opt, i) => ({
                id: opt.id,
                text: opt.text,
                isCorrect: opt.isCorrect,
                order: i,
                weight: 1,
                metadata: {
                    match_text: opt.match_text,
                    category_name: opt.category_name
                }
            }))
        });

        if (result.success) {
            setIsEditorOpen(false);
            await loadData();
        } else {
            alert('Gagal menyimpan soal: ' + result.error);
        }
        setIsSubmitting(false);
    };

    const addOption = () => setOptions([...options, { text: '', isCorrect: false, order: options.length, weight: 0 }]);
    const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
    const updateOption = (idx: number, fields: any) => {
        const newOpts = [...options];
        newOpts[idx] = { ...newOpts[idx], ...fields };
        setOptions(newOpts);
    };

    const handleDelete = async (qId: string) => {
        if (!confirm('Apakah anda yakin ingin menghapus soal ini?')) return;

        const result = await deleteQuestionAction(qId, bankId);
        if (result.success) {
            await loadData();
        } else {
            alert('Gagal menghapus soal: ' + result.error);
        }
    };

    const handleOpenView = (q: any) => {
        setViewingQuestion(q);
        setMatchingAnswers({});
        setSelectedLeft(null);
        setIsViewModalOpen(true);
    };

    const insertTable = () => {
        if (!quillInstance) return;

        let tableHtml = '<table style="width: 100%; border-collapse: collapse; border: 1px solid #e1e1e1; margin: 10px 0;"><tbody>';
        for (let r = 0; r < tableRows; r++) {
            tableHtml += '<tr>';
            for (let c = 0; c < tableCols; c++) {
                tableHtml += '<td style="border: 1px solid #e1e1e1; padding: 12px; min-height: 40px;">&nbsp;</td>';
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table><p><br></p>';

        const range = quillInstance.getSelection(true);
        const index = range ? range.index : 0;
        quillInstance.clipboard.dangerouslyPasteHTML(index, tableHtml);
        setIsTableConfigOpen(false);
    };

    const handleImportCSV = async () => {
        if (!importFile) return;
        setIsImporting(true);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const rows = text.split('\n');

                const newQuestions = [];
                for (let i = 1; i < rows.length; i++) {
                    if (!rows[i].trim()) continue;
                    const cols = rows[i].split(',');

                    const qText = cols[0];
                    const qType = (cols[1] || 'mcq') as QuestionType;
                    const qDiff = (cols[2] || 'medium') as any;
                    const correctIdx = parseInt(cols[3]) || 0;

                    const qOptions = [];
                    for (let j = 4; j < 9; j++) {
                        if (cols[j]) {
                            qOptions.push({
                                option_text: cols[j],
                                is_correct: qOptions.length === correctIdx,
                                order_index: qOptions.length
                            });
                        }
                    }

                    newQuestions.push({
                        bankId: bankId,
                        orgId: org.id,
                        questionText: qText,
                        type: qType,
                        difficulty: qDiff,
                        scoreDefault: 1,
                        options: qOptions.map((o, idx) => ({
                            text: o.option_text,
                            isCorrect: o.is_correct,
                            order: idx,
                            weight: o.is_correct ? 1 : 0
                        }))
                    });
                }

                for (const q of newQuestions) {
                    await saveQuestionAction(q);
                }

                await loadData();
                setIsImportModalOpen(false);
                setImportFile(null);
                alert(`Berhasil mengimport ${newQuestions.length} soal!`);
            };
            reader.readAsText(importFile);
        } catch (err) {
            console.error(err);
            alert("Gagal mengimport soal. Pastikan format CSV benar.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportDocx = async () => {
        if (!importFile || !org) return;
        setIsImporting(true);

        try {
            const parsedQuestions = await parseDocxToQuestions(importFile);

            for (const q of parsedQuestions) {
                await saveQuestionAction({
                    bankId: bankId,
                    orgId: org.id,
                    type: q.type,
                    questionText: q.question_text,
                    difficulty: 'medium',
                    scoreDefault: 1,
                    metadata: q.metadata,
                    options: q.options
                });
            }

            await loadData();
            setIsImportModalOpen(false);
            setImportFile(null);
            alert(`Berhasil mengimport ${parsedQuestions.length} soal dari Word!`);
        } catch (err) {
            console.error(err);
            alert("Gagal mengimport soal dari file Word. Pastikan format file benar.");
        } finally {
            setIsImporting(false);
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.question_text?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[2rem] shadow-premium border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>

                <div className="relative z-10 flex flex-col gap-3">
                    <button
                        onClick={() => router.back()}
                        suppressHydrationWarning
                        className="group flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest hover:translate-x-[-4px] transition-all"
                    >
                        <ChevronLeft size={14} className="group-hover:text-accent transition-colors" /> Kembali ke Bank
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-3 mb-1 uppercase">
                            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
                                <BookOpen size={16} className="text-white -rotate-3" />
                            </div>
                            Butir Soal
                        </h2>
                        <p className="text-slate-400 font-bold text-[8px] uppercase tracking-[0.2em] ml-11">Kurasi & tata kelola mahakarya evaluasi.</p>
                    </div>
                </div>

                <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto relative z-10">
                    <div className="relative flex-1 md:w-56 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Cari soal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none font-bold transition-all placeholder:text-slate-300 text-[11px] shadow-inner"
                        />
                    </div>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        suppressHydrationWarning
                        className="bg-white hover:bg-slate-50 text-primary border-2 border-slate-100 font-black px-6 py-3 rounded-xl transition-all flex items-center gap-2 active:scale-95 text-[9px] uppercase tracking-widest shadow-sm hover:shadow-md"
                    >
                        <Upload size={14} className="text-primary" /> Import Masal
                    </button>
                    <button
                        onClick={() => handleOpenEditor()}
                        suppressHydrationWarning
                        className="bg-primary hover:bg-primary-light text-white font-black px-6 py-3 rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center gap-2 active:scale-95 text-[9px] uppercase tracking-widest"
                    >
                        <Plus size={16} strokeWidth={3} /> Tambah Soal
                    </button>
                </div>
            </header>

            {/* Question List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={40} className="text-primary animate-spin opacity-20" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredQuestions.map((q, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={q.id}
                            className="bg-white border border-slate-100 rounded-[1.5rem] p-5 md:p-6 hover:shadow-xl hover:border-primary/10 transition-all relative group overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-xl shadow-md shadow-primary/10 uppercase tracking-widest italic">
                                    Soal #{idx + 1}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <button
                                        onClick={() => handleOpenView(q)}
                                        className="w-11 h-11 bg-white hover:bg-emerald-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-90"
                                        title="Pratinjau Siswa"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleOpenEditor(q)}
                                        className="w-11 h-11 bg-white hover:bg-primary hover:text-white text-slate-400 rounded-xl transition-all shadow-sm border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-90"
                                        title="Edit"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="w-11 h-11 bg-white hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-90"
                                        title="Hapus"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-3 p-4 bg-slate-50/20 rounded-xl border border-slate-100/50 relative group/qtext transition-all">
                                <div className="text-slate-900 font-bold leading-relaxed text-[13px]">
                                    <LatexRenderer text={q.question_text} />
                                </div>
                            </div>

                            {q.bank_question_options?.filter((o: any) => o.option_text?.trim() !== '')?.length > 0 && (
                                <div className="flex flex-col gap-2.5">
                                    {q.bank_question_options
                                        .filter((o: any) => o.option_text?.trim() !== '')
                                        .sort((a: any, b: any) => a.order - b.order)
                                        .map((opt: any, oIdx: number) => {
                                            const optMeta = opt.metadata || {};
                                            return (
                                                <div key={opt.id} className={`p-3 rounded-xl border transition-all group/opt relative overflow-hidden ${opt.is_correct ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-100 hover:border-slate-300'} flex items-center gap-3`}>
                                                    <span className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-black transition-all ${opt.is_correct ? 'bg-primary text-white shadow-lg' : 'bg-slate-200 text-slate-600 group-hover/opt:bg-slate-300'}`}>
                                                        {q.type === 'true_false' ? (opt.is_correct ? 'B' : 'S') : String.fromCharCode(65 + oIdx)}
                                                    </span>
                                                    <div className="flex-1 space-y-2 min-w-0">
                                                        <div className="text-[11px] font-bold text-slate-700 leading-relaxed">
                                                            <LatexRenderer text={opt.option_text} />
                                                        </div>

                                                        {/* Matching Display */}
                                                        {q.type === 'matching' && optMeta.match_text && (
                                                            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                                                                <ArrowRight size={14} className="text-primary/30" />
                                                                <div className="bg-primary/5 px-4 py-1.5 rounded-xl text-[10px] font-black text-primary border border-primary/10 italic uppercase tracking-widest truncate">
                                                                    {optMeta.match_text}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Categorization Display */}
                                                        {q.type === 'categorization' && optMeta.category_name && (
                                                            <div className="pt-2">
                                                                <span className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                                    {optMeta.category_name}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {opt.is_correct && (q.type === 'mcq' || q.type === 'mcq_complex') && (
                                                        <div className="bg-primary/10 p-1.5 rounded-xl self-start group-hover/opt:scale-110 transition-transform">
                                                            <Check size={16} className="text-primary" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {filteredQuestions.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-20 text-center bg-white border border-dashed border-slate-100 rounded-[2.5rem] shadow-premium relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce transition-all">
                                    <Sparkles size={40} className="text-primary opacity-20" />
                                </div>
                                <h3 className="text-2xl font-black text-primary tracking-tighter uppercase leading-none mb-3">Mulai Mahakarya Anda</h3>
                                <p className="text-slate-400 font-bold mt-2 text-[11px] max-w-xs mx-auto leading-relaxed">Bank soal ini menanti sentuhan kreatifitas anda. Buat butir soal pertama untuk memulai evaluasi berkualitas.</p>
                                <button
                                    onClick={() => handleOpenEditor()}
                                    className="bg-primary text-white font-black px-10 py-5 rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:bg-primary-light transition-all flex items-center gap-3 mx-auto text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95"
                                >
                                    <Plus size={20} strokeWidth={3} /> Buat Butir Soal Pertama
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Editor Modal: SMART SPLIT LAYOUT */}
            <AnimatePresence>
                {isEditorOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditorOpen(false)} />
                        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="bg-white w-full max-w-[1240px] h-full md:h-[90vh] rounded-none md:rounded-3xl overflow-hidden relative z-10 shadow-2xl flex flex-col border border-white/50">

                            {/* Decorative Background Elements */}
                            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] gaussian-blur blur-navy-white opacity-40"></div>
                            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] gaussian-blur blur-orange-white opacity-20"></div>
                            <div className="noise-bg opacity-[0.015]"></div>

                            {/* Editor Header */}
                            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center relative z-20 bg-gradient-to-r from-primary/10 via-transparent to-accent/5 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-2">
                                        <Hash size={24} className="text-white -rotate-2" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-primary tracking-tighter uppercase leading-none">
                                            Soal Nomor <span className="text-accent italic">{editingQuestion ? questions.indexOf(editingQuestion) + 1 : questions.length + 1}</span>
                                        </h3>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                                            UNELMA Assessment Design Studio
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setIsEditorOpen(false)}
                                        className="px-6 py-3 font-black text-[10px] text-slate-400 hover:text-rose-500 transition-all uppercase tracking-widest active:scale-95"
                                    >
                                        Batal
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                        className="bg-primary hover:bg-primary-light text-white px-8 py-3.5 rounded-2xl font-black shadow-2xl shadow-primary/30 flex items-center gap-3 transition-all active:scale-95 text-[10px] uppercase tracking-[0.2em]"
                                    >
                                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={16} strokeWidth={3} />}
                                        Simpan Mahakarya
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex overflow-hidden relative z-10 bg-slate-50/20">
                                {/* LEFT PANEL: INPUT */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                                    <form id="q-editor" className="space-y-10 pb-12">

                                        {/* Configuration Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/40 p-6 rounded-[2rem] border border-white/60 backdrop-blur-sm">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Layout size={14} className="text-primary" /> Tipe Evaluasi
                                                </label>
                                                <select
                                                    value={selectedType === 'mcq_complex' ? 'mcq' : selectedType}
                                                    onChange={(e) => setSelectedType(e.target.value as QuestionType)}
                                                    className="w-full bg-white border border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-black text-primary transition-all shadow-sm text-xs cursor-pointer hover:bg-slate-50"
                                                >
                                                    <option value="mcq">Pilihan Ganda (Auto-Detect)</option>
                                                    <option value="true_false">Benar / Salah</option>
                                                    <option value="matching">Penjodohan Data</option>
                                                    <option value="categorization">Kategori Jawaban</option>
                                                    <option value="short_answer">Isian Singkat</option>
                                                    <option value="essay">Uraian / Essay</option>
                                                </select>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Sparkles size={14} className="text-accent" /> Poin Soal
                                                </label>
                                                <div className="relative group/points">
                                                    <input
                                                        type="number"
                                                        value={scoreDefault}
                                                        onChange={(e) => setScoreDefault(Number(e.target.value))}
                                                        className="w-full bg-white border border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none font-black text-primary transition-all shadow-sm text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="Contoh: 1, 5, 10..."
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-accent bg-accent/5 px-3 py-1.5 rounded-xl uppercase tracking-widest opacity-0 group-focus-within/points:opacity-100 transition-opacity">
                                                        Points
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Question Textarea */}
                                        <div className="space-y-2.5 relative group">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                                <span className="flex items-center gap-2"><Type size={12} className="text-primary" /> Redaksi Pertanyaan</span>
                                            </label>
                                            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-premium/5 question-quill-editor">
                                                <ReactQuill
                                                    {...{
                                                        theme: "snow",
                                                        value: questionText,
                                                        onChange: setQuestionText,
                                                        placeholder: "Tuangkan deskripsi pertanyaan di sini...",
                                                        modules: {
                                                            toolbar: {
                                                                container: [
                                                                    [{ 'header': [1, 2, 3, false] }],
                                                                    ['bold', 'italic', 'underline', 'strike'],
                                                                    [{ 'color': [] }, { 'background': [] }],
                                                                    [{ 'script': 'sub' }, { 'script': 'super' }],
                                                                    [{ 'align': [] }],
                                                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                    [{ 'indent': '-1' }, { 'indent': '+1' }],
                                                                    ['link', 'image', 'video', 'formula'],
                                                                    ['table'],
                                                                    ['symbol'],
                                                                    ['clean']
                                                                ],
                                                                handlers: {
                                                                    'symbol': function () {
                                                                        setIsSymbolPickerOpen(true);
                                                                    },
                                                                    'formula': function () {
                                                                        setIsEquationBuilderOpen(true);
                                                                    },
                                                                    'table': function () {
                                                                        setIsTableConfigOpen(true);
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        ref: (el: any) => {
                                                            if (el && !quillInstance) {
                                                                setQuillInstance(el.getEditor());
                                                            }
                                                        }
                                                    } as any}
                                                />
                                            </div>

                                        </div>

                                        {/* Options Editor */}
                                        {(['mcq', 'mcq_complex', 'true_false', 'matching', 'categorization'].includes(selectedType)) && (
                                            <div className="space-y-5">
                                                <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl">
                                                    <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <ListChecks size={14} className="text-primary" />
                                                        {selectedType === 'matching' ? 'Pasangan Item (Matching)' :
                                                            selectedType === 'categorization' ? 'Item & Kategori' : 'Opsi Jawaban'}
                                                    </h4>
                                                    {selectedType !== 'true_false' && (
                                                        <button
                                                            type="button"
                                                            onClick={addOption}
                                                            className="text-[9px] font-black text-white bg-primary hover:bg-primary-light px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 uppercase tracking-widest"
                                                        >
                                                            <Plus size={14} strokeWidth={3} /> {selectedType === 'matching' ? 'Tambah Baris' : 'Tambah Item'}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Categorization: Category Management */}
                                                {selectedType === 'categorization' && (
                                                    <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kelola Daftar Kategori</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {categories.map((cat, idx) => (
                                                                <div key={idx} className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200">
                                                                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{cat}</span>
                                                                    <button type="button" onClick={() => setCategories(categories.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const name = prompt('Input Nama Kategori:');
                                                                    if (name && !categories.includes(name)) setCategories([...categories, name]);
                                                                }}
                                                                className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-primary hover:text-primary transition-all text-[10px] font-bold flex items-center gap-1.5"
                                                            >
                                                                <Plus size={12} /> Kategori Baru
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 gap-4">
                                                    {options.map((opt, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className={`p-5 rounded-2xl border transition-all ${opt.isCorrect ? 'bg-primary/5 border-primary ring-1 ring-primary/20' : 'bg-white border-slate-100 shadow-sm'}`}
                                                        >
                                                            <div className="flex gap-5 items-start">
                                                                {/* Type-based Action Icon */}
                                                                {selectedType === 'mcq' || selectedType === 'mcq_complex' ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newOptions = [...options];
                                                                            newOptions[idx].isCorrect = !newOptions[idx].isCorrect;
                                                                            const correctCount = newOptions.filter(o => o.isCorrect).length;
                                                                            if (correctCount > 1) setSelectedType('mcq_complex');
                                                                            else setSelectedType('mcq');
                                                                            setOptions(newOptions);
                                                                        }}
                                                                        className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${opt.isCorrect ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                                                                    >
                                                                        <Check size={18} strokeWidth={4} />
                                                                    </button>
                                                                ) : selectedType === 'true_false' ? (
                                                                    <div className="flex flex-col gap-1 items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateOption(idx, { isCorrect: true })}
                                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${opt.isCorrect ? 'bg-green-500 text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                                                                        >
                                                                            B
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateOption(idx, { isCorrect: false })}
                                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!opt.isCorrect ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                                                                        >
                                                                            S
                                                                        </button>
                                                                    </div>
                                                                ) : null}

                                                                <div className="flex-1 space-y-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                            {selectedType === 'matching' ? 'Item Domain' :
                                                                                selectedType === 'categorization' ? 'Redaksi Item Soal' : `Opsi ${String.fromCharCode(65 + idx)}`}
                                                                        </span>
                                                                        {opt.isCorrect && (selectedType === 'mcq' || selectedType === 'mcq_complex') && (
                                                                            <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">Kunci Jawaban</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Core Input */}
                                                                    <div className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-xl border border-slate-50">
                                                                        <input
                                                                            required
                                                                            placeholder={selectedType === 'matching' ? "Tulis item sebelah kiri..." : "Tulis teks jawaban di sini..."}
                                                                            value={opt.text}
                                                                            onChange={(e) => updateOption(idx, { text: e.target.value })}
                                                                            className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
                                                                        />

                                                                        {/* Matching: Kodomain Input */}
                                                                        {selectedType === 'matching' && (
                                                                            <div className="flex items-center gap-4 animate-in slide-in-from-left-2 duration-300">
                                                                                <div className="w-8 h-[2px] bg-primary/20 rounded-full relative">
                                                                                    <div className="absolute right-[-2px] top-[-3px] border-t-4 border-b-4 border-l-6 border-transparent border-l-primary/30"></div>
                                                                                </div>
                                                                                <input
                                                                                    required
                                                                                    placeholder="Tulis item sebelah kanan..."
                                                                                    value={opt.match_text || ''}
                                                                                    onChange={(e) => updateOption(idx, { match_text: e.target.value })}
                                                                                    className="flex-1 bg-white border border-slate-100 rounded-lg px-4 py-2 text-sm font-bold text-primary outline-none focus:border-primary transition-all shadow-sm"
                                                                                />
                                                                            </div>
                                                                        )}

                                                                        {/* Categorization: Category Select */}
                                                                        {selectedType === 'categorization' && (
                                                                            <select
                                                                                value={opt.category_name || ''}
                                                                                onChange={(e) => updateOption(idx, { category_name: e.target.value })}
                                                                                className="bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-[10px] font-black text-primary outline-none focus:border-primary shadow-sm"
                                                                            >
                                                                                <option value="">Pilih Kategori</option>
                                                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                                            </select>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {options.length > 2 && selectedType !== 'true_false' && (
                                                                    <button type="button" onClick={() => removeOption(idx)} className="mt-6 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                                        <Trash2 size={20} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </div>

                                {/* RIGHT PANEL: LIVE PREVIEW */}
                                <div className="w-[420px] border-l border-slate-100 bg-white flex flex-col relative hidden lg:flex shrink-0">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                                    <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 backdrop-blur-md relative z-10">
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Live Preview Siswa
                                        </h4>
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10 relative z-10 bg-gradient-to-b from-slate-50/50 to-white">
                                        <div className="space-y-8">
                                            <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-premium relative overflow-hidden min-h-[120px] group/preview-box">
                                                <div className="absolute top-0 right-0 w-1.5 h-full bg-primary/10 group-hover/preview-box:bg-primary/20 transition-colors"></div>
                                                <div className="text-[15px] font-bold text-slate-900 leading-relaxed">
                                                    {questionText ? <LatexRenderer text={questionText} /> : <span className="text-slate-200 italic font-medium">Mulai merangkai pertanyaan anda di panel kiri...</span>}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {options
                                                    ?.filter((o: any) => o.text?.trim() !== '')
                                                    ?.map((opt: any, i: number) => (
                                                        <div key={i} className="flex flex-col gap-2 p-5 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-right-6 duration-500 group/preview-opt">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs shrink-0 shadow-inner group-hover/preview-opt:bg-primary/5 group-hover/preview-opt:text-primary transition-all">
                                                                    {selectedType === 'true_false' ? (opt.isCorrect ? 'B' : 'S') : String.fromCharCode(65 + i)}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-[13px] font-bold text-slate-700 leading-snug">
                                                                        <LatexRenderer text={opt.text} />
                                                                    </div>

                                                                    {selectedType === 'matching' && opt.match_text && (
                                                                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                                                                            <ChevronRight size={14} className="text-primary opacity-30" />
                                                                            <div className="bg-primary/5 px-3 py-1.5 rounded-lg text-[9px] font-black text-primary border border-primary/10 tracking-widest uppercase italic">
                                                                                {opt.match_text}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {selectedType === 'categorization' && opt.category_name && (
                                                                        <div className="mt-3 text-[8px] font-black text-white bg-primary px-3 py-1 rounded-lg uppercase tracking-widest inline-block shadow-lg shadow-primary/10 italic">
                                                                            {opt.category_name}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white border-t border-slate-50 text-center">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] leading-relaxed">
                                            Interactive Live Environment<br />
                                            <span className="text-[7px] text-primary/40 font-black tracking-[0.2em]">Verified by UNELMA Framework Studio</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Student View Modal */}
            <AnimatePresence>
                {isViewModalOpen && viewingQuestion && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-slate-950/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-[480px] rounded-[1.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
                            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-lg font-black text-primary uppercase italic tracking-tighter flex items-center gap-3">
                                    <Eye size={20} /> Preview Siswa
                                </h3>
                                <button onClick={() => setIsViewModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-5 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                                <div className="p-5 md:p-6 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-primary/10"></div>
                                    <div className="text-[15px] font-bold text-slate-900 leading-relaxed">
                                        <LatexRenderer text={viewingQuestion.question_text} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {(viewingQuestion.type === 'matching' || viewingQuestion.type === 'categorization') && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                                            <Sparkles size={16} className="text-primary" />
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">
                                                Mode: {viewingQuestion.type === 'matching' ? 'Penjodohan' : 'Pengelompokkan'}
                                            </span>
                                        </div>
                                    )}

                                    {viewingQuestion.type === 'matching' ? (
                                        <InteractiveMatching
                                            question={viewingQuestion}
                                            answers={matchingAnswers}
                                            onAnswerChange={(leftId, rightText) => {
                                                if (!leftId) {
                                                    setMatchingAnswers({});
                                                    return;
                                                }
                                                setMatchingAnswers(prev => ({ ...prev, [leftId]: rightText }));
                                            }}
                                            selectedLeft={selectedLeft}
                                            onSelectLeft={setSelectedLeft}
                                        />
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {viewingQuestion.bank_question_options
                                                ?.filter((o: any) => o.option_text?.trim() !== '')
                                                ?.sort((a: any, b: any) => a.order - b.order)
                                                .map((opt: any, i: number) => {
                                                    const optMeta = opt.metadata || {};
                                                    return (
                                                        <div key={opt.id} className="flex flex-col gap-2 p-3 md:p-4 rounded-xl border-2 border-slate-50 hover:border-primary/20 transition-all group cursor-pointer active:scale-[0.98] bg-white">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-all text-xs shrink-0">
                                                                    {viewingQuestion.type === 'true_false' ? (opt.is_correct ? 'B' : 'S') : String.fromCharCode(65 + i)}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-[13px] font-bold text-slate-700 group-hover:text-primary leading-tight">
                                                                        <LatexRenderer text={opt.option_text} />
                                                                    </div>

                                                                    {/* Categorization Preview */}
                                                                    {viewingQuestion.type === 'categorization' && optMeta.category_name && (
                                                                        <div className="mt-3 flex items-center gap-2">
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Kategori: </span>
                                                                            <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter italic">
                                                                                {optMeta.category_name}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Visual Equation Builder (MathType-style) */}
            <AnimatePresence>
                {isEquationBuilderOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                                        <Hash size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-primary uppercase tracking-tighter leading-none">Equation Builder</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">MathType Visual Palette</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsEquationBuilderOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* Palette Categories */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {equationPalette.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setLatexInput(prev => prev + item.latex)}
                                            className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary hover:bg-white hover:shadow-lg transition-all group"
                                        >
                                            <span className="text-xl font-serif text-slate-400 group-hover:text-primary mb-1">{item.icon}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary-light">{item.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* LaTeX Input Area */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                                        <Type size={14} className="text-primary" /> Editor LaTeX
                                    </label>
                                    <textarea
                                        value={latexInput}
                                        onChange={(e) => setLatexInput(e.target.value)}
                                        placeholder="Ketik LaTeX atau klik palet di atas..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 font-mono text-sm text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all resize-none h-32"
                                    />
                                </div>

                                {/* Render Preview */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                                        <Eye size={14} className="text-primary" /> Preview Matematika
                                    </label>
                                    <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-8 flex items-center justify-center min-h-[120px] text-xl text-primary overflow-x-auto shadow-inner">
                                        {latexInput ? (
                                            <BlockMath math={latexInput} />
                                        ) : (
                                            <span className="text-slate-200 font-bold text-xs uppercase tracking-widest">Pratinjau rumus akan muncul di sini...</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLatexInput('');
                                        setIsEquationBuilderOpen(false);
                                    }}
                                    className="px-8 py-4 font-black text-xs text-slate-400 hover:text-primary transition-all uppercase tracking-widest italic"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (latexInput) {
                                            setQuestionText(prev => prev + ` $${latexInput}$ `);
                                            setLatexInput('');
                                            setIsEquationBuilderOpen(false);
                                        }
                                    }}
                                    className="bg-primary text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-[0.2em] italic"
                                >
                                    <Check size={18} /> Sisipkan Rumus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isSymbolPickerOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
                            <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-sm font-black text-primary uppercase italic tracking-widest flex items-center gap-2">
                                    <Hash size={16} /> Insert Simbol
                                </h3>
                                <button onClick={() => setIsSymbolPickerOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 grid grid-cols-6 gap-2">
                                {['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'π', 'ρ', 'σ', 'τ', 'φ', 'ω', 'Δ', 'Ω', '±', '×', '÷', '≈', '≠', '≤', '≥', '∞', '√', '∫', '∑', '→'].map(sym => (
                                    <button
                                        key={sym}
                                        type="button"
                                        onClick={() => {
                                            const quill = (document.querySelector('.question-quill-editor .ql-editor') as any);
                                            // This is a bit hacky since we don't have direct ref easily in this dynamic setup, 
                                            // but we can use the onChange or a global ref if we set it up.
                                            // For now, let's just append to the text or use a better way if possible.
                                            setQuestionText(prev => prev + sym);
                                            setIsSymbolPickerOpen(false);
                                        }}
                                        className="w-full aspect-square flex items-center justify-center text-lg font-bold text-slate-600 hover:bg-primary hover:text-white rounded-xl transition-all border border-slate-50"
                                    >
                                        {sym}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;700;900&display=swap');
                
                .ql-symbol::before {
                    content: 'Ω' !important;
                    font-family: 'Inter', sans-serif;
                    font-weight: 900;
                    font-size: 14px;
                }
                
                :root {
                    --primary: #030c4d;
                    --secondary: #f8a01b;
                    --accent: #f8a01b;
                }

                 .quran-text {
                    font-family: 'Amiri', serif;
                }

                .question-quill-editor .ql-container {
                    border: none !important;
                    min-height: 220px;
                    font-family: 'Inter', sans-serif;
                    font-size: 1rem;
                    color: var(--primary);
                    padding: 0.5rem;
                }
                .question-quill-editor .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 1rem !important;
                }
                .question-quill-editor .ql-editor {
                    min-height: 220px;
                    padding: 1.5rem 2rem;
                }
                .question-quill-editor .ql-editor.ql-blank::before {
                    color: #cbd5e1;
                    font-style: italic;
                    font-weight: 700;
                    left: 2rem;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                
                /* Table Styles */
                .rich-content table, .ql-editor table {
                    width: 100% !important;
                    border-collapse: collapse;
                    margin: 1rem 0;
                    border: 2px solid #f1f5f9;
                    border-radius: 1rem;
                    overflow: hidden;
                }
                .rich-content td, .ql-editor td {
                    border: 1px solid #f1f5f9;
                    padding: 12px 16px;
                    min-height: 50px;
                    vertical-align: top;
                }
                .ql-editor td {
                    cursor: text;
                }
                
                /* Quranic Text Styles */
                .quran-text {
                    font-family: 'Amiri', serif;
                    direction: rtl;
                    font-size: 1.75rem;
                    line-height: 2.2;
                    display: inline-block;
                    padding: 0 0.5rem;
                    color: #030c4d;
                    text-align: right;
                    word-spacing: 0.1em;
                    font-weight: 500;
                }
            `}</style>
            <AnimatePresence>
                {isTableConfigOpen && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
                            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Layout size={16} /> Konfigurasi Tabel
                                </h3>
                                <button onClick={() => setIsTableConfigOpen(false)} className="text-slate-400 hover:text-rose-500">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Baris</label>
                                        <input
                                            type="number"
                                            min="1" max="10"
                                            value={tableRows}
                                            onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-primary outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Kolom</label>
                                        <input
                                            type="number"
                                            min="1" max="10"
                                            value={tableCols}
                                            onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-primary outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={insertTable}
                                    className="w-full bg-primary text-white py-4 rounded-xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 text-[10px] uppercase tracking-widest italic"
                                >
                                    <Plus size={16} /> Sisipkan Tabel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
                            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-primary uppercase italic tracking-widest flex items-center gap-3">
                                        <Upload size={22} /> Import Soal Masal
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih metode import yang Anda inginkan</p>
                                </div>
                                <button onClick={() => setIsImportModalOpen(false)} className="bg-slate-100 text-slate-400 hover:text-rose-500 p-2 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-10 space-y-8">
                                {/* Type Selector */}
                                <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-100">
                                    <button
                                        onClick={() => setImportType('docx')}
                                        className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${importType === 'docx' ? 'bg-white text-primary shadow-lg' : 'text-slate-400 hover:text-primary'}`}
                                    >
                                        Microsoft Word (.docx)
                                    </button>
                                    <button
                                        onClick={() => setImportType('csv')}
                                        className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${importType === 'csv' ? 'bg-white text-primary shadow-lg' : 'text-slate-400 hover:text-primary'}`}
                                    >
                                        CSV Template
                                    </button>
                                </div>

                                {importType === 'csv' ? (
                                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-start gap-4">
                                        <div className="bg-primary/10 p-3 rounded-xl text-primary">
                                            <FileText size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-primary">Gunakan Template CSV</p>
                                            <p className="text-[11px] text-primary/70 leading-relaxed font-medium">Pastikan kolom seperti 'pertanyaan', 'opsi', dan 'jawaban' sudah terisi dengan benar.</p>
                                            <button
                                                onClick={() => {
                                                    const csvContent = "Pertanyaan,Tipe Soal,Kesulitan,Indeks Jawaban Benar,Pilihan 1,Pilihan 2,Pilihan 3,Pilihan 4,Pilihan 5\nContoh Pertanyaan Matematika: Berapa 1+1?,mcq,easy,0,2,3,4,5,6";
                                                    const blob = new Blob([csvContent], { type: 'text/csv' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = 'template_soal.csv';
                                                    a.click();
                                                }}
                                                className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 mt-3 hover:gap-3 transition-all underline decoration-primary/20"
                                            >
                                                <Download size={14} /> Download Template CSV
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex items-start gap-4">
                                        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                                            <FileText size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-emerald-900">Format Microsoft Word</p>
                                            <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">Tulis soal dengan nomor (1. 2.), opsi (a. b.), dan kunci (Kunci: A). Dukungan rumus matematika dan klasifikasi [MATCHING], [ESSAY], dll.</p>
                                            <a
                                                href="/template_soal.docx"
                                                download="template_soal.docx"
                                                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mt-3 hover:gap-3 transition-all underline decoration-emerald-200"
                                            >
                                                <Download size={14} /> Download Template Word
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center space-y-4 hover:border-primary/30 hover:bg-slate-50/50 transition-all cursor-pointer group relative">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        <Upload size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-600 uppercase italic tracking-widest">Pilih File {importType.toUpperCase()} di sini</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {importFile ? `Berkas terpilih: ${importFile.name}` : 'Atau seret dan lepas file Anda'}
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept={importType === 'csv' ? ".csv" : ".docx"}
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Batal</button>
                                    <button
                                        onClick={importType === 'csv' ? handleImportCSV : handleImportDocx}
                                        disabled={isImporting || !importFile}
                                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${isImporting || !importFile ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-primary shadow-primary/20 hover:scale-[1.02] active:scale-98'}`}
                                    >
                                        {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                        {isImporting ? 'Memproses...' : 'Mulai Import'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
