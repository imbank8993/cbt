"use server";

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate Kisi-kisi (Exam Blueprint) using AI
 */
export async function generateKisiKisiAction(questionText: string, options?: string[]) {
    try {
        const prompt = `
            Anda adalah seorang pakar kurikulum pendidikan di Indonesia.
            Tugas Anda adalah membuat "Kisi-kisi" soal (Exam Blueprint) berdasarkan teks pertanyaan yang diberikan.
            
            Kisi-kisi harus mencakup:
            1. Kompetensi Dasar / Lingkup Materi
            2. Indikator Soal
            3. Level Kognitif (L1/L2/L3 atau LOTS/MOTS/HOTS)
            
            Format jawaban harus singkat, padat, dan profesional dalam Bahasa Indonesia.
            Contoh Format:
            "KD: [Isi KD], Indikator: [Isi Indikator], Level: [Isi Level]"

            Teks Pertanyaan:
            "${questionText}"
            
            ${options && options.length > 0 ? `Pilihan Jawaban:\n${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}` : ''}
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Anda adalah asisten cerdas yang membantu guru membuat kisi-kisi soal sesuai standar pendidikan Indonesia." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 300,
        });

        const kisi = response.choices[0]?.message?.content?.trim() || "Gagal menghasilkan kisi-kisi.";
        return { success: true, kisi };
    } catch (error: any) {
        console.error('AI: Grid generation error:', error);
        // Log more details for debugging
        if (error.response) {
            console.error('AI: Status:', error.response.status);
            console.error('AI: Data:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}
