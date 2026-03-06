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
                        <span key={i} className="quran-text" dir="rtl" style={{
                            fontFamily: "'Amiri', serif",
                            direction: 'rtl',
                            fontSize: '1.75rem',
                            lineHeight: '2.2',
                            display: 'inline-block',
                            padding: '0 0.5rem',
                            color: '#030c4d',
                            textAlign: 'right',
                            wordSpacing: '0.1em',
                            fontWeight: 500
                        }}>
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
