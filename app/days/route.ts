import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getLifeInWeeks, getYearProgress, getGoalProgress, CalendarType } from '@/lib/calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IPHONE_6_SPEC = { width: 750, height: 1334, offsetTop: 420 }; // Increased offset to clear clock completely

function generateSVG(type: CalendarType, data: any, specs: { width: number, height: number, offsetTop: number }): string {
    const { width, height, offsetTop } = specs;

    const palettes = {
        life: { primary: '#FF2D55', accent: '#AF52DE', bg: ['#000000', '#12041a', '#0a0012'] },
        year: { primary: '#007AFF', accent: '#5856D6', bg: ['#000000', '#040b1a', '#000812'] },
        goal: { primary: '#FF9500', accent: '#FF3B30', bg: ['#000000', '#1a0d04', '#120800'] },
    };

    const p = palettes[type] || palettes.life;
    const paddingBottom = height * 0.20; // Room for footer labels
    const contentWidth = width * 0.97;   // 10% bigger width-wise (0.88 -> 0.97)
    const contentHeight = height - offsetTop - paddingBottom;

    let svgContent = '';

    const defs = `
        <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="meshGradient" cx="50%" cy="40%" r="80%" fx="50%" fy="40%">
                <stop offset="0%" stop-color="${p.bg[1]}" />
                <stop offset="60%" stop-color="${p.bg[2]}" />
                <stop offset="100%" stop-color="${p.bg[0]}" />
            </radialGradient>
        </defs>
    `;

    if (type === 'life') {
        const rows = 80;
        const cols = 52;
        const gap = 3;

        // Calculate size to fit BOTH width and height
        const availableW = contentWidth - (cols - 1) * gap;
        const availableH = contentHeight - (rows - 1) * gap;
        const cellSize = Math.min(availableW / cols, availableH / rows);

        const actualW = cols * cellSize + (cols - 1) * gap;
        const actualH = rows * cellSize + (rows - 1) * gap;

        const gridX = (width - actualW) / 2;
        const gridY = offsetTop + (contentHeight - actualH) / 2;

        for (let i = 0; i < rows * cols; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = gridX + col * (cellSize + gap);
            const y = gridY + row * (cellSize + gap);
            const isLived = i < data.elapsed;
            const color = isLived ? p.primary : '#1c1c1e';
            const opacity = isLived ? 1 : 0.3;
            svgContent += `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${cellSize / 2.2}" fill="${color}" opacity="${opacity}" ${isLived && i % 400 === 0 ? 'filter="url(#glow)"' : ''} />`;
        }
    } else if (type === 'year') {
        const cols = 15;
        const rows = 25;
        const gap = 7; // Adjusted for slightly larger grid

        // Calculate size to fit BOTH width and height
        const availableW = contentWidth - (cols - 1) * gap;
        const availableH = contentHeight - (rows - 1) * gap;
        const cellSize = Math.min(availableW / cols, availableH / rows);

        const actualW = cols * cellSize + (cols - 1) * gap;
        const actualH = rows * cellSize + (rows - 1) * gap;

        const gridX = (width - actualW) / 2;
        const gridY = offsetTop + (contentHeight - actualH) / 2;

        for (let i = 0; i < data.total; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = gridX + col * (cellSize + gap);
            const y = gridY + row * (cellSize + gap);
            const isElapsed = i < data.elapsed;
            const color = isElapsed ? p.primary : '#1c1c1e';
            svgContent += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellSize / 4}" fill="${color}" opacity="${isElapsed ? 1 : 0.4}" ${isElapsed && i % 10 === 0 ? 'filter="url(#soft-glow)"' : ''} />`;
        }

        // Year Label
        svgContent += `<text x="${width / 2}" y="${gridY - (width / 10)}" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="900" font-size="${width / 9}" fill="white" letter-spacing="-1">${data.label}</text>`;

        // Footer Labels
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        svgContent += `
            <text x="${gridX}" y="${gridY + actualH + 60}" text-anchor="start" font-family="-apple-system, sans-serif" font-weight="700" font-size="${width / 24}" fill="rgba(255,255,255,0.4)" letter-spacing="1">${data.elapsed} DAYS GONE IN ${currentYear}</text>
            <text x="${gridX + actualW}" y="${gridY + actualH + 60}" text-anchor="end" font-family="-apple-system, sans-serif" font-weight="700" font-size="${width / 24}" fill="rgba(255,255,255,0.4)" letter-spacing="1">${data.remaining} DAYS LEFT TILL ${nextYear}</text>
        `;
    } else if (type === 'goal') {
        const cx = width / 2;
        const cy = offsetTop + contentHeight / 2;
        const r = width * 0.35;
        const strokeWidth = width * 0.08;
        const circumference = 2 * Math.PI * r;
        const progress = (data.elapsed / data.total) || 0;
        const offset = circumference * (1 - progress);

        svgContent += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1c1c1e" stroke-width="${strokeWidth}" />`;
        svgContent += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.primary}" stroke-width="${strokeWidth}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" filter="url(#soft-glow)" />`;
        svgContent += `<text x="${cx}" y="${cy + width / 30}" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="900" font-size="${width / 3}" fill="white" filter="url(#soft-glow)">${data.remaining}</text>`;
        svgContent += `<text x="${cx}" y="${cy + width / 5}" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="600" font-size="${width / 22}" fill="rgba(255,255,255,0.4)" letter-spacing="12">DAYS LEFT</text>`;
    }

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${defs}
      <rect width="100%" height="100%" fill="url(#meshGradient)" />
      ${svgContent}
    </svg>
  `;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') as CalendarType) || 'life';
    const dob = searchParams.get('dob');
    const goalDate = searchParams.get('goalDate');

    // Hardcode stats for iPhone 6 for "best" focus
    const specs = IPHONE_6_SPEC;

    try {
        let data;
        if (type === 'life') {
            data = getLifeInWeeks(new Date(dob || '2000-01-01'));
        } else if (type === 'year') {
            data = getYearProgress();
        } else {
            data = getGoalProgress(new Date(goalDate || '2025-12-31'));
        }

        const svg = generateSVG(type, data, specs);
        const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

        return new NextResponse(pngBuffer as any, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (e: any) {
        return new NextResponse(null, { status: 500 });
    }
}
