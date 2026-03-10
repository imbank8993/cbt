"use client";
import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

/**
 * Robust LaTeX & Quran Renderer that supports multiple delimiters
 * Delimiters supported: $$, [% %], $, \[ \], and [q /q] for Quran
 */
export const LatexRenderer = ({ text }: { text: string }) => {
    if (!text) return null;

    // Use dangerouslySetInnerHTML for HTML content from Quill
    // and split by LaTeX and Quran delimiters.
    const regex = /(\$\$[\s\S]*?\$\$|\[%[\s\S]*?%\]|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$|\[q\][\s\S]*?\[\/q\])/g;

    // Sanitize common "ffffff" bug residue from editor
    const sanitizedText = text.replace(/ffffff/g, '');
    const parts = sanitizedText.split(regex);

    return (
        <div className="rich-content whitespace-normal">
            {parts.map((part, i) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    return <div key={i} className="overflow-x-auto my-2 custom-scrollbar"><BlockMath math={part.slice(2, -2)} /></div>;
                }
                if (part.startsWith('[%') && part.endsWith('%]')) {
                    return <div key={i} className="overflow-x-auto my-2 custom-scrollbar"><BlockMath math={part.slice(2, -2)} /></div>;
                }
                if (part.startsWith('\\[') && part.endsWith('\\]')) {
                    return <div key={i} className="overflow-x-auto my-2 custom-scrollbar"><BlockMath math={part.slice(2, -2)} /></div>;
                }
                if (part.startsWith('$') && part.endsWith('$')) {
                    return <InlineMath key={i} math={part.slice(1, -1)} />;
                }
                if (part.startsWith('[q]') && part.endsWith('[/q]')) {
                    return (
                        <div key={i} className="quran-text force-wrap" dir="rtl" style={{
                            fontFamily: "'Amiri', serif",
                            direction: 'rtl',
                            fontSize: '1.75rem',
                            lineHeight: '2.2',
                            display: 'block',
                            padding: '1rem 0',
                            color: '#030c4d',
                            textAlign: 'center',
                            wordSpacing: '0.1em',
                            fontWeight: 500,
                            width: '100%'
                        }}>
                            {part.slice(3, -4)}
                        </div>
                    );
                }
                // Handle HTML from Quill
                return <div key={i} className="contents" dangerouslySetInnerHTML={{ __html: part }} />;
            })}
        </div>
    );
};
