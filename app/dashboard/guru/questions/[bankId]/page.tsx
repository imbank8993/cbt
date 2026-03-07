"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, ChevronLeft,
    ChevronUp, ChevronDown,
    Trash2, Edit3,
    Save, X, Check, Loader2,
    BookOpen, Eye, Layout,
    Type, ListChecks, Hash,
    ArrowRight, Sparkles, Activity, Zap,
    Clock, ShieldCheck, FileDown, MoreVertical,
    Upload, Download, FileText, Target, List, FileSearch, Image as ImageIcon, Crop
} from 'lucide-react';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, BorderStyle, TextRun, AlignmentType, VerticalAlign } from "docx";
import { getBankQuestions, saveQuestionAction, deleteQuestionAction, QuestionType, getQuestionBankAction, updateQuestionsOrderAction, toggleQuestionBankPublishAction, updateQuestionMetadataAction } from '@/app/actions/question';
import { generateKisiKisiAction } from '@/app/actions/ai';
import { getProctorOrganization } from '@/app/actions/proktor';
import { parseDocxToQuestions } from '@/lib/doc-parser';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import ImageCropperModal from '@/app/components/ImageCropperModal';
import { uploadToHosting } from '@/lib/uploader';

// Rich Text Editor Support
const ReactQuill = dynamic(async () => {
    const { default: RQ } = await import('react-quill-new');
    const { default: ImageResize } = await import('quill-image-resize-module-react');
    const Quill = (RQ as any).Quill;
    if (Quill) {
        Quill.register('modules/imageResize', ImageResize);
    }
    return RQ;
}, {
    ssr: false,
    loading: () => <div className="h-[220px] w-full bg-slate-50 animate-pulse rounded-[2rem]" />
});
import 'react-quill-new/dist/quill.snow.css';

// LaTeX Support
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { QuestionRenderer } from '@/app/components/questions/QuestionRenderer';
import { LatexRenderer } from '@/app/components/questions/LatexRenderer';


/**
 * UI Components for rendering question previews are now imported from @/app/components/questions
 */


export default function BankDetailPage() {
    const params = useParams();
    const bankId = params.bankId as string;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [org, setOrg] = useState<any>(null);
    const [bankInfo, setBankInfo] = useState<any>(null);
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
    const [editorMatchingLinks, setEditorMatchingLinks] = useState<{ x1: number, y1: number, x2: number, y2: number }[]>([]);
    const editorMatchingContainerRef = useRef<HTMLDivElement>(null);

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
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedResults, setSimulatedResults] = useState<{ score: number, max: number } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'csv' | 'docx'>('docx');
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [doubtfulPreviews, setDoubtfulPreviews] = useState<Set<string>>(new Set());

    // Resizable Columns State
    const [columnWidths, setColumnWidths] = useState({
        question: 45,
        options: 40,
        matrix: 15
    });
    const [isResizing, setIsResizing] = useState<string | null>(null);

    // Visual Equation Builder State (MathType-style)
    const [isEquationBuilderOpen, setIsEquationBuilderOpen] = useState(false);
    const [latexInput, setLatexInput] = useState('');
    // Cropper & Resize State
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [cropperContext, setCropperContext] = useState<{ type: 'question' | 'option' | 'matching_right' | 'option_replace' | 'matching_replace', index?: number, item?: string }>({ type: 'question' });

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

    // Kisi-kisi State
    const [kisiKisi, setKisiKisi] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState<string | null>(null);

    useEffect(() => {
        loadData();
        // Bind Katex to window for Quill formula support
        if (typeof window !== 'undefined') {
            const katex = require('katex');
            (window as any).katex = katex;
        }
    }, [bankId]);

    // PREVIEW PERSISTENCE: Sync with URL params
    useEffect(() => {
        if (isLoading || questions.length === 0) return;

        const previewParam = searchParams.get('preview');
        if (previewParam) {
            if (previewParam === 'all') {
                setIsViewModalOpen(true);
                setViewingQuestion(null);
            } else {
                const q = questions.find(q => q.id === previewParam);
                if (q) {
                    setViewingQuestion(q);
                    setIsViewModalOpen(true);
                }
            }
        } else {
            setIsViewModalOpen(false);
        }

        const indexParam = searchParams.get('index');
        if (indexParam) {
            setCurrentPreviewIndex(parseInt(indexParam) || 0);
        }

        // Restore column widths from localStorage
        const savedWidths = localStorage.getItem(`preview_widths_${bankId}`);
        if (savedWidths) {
            try { setColumnWidths(JSON.parse(savedWidths)); } catch (e) { }
        }
    }, [searchQuery, searchParams, isLoading, questions]);

    const handleExportWord = async (isTemplate = false) => {
        const questionsToExport = isTemplate ? [] : questions;

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: isTemplate ? "TEMPLATE IMPORT SOAL - GURU" : `EXPORT SOAL - ${bankInfo?.title || 'BANK SOAL'}`,
                                bold: true,
                                size: 32,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: isTemplate
                                    ? "Petunjuk: Isi tabel di bawah ini. Jangan menghapus header tabel. Simpan dalam format .docx lalu upload ke menu Import. Soal bergambar: sisipkan gambar langsung di kolom Pertanyaan."
                                    : "Berikut adalah daftar soal yang diekspor dari sistem.",
                                size: 18,
                            }),
                        ],
                        spacing: { after: 200 },
                    }),
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE,
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pertanyaan", bold: true })] })], width: { size: 45, type: WidthType.PERCENTAGE } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tipe", bold: true })] })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Opsi (Satu baris per opsi)", bold: true })] })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kunci", bold: true })] })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Poin", bold: true })] })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                                ],
                            }),
                            ...(questionsToExport.length > 0 ? questionsToExport.map((q, idx) => {
                                const cleanHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

                                let kunci = "";
                                if (q.type === 'mcq' || q.type === 'mcq_complex') {
                                    kunci = q.bank_question_options
                                        ?.filter((o: any) => o.is_correct)
                                        .map((o: any) => String.fromCharCode(65 + q.bank_question_options.indexOf(o)))
                                        .join(', ') || "";
                                } else if (q.type === 'true_false') {
                                    kunci = q.bank_question_options?.find((o: any) => o.is_correct)?.option_text || "";
                                } else if (q.type === 'short_answer') {
                                    const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : (q.metadata || {});
                                    kunci = meta.blanks?.[0]?.variations?.[0] || "";
                                } else if (q.type === 'matching') {
                                    kunci = q.bank_question_options?.map((o: any) => `${o.option_text} == ${o.metadata?.match_text}`).join('\n') || "";
                                } else if (q.type === 'categorization') {
                                    kunci = q.bank_question_options?.map((o: any) => `${o.option_text} -> ${o.metadata?.category_name}`).join('\n') || "";
                                }

                                return new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph((idx + 1).toString())] }),
                                        new TableCell({ children: [new Paragraph(cleanHtml(q.question_text))] }),
                                        new TableCell({ children: [new Paragraph(q.type.toUpperCase())] }),
                                        new TableCell({ children: q.bank_question_options?.map((o: any) => new Paragraph(o.option_text)) || [] }),
                                        new TableCell({ children: [new Paragraph(kunci)] }),
                                        new TableCell({ children: [new Paragraph((q.score_default || 1).toString())] }),
                                    ]
                                });
                            }) : [
                                // Contoh 1: Pilihan Ganda (MCQ)
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("1")] }),
                                        new TableCell({ children: [new Paragraph("Siapakah presiden pertama Indonesia?")] }),
                                        new TableCell({ children: [new Paragraph("MCQ")] }),
                                        new TableCell({
                                            children: [
                                                new Paragraph("A. Soekarno"),
                                                new Paragraph("B. Soeharto"),
                                                new Paragraph("C. Habibie"),
                                                new Paragraph("D. Megawati"),
                                            ]
                                        }),
                                        new TableCell({ children: [new Paragraph("A")] }),
                                        new TableCell({ children: [new Paragraph("1")] }),
                                    ]
                                }),
                                // Contoh 2: PG Kompleks (PGK)
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("2")] }),
                                        new TableCell({ children: [new Paragraph("Manakah yang termasuk planet dalam tata surya? (Pilih semua yang benar)")] }),
                                        new TableCell({ children: [new Paragraph("PGK")] }),
                                        new TableCell({
                                            children: [
                                                new Paragraph("A. Mars"),
                                                new Paragraph("B. Matahari"),
                                                new Paragraph("C. Bumi"),
                                                new Paragraph("D. Bulan"),
                                            ]
                                        }),
                                        new TableCell({ children: [new Paragraph("A, C")] }),
                                        new TableCell({ children: [new Paragraph("2")] }),
                                    ]
                                }),
                                // Contoh 3: Benar/Salah (BS)
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("3")] }),
                                        new TableCell({ children: [new Paragraph("Air mendidih pada suhu 100 derajat Celcius pada tekanan 1 atm.")] }),
                                        new TableCell({ children: [new Paragraph("BS")] }),
                                        new TableCell({
                                            children: [
                                                new Paragraph("Benar"),
                                                new Paragraph("Salah"),
                                            ]
                                        }),
                                        new TableCell({ children: [new Paragraph("A")] }),
                                        new TableCell({ children: [new Paragraph("1")] }),
                                    ]
                                }),
                                // Contoh 4: Menjodohkan (MATCHING)
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("4")] }),
                                        new TableCell({ children: [new Paragraph("Jodohkan negara dengan ibu kotanya")] }),
                                        new TableCell({ children: [new Paragraph("MATCHING")] }),
                                        new TableCell({
                                            children: [
                                                new Paragraph("Indonesia"),
                                                new Paragraph("Jepang"),
                                                new Paragraph("Thailand"),
                                            ]
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph("Jakarta"),
                                                new Paragraph("Tokyo"),
                                                new Paragraph("Bangkok"),
                                            ]
                                        }),
                                        new TableCell({ children: [new Paragraph("3")] }),
                                    ]
                                }),
                                // Contoh 5: Kategorisasi (CAT)
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("5")] }),
                                        new TableCell({ children: [new Paragraph("Kelompokkan hewan berikut ke dalam kategori yang tepat")] }),
                                        new TableCell({ children: [new Paragraph("CAT")] }),
                                        new TableCell({
                                            children: [
                                                new Paragraph("Kucing"),
                                                new Paragraph("Ikan Mas"),
                                                new Paragraph("Elang"),
                                            ]
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph("Mamalia"),
                                                new Paragraph("Ikan"),
                                                new Paragraph("Burung"),
                                            ]
                                        }),
                                        new TableCell({ children: [new Paragraph("3")] }),
                                    ]
                                }),
                                // Contoh 6: Isian Singkat (ISIAN)
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("6")] }),
                                        new TableCell({ children: [new Paragraph("Ibu kota negara Indonesia adalah ___")] }),
                                        new TableCell({ children: [new Paragraph("ISIAN")] }),
                                        new TableCell({ children: [new Paragraph("")] }),
                                        new TableCell({ children: [new Paragraph("Jakarta")] }),
                                        new TableCell({ children: [new Paragraph("1")] }),
                                    ]
                                }),
                                // Contoh 7: Uraian / Essay
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("7")] }),
                                        new TableCell({ children: [new Paragraph("Jelaskan proses fotosintesis pada tumbuhan!")] }),
                                        new TableCell({ children: [new Paragraph("ESSAY")] }),
                                        new TableCell({ children: [new Paragraph("")] }),
                                        new TableCell({ children: [new Paragraph("")] }),
                                        new TableCell({ children: [new Paragraph("5")] }),
                                    ]
                                }),
                                // Contoh 8: Soal bergambar (MCQ + gambar)
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("8")] }),
                                        new TableCell({ children: [new Paragraph("Perhatikan gambar berikut: [SISIPKAN GAMBAR DI SINI]. Apa nama organ tubuh yang ditunjuk?")] }),
                                        new TableCell({ children: [new Paragraph("MCQ")] }),
                                        new TableCell({
                                            children: [
                                                new Paragraph("A. Jantung"),
                                                new Paragraph("B. Paru-paru"),
                                                new Paragraph("C. Hati"),
                                                new Paragraph("D. Ginjal"),
                                            ]
                                        }),
                                        new TableCell({ children: [new Paragraph("B")] }),
                                        new TableCell({ children: [new Paragraph("1")] }),
                                    ]
                                }),
                            ])
                        ],
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = isTemplate ? 'template_soal_guru.docx' : `export_${bankInfo?.title || 'soal'}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExportKisiKisi = async () => {
        if (!questions.length) return;

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `KISI-KISI & INDIKATOR SOAL - ${bankInfo?.title || 'BANK SOAL'}`,
                                bold: true,
                                size: 32,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE,
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })] })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Materi / Indikator", bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kisi-Kisi & Tujuan Pembelajaran", bold: true })] })], width: { size: 60, type: WidthType.PERCENTAGE } }),
                                ],
                            }),
                            ...questions.map((q, idx) => {
                                const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : (q.metadata || {});
                                return new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph((idx + 1).toString())] }),
                                        new TableCell({ children: [new Paragraph(q.question_text.substring(0, 50) + "...")] }),
                                        new TableCell({ children: [new Paragraph(meta.kisi_kisi || "-")] }),
                                    ]
                                });
                            })
                        ],
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kisi_kisi_${bankInfo?.title || 'soal'}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const organization = await getProctorOrganization(user.id);
            if (organization) {
                setOrg(organization);
                const [qList, bDetail] = await Promise.all([
                    getBankQuestions(bankId),
                    getQuestionBankAction(bankId)
                ]);
                setQuestions(qList || []);
                setBankInfo(bDetail);
            }
        }
        setIsLoading(false);
    };

    // Resize Logic
    const handleMouseDown = (e: React.MouseEvent, column: string) => {
        setIsResizing(column);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const container = document.getElementById('preview-grid-container');
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const containerWidth = rect.width;
            const percentage = (mouseX / containerWidth) * 100;

            if (isResizing === 'question') {
                const newQuestionWidth = Math.max(20, Math.min(70, percentage));
                const remaining = 100 - newQuestionWidth;
                const currentRatio = columnWidths.options / (columnWidths.options + columnWidths.matrix);

                const next = {
                    ...columnWidths,
                    question: newQuestionWidth,
                    options: remaining * currentRatio,
                    matrix: remaining * (1 - currentRatio)
                };
                setColumnWidths(next);
                localStorage.setItem(`preview_widths_${bankId}`, JSON.stringify(next));
            } else if (isResizing === 'options') {
                const questionEnd = columnWidths.question;
                const availableForBoth = 100 - questionEnd;
                const mouseInAvailable = percentage - questionEnd;
                const newOptionsWidth = Math.max(10, Math.min(availableForBoth - 10, mouseInAvailable));

                const next = {
                    ...columnWidths,
                    options: newOptionsWidth,
                    matrix: availableForBoth - newOptionsWidth
                };
                setColumnWidths(next);
                localStorage.setItem(`preview_widths_${bankId}`, JSON.stringify(next));
            }
        };

        const handleMouseUp = () => {
            setIsResizing(null);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, columnWidths, bankId]);

    const handleOpenEditor = (q: any = null) => {
        if (q) {
            setEditingQuestion(q);
            setSelectedType(q.type);
            setQuestionText(q.question_text);
            setScoreDefault(q.score_default || 1);
            setMetadata(q.metadata || {});
            setCategories(q.metadata?.categories || []);
            setKisiKisi(q.metadata?.kisi_kisi || '');
            setOptions(q.bank_question_options.map((o: any) => ({
                id: o.id,
                text: o.option_text,
                isCorrect: o.is_correct,
                order: o.order,
                weight: o.weight,
                match_texts: o.metadata?.match_texts || (o.metadata?.match_text ? [o.metadata.match_text] : []),
                category_names: o.metadata?.category_names || (o.metadata?.category_name ? [o.metadata.category_name] : [])
            })));
        } else {
            setEditingQuestion(null);
            setSelectedType('mcq');
            setQuestionText('');
            setScoreDefault(1);
            setMetadata({});
            setCategories([]);
            setKisiKisi('');
            setOptions([
                { text: '', isCorrect: true, order: 0, weight: 1, match_texts: [], category_names: [] },
                { text: '', isCorrect: false, order: 1, weight: 0, match_texts: [], category_names: [] },
                { text: '', isCorrect: false, order: 2, weight: 0, match_texts: [], category_names: [] },
                { text: '', isCorrect: false, order: 3, weight: 0, match_texts: [], category_names: [] }
            ]);
        }
        setIsEditorOpen(true);
    };

    const generateKisiForQuestion = async (qId: string, text: string, opts: any[]) => {
        setIsGeneratingAI(qId);
        try {
            const optTexts = opts.map(o => o.option_text || o.text);
            const res = await generateKisiKisiAction(text, optTexts);
            if (res.success && res.kisi) {
                // Update local question state
                setQuestions(prev => prev.map(q =>
                    q.id === qId ? { ...q, metadata: { ...q.metadata, kisi_kisi: res.kisi } } : q
                ));
                // Persist to DB
                await updateQuestionMetadataAction(qId, { kisi_kisi: res.kisi });
                alert("Berhasil men-generate kisi-kisi! Silakan cek kartu soal.");
            } else {
                alert(`Gagal men-generate kisi-kisi: ${res.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan teknis saat menghubungi AI.");
        } finally {
            setIsGeneratingAI(null);
        }
    };

    // Auto-Initialize Matching 4x4
    useEffect(() => {
        if (selectedType === 'matching' && options.length <= 1 && (!metadata.right_items || metadata.right_items.length === 0)) {
            setOptions([
                { text: '', isCorrect: false, order: 0, weight: 1, match_texts: [] },
                { text: '', isCorrect: false, order: 1, weight: 1, match_texts: [] },
                { text: '', isCorrect: false, order: 2, weight: 1, match_texts: [] },
                { text: '', isCorrect: false, order: 3, weight: 1, match_texts: [] }
            ]);
            setMetadata((prev: any) => ({
                ...prev,
                right_items: ['Opsi 1', 'Opsi 2', 'Opsi 3', 'Opsi 4']
            }));
        }
    }, [selectedType]);

    // Calculate Editor Matching Lines
    useEffect(() => {
        if (selectedType !== 'matching' || !editorMatchingContainerRef.current) return;

        const updateLines = () => {
            const container = editorMatchingContainerRef.current;
            if (!container) return;
            const containerRect = container.getBoundingClientRect();

            const newLinks: any[] = [];
            options.forEach((opt, idx) => {
                const leftEl = document.getElementById(`editor-matching-left-${idx}`);
                if (!leftEl) return;
                const leftRect = leftEl.getBoundingClientRect();

                (opt.match_texts || []).forEach((rightText: string) => {
                    const rightEl = document.getElementById(`editor-matching-right-${btoa(rightText).replace(/=/g, '')}`);
                    if (!rightEl) return;
                    const rightRect = rightEl.getBoundingClientRect();

                    newLinks.push({
                        x1: leftRect.right - containerRect.left,
                        y1: leftRect.top + leftRect.height / 2 - containerRect.top,
                        x2: rightRect.left - containerRect.left,
                        y2: rightRect.top + rightRect.height / 2 - containerRect.top
                    });
                });
            });
            setEditorMatchingLinks(newLinks);
        };

        const timer = setTimeout(updateLines, 100);
        window.addEventListener('resize', updateLines);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateLines);
        };
    }, [selectedType, options, metadata.right_items, isEditorOpen]);

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
                categories: selectedType === 'categorization' ? categories : [],
                kisi_kisi: kisiKisi
            },
            options: (selectedType === 'short_answer' || selectedType === 'essay') ? [] : options.map((opt, i) => ({
                id: opt.id,
                text: opt.text,
                isCorrect: opt.isCorrect,
                order: i,
                weight: 1,
                metadata: {
                    match_texts: opt.match_texts || [],
                    category_names: opt.category_names || []
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

    // Save layout preference for a question directly from preview
    const handleSetQuestionLayout = async (questionId: string, layout: 'split' | 'wide') => {
        // Optimistic local update
        setQuestions(prev => prev.map(q =>
            q.id === questionId
                ? { ...q, metadata: { ...(q.metadata || {}), question_layout: layout } }
                : q
        ));
        await updateQuestionMetadataAction(questionId, { question_layout: layout });
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

        const params = new URLSearchParams(searchParams.toString());
        if (q?.id) params.set('preview', q.id);
        else params.set('preview', 'all');
        router.push(`${pathname}?${params.toString()}`);
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


    const calculateScore = (q: any, studentAnswer: any) => {
        const type = q.type;
        const options = q.bank_question_options || q.options || [];
        const metadata = q.metadata || {};
        const maxScore = q.score_default || 1;

        if (type === 'mcq' || type === 'true_false') {
            const correctOpt = options.find((o: any) => o.is_correct || o.isCorrect);
            return studentAnswer === correctOpt?.id ? maxScore : 0;
        }

        if (type === 'mcq_complex') {
            let selectedIds = [];
            try { selectedIds = typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : studentAnswer; } catch (e) { }
            if (!Array.isArray(selectedIds)) selectedIds = [];
            const correctIds = options.filter((o: any) => o.is_correct || o.isCorrect).map((o: any) => o.id);
            const isCorrect = selectedIds.length === correctIds.length && selectedIds.every(id => correctIds.includes(id));
            return isCorrect ? maxScore : 0;
        }

        if (type === 'categorization') {
            let studentCats: any = {};
            try { studentCats = typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : studentAnswer; } catch (e) { }
            let correctCount = 0;
            options.forEach((opt: any) => {
                const selected = studentCats[opt.id] || [];
                const correct = opt.category_names || [];
                const isMatch = selected.length === correct.length && selected.every((c: string) => correct.includes(c));
                if (isMatch) correctCount++;
            });
            return (correctCount / (options.length || 1)) * maxScore;
        }

        if (type === 'matching') {
            let studentPairs: any = {};
            try { studentPairs = typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : studentAnswer; } catch (e) { }
            let correctCount = 0;
            options.forEach((opt: any) => {
                const selected = studentPairs[opt.id] || [];
                const correct = opt.metadata?.matching_texts || [];
                const isMatch = selected.length === correct.length && selected.every((m: string) => correct.includes(m));
                if (isMatch) correctCount++;
            });
            return (correctCount / (options.length || 1)) * maxScore;
        }

        if (type === 'short_answer') {
            let studentInputs = [];
            try { studentInputs = typeof studentAnswer === 'string' ? JSON.parse(studentAnswer) : studentAnswer; } catch (e) { }
            if (!Array.isArray(studentInputs)) studentInputs = [];
            const blanks = metadata.blanks || [];
            let correctCount = 0;
            blanks.forEach((b: any, i: number) => {
                const input = (studentInputs[i] || '').trim().toLowerCase();
                const variations = (b.variations || []).map((v: string) => v.trim().toLowerCase());
                if (variations.includes(input)) correctCount++;
            });
            return (correctCount / (blanks.length || 1)) * maxScore;
        }

        return 0; // Essay or unknown
    };

    const runSimulation = () => {
        if (viewingQuestion) {
            const score = calculateScore(viewingQuestion, matchingAnswers[viewingQuestion.id]);
            setSimulatedResults({ score, max: viewingQuestion.score_default || 1 });
        } else {
            // Global simulation
            let total = 0;
            let totalMax = 0;
            filteredQuestions.forEach(q => {
                total += calculateScore(q, matchingAnswers[q.id]);
                totalMax += (q.score_default || 1);
            });
            setSimulatedResults({ score: total, max: totalMax });
        }
        setIsSimulating(true);
    };

    const resetSimulation = () => {
        setIsSimulating(false);
        setSimulatedResults(null);
        setMatchingAnswers({});
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

    const handleMoveQuestion = async (idx: number, direction: 'up' | 'down') => {
        const newQuestions = [...questions];
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

        if (targetIdx < 0 || targetIdx >= newQuestions.length) return;

        // Swap
        const temp = newQuestions[idx];
        newQuestions[idx] = newQuestions[targetIdx];
        newQuestions[targetIdx] = temp;

        setQuestions(newQuestions);

        // Persist to database using new server action
        const orderedIds = newQuestions.map(q => q.id);
        await updateQuestionsOrderAction(bankId, orderedIds);
    };

    const filteredQuestions = (questions || []).filter(q =>
        (q.question_text || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
            {/* Header Area */}
            <header className="flex flex-col gap-8 bg-white p-8 rounded-[2rem] shadow-premium border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>

                {/* Row 1: Title & Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.back()}
                            suppressHydrationWarning
                            className="group flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest hover:translate-x-[-4px] transition-all"
                        >
                            <ChevronLeft size={14} className="group-hover:text-accent transition-colors" /> Kembali ke Bank
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-[#030c4d] tracking-tighter flex items-center gap-3 mb-1 uppercase">
                                <div className="w-9 h-9 bg-gradient-to-br from-[#030c4d] to-[#0a1a6e] rounded-xl flex items-center justify-center shadow-lg shadow-[#030c4d]/20 rotate-3 border border-white/10">
                                    <BookOpen size={18} className="text-[#f8a01b] -rotate-3" />
                                </div>
                                Butir Soal <span className="text-slate-400">Organisasi</span>
                            </h2>
                            <p className="text-slate-400 font-bold text-[8px] uppercase tracking-[0.2em] ml-12">Pusat kontrol dan kurasi evaluasi sekolah.</p>
                        </div>
                    </div>
                </div>

                {/* Row 2: Actions & Search */}
                <div className="flex flex-wrap items-center gap-3 w-full relative z-10 pt-8 border-t border-slate-50">
                    <div className="relative flex-1 min-w-[200px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Cari soal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            suppressHydrationWarning
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none font-bold transition-all placeholder:text-slate-300 text-[11px] shadow-inner"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => {
                                // Implement Global Preview
                                setIsViewModalOpen(true);
                                setViewingQuestion(null); // Signal "All Questions" mode
                                const params = new URLSearchParams(searchParams.toString());
                                params.set('preview', 'all');
                                router.push(`${pathname}?${params.toString()}`);
                            }}
                            suppressHydrationWarning
                            className="bg-[#f8a01b] hover:bg-[#e08e15] text-white font-black px-4 py-3 rounded-xl shadow-xl shadow-[#f8a01b]/20 transition-all flex items-center gap-2 active:scale-95 text-[9px] uppercase tracking-widest"
                        >
                            <Eye size={16} /> Pratinjau
                        </button>

                        <button
                            onClick={async () => {
                                if (!org) return;
                                const newStatus = !bankInfo?.is_published;
                                const result = await toggleQuestionBankPublishAction(bankId, org.id, newStatus);
                                if (result.success) {
                                    alert(newStatus ? 'Berhasil menerbitkan bank soal!' : 'Berhasil menarik publikasi bank soal (Draft).');
                                    await loadData();
                                } else {
                                    alert('Gagal mengubah status: ' + result.error);
                                }
                            }}
                            suppressHydrationWarning
                            className={`font-black px-4 py-3 rounded-xl shadow-xl transition-all flex items-center gap-2 active:scale-95 text-[9px] uppercase tracking-widest border-2 ${bankInfo?.is_published
                                ? 'bg-[#030c4d] text-white border-[#030c4d] shadow-[#030c4d]/20 ring-4 ring-[#030c4d]/10'
                                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 hover:opacity-100 hover:bg-white'}`}
                        >
                            <Check size={16} strokeWidth={4} className={bankInfo?.is_published ? 'text-[#f8a01b]' : 'text-slate-300'} />
                            {bankInfo?.is_published ? 'Published' : 'Draft'}
                        </button>

                        <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden lg:block" />

                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            suppressHydrationWarning
                            className="bg-white hover:bg-slate-50 text-[#030c4d] border-2 border-slate-100 font-black px-4 py-3 rounded-xl transition-all flex items-center gap-2 active:scale-95 text-[9px] uppercase tracking-widest shadow-sm hover:shadow-md hover:border-[#f8a01b]/30"
                        >
                            <Upload size={14} className="text-[#f8a01b]" /> Import
                        </button>

                        <div className="relative" ref={exportRef}>
                            <button
                                onClick={() => setIsExportOpen(!isExportOpen)}
                                suppressHydrationWarning
                                className="bg-[#f8a01b] hover:bg-[#e08e15] text-white font-black px-4 py-3 rounded-xl shadow-xl shadow-[#f8a01b]/10 transition-all flex items-center gap-2 active:scale-95 text-[9px] uppercase tracking-widest"
                            >
                                <FileDown size={16} strokeWidth={3} /> Export <ChevronDown size={14} className={`transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isExportOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100] origin-top-right overflow-hidden"
                                    >
                                        <button
                                            onClick={() => { handleExportWord(); setIsExportOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#030c4d] hover:bg-slate-50 rounded-xl transition-colors"
                                        >
                                            <FileText size={14} className="text-[#f8a01b]" /> Export Soal
                                        </button>
                                        <button
                                            onClick={() => { handleExportKisiKisi(); setIsExportOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#030c4d] hover:bg-slate-50 rounded-xl transition-colors"
                                        >
                                            <FileSearch size={14} className="text-[#f8a01b]" /> Export Kisi-Kisi
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={() => handleOpenEditor()}
                            suppressHydrationWarning
                            className="bg-[#030c4d] hover:bg-[#0a1a6e] text-white font-black px-4 py-3 rounded-xl shadow-xl shadow-[#030c4d]/20 transition-all flex items-center gap-2 active:scale-95 text-[9px] uppercase tracking-widest border-b-4 border-[#000B44]"
                        >
                            <Plus size={16} strokeWidth={3} className="text-[#f8a01b]" /> Tambah
                        </button>
                    </div>
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
                                <div className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-xl shadow-md shadow-primary/10 uppercase tracking-widest">
                                    Soal #{idx + 1}
                                </div>
                                <div className="flex gap-1.5 transition-all">
                                    <button
                                        onClick={() => generateKisiForQuestion(q.id, q.question_text, q.bank_question_options || [])}
                                        disabled={isGeneratingAI === q.id}
                                        className={`w-8 h-8 rounded-lg transition-all shadow-sm border flex items-center justify-center hover:scale-110 active:scale-90 ${isGeneratingAI === q.id ? 'bg-slate-100 text-slate-300 border-slate-100' : 'bg-white hover:bg-accent hover:text-white text-accent border-accent/20'}`}
                                        title="Generate Kisi-kisi (AI)"
                                    >
                                        {isGeneratingAI === q.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} strokeWidth={3} />}
                                    </button>
                                    {(questions || []).length > 1 && (
                                        <>
                                            <button
                                                onClick={() => handleMoveQuestion(idx, 'up')}
                                                disabled={idx === 0}
                                                className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-400 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white"
                                                title="Pindahkan ke Atas"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleMoveQuestion(idx, 'down')}
                                                disabled={idx === (filteredQuestions.length || questions.length) - 1}
                                                className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-400 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white"
                                                title="Pindahkan ke Bawah"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleOpenView(q)}
                                        className="w-8 h-8 bg-white hover:bg-[#f8a01b] hover:text-white text-slate-400 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-90"
                                        title="Pratinjau Siswa"
                                    >
                                        <Eye size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleOpenEditor(q)}
                                        className="w-8 h-8 bg-white hover:bg-primary hover:text-white text-slate-400 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-90"
                                        title="Edit"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="w-8 h-8 bg-white hover:bg-rose-500 hover:text-white text-slate-400 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-90"
                                        title="Hapus"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-3 p-4 bg-slate-50/20 rounded-xl border border-slate-100/50 relative group/qtext transition-all">
                                <div className="text-slate-900 font-bold leading-relaxed text-sm">
                                    <LatexRenderer text={q.question_text} />
                                </div>
                                {q.type === 'essay' && (
                                    <div className="mt-4">
                                        <span className="bg-amber-100 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit shadow-sm">
                                            <FileText size={12} /> Uraian / Essay
                                        </span>
                                    </div>
                                )}
                                {q.type === 'short_answer' && (
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <span className="bg-primary/5 text-primary border border-primary/20 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
                                            <Target size={12} /> {(q.metadata?.blanks || []).length || 1} Isian Singkat
                                        </span>
                                        {(q.metadata?.blanks || []).map((blank: any, bIdx: number) => (
                                            <div key={bIdx} className="bg-white border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                                                <span className="text-[8px] font-black text-slate-400">#{bIdx + 1}</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {(blank.variations || []).slice(0, 3).map((v: string, vIdx: number) => (
                                                        <span key={vIdx} className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md text-[8px] font-bold border border-slate-100">{v}</span>
                                                    ))}
                                                    {(blank.variations || []).length > 3 && <span className="text-[8px] font-bold text-slate-300">...</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {(() => {
                                const meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata || '{}') : (q.metadata || {});
                                return meta.kisi_kisi ? (
                                    <div className="mt-3 px-4 py-2 bg-accent/5 rounded-xl border border-accent/10 flex items-start gap-3">
                                        <div className="mt-1 bg-accent/10 p-1.5 rounded-lg">
                                            <Sparkles size={10} className="text-accent" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[8px] font-black text-accent uppercase tracking-[0.2em] mb-0.5">Kisi-kisi / Indikator (AI)</div>
                                            <div className="text-[10px] font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                {meta.kisi_kisi}
                                            </div>
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            {q.bank_question_options?.filter((o: any) => o.option_text?.trim() !== '')?.length > 0 && (
                                <div className="flex flex-col gap-2.5">
                                    {q.bank_question_options
                                        .filter((o: any) => o.option_text?.trim() !== '')
                                        .sort((a: any, b: any) => a.order - b.order)
                                        .map((opt: any, oIdx: number) => {
                                            const optMeta = opt.metadata || {};
                                            const isCategorization = q.type === 'categorization';
                                            const isMatching = q.type === 'matching';

                                            const isTrueFalse = q.type === 'true_false';
                                            const isProminentPn = isCategorization || isMatching;

                                            // Determine badge color and text
                                            let badgeBg = opt.is_correct ? 'bg-primary text-white shadow-lg' : 'bg-slate-200 text-slate-600 group-hover/opt:bg-slate-300';
                                            let badgeText = String.fromCharCode(65 + oIdx);

                                            if (isTrueFalse) {
                                                badgeText = opt.is_correct ? 'B' : 'S';
                                                badgeBg = opt.is_correct ? 'bg-emerald-500 text-white shadow-lg' : 'bg-rose-500 text-white shadow-md';
                                            } else if (isProminentPn) {
                                                badgeText = `P${oIdx + 1}`;
                                                badgeBg = 'bg-slate-50 text-slate-500 border border-slate-200 shadow-sm px-2.5 w-auto min-w-[34px]';
                                            } else if (isMatching) {
                                                badgeText = (oIdx + 1).toString();
                                            }

                                            return (
                                                <div key={opt.id} className={`p-3 rounded-xl border transition-all group/opt relative overflow-hidden ${opt.is_correct ? (isTrueFalse ? 'bg-emerald-50/50 border-emerald-200' : 'bg-primary/5 border-primary/20') : (isTrueFalse ? 'bg-rose-50/50 border-rose-100' : 'bg-white border-slate-100 hover:border-slate-300')} flex items-center gap-3`}>
                                                    <span className={`h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black transition-all ${badgeBg} ${!isProminentPn ? 'w-7' : ''}`}>
                                                        {badgeText}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        {isMatching || isCategorization ? (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center">
                                                                <div className="text-sm font-bold text-slate-700 leading-relaxed">
                                                                    <LatexRenderer text={opt.option_text} />
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex-shrink-0 flex items-center gap-1.5 text-slate-300">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                                                        <ArrowRight size={14} strokeWidth={3} className={isMatching ? "text-[#f8a01b] animate-pulse-slow" : "text-slate-300"} />
                                                                    </div>
                                                                    <div className="flex-1 flex flex-wrap gap-2">
                                                                        {isMatching ? (
                                                                            (optMeta.match_texts || (optMeta.match_text ? [optMeta.match_text] : [])).map((m: string, mi: number) => (
                                                                                <div key={mi} className="bg-gradient-to-r from-[#f8a01b]/10 to-[#f8a01b]/5 px-4 py-2 rounded-xl text-[10px] font-black text-[#f8a01b] border border-[#f8a01b]/20 uppercase tracking-widest shadow-sm hover:scale-105 transition-transform cursor-default">
                                                                                    {m}
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            (optMeta.category_names || (optMeta.category_name ? [optMeta.category_name] : [])).map((c: string, ci: number) => (
                                                                                <span key={ci} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[8px] font-black text-slate-500 uppercase tracking-widest shadow-sm hover:bg-white hover:border-primary/20 transition-all cursor-default">
                                                                                    {c}
                                                                                </span>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm font-bold text-slate-700 leading-relaxed">
                                                                <LatexRenderer text={opt.option_text} />
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
                            )
                            }
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
            )
            }

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
                                            Soal Nomor <span className="text-accent">{editingQuestion ? questions.indexOf(editingQuestion) + 1 : questions.length + 1}</span>
                                        </h3>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                                            UNELMA Assessment Design Studio
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            const tempQ = {
                                                type: selectedType,
                                                question_text: questionText,
                                                metadata: {
                                                    ...metadata,
                                                    categories: categories
                                                },
                                                bank_question_options: options.map((opt, i) => ({
                                                    id: opt.id || `temp-${i}`,
                                                    option_text: opt.text,
                                                    is_correct: opt.isCorrect,
                                                    order: i,
                                                    metadata: {
                                                        match_texts: opt.match_texts || [],
                                                        category_names: opt.category_names || []
                                                    }
                                                }))
                                            };
                                            handleOpenView(tempQ);
                                        }}
                                        className="w-12 h-12 bg-orange-50 hover:bg-[#f8a01b] text-[#f8a01b] hover:text-white rounded-2xl transition-all shadow-sm border border-orange-100 flex items-center justify-center hover:scale-110 active:scale-90 shadow-xl shadow-orange-500/10"
                                        title="Pratinjau Siswa"
                                    >
                                        <Eye size={20} />
                                    </button>

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
                                {/* PANELS: INPUT ONLY (NOW FULL WIDTH) */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                                    <form id="q-editor" className="space-y-10 pb-12 max-w-5xl mx-auto">

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
                                                        value={isNaN(scoreDefault) ? '' : scoreDefault}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            setScoreDefault(isNaN(val) ? 0 : val);
                                                        }}
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
                                                                    },
                                                                    'image': function () {
                                                                        // Check if an image is selected for cropping
                                                                        const quill = (this as any).quill;
                                                                        const range = quill.getSelection();
                                                                        if (range) {
                                                                            const [leaf] = quill.getLeaf(range.index);
                                                                            if (leaf && leaf.domNode.tagName === 'IMG') {
                                                                                setImageToCrop(leaf.domNode.src);
                                                                                setIsCropperOpen(true);
                                                                                return;
                                                                            }
                                                                        }

                                                                        // Otherwise, upload new
                                                                        const input = document.createElement('input');
                                                                        input.setAttribute('type', 'file');
                                                                        input.setAttribute('accept', 'image/*');
                                                                        input.click();
                                                                        input.onchange = () => {
                                                                            const file = input.files?.[0];
                                                                            if (file) {
                                                                                const reader = new FileReader();
                                                                                reader.readAsDataURL(file);
                                                                                reader.onload = () => {
                                                                                    setImageToCrop(reader.result as string);
                                                                                    setCropperContext({ type: 'question' });
                                                                                    setIsCropperOpen(true);
                                                                                };
                                                                            }
                                                                        };
                                                                    }
                                                                }
                                                            },
                                                            imageResize: {
                                                                parchment: (ReactQuill as any).Quill?.import('parchment'),
                                                                modules: ['Resize', 'DisplaySize']
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

                                            {/* AI & Kisi-kisi Section */}
                                            <div className="space-y-4 bg-accent/5 p-6 rounded-[2.5rem] border border-accent/10 relative overflow-hidden group/ai">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover/ai:scale-150 transition-transform duration-1000"></div>
                                                <div className="flex justify-between items-center relative z-10">
                                                    <label className="text-[10px] font-black text-accent uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Sparkles size={14} className="animate-pulse" /> Kisi-kisi & Indikator Soal
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            setIsGeneratingAI('editor');
                                                            const res = await generateKisiKisiAction(questionText, options.map(o => o.text));
                                                            if (res.success && res.kisi) {
                                                                setKisiKisi(res.kisi);
                                                                alert("Kisi-kisi berhasil di-generate! Jangan lupa klik 'Simpan Mahakarya'.");
                                                            } else {
                                                                alert(`Gagal men-generate kisi-kisi: ${res.error || 'Unknown error'}`);
                                                            }
                                                            setIsGeneratingAI(null);
                                                        }}
                                                        disabled={isGeneratingAI === 'editor' || !questionText}
                                                        className="bg-accent text-white font-black px-5 py-2 rounded-xl text-[9px] uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                                    >
                                                        {isGeneratingAI === 'editor' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                        Generate Otomatis (AI)
                                                    </button>
                                                </div>
                                                <div className="relative group z-10">
                                                    <textarea
                                                        value={kisiKisi}
                                                        onChange={(e) => setKisiKisi(e.target.value)}
                                                        rows={3}
                                                        className="w-full bg-white/80 border border-accent/20 rounded-2xl p-4 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none font-bold text-slate-600 transition-all shadow-sm text-[11px] leading-relaxed resize-none"
                                                        placeholder="Contoh: KD 3.1, Indikator: Peserta didik mampu menganalisis..., Level: L3 (HOTS)"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Options Editor */}
                                        {(['mcq', 'mcq_complex', 'true_false', 'matching', 'categorization', 'short_answer'].includes(selectedType)) && (
                                            <div className="space-y-5">
                                                <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl">
                                                    <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <ListChecks size={14} className="text-primary" />
                                                        {selectedType === 'matching' ? 'Pasangan Item (Matching)' :
                                                            selectedType === 'short_answer' ? 'Konfigurasi Kunci Jawaban' :
                                                                selectedType === 'categorization' ? 'Item & Kategori' : 'Opsi Jawaban'}
                                                    </h4>
                                                    {selectedType !== 'true_false' && selectedType !== 'short_answer' && (
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

                                                {/* Short Answer: Blanks & Variations */}
                                                {selectedType === 'short_answer' && (
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Konfigurasi Isian Singkat</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const current = metadata.blanks || [];
                                                                    if (current.length < 2) {
                                                                        setMetadata({ ...metadata, blanks: [...current, { variations: [] }] });
                                                                    } else {
                                                                        alert('Maksimal 2 isian singkat diperbolehkan.');
                                                                    }
                                                                }}
                                                                className="text-[9px] font-black text-primary bg-primary/5 px-4 py-2 rounded-lg hover:bg-primary/10 transition-all uppercase tracking-widest border border-primary/10"
                                                            >
                                                                + Tambah Isian
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {(metadata.blanks || [{ variations: [] }]).map((blank: any, bIdx: number) => (
                                                                <div key={bIdx} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 space-y-4 relative group">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter">Isian #{bIdx + 1}</span>
                                                                        {bIdx > 0 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const next = metadata.blanks.filter((_: any, i: number) => i !== bIdx);
                                                                                    setMetadata({ ...metadata, blanks: next });
                                                                                }}
                                                                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Variasi Jawaban Benar:</label>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {(blank.variations || []).map((v: string, vIdx: number) => (
                                                                                <div key={vIdx} className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 shadow-sm">
                                                                                    <span className="text-[10px] font-bold text-slate-700">{v}</span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const nextBlanks = [...metadata.blanks];
                                                                                            nextBlanks[bIdx].variations = nextBlanks[bIdx].variations.filter((_: any, i: number) => i !== vIdx);
                                                                                            setMetadata({ ...metadata, blanks: nextBlanks });
                                                                                        }}
                                                                                        className="text-slate-300 hover:text-rose-500"
                                                                                    >
                                                                                        <X size={10} />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const val = prompt('Tambah variasi jawaban benar:');
                                                                                    if (val) {
                                                                                        const nextBlanks = metadata.blanks ? [...metadata.blanks] : [{ variations: [] }];
                                                                                        if (!nextBlanks[bIdx]) nextBlanks[bIdx] = { variations: [] };
                                                                                        nextBlanks[bIdx].variations = [...(nextBlanks[bIdx].variations || []), val];
                                                                                        setMetadata({ ...metadata, blanks: nextBlanks });
                                                                                    }
                                                                                }}
                                                                                className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-primary hover:text-primary transition-all text-[10px] font-bold"
                                                                            >
                                                                                + Tambah Variasi
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}


                                                <div className="grid grid-cols-1 gap-4">
                                                    {selectedType === 'matching' ? (
                                                        <div className="space-y-6 animate-in fade-in zoom-in duration-700">
                                                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-slate-100 pb-8">
                                                                <div>
                                                                    <h3 className="text-2xl font-black text-primary tracking-tighter uppercase flex items-center gap-3">
                                                                        <Sparkles className="text-accent animate-pulse" /> Studio Penjodohan <span className="text-[10px] font-black bg-primary/5 px-3 py-1 rounded-full text-primary/40 not-italic tracking-widest ml-2 border border-primary/5">PRO</span>
                                                                    </h3>
                                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Arsitektur Penjodohan Interaktif</p>
                                                                </div>
                                                                <div className="flex flex-wrap justify-center gap-4">
                                                                    <button
                                                                        type="button"
                                                                        onClick={addOption}
                                                                        className="bg-slate-50 hover:bg-slate-100 text-primary border border-slate-200 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                                                                    >
                                                                        <Plus size={14} className="text-accent" /> Tambah Baris Kiri
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const item = prompt('Nama Item Kolom Kanan:');
                                                                            if (item && !(metadata.right_items || []).includes(item)) {
                                                                                setMetadata({ ...metadata, right_items: [...(metadata.right_items || []), item] });
                                                                            }
                                                                        }}
                                                                        className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-primary/20"
                                                                    >
                                                                        <Zap size={14} className="text-accent" /> Tambah Item Kanan
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div ref={editorMatchingContainerRef} className="relative min-h-[500px] px-4">
                                                                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20">
                                                                    <defs>
                                                                        <marker id="editor-arrowhead-guru" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                                                            <polygon points="0 0, 10 3.5, 0 7" fill="#f8a01b" />
                                                                        </marker>
                                                                    </defs>
                                                                    {editorMatchingLinks.map((link, i) => (
                                                                        <motion.line
                                                                            key={i}
                                                                            initial={{ pathLength: 0, opacity: 0 }}
                                                                            animate={{ pathLength: 1, opacity: 1 }}
                                                                            x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2}
                                                                            stroke="#f8a01b" strokeWidth="2.5" markerEnd="url(#editor-arrowhead-guru)"
                                                                            strokeDasharray="5,5"
                                                                            className="drop-shadow-[0_0_8px_rgba(248,160,27,0.5)]"
                                                                        />
                                                                    ))}
                                                                </svg>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-40 relative z-30">
                                                                    <div className="space-y-6">
                                                                        <div className="flex items-center gap-3 px-6 mb-8 text-slate-400">
                                                                            <div className="w-8 h-[1px] bg-slate-200" />
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Baris Soal (Kiri)</span>
                                                                        </div>
                                                                        {options.map((opt, idx) => (
                                                                            <motion.div
                                                                                key={`left-${idx}`}
                                                                                initial={{ opacity: 0, x: -20 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                transition={{ delay: idx * 0.1 }}
                                                                                id={`editor-matching-left-${idx}`}
                                                                                onClick={() => setSelectedLeft(selectedLeft === String(idx) ? null : String(idx))}
                                                                                className={`group relative bg-white border border-slate-100 p-6 rounded-[2rem] transition-all cursor-pointer hover:border-primary/30 hover:shadow-xl ${selectedLeft === String(idx) ? 'border-primary ring-4 ring-primary/5 scale-[1.02] z-40' : ''}`}
                                                                            >
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${selectedLeft === String(idx) ? 'bg-primary text-white rotate-6' : 'bg-slate-50 text-slate-400'}`}>
                                                                                        {idx + 1}
                                                                                    </div>
                                                                                    <div className="flex-1 space-y-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <input
                                                                                                value={opt.text}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                onChange={(e) => updateOption(idx, { text: e.target.value })}
                                                                                                placeholder="Tulis pernyataan..."
                                                                                                className="flex-1 bg-transparent border-none text-slate-700 font-bold text-sm outline-none placeholder:text-slate-300"
                                                                                            />
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const input = document.createElement('input');
                                                                                                    input.type = 'file';
                                                                                                    input.accept = 'image/*';
                                                                                                    input.onchange = (ev: any) => {
                                                                                                        const file = ev.target.files[0];
                                                                                                        if (file) {
                                                                                                            const reader = new FileReader();
                                                                                                            reader.onload = (re: any) => {
                                                                                                                setImageToCrop(re.target.result);
                                                                                                                setCropperContext({ type: 'option', index: idx });
                                                                                                                setIsCropperOpen(true);
                                                                                                            };
                                                                                                            reader.readAsDataURL(file);
                                                                                                        }
                                                                                                    };
                                                                                                    input.click();
                                                                                                }}
                                                                                                className="p-2 text-slate-300 hover:text-primary transition-colors"
                                                                                            >
                                                                                                <ImageIcon size={16} />
                                                                                            </button>
                                                                                        </div>
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {opt.match_texts?.map((m: string) => (
                                                                                                <span key={m} className="text-[8px] font-black text-accent bg-accent/10 px-2 py-1 rounded-full uppercase truncate max-w-[100px]">→ {m}</span>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => { e.stopPropagation(); removeOption(idx); }}
                                                                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-2"
                                                                                    >
                                                                                        <Trash2 size={16} />
                                                                                    </button>
                                                                                </div>
                                                                                {selectedLeft === String(idx) && (
                                                                                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-primary shadow-lg animate-pulse z-50">
                                                                                        <ArrowRight size={16} strokeWidth={3} />
                                                                                    </div>
                                                                                )}
                                                                            </motion.div>
                                                                        ))}
                                                                    </div>

                                                                    <div className="space-y-6">
                                                                        <div className="flex items-center gap-3 px-6 mb-8 text-slate-400 justify-end">
                                                                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Jawaban (Kanan)</span>
                                                                            <div className="w-8 h-[1px] bg-slate-200" />
                                                                        </div>
                                                                        {(metadata.right_items || []).map((rightItem: string) => {
                                                                            const isMatched = selectedLeft !== null && (options[parseInt(selectedLeft)]?.match_texts || []).includes(rightItem);
                                                                            return (
                                                                                <motion.div
                                                                                    key={rightItem}
                                                                                    id={`editor-matching-right-${btoa(rightItem).replace(/=/g, '')}`}
                                                                                    initial={{ opacity: 0, x: 20 }}
                                                                                    animate={{ opacity: 1, x: 0 }}
                                                                                    onClick={() => {
                                                                                        if (selectedLeft === null) return;
                                                                                        const idx = parseInt(selectedLeft);
                                                                                        const currentMatches = options[idx].match_texts || [];
                                                                                        const nextMatches = currentMatches.includes(rightItem)
                                                                                            ? currentMatches.filter((m: string) => m !== rightItem)
                                                                                            : [...currentMatches, rightItem];
                                                                                        updateOption(idx, { match_texts: nextMatches });
                                                                                    }}
                                                                                    className={`group bg-white border border-slate-100 p-6 rounded-[2rem] transition-all cursor-pointer hover:border-primary/30 hover:shadow-xl ${isMatched ? 'border-primary ring-4 ring-primary/5 scale-[1.02]' : ''} ${selectedLeft !== null ? 'hover:scale-[1.02]' : ''}`}
                                                                                >
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="flex-1 space-y-2">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        const input = document.createElement('input');
                                                                                                        input.type = 'file';
                                                                                                        input.accept = 'image/*';
                                                                                                        input.onchange = (ev: any) => {
                                                                                                            const file = ev.target.files[0];
                                                                                                            if (file) {
                                                                                                                const reader = new FileReader();
                                                                                                                reader.onload = (re: any) => {
                                                                                                                    setImageToCrop(re.target.result);
                                                                                                                    setCropperContext({ type: 'matching_right', item: rightItem });
                                                                                                                    setIsCropperOpen(true);
                                                                                                                };
                                                                                                                reader.readAsDataURL(file);
                                                                                                            }
                                                                                                        };
                                                                                                        input.click();
                                                                                                    }}
                                                                                                    className="p-2 text-slate-300 hover:text-primary transition-colors"
                                                                                                >
                                                                                                    <ImageIcon size={16} />
                                                                                                </button>
                                                                                                <input
                                                                                                    value={rightItem}
                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                    onChange={(e) => {
                                                                                                        const newVal = e.target.value;
                                                                                                        const oldVal = rightItem;
                                                                                                        const nextItems = (metadata.right_items || []).map((i: string) => i === oldVal ? newVal : i);
                                                                                                        setMetadata({ ...metadata, right_items: nextItems });
                                                                                                        setOptions(options.map(o => ({
                                                                                                            ...o,
                                                                                                            match_texts: (o.match_texts || []).map((m: string) => m === oldVal ? newVal : m)
                                                                                                        })));
                                                                                                    }}
                                                                                                    className="flex-1 bg-transparent border-none text-slate-700 font-bold text-sm outline-none placeholder:text-slate-300 text-right"
                                                                                                />
                                                                                                {/* EDIT IMAGE ICON */}
                                                                                                {(() => {
                                                                                                    const match = rightItem.match(/<img.*?src=["'](.*?)["'].*?>/i);
                                                                                                    return match ? (
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                setImageToCrop(match[1]);
                                                                                                                setCropperContext({ type: 'matching_replace', item: rightItem });
                                                                                                                setIsCropperOpen(true);
                                                                                                            }}
                                                                                                            className="p-2 text-amber-500 hover:text-amber-600 transition-colors bg-amber-50 rounded-lg border border-amber-100"
                                                                                                            title="Edit Gambar"
                                                                                                        >
                                                                                                            <Crop size={14} />
                                                                                                        </button>
                                                                                                    ) : null;
                                                                                                })()}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isMatched ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                                                                                            {isMatched ? <Check size={16} strokeWidth={4} /> : <Zap size={14} />}
                                                                                        </div>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                const next = (metadata.right_items || []).filter((i: string) => i !== rightItem);
                                                                                                setMetadata({ ...metadata, right_items: next });
                                                                                                setOptions(options.map(o => ({
                                                                                                    ...o,
                                                                                                    match_texts: (o.match_texts || []).filter((m: string) => m !== rightItem)
                                                                                                })));
                                                                                            }}
                                                                                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-2"
                                                                                        >
                                                                                            <Trash2 size={16} />
                                                                                        </button>
                                                                                    </div>
                                                                                </motion.div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-12 flex justify-center">
                                                                <div className="bg-slate-50 rounded-full px-8 py-4 border border-slate-100 flex items-center gap-6 shadow-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Penjodohan Aktif</span>
                                                                    </div>
                                                                    <div className="w-[1px] h-4 bg-slate-200" />
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klik butir di kiri, lalu hubungkan ke jawaban di kanan.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (selectedType === 'short_answer' || selectedType === 'essay') ? null : options.map((opt, idx) => (
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
                                                                ) : selectedType === 'categorization' ? (
                                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
                                                                        {idx + 1}
                                                                    </div>
                                                                ) : null}

                                                                <div className="flex-1 space-y-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                            {selectedType === 'categorization' ? 'Redaksi Item Soal' : `Opsi ${String.fromCharCode(65 + idx)}`}
                                                                        </span>
                                                                        {opt.isCorrect && (selectedType === 'mcq' || selectedType === 'mcq_complex') && (
                                                                            <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">Kunci Jawaban</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Core Input */}
                                                                    <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const input = document.createElement('input');
                                                                                input.type = 'file';
                                                                                input.accept = 'image/*';
                                                                                input.onchange = (e: any) => {
                                                                                    const file = e.target.files[0];
                                                                                    if (file) {
                                                                                        const reader = new FileReader();
                                                                                        reader.onload = (re: any) => {
                                                                                            setImageToCrop(re.target.result);
                                                                                            setCropperContext({ type: 'option', index: idx });
                                                                                            setIsCropperOpen(true);
                                                                                        };
                                                                                        reader.readAsDataURL(file);
                                                                                    }
                                                                                };
                                                                                input.click();
                                                                            }}
                                                                            className="p-2 text-slate-300 hover:text-primary transition-colors bg-white rounded-lg shadow-sm border border-slate-100"
                                                                        >
                                                                            <ImageIcon size={16} />
                                                                        </button>
                                                                        <input
                                                                            required
                                                                            placeholder={"Tulis teks atau sisipkan gambar..."}
                                                                            value={opt.text}
                                                                            onChange={(e) => updateOption(idx, { text: e.target.value })}
                                                                            className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-200"
                                                                        />

                                                                        {/* EDIT IMAGE ICON */}
                                                                        {(() => {
                                                                            const match = opt.text.match(/<img.*?src=["'](.*?)["'].*?>/i);
                                                                            return match ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setImageToCrop(match[1]);
                                                                                        setCropperContext({ type: 'option_replace', index: idx });
                                                                                        setIsCropperOpen(true);
                                                                                    }}
                                                                                    className="p-2 text-amber-500 hover:text-amber-600 transition-colors bg-amber-50 rounded-lg border border-amber-100"
                                                                                    title="Edit Gambar"
                                                                                >
                                                                                    <Crop size={14} />
                                                                                </button>
                                                                            ) : null;
                                                                        })()}

                                                                        {selectedType === 'categorization' && (
                                                                            <div className="flex flex-wrap gap-2 animate-in slide-in-from-left-2 duration-300">
                                                                                {categories.map(cat => (
                                                                                    <button
                                                                                        key={cat}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const current = opt.category_names || [];
                                                                                            const next = current.includes(cat)
                                                                                                ? current.filter((c: string) => c !== cat)
                                                                                                : [...current, cat];
                                                                                            updateOption(idx, { category_names: next });
                                                                                        }}
                                                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${opt.category_names?.includes(cat) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-primary/30'}`}
                                                                                    >
                                                                                        {opt.category_names?.includes(cat) && <Check size={10} strokeWidth={4} />}
                                                                                        {cat}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        <button type="button" onClick={() => removeOption(idx)} className="text-slate-200 hover:text-rose-500 p-2 transition-colors">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Refined Student View Modal / Simulation Engine */}
            <AnimatePresence>
                {isViewModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 bg-slate-950/90 backdrop-blur-2xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="bg-slate-50 w-screen h-screen max-w-none shadow-[0_0_120px_rgba(3,12,77,0.5)] overflow-hidden relative flex flex-col border border-white/20"
                        >
                            {/* REPLICATED STUDENT HEADER */}
                            <header className="bg-white/95 backdrop-blur-2xl border-b border-slate-100 sticky top-0 z-[100] shadow-sm shrink-0">
                                <div className="max-w-[1300px] mx-auto px-6 h-20 flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#030c4d] to-[#0a1a6e] flex items-center justify-center text-white shadow-xl shadow-[#030c4d]/20 border border-white/10 font-black text-xl tracking-tighter">
                                            U
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h1 className="text-[#030c4d] font-black text-xl uppercase tracking-tighter leading-none">Pratinjau Ujian</h1>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                                                    <span className="text-[8px] font-black tracking-[0.2em] uppercase text-primary">Preview Mode</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">{bankInfo?.subject || 'MAPEL'}</span>
                                                </div>
                                                <span className="text-slate-200">|</span>
                                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">{bankInfo?.title || 'BANK SOAL'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl flex items-center gap-4 text-[#030c4d] shadow-sm">
                                            <div className="flex flex-col items-end mr-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 leading-none">Time Remaining</span>
                                                <span className="text-[7px] font-bold uppercase tracking-widest opacity-30 mt-1">Sisa Waktu</span>
                                            </div>
                                            <Clock size={18} className="text-primary" />
                                            <span className="font-mono text-2xl font-black tracking-tighter">59:59</span>
                                        </div>
                                        {/* LAYOUT TOGGLE */}
                                        {(() => {
                                            const activeQ = viewingQuestion || filteredQuestions[currentPreviewIndex];
                                            const currentLayout = activeQ?.metadata?.question_layout || 'split';
                                            return activeQ ? (
                                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                                    <button
                                                        onClick={() => handleSetQuestionLayout(activeQ.id, 'split')}
                                                        title="Layout Split: Soal | Jawaban"
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${currentLayout === 'split'
                                                            ? 'bg-white text-[#030c4d] shadow-sm'
                                                            : 'text-slate-400 hover:text-slate-600'
                                                            }`}
                                                    >
                                                        <Layout size={12} />
                                                        Split
                                                    </button>
                                                    <button
                                                        onClick={() => handleSetQuestionLayout(activeQ.id, 'wide')}
                                                        title="Layout Wide: Full Width"
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${currentLayout === 'wide'
                                                            ? 'bg-white text-[#030c4d] shadow-sm'
                                                            : 'text-slate-400 hover:text-slate-600'
                                                            }`}
                                                    >
                                                        <Type size={12} />
                                                        Wide
                                                    </button>
                                                </div>
                                            ) : null;
                                        })()}
                                        <button
                                            onClick={() => {
                                                setIsViewModalOpen(false);
                                                resetSimulation();
                                                // Clear preview from URL
                                                const params = new URLSearchParams(window.location.search);
                                                params.delete('preview');
                                                window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
                                            }}
                                            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-rose-100"
                                        >
                                            <X size={28} />
                                        </button>
                                    </div>
                                </div>
                            </header>

                            {/* PREVIEW CONTAINER */}
                            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-8 p-6 lg:px-4 lg:py-6 bg-slate-50/50 relative z-10 max-w-[1600px] mx-auto w-full">
                                {(!viewingQuestion && filteredQuestions.length === 0) ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-6">
                                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200">
                                            <Sparkles size={48} className="opacity-20" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-primary uppercase tracking-tighter">No Questions Found</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">
                                                {searchQuery ? `Tidak ada soal yang cocok dengan "${searchQuery}"` : 'Belum ada butir soal dalam bank ini untuk dipratinjau.'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {(viewingQuestion || filteredQuestions[currentPreviewIndex]) ? (() => {
                                            const displayQ = viewingQuestion || filteredQuestions[currentPreviewIndex]!;
                                            const isWide = displayQ?.metadata?.question_layout === 'wide';

                                            return (
                                                <div
                                                    id="preview-grid-container"
                                                    className="flex-1 max-w-none mx-auto w-full grid grid-cols-1 overflow-hidden min-h-0 relative select-none"
                                                    style={isWide ? {
                                                        gridTemplateColumns: `${columnWidths.question + columnWidths.options}fr 1.25rem ${columnWidths.matrix}fr`,
                                                        gap: '0px'
                                                    } : {
                                                        gridTemplateColumns: `${columnWidths.question}fr 1.25rem ${columnWidths.options}fr 1.25rem ${columnWidths.matrix}fr`,
                                                        gap: '0px'
                                                    }}
                                                >
                                                    {isWide ? (
                                                        /* WIDE MODE: question + options in one full-width card */
                                                        <>
                                                            <div className="flex flex-col min-w-0 h-full overflow-hidden">
                                                                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 lg:p-10 flex-1 shadow-premium flex flex-col overflow-hidden relative group">
                                                                    <div className="flex items-center gap-6 mb-10 relative z-10">
                                                                        <div className="flex-1">
                                                                            <div className="flex justify-between items-end mb-3 px-1">
                                                                                <div className="flex items-baseline gap-1 text-[#030c4d] font-medium text-sm">
                                                                                    <span className="uppercase tracking-[0.3em] text-[10px] text-slate-400 font-black">Assessment Progress</span>
                                                                                </div>
                                                                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{Math.round(((viewingQuestion ? 1 : currentPreviewIndex + 1) / (viewingQuestion ? 1 : filteredQuestions.length)) * 100)}% Complete</div>
                                                                            </div>
                                                                            <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden">
                                                                                <motion.div
                                                                                    className="h-full bg-gradient-to-r from-[#030c4d] via-[#0a1a6e] to-[#f8a01b]"
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${((viewingQuestion ? 1 : currentPreviewIndex + 1) / (viewingQuestion ? 1 : filteredQuestions.length)) * 100}%` }}
                                                                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pt-2">
                                                                        <QuestionRenderer
                                                                            question={displayQ}
                                                                            answer={matchingAnswers[displayQ.id]}
                                                                            onAnswerChange={(newVal) => setMatchingAnswers(prev => ({ ...prev, [displayQ.id]: newVal }))}
                                                                            isPreview={true}
                                                                            showFeedback={isSimulating}
                                                                        />

                                                                        {/* Ragu-ragu Checkbox in Preview Wide Mode */}
                                                                        <div
                                                                            className={`mt-12 p-5 rounded-[1.5rem] border-2 max-w-sm flex items-center gap-5 cursor-pointer transition-all duration-300 select-none group relative overflow-hidden ${doubtfulPreviews.has(displayQ.id) ? 'bg-[#f8a01b]/5 border-[#f8a01b] shadow-lg shadow-[#f8a01b]/10' : 'bg-slate-50 border-slate-100 hover:border-primary/30 hover:bg-white'}`}
                                                                            onClick={() => {
                                                                                const next = new Set(doubtfulPreviews);
                                                                                if (next.has(displayQ.id)) next.delete(displayQ.id);
                                                                                else next.add(displayQ.id);
                                                                                setDoubtfulPreviews(next);
                                                                            }}
                                                                        >
                                                                            <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${doubtfulPreviews.has(displayQ.id) ? 'bg-[#f8a01b] border-[#f8a01b] text-white shadow-xl shadow-[#f8a01b]/20 scale-105' : 'bg-white border-slate-200 text-transparent group-hover:border-primary/50'}`}>
                                                                                <Check size={22} strokeWidth={4} />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <span className={`block font-black text-xs uppercase tracking-[0.1em] leading-none mb-1.5 ${doubtfulPreviews.has(displayQ.id) ? 'text-[#f8a01b]' : 'text-slate-500 group-hover:text-slate-700'}`}>Review Later</span>
                                                                                <span className="block text-[8px] font-bold text-slate-300 uppercase tracking-widest italic opacity-60">Tandai Ragu-Ragu (Simulasi)</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div /> {/* Spacer for grid column 2 */}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* SPLIT MODE - LEFT: QUESTION (50%) */}
                                                            <div className="flex flex-col min-w-0 h-full overflow-hidden">
                                                                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 lg:p-10 flex-1 shadow-premium flex flex-col relative overflow-hidden group">
                                                                    <div className="flex items-center gap-6 mb-10 relative z-10">
                                                                        <div className="flex-1">
                                                                            <div className="flex justify-between items-end mb-3 px-1">
                                                                                <div className="flex items-baseline gap-1 text-[#030c4d] font-medium text-sm">
                                                                                    <span className="uppercase tracking-[0.3em] text-[10px] text-slate-400 font-black">Assessment Progress</span>
                                                                                </div>
                                                                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{Math.round(((viewingQuestion ? 1 : currentPreviewIndex + 1) / (viewingQuestion ? 1 : filteredQuestions.length)) * 100)}% Complete</div>
                                                                            </div>
                                                                            <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden">
                                                                                <motion.div
                                                                                    className="h-full bg-gradient-to-r from-[#030c4d] via-[#0a1a6e] to-[#f8a01b]"
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${((viewingQuestion ? 1 : currentPreviewIndex + 1) / (viewingQuestion ? 1 : filteredQuestions.length)) * 100}%` }}
                                                                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pt-2">
                                                                        <QuestionRenderer question={displayQ} answer={matchingAnswers[displayQ.id]} onAnswerChange={() => { }} isPreview={true} showOptions={false} />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Resize Handle 1 */}
                                                            <div
                                                                onMouseDown={(e) => handleMouseDown(e, 'question')}
                                                                className="self-stretch w-5 cursor-col-resize group flex items-center justify-center relative z-20 -mx-2.5"
                                                            >
                                                                <div className={`w-1 h-12 rounded-full transition-all ${isResizing === 'question' ? 'bg-primary scale-x-150' : 'bg-slate-200 group-hover:bg-primary/50'}`} />
                                                            </div>

                                                            {/* SPLIT MODE - MIDDLE: OPTIONS (40%) */}
                                                            <div className="flex flex-col min-w-0 h-full overflow-hidden">
                                                                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 lg:p-10 flex-1 shadow-premium flex flex-col relative overflow-hidden group">
                                                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pt-2">
                                                                        <QuestionRenderer question={displayQ} answer={matchingAnswers[displayQ.id]} onAnswerChange={(newVal) => setMatchingAnswers(prev => ({ ...prev, [displayQ.id]: newVal }))} isPreview={true} showFeedback={isSimulating} showQuestion={false} />
                                                                    </div>
                                                                    {/* Ragu-ragu Checkbox in Preview Split Mode */}
                                                                    <div
                                                                        className={`mt-6 p-4 rounded-xl border-2 flex items-center gap-4 cursor-pointer transition-all duration-300 select-none group relative overflow-hidden ${doubtfulPreviews.has(displayQ.id) ? 'bg-[#f8a01b]/5 border-[#f8a01b] shadow-lg shadow-[#f8a01b]/10' : 'bg-slate-50 border-slate-100 hover:border-primary/30 hover:bg-white'}`}
                                                                        onClick={() => {
                                                                            const next = new Set(doubtfulPreviews);
                                                                            if (next.has(displayQ.id)) next.delete(displayQ.id);
                                                                            else next.add(displayQ.id);
                                                                            setDoubtfulPreviews(next);
                                                                        }}
                                                                    >
                                                                        <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${doubtfulPreviews.has(displayQ.id) ? 'bg-[#f8a01b] border-[#f8a01b] text-white shadow-xl shadow-[#f8a01b]/20 scale-105' : 'bg-white border-slate-200 text-transparent group-hover:border-primary/50'}`}>
                                                                            <Check size={18} strokeWidth={4} />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <span className={`block font-black text-[11px] uppercase tracking-widest leading-none mb-1 ${doubtfulPreviews.has(displayQ.id) ? 'text-[#f8a01b]' : 'text-slate-500 group-hover:text-slate-700'}`}>Review Later</span>
                                                                            <span className="block text-[8px] font-bold text-slate-300 uppercase tracking-widest">Tandai Ragu-Ragu (Simulasi)</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Resize Handle 2 */}
                                                            <div
                                                                onMouseDown={(e) => handleMouseDown(e, 'options')}
                                                                className="self-stretch w-5 cursor-col-resize group flex items-center justify-center relative z-20 -mx-2.5"
                                                            >
                                                                <div className={`w-1 h-12 rounded-full transition-all ${isResizing === 'options' ? 'bg-primary scale-x-150' : 'bg-slate-200 group-hover:bg-primary/50'}`} />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* RIGHT: MATRIX NAVIGATION (always visible) */}
                                                    <div className="flex flex-col gap-6 h-full overflow-hidden">
                                                        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-premium relative overflow-hidden flex flex-col h-full shrink-0">
                                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-[#030c4d]" />

                                                            {/* Simulation Result Header */}
                                                            <AnimatePresence>
                                                                {isSimulating && simulatedResults && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center overflow-hidden"
                                                                    >
                                                                        <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Hasil</h4>
                                                                        <div className="flex items-baseline justify-center gap-1">
                                                                            <span className="text-2xl font-black text-emerald-700 tracking-tighter">{simulatedResults.score.toFixed(1).replace('.0', '')}</span>
                                                                            <span className="text-xs font-bold text-emerald-500 opacity-60">/ {simulatedResults.max}</span>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>

                                                            <div className="grid grid-cols-2 gap-2 mb-6 overflow-y-auto pr-1 custom-scrollbar shrink min-h-0">
                                                                {filteredQuestions.map((q, i) => {
                                                                    const isAnswered = !!matchingAnswers[q.id];
                                                                    const isCurrent = currentPreviewIndex === i;
                                                                    const isDoubtful = doubtfulPreviews.has(q.id);
                                                                    const score = isSimulating ? calculateScore(q, matchingAnswers[q.id]) : 0;
                                                                    const isCorrect = isSimulating && score === (q.score_default || 1);
                                                                    const isPartial = isSimulating && score > 0 && score < (q.score_default || 1);

                                                                    let btnClass = "w-full aspect-square rounded-xl flex items-center justify-center font-black text-[13px] transition-all duration-300 border-2 relative group ";
                                                                    if (isCurrent) btnClass += "bg-[#030c4d] text-white border-[#030c4d] shadow-lg shadow-[#030c4d]/20 scale-105 z-10 ring-2 ring-[#030c4d]/10";
                                                                    else if (isSimulating) {
                                                                        if (isCorrect) btnClass += "bg-emerald-500 text-white border-emerald-500 shadow-md hover:scale-105 ";
                                                                        else if (isPartial) btnClass += "bg-amber-500 text-white border-amber-500 shadow-md hover:scale-105 ";
                                                                        else if (isAnswered) btnClass += "bg-rose-500 text-white border-rose-500 shadow-md hover:scale-105 ";
                                                                        else btnClass += "bg-slate-50 text-slate-300 border-slate-100 ";
                                                                    } else if (isDoubtful) {
                                                                        btnClass += "bg-[#f8a01b] text-white border-[#f8a01b] shadow-md hover:bg-[#e08e15]";
                                                                    } else if (isAnswered) {
                                                                        btnClass += "bg-blue-50/80 text-[#030c4d] border-blue-100/50 shadow-sm hover:bg-blue-100";
                                                                    } else {
                                                                        btnClass += "bg-slate-50 text-slate-400 border-slate-100 hover:border-primary/20 hover:bg-white hover:text-primary";
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={q.id || i}
                                                                            onClick={() => {
                                                                                setCurrentPreviewIndex(i);
                                                                                // Update URL
                                                                                const params = new URLSearchParams(searchParams.toString());
                                                                                params.set('index', i.toString());
                                                                                router.push(`${pathname}?${params.toString()}`);
                                                                            }}
                                                                            className={btnClass}
                                                                        >
                                                                            {i + 1}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Simulation Controls */}
                                                            <div className="mt-auto pt-4 border-t border-slate-100 space-y-2 shrink-0">
                                                                {!isSimulating ? (
                                                                    <button onClick={runSimulation} disabled={Object.keys(matchingAnswers).length === 0} className="w-full bg-[#f8a01b] hover:bg-[#e08e15] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#f8a01b]/20 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-30 disabled:grayscale">
                                                                        <Check size={16} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                                                        Simulasi Selesai
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={resetSimulation} className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/20 transition-all flex items-center justify-center gap-2 group active:scale-95">
                                                                        <Zap size={16} className="text-secondary" />
                                                                        Reset
                                                                    </button>
                                                                )}
                                                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest text-center leading-tight">
                                                                    {!isSimulating ? 'Lakukan simulasi cek skor.' : 'Klik reset untuk ulangi.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })() : null}
                                    </>
                                )}
                            </div>

                            {/* Removed footer */}

                            {/* WATERMARK OVERLAY (Refined) */}
                            <div className="absolute inset-x-0 bottom-4 pointer-events-none flex justify-center opacity-30 select-none z-0">
                                <p className="text-[120px] font-black text-slate-200 uppercase tracking-[0.3em] font-serif rotate-[-15deg] whitespace-nowrap">PREVIEW</p>
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
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
                                    className="px-8 py-4 font-black text-xs text-slate-400 hover:text-primary transition-all uppercase tracking-widest"
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
                                    className="bg-primary text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-[0.2em]"
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
                                <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
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
                    font-style:;
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

                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: translateX(0); }
                    50% { opacity: 0.7; transform: translateX(3px); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
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
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baris</label>
                                        <input
                                            type="number"
                                            min="1" max="10"
                                            value={isNaN(tableRows) ? '' : tableRows}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setTableRows(isNaN(val) ? 1 : val);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-primary outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kolom</label>
                                        <input
                                            type="number"
                                            min="1" max="10"
                                            value={isNaN(tableCols) ? '' : tableCols}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setTableCols(isNaN(val) ? 1 : val);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-primary outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={insertTable}
                                    className="w-full bg-primary text-white py-4 rounded-xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 text-[10px] uppercase tracking-widest"
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
                                    <h3 className="text-lg font-black text-primary uppercase tracking-widest flex items-center gap-3">
                                        <Upload size={22} /> Import Soal Masal
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih metode import yang Anda inginkan</p>
                                </div>
                                <button onClick={() => setIsImportModalOpen(false)} className="bg-slate-100 text-slate-400 hover:text-rose-500 p-2 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex items-start gap-4">
                                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                                        <FileText size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-emerald-900">Format Microsoft Word</p>
                                        <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">Tulis soal dengan nomor (1. 2.), opsi (a. b.), dan kunci (Kunci: A). Dukungan rumus matematika dan klasifikasi [MATCHING], [ESSAY], dll.</p>
                                        <button
                                            onClick={() => handleExportWord(true)}
                                            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mt-3 hover:gap-3 transition-all underline decoration-emerald-200"
                                        >
                                            <Download size={14} /> Download Template Word
                                        </button>
                                    </div>
                                </div>

                                <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center space-y-4 hover:border-primary/30 hover:bg-slate-50/50 transition-all cursor-pointer group relative">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        <Upload size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Pilih File DOCX di sini</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {importFile ? `Berkas terpilih: ${importFile.name}` : 'Atau seret dan lepas file Anda'}
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept=".docx"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Batal</button>
                                    <button
                                        onClick={handleImportDocx}
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
            <ImageCropperModal
                isOpen={isCropperOpen}
                onClose={() => setIsCropperOpen(false)}
                imageSrc={imageToCrop || ''}
                onCropComplete={async (croppedData) => {
                    if (!croppedData) return;
                    setIsSubmitting(true);
                    try {
                        const blob = await (await fetch(croppedData)).blob();
                        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
                        const res = await uploadToHosting(file, 'questions');
                        const finalUrl = res.success ? res.url : croppedData;

                        if (cropperContext.type === 'question') {
                            if (quillInstance) {
                                const range = quillInstance.getSelection();
                                quillInstance.insertEmbed(range?.index || 0, 'image', finalUrl);
                            }
                        } else if (cropperContext.type === 'option' && cropperContext.index !== undefined) {
                            const imgHtml = `<img src="${finalUrl}" style="max-width:140px; height:auto; border-radius:12px; display:block; margin:8px 0;" />`;
                            updateOption(cropperContext.index, { text: options[cropperContext.index].text + imgHtml });
                        } else if (cropperContext.type === 'option_replace' && cropperContext.index !== undefined) {
                            const imgHtml = `<img src="${finalUrl}" style="max-width:140px; height:auto; border-radius:12px; display:block; margin:8px 0;" />`;
                            const newText = options[cropperContext.index].text.replace(/<img.*?>/i, imgHtml);
                            updateOption(cropperContext.index, { text: newText });
                        } else if (cropperContext.type === 'matching_right' && cropperContext.item !== undefined) {
                            const imgHtml = `<img src="${finalUrl}" style="max-width:140px; height:auto; border-radius:12px; display:block; margin:8px 0;" />`;
                            const oldVal = cropperContext.item;
                            const newVal = oldVal + imgHtml;
                            const nextItems = (metadata.right_items || []).map((i: string) => i === oldVal ? newVal : i);
                            setMetadata({ ...metadata, right_items: nextItems });
                            setOptions(options.map(o => ({
                                ...o,
                                match_texts: (o.match_texts || []).map((m: string) => m === oldVal ? newVal : m)
                            })));
                        } else if (cropperContext.type === 'matching_replace' && cropperContext.item !== undefined) {
                            const imgHtml = `<img src="${finalUrl}" style="max-width:140px; height:auto; border-radius:12px; display:block; margin:8px 0;" />`;
                            const oldVal = cropperContext.item;
                            const newVal = oldVal.replace(/<img.*?>/i, imgHtml);

                            const nextItems = (metadata.right_items || []).map((i: string) => i === oldVal ? newVal : i);
                            setMetadata({ ...metadata, right_items: nextItems });
                            setOptions(options.map(o => ({
                                ...o,
                                match_texts: (o.match_texts || []).map((m: string) => m === oldVal ? newVal : m)
                            })));
                        }
                    } catch (e) {
                        console.error(e);
                    } finally {
                        setIsSubmitting(false);
                        setIsCropperOpen(false);
                    }
                }}
            />
        </div>
    );
}
