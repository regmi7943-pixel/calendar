'use client';

import Image from "next/image";
import { useState, useEffect } from "react";

type CalendarType = 'life' | 'year' | 'goal';

const IPHONE_MODELS = [
    { id: 'iphone_14_15_promax', name: 'iPhone 15 / 15 Pro / 16', w: 1290, h: 2796 },
    { id: 'iphone_14_15_pro', name: 'iPhone 14 / 15', w: 1179, h: 2556 },
    { id: 'iphone_12_14_max', name: 'iPhone 12 / 13 / 14 Pro Max', w: 1284, h: 2778 },
    { id: 'iphone_12_14', name: 'iPhone 12 / 13 / 14', w: 1170, h: 2532 },
    { id: 'iphone_xsmax_11promax', name: 'iPhone XS Max / 11 Pro Max', w: 1242, h: 2688 },
    { id: 'iphone_xr_11', name: 'iPhone XR / 11', w: 828, h: 1792 },
    { id: 'iphone_x_11pro', name: 'iPhone X / XS / 11 Pro', w: 1125, h: 2436 },
    { id: 'iphone_6_8_plus', name: 'iPhone 6 Plus / 7 Plus / 8 Plus', w: 1242, h: 2208 },
    { id: 'iphone_6_8', name: 'iPhone 6 / 7 / 8', w: 750, h: 1334 },
];

export default function Home() {
    const [origin, setOrigin] = useState("");
    const [config, setConfig] = useState<{ open: boolean; type: CalendarType | null }>({ open: false, type: null });

    // Separate date states to match exact UI
    const [birthYear, setBirthYear] = useState('2000');
    const [birthMonth, setBirthMonth] = useState('01');
    const [birthDay, setBirthDay] = useState('01');

    const [goalYear, setGoalYear] = useState('2025');
    const [goalMonth, setGoalMonth] = useState('12');
    const [goalDay, setGoalDay] = useState('31');

    const [device, setDevice] = useState('iphone_14_15_promax');

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const dob = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
    const goalDate = `${goalYear}-${goalMonth.padStart(2, '0')}-${goalDay.padStart(2, '0')}`;

    const getPreviewUrl = (type: CalendarType) => {
        if (!origin) return '';
        const model = IPHONE_MODELS.find(m => m.id === device) || IPHONE_MODELS[0];
        return `${origin}/days?type=${type}&width=${model.w}&height=${model.h}&dob=${dob}&goalDate=${goalDate}`;
    };

    const copyFinalUrl = () => {
        if (!config.type) return;
        const url = getPreviewUrl(config.type);
        navigator.clipboard.writeText(url);
        alert("API URL copied!");
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-neutral-800 overflow-x-hidden">
            {/* Minimal Header */}
            <header className="h-[70px] border-b border-neutral-900 flex items-center justify-center bg-black sticky top-0 z-50">
                <span className="text-[17px] font-medium tracking-tight">The Life Calendar</span>
            </header>

            <main className="flex flex-col md:flex-row min-h-[calc(100vh-70px)]">
                <Section title="Life Calendar" subtitle="Visualize your life in weeks" src={getPreviewUrl('life')} onInstall={() => setConfig({ open: true, type: 'life' })} />
                <Section title="Year Calendar" subtitle="Track the current year's progress" src={getPreviewUrl('year')} onInstall={() => setConfig({ open: true, type: 'year' })} />
                <Section title="Goal Calendar" subtitle="Count down to your deadline" src={getPreviewUrl('goal')} onInstall={() => setConfig({ open: true, type: 'goal' })} noBorder />
            </main>

            <SetupGuide />

            {/* Installation Modal (Reference Design) */}
            {config.open && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setConfig({ open: false, type: null })} />

                    <div className="relative bg-[#050505] border-t md:border border-neutral-800 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
                        {/* Drag Handle */}
                        <div className="w-16 h-1.5 bg-neutral-800 rounded-full mx-auto mt-4 mb-2 shrink-0" />

                        <div className="overflow-y-auto px-6 py-8 md:px-12 md:py-12 custom-scrollbar">
                            <div className="space-y-4 mb-12">
                                <h2 className="text-[42px] font-bold tracking-tight leading-none">Installation Steps</h2>
                                <p className="text-neutral-500 text-lg leading-relaxed max-w-lg">
                                    First, define your wallpaper settings. Then create an automation to run daily. Finally, add the shortcut actions to update your lock screen.
                                </p>
                            </div>

                            <div className="space-y-16">
                                {/* Step 1: Define Wallpaper */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center font-bold text-sm">1</div>
                                        <h3 className="text-2xl font-bold tracking-tight">Define your Wallpaper</h3>
                                    </div>

                                    <div className="space-y-10 pl-12">
                                        {config.type === 'life' && (
                                            <div className="space-y-4">
                                                <label className="text-sm font-medium text-neutral-400">Your Birthday</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <Input label="Year" value={birthYear} onChange={setBirthYear} placeholder="1995" />
                                                    <Input label="Month" value={birthMonth} onChange={setBirthMonth} placeholder="05" />
                                                    <Input label="Day" value={birthDay} onChange={setBirthDay} placeholder="12" />
                                                </div>
                                            </div>
                                        )}

                                        {config.type === 'goal' && (
                                            <div className="space-y-4">
                                                <label className="text-sm font-medium text-neutral-400">Target Date</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <Input label="Year" value={goalYear} onChange={setGoalYear} />
                                                    <Input label="Month" value={goalMonth} onChange={setGoalMonth} />
                                                    <Input label="Day" value={goalDay} onChange={setGoalDay} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <label className="text-sm font-medium text-neutral-400">iPhone Model</label>
                                            <div className="relative">
                                                <select
                                                    value={device}
                                                    onChange={(e) => setDevice(e.target.value)}
                                                    className="w-full bg-[#111] border border-neutral-800 rounded-xl p-4 text-[15px] font-medium outline-none focus:border-neutral-500 transition-colors cursor-pointer appearance-none pr-10"
                                                >
                                                    {IPHONE_MODELS.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Create Automation */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center font-bold text-sm">2</div>
                                        <h3 className="text-2xl font-bold tracking-tight">Create Automation</h3>
                                    </div>

                                    <div className="pl-12">
                                        <div className="bg-[#0D0D0D] border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
                                            <p className="text-neutral-400 leading-relaxed text-[15px]">
                                                Open <span className="text-white underline underline-offset-4 decoration-neutral-700 font-semibold cursor-pointer">Shortcuts</span> app → Go to <span className="font-bold text-white">Automation</span> tab → New Automation → <span className="font-bold text-white">Time of Day</span> → 6:00 AM → Repeat Daily.
                                            </p>
                                            <p className="text-neutral-400 leading-relaxed text-[15px]">
                                                Ensure <span className="italic text-white">Run Immediately</span> is selected.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: Add Shortcut Actions */}
                                <div className="space-y-8 pb-12">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center font-bold text-sm">3</div>
                                        <h3 className="text-2xl font-bold tracking-tight">Add Actions</h3>
                                    </div>

                                    <div className="pl-12 space-y-6">
                                        {origin.includes('localhost') && (
                                            <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-xl space-y-2">
                                                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                    Important Note
                                                </div>
                                                <p className="text-amber-200/60 text-xs leading-relaxed">
                                                    You are currently running on <b>localhost</b>. Shortcuts on your physical iPhone cannot reach this URL. This link will work perfectly once you deploy to Vercel or a public URL.
                                                </p>
                                            </div>
                                        )}
                                        <button
                                            onClick={copyFinalUrl}
                                            className="w-full bg-white text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all active:scale-[0.98] shadow-lg"
                                        >
                                            <span>Copy API URL</span>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        </button>
                                        <p className="text-neutral-500 text-sm text-center italic">Then add 'Get Contents of URL' and 'Set Wallpaper' actions in your shortcut.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #222;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #333;
                }
            `}</style>
        </div>
    );
}

function Section({ title, subtitle, src, onInstall, noBorder }: any) {
    return (
        <div className={`flex-1 flex flex-col items-center py-20 px-10 bg-[#0D0D0D] transition-colors hover:bg-[#111] group ${!noBorder ? 'md:border-r border-neutral-900 border-b md:border-b-0' : ''}`}>
            <h2 className="text-[28px] font-bold tracking-tight mb-1">{title}</h2>
            <p className="text-[#636366] text-[15px] mb-12">{subtitle}</p>
            <div className="mb-12"><IPhoneMockup src={src} /></div>
            <button onClick={onInstall} className="bg-black border border-neutral-800 rounded-[10px] px-12 py-3.5 text-[15px] font-semibold flex items-center gap-2.5 transition-all hover:bg-neutral-900 active:scale-[0.98]">
                Next <svg className="w-2.5 h-2.5 translate-y-[0.5px] opacity-60" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 5L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
        </div>
    );
}

function SetupGuide() {
    return (
        <section className="bg-black border-t border-neutral-900 pb-48">
            <div className="h-[100px] flex items-center justify-center border-b border-neutral-900 mb-24">
                <h2 className="text-xl font-medium tracking-tight">Implementation Guide</h2>
            </div>
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-neutral-900 rounded-[2rem] overflow-hidden">
                    <GuideStep number="01" title="Create" text="Open Shortcuts app, tap + and name it 'Life Calendar Refresh'." />
                    <GuideStep number="02" title="Configure" text="Search for 'Get Contents of URL'. Obtain your personal link by clicking Install above." />
                    <GuideStep number="03" title="Set" text="Add 'Switch Wallpaper', select Lock Screen, and toggle Show Preview OFF." />
                    <GuideStep number="04" title="Automate" text="Go to Automation, select Time of Day (e.g. 4am), and select Run Immediately." noBorder />
                </div>
            </div>
        </section>
    );
}

function GuideStep({ number, title, text, noBorder }: any) {
    return (
        <div className={`p-10 md:p-12 space-y-6 flex flex-col bg-[#0D0D0D] transition-colors hover:bg-[#111] ${!noBorder ? 'lg:border-r border-neutral-900 border-b lg:border-b-0' : ''}`}>
            <div className="text-[11px] font-black text-neutral-700 tracking-[0.3em] uppercase">{number}</div>
            <div className="space-y-3">
                <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                <p className="text-neutral-500 text-[15px] leading-relaxed font-medium">{text}</p>
            </div>
        </div>
    );
}

function Input({ label, value, onChange, placeholder }: any) {
    return (
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 space-y-1 focus-within:border-neutral-500 transition-colors">
            <div className="text-[10px] uppercase font-bold text-neutral-600 tracking-widest">{label}</div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-neutral-800"
            />
        </div>
    );
}

function IPhoneMockup({ src }: { src: string }) {
    return (
        <div className="relative w-[260px] aspect-[9/18.5] shadow-2xl select-none">
            <div className="absolute top-[90px] -left-[4px] w-[3px] h-[35px] bg-[#1a1a1a] rounded-l-sm z-0" />
            <div className="absolute top-[135px] -left-[4px] w-[3px] h-[35px] bg-[#1a1a1a] rounded-l-sm z-0" />
            <div className="absolute top-[120px] -right-[4px] w-[3px] h-[75px] bg-[#1a1a1a] rounded-r-sm z-0" />
            <div className="absolute inset-0 rounded-[44px] border-[7px] border-[#1c1c1e] z-30 pointer-events-none shadow-[inset_0_0_2px_1px_rgba(255,255,255,0.05)]" />
            <div className="absolute -inset-[2.5px] rounded-[48px] border-[1.5px] border-[#3a3a3c]/30 z-20 pointer-events-none" />
            <div className="absolute inset-[7px] rounded-[38px] overflow-hidden bg-black z-10">
                {src && <Image src={src} alt="Preview" fill className="object-cover opacity-100" unoptimized />}
                <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center pt-12">
                    <div className="text-[10px] font-semibold text-white/50 tracking-wider mb-1 px-1">Wed Dec 31</div>
                    <div className="text-[72px] font-semibold tracking-tighter text-white/90 leading-[0.9]">08:00</div>
                    <div className="absolute top-[13px] left-1/2 -translate-x-1/2 w-[30%] h-[24px] bg-black rounded-full" />
                    <div className="absolute bottom-10 left-8 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <div className="w-1.5 h-4 bg-white/40 rounded-full" />
                    </div>
                    <div className="absolute bottom-10 right-8 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <div className="w-5 h-4 bg-white/40 rounded-[2px]" />
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[35%] h-[4px] bg-white/30 rounded-full" />
                </div>
            </div>
        </div>
    );
}
