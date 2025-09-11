"use client";
import Link from 'next/link';
import React from 'react';

type ThemeShape = { border: string; text: string; appBg: string; link: string } & Record<string, any>;

type Props = {
    title: string;
    company: string;
    darkMode: boolean;
    theme: ThemeShape;
    href?: string;
    ariaLabel?: string;
    linkTitle?: string;
};

export default function CompactJobCard({ title, company, darkMode, theme, href, ariaLabel, linkTitle }: Props) {
    const content = (
        <div
            style={{
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                background: theme.appBg,
                padding: 10,
                minWidth: 220,
                maxWidth: 280,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {company}
                    </div>
                    <div style={{ fontSize: 13, color: darkMode ? '#9ca3af' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                    </div>
                </div>
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} aria-label={ariaLabel} title={linkTitle} style={{ textDecoration: 'none', color: 'inherit' }}>
                {content}
            </Link>
        );
    }

    return content;
}
