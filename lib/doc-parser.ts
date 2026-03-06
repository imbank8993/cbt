import mammoth from "mammoth";
import { Buffer } from "buffer";
import { QuestionType } from "@/app/actions/question";
import { uploadToHosting } from "@/lib/uploader";

export interface ParsedQuestion {
    question_text: string;
    type: QuestionType;
    difficulty: 'easy' | 'medium' | 'hard';
    scoreDefault: number;
    options: {
        text: string;
        isCorrect: boolean;
        order: number;
        weight: number;
        metadata?: any;
    }[];
    metadata: any;
}

/**
 * Mengekstrak gambar base64 dari HTML dan mengupload ke hosting eksternal
 * Mengembalikan HTML baru dengan URL gambar eksternal
 */
async function uploadEmbeddedImages(html: string): Promise<string> {
    // Cari semua tag <img src="data:..."> (base64 embedded images dari Word)
    const imgRegex = /<img\s+[^>]*src="data:([^;]+);base64,([^"]+)"[^>]*>/gi;
    const matches = [...html.matchAll(imgRegex)];

    if (matches.length === 0) return html;

    let result = html;

    for (const match of matches) {
        const mimeType = match[1]; // e.g. "image/png"
        const base64Data = match[2];
        const ext = mimeType.split('/')[1] || 'png';

        try {
            // Konversi base64 ke Blob/File
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const file = new File([blob], `docx_img_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`, { type: mimeType });

            // Upload ke hosting eksternal
            const uploadResult = await uploadToHosting(file, 'questions');

            if (uploadResult.success && uploadResult.url) {
                // Ganti src base64 dengan URL hosting
                result = result.replace(match[0], `<img src="${uploadResult.url}" style="max-width:100%;height:auto;" />`);
            }
        } catch (err) {
            console.error('Failed to upload embedded image:', err);
            // Tetap gunakan base64 jika gagal upload
        }
    }

    return result;
}

export async function parseDocxToQuestions(file: File): Promise<ParsedQuestion[]> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: Buffer.from(arrayBuffer) as any });
    let html = result.value;

    // Upload gambar yang di-embed dari Word ke hosting eksternal
    html = await uploadEmbeddedImages(html);

    // 1. Try Table Format First
    if (html.includes('<table')) {
        const tableQuestions = parseTableFormat(html);
        if (tableQuestions.length > 0) return tableQuestions;
    }

    // 2. Fallback to Paragraph Format
    return parseParagraphFormat(html);
}

function parseTableFormat(html: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const rowMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];

    for (let i = 1; i < rowMatches.length; i++) {
        const cellMatches = rowMatches[i].match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
        if (cellMatches.length < 5) continue;

        const cleanCell = (cellHtml: string, keepImages = false) => {
            let cleaned = cellHtml
                .replace(/<td[^>]*>/, "")
                .replace(/<\/td>/, "");

            if (keepImages) {
                // Pertahankan tag <img> tapi bersihkan tag HTML lain
                cleaned = cleaned
                    .replace(/<\/p>/g, "\n")
                    .replace(/<br\s*\/?>/g, "\n")
                    .replace(/<(?!img\b)[^>]*>/g, "")
                    .trim();
            } else {
                cleaned = cleaned
                    .replace(/<\/p>/g, "\n")
                    .replace(/<br\s*\/?>/g, "\n")
                    .replace(/<[^>]*>/g, "")
                    .trim();
            }
            return cleaned;
        };

        // Kolom pertanyaan: pertahankan gambar
        const questionText = cleanCell(cellMatches[1], true).replace(/\n+$/, "").replace(/\n/g, "<br>");
        const typeRaw = cleanCell(cellMatches[2]).toUpperCase();
        const optionsRaw = cleanCell(cellMatches[3], true); // pertahankan gambar di opsi juga
        const kunciRaw = cleanCell(cellMatches[4]);
        const poinRaw = cellMatches.length >= 6 ? cleanCell(cellMatches[5]) : "1";

        if (!questionText) continue;

        let type: QuestionType = 'mcq';
        if (typeRaw.includes('PGK') || typeRaw.includes('COMPLEX')) type = 'mcq_complex';
        else if (typeRaw.includes('BS') || typeRaw.includes('TRUE')) type = 'true_false';
        else if (typeRaw.includes('MATCH')) type = 'matching';
        else if (typeRaw.includes('CAT')) type = 'categorization';
        else if (typeRaw.includes('ISIAN') || typeRaw.includes('SHORT')) type = 'short_answer';
        else if (typeRaw.includes('URAIAN') || typeRaw.includes('ESSAY')) type = 'essay';

        const options: any[] = [];
        const optLines = optionsRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const kunciLines = kunciRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const scoreDefault = parseFloat(poinRaw) || 1;

        if (type === 'matching') {
            optLines.forEach((text, idx) => {
                options.push({
                    text: text,
                    isCorrect: true,
                    order: idx,
                    weight: 1,
                    metadata: { match_text: kunciLines[idx] || "" }
                });
            });
        } else if (type === 'categorization') {
            optLines.forEach((text, idx) => {
                options.push({
                    text: text,
                    isCorrect: true,
                    order: idx,
                    weight: 1,
                    metadata: { category_name: kunciLines[idx] || "" }
                });
            });
        } else if (type === 'short_answer') {
            options.push({
                text: kunciLines[0] || kunciRaw.trim(),
                isCorrect: true,
                order: 0,
                weight: 1
            });
        } else if (type === 'essay') {
            // No options
        } else {
            const kunciFlat = kunciRaw.split(/[\n,;]+/).map(l => l.trim().toUpperCase()).filter(l => l.length > 0);
            optLines.forEach((text, idx) => {
                const plainText = text.replace(/^[a-eA-E][\.)\s]+/, "").trim();
                const char = text.match(/^[a-eA-E]/)?.[0]?.toUpperCase() || String.fromCharCode(65 + idx);
                const isCorrect = kunciFlat.includes(char) || kunciFlat.includes(text.toUpperCase()) || kunciFlat.includes(plainText.toUpperCase());

                options.push({
                    text: plainText || text,
                    isCorrect: isCorrect,
                    order: idx,
                    weight: isCorrect ? 1 : 0
                });
            });
        }

        questions.push({
            question_text: questionText,
            type: type,
            difficulty: 'medium',
            scoreDefault: scoreDefault,
            options: options,
            metadata: {}
        });
    }
    return questions;
}

function parseParagraphFormat(html: string): ParsedQuestion[] {
    const paragraphs = html.split(/<\/p>/).map(p => p.replace(/<p>/g, "").trim()).filter(p => p.length > 0);

    const questions: ParsedQuestion[] = [];
    let currentQuestion: Partial<ParsedQuestion> | null = null;
    let currentOptions: any[] = [];

    for (const text of paragraphs) {
        // Bersihkan teks tapi pertahankan gambar
        const plainText = text.replace(/<(?!img\b)[^>]*>/g, "").trim();
        if (/^\d+[\.)\s]/.test(plainText)) {
            if (currentQuestion) finalizeQuestion(currentQuestion as ParsedQuestion, currentOptions, questions);
            currentQuestion = { question_text: text.replace(/^\d+[\.)\s]+/, ""), type: 'mcq', difficulty: 'medium', scoreDefault: 1, metadata: {} };
            currentOptions = [];
            const markerMatch = plainText.match(/\[(MATCHING|ESSAY|SHORT_ANSWER|CATEGORIZATION|TRUE_FALSE|ISIAN|URAIAN)\]/i);
            if (markerMatch) {
                const m = markerMatch[1].toUpperCase();
                if (m === 'ISIAN') currentQuestion.type = 'short_answer' as QuestionType;
                else if (m === 'URAIAN') currentQuestion.type = 'essay' as QuestionType;
                else currentQuestion.type = m.toLowerCase() as QuestionType;
            }
            continue;
        }
        if (!currentQuestion) continue;

        const optionMatch = plainText.match(/^([a-eA-E])[\.)\s]+(.*)/);
        if (optionMatch) {
            currentOptions.push({ text: optionMatch[2].trim(), isCorrect: false, order: currentOptions.length, weight: 0 });
            continue;
        }

        const kunciMatch = plainText.match(/^(Kunci|Jawaban|Key)\s*[:\s]\s*([a-eA-E1-9\s,&]+)/i);
        if (kunciMatch && currentQuestion.type !== 'short_answer') {
            const keys = kunciMatch[2].toUpperCase().split(/[\s,&]+/).map(k => k.trim()).filter(k => k.length > 0);
            currentOptions.forEach((opt, idx) => {
                if (keys.includes(String.fromCharCode(65 + idx))) { opt.isCorrect = true; opt.weight = 1; }
            });
            if (keys.length > 1) currentQuestion.type = 'mcq_complex' as QuestionType;
            continue;
        }

        if (plainText.includes('==')) {
            const [left, right] = plainText.split('==').map(s => s.trim());
            currentQuestion.type = 'matching' as QuestionType;
            currentOptions.push({ text: left, isCorrect: true, order: currentOptions.length, weight: 1, metadata: { match_text: right } });
            continue;
        }

        currentQuestion.question_text += "<br>" + text;
    }
    if (currentQuestion) finalizeQuestion(currentQuestion as ParsedQuestion, currentOptions, questions);
    return questions;
}

function finalizeQuestion(q: ParsedQuestion, opts: any[], questions: ParsedQuestion[]) {
    q.options = opts;
    if (opts.length === 2 && q.type === 'mcq') {
        const hasBenar = opts.some(o => /^(benar|true|betul)$/i.test(o.text));
        const hasSalah = opts.some(o => /^(salah|false)$/i.test(o.text));
        if (hasBenar && hasSalah) q.type = 'true_false';
    }
    if (opts.length === 0 && q.type === 'mcq') q.type = 'essay';
    questions.push(q);
}
