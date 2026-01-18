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

    const isHourglass = type === 'year';
    const p = palettes[type] || palettes.life;
    const bg = isHourglass ? '#000000' : (p.bg[0] || '#000000');
    const strokeColor = isHourglass ? '#00A3FF' : '#ffffff'; // Brighter Electric Blue
    const accentColor = '#00E0FF'; // Cyan for highlights

    const paddingBottom = height * 0.20;
    const contentWidth = width * 0.98;
    const contentHeight = height - offsetTop - paddingBottom;

    let svgContent = '';

    const defs = `
        <defs>
            <filter id="bloom" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 0 0 0 0.6  0 0 0 0 1  0 0 0 1 0" />
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <filter id="sand-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feFlood flood-color="${strokeColor}" flood-opacity="0.4" result="color" />
                <feComposite in="color" in2="blur" operator="in" />
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <pattern id="grain" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.5" fill="white" fill-opacity="0.2"/>
                <circle cx="7" cy="5" r="0.5" fill="white" fill-opacity="0.1"/>
            </pattern>
            <radialGradient id="meshGradient" cx="50%" cy="40%" r="80%" fx="50%" fy="40%">
                <stop offset="0%" stop-color="${isHourglass ? '#050c1f' : p.bg[1]}" />
                <stop offset="60%" stop-color="#000000" />
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
        const cx = width / 2;
        const hgH = 720; // Slightly taller to use more screen
        const hgW = 460; // Slightly wider for more "belly"
        const neckY = offsetTop + (hgH / 2) - 20;
        const topY = neckY - hgH / 2;
        const bottomY = neckY + hgH / 2;
        const neckWidth = 18;

        const getWidthAtY = (y: number) => {
            const h = hgH / 2;
            const dy = Math.abs(y - neckY);
            const p = dy / h;
            // More organic bulge: mix of quadratic and cubic
            return neckWidth + (hgW - neckWidth) * (0.3 * Math.pow(p, 1.5) + 0.7 * Math.pow(p, 3));
        };

        // --- UPDATED DEFS WITH GRADIENTS ---
        const localDefs = `
          <linearGradient id="sandGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="${strokeColor}" stop-opacity="1" />
            <stop offset="70%" stop-color="${accentColor}" stop-opacity="0.6" />
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.3" />
          </linearGradient>
          <radialGradient id="highlightGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="white" stop-opacity="0.4" />
            <stop offset="100%" stop-color="white" stop-opacity="0" />
          </radialGradient>
        `;

        // --- GLASS OUTLINE (Organic Bulge) ---
        const glassPath = `
          M ${cx - hgW / 2} ${topY} L ${cx + hgW / 2} ${topY}
          C ${cx + hgW / 2 + 40} ${topY + 220}, ${cx + neckWidth * 4} ${neckY - 100}, ${cx + neckWidth / 2} ${neckY}
          C ${cx + neckWidth * 4} ${neckY + 100}, ${cx + hgW / 2 + 40} ${bottomY - 220}, ${cx + hgW / 2} ${bottomY}
          L ${cx - hgW / 2} ${bottomY}
          C ${cx - hgW / 2 - 40} ${bottomY - 220}, ${cx - neckWidth * 4} ${neckY + 100}, ${cx - neckWidth / 2} ${neckY}
          C ${cx - neckWidth * 4} ${neckY - 100}, ${cx - hgW / 2 - 40} ${topY + 220}, ${cx - hgW / 2} ${topY}
          Z
        `;

        svgContent += localDefs;
        svgContent += `<path d="${glassPath}" fill="white" fill-opacity="0.01" stroke="${strokeColor}" stroke-width="2" stroke-opacity="0.6" filter="url(#bloom)" />`;

        // Caps
        svgContent += `<line x1="${cx - hgW / 2 - 40}" y1="${topY}" x2="${cx + hgW / 2 + 40}" y2="${topY}" stroke="${strokeColor}" stroke-width="4" stroke-linecap="round" filter="url(#bloom)" />`;
        svgContent += `<line x1="${cx - hgW / 2 - 40}" y1="${bottomY}" x2="${cx + hgW / 2 + 40}" y2="${bottomY}" stroke="${strokeColor}" stroke-width="4" stroke-linecap="round" filter="url(#bloom)" />`;

        const progress = data.elapsed / data.total;

        // --- BOTTOM VOLUME (Organic Heaped Mound) ---
        const fillHeightBottom = progress * (hgH * 0.46);
        if (fillHeightBottom > 5) {
            const fillY = bottomY - fillHeightBottom;
            const wAtFill = getWidthAtY(fillY) - 15;
            const moundH = Math.min(80, fillHeightBottom * 0.9);
            const sandPathBottom = `
              M ${cx - wAtFill / 2} ${bottomY - 5}
              L ${cx + wAtFill / 2} ${bottomY - 5}
              C ${cx + wAtFill / 2} ${bottomY - 30}, ${cx + wAtFill / 3} ${fillY}, ${cx} ${fillY - moundH}
              C ${cx - wAtFill / 3} ${fillY}, ${cx - wAtFill / 2} ${bottomY - 30}, ${cx - wAtFill / 2} ${bottomY - 5}
              Z
            `;
            svgContent += `<path d="${sandPathBottom}" fill="url(#sandGrad)" filter="url(#sand-glow)" />`;
            svgContent += `<path d="${sandPathBottom}" fill="url(#grain)" />`;
        }

        // --- TOP VOLUME (Concave Draining Curve) ---
        const remainingRatio = data.remaining / data.total;
        const fillHeightTop = remainingRatio * (hgH * 0.46);
        if (fillHeightTop > 5) {
            const fillYTopBase = neckY - 10;
            const fillYTopSurface = neckY - 10 - fillHeightTop;
            const wAtFillTop = getWidthAtY(fillYTopSurface) - 15;

            // The "Vortex" effect: a curve that dips in the middle
            const vortexDip = Math.min(40, fillHeightTop * 0.5);

            const sandPathTop = `
              M ${cx - neckWidth / 2} ${fillYTopBase}
              L ${cx + neckWidth / 2} ${fillYTopBase}
              C ${cx + neckWidth} ${fillYTopBase - 40}, ${cx + wAtFillTop / 2} ${fillYTopSurface + 40}, ${cx + wAtFillTop / 2} ${fillYTopSurface}
              Q ${cx} ${fillYTopSurface + vortexDip} ${cx - wAtFillTop / 2} ${fillYTopSurface}
              C ${cx - wAtFillTop / 2} ${fillYTopSurface + 40}, ${cx - neckWidth} ${fillYTopBase - 40}, ${cx - neckWidth / 2} ${fillYTopBase}
              Z
            `;
            svgContent += `<path d="${sandPathTop}" fill="url(#sandGrad)" opacity="0.8" filter="url(#sand-glow)" />`;
            svgContent += `<path d="${sandPathTop}" fill="url(#grain)" />`;
        }

        // --- ATMospheric Details ---
        for (let i = 0; i < 30; i++) {
            const rx = cx + (Math.random() - 0.5) * hgW * 1.5;
            const ry = offsetTop + Math.random() * hgH * 1.2;
            const size = Math.random() * 1.5 + 0.5;
            svgContent += `<circle cx="${rx}" cy="${ry}" r="${size}" fill="${accentColor}" opacity="${Math.random() * 0.4}" />`;
        }

        // --- FALLING STREAM (Realistic Dripping Grains) ---
        const streamEnd = bottomY - fillHeightBottom - 15;
        const grainCount = 22; // Even more grains for fluid flow
        for (let i = 0; i < grainCount; i++) {
            const progressY = i / (grainCount - 1);
            const grainY = neckY + progressY * (streamEnd - neckY);
            // Slight horizontal jitter for a natural "dropping" look
            const jitter = (Math.sin(i * 2.2) * 1.8);
            const size = 3 * (0.8 + Math.random() * 0.4);
            const op = 1.0 - (progressY * 0.2); // Maintain high visibility

            if (grainY < streamEnd) {
                svgContent += `<circle cx="${cx + jitter}" cy="${grainY}" r="${size}" fill="${accentColor}" opacity="${op}" filter="url(#bloom)" />`;
            }
        }
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

    const finalBg = 'url(#meshGradient)';

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${defs}
      <rect width="100%" height="100%" fill="${finalBg}" />
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
