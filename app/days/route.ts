import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getLifeInWeeks, getYearProgress, getGoalProgress, CalendarType } from '@/lib/calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type DeviceId =
    | 'iphone_6_8' | 'iphone_6_8_plus'
    | 'iphone_x_11pro' | 'iphone_xr_11' | 'iphone_xsmax_11promax'
    | 'iphone_12_14' | 'iphone_12_14_max'
    | 'iphone_14_15_pro' | 'iphone_14_15_promax';

interface DeviceSpecs {
    width: number;
    height: number;
    offsetTop: number;
    era: 'home' | 'notch' | 'island';
}

const DEVICE_CONFIGS: Record<DeviceId, DeviceSpecs> = {
    iphone_6_8: { width: 750, height: 1334, offsetTop: 350, era: 'home' },
    iphone_6_8_plus: { width: 1242, height: 2208, offsetTop: 500, era: 'home' },
    iphone_x_11pro: { width: 1125, height: 2436, offsetTop: 700, era: 'notch' },
    iphone_xr_11: { width: 828, height: 1792, offsetTop: 500, era: 'notch' },
    iphone_xsmax_11promax: { width: 1242, height: 2688, offsetTop: 750, era: 'notch' },
    iphone_12_14: { width: 1170, height: 2532, offsetTop: 750, era: 'notch' },
    iphone_12_14_max: { width: 1284, height: 2778, offsetTop: 850, era: 'notch' },
    iphone_14_15_pro: { width: 1179, height: 2556, offsetTop: 850, era: 'island' },
    iphone_14_15_promax: { width: 1290, height: 2796, offsetTop: 950, era: 'island' },
};

function generateSVG(type: CalendarType, data: any, specs: DeviceSpecs): string {
    const { width, height, offsetTop } = specs;

    const palettes = {
        life: { primary: '#FF2D55', accent: '#AF52DE', bg: ['#000000', '#12041a', '#0a0012'] },
        year: { primary: '#007AFF', accent: '#5856D6', bg: ['#000000', '#040b1a', '#000812'] },
        goal: { primary: '#FF9500', accent: '#FF3B30', bg: ['#000000', '#1a0d04', '#120800'] },
    };

    const p = palettes[type] || palettes.life;
    const paddingBottom = height * 0.15;
    const contentWidth = width * 0.90;
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
        const gap = (width > 1000) ? 6 : 3;
        const cellSize = (contentWidth - (cols - 1) * gap) / cols;
        const actualH = rows * cellSize + (rows - 1) * gap;
        const gridX = (width - contentWidth) / 2;
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
        const gap = (width > 1000) ? 8 : 4;
        const cellSize = (contentWidth - (cols - 1) * gap) / cols;
        const actualH = rows * cellSize + (rows - 1) * gap;
        const gridX = (width - contentWidth) / 2;
        const gridY = offsetTop + (contentHeight - actualH) / 2;

        for (let i = 0; i < data.total; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = gridX + col * (cellSize + gap);
            const y = gridY + row * (cellSize + gap);
            const isElapsed = i < data.elapsed;
            const color = isElapsed ? p.primary : '#1c1c1e';
            svgContent += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellSize / 4}" fill="${color}" opacity="${isElapsed ? 1 : 0.4}" ${isElapsed && i % 40 === 0 ? 'filter="url(#soft-glow)"' : ''} />`;
        }
        svgContent += `<text x="${width / 2}" y="${gridY - 120}" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="900" font-size="${width / 10}" fill="white" letter-spacing="-2">${data.label}</text>`;
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

    // Explicit Width/Height support
    const reqWidth = parseInt(searchParams.get('width') || '0');
    const reqHeight = parseInt(searchParams.get('height') || '0');

    // Fallback to device logic
    const deviceId = (searchParams.get('device') as DeviceId) || 'iphone_14_15_promax';
    const deviceSpecs = DEVICE_CONFIGS[deviceId] || DEVICE_CONFIGS.iphone_14_15_promax;

    const specs: DeviceSpecs = {
        width: reqWidth || deviceSpecs.width,
        height: reqHeight || deviceSpecs.height,
        offsetTop: deviceSpecs.offsetTop, // In a real app we'd calculate this based on aspect ratio/era
        era: deviceSpecs.era
    };

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
