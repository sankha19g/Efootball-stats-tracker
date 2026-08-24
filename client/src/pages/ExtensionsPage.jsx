import { useState } from 'react';
import { Download, Monitor, Smartphone, Globe, CheckCircle2, Zap, Shield, Sparkles, Layers, ArrowRight, Copy, Check } from 'lucide-react';

const ExtensionsPage = ({ user, showAlert }) => {
    const [activeTab, setActiveTab] = useState('chrome');
    const [copiedPath, setCopiedPath] = useState(false);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedPath(true);
        if (showAlert) showAlert('Copied', 'Path copied to clipboard!', 'success');
        setTimeout(() => setCopiedPath(false), 2000);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121620] via-[#0d111a] to-[#080a0f] border border-white/10 p-8 md:p-12 mb-10 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-ef-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ef-accent/10 border border-ef-accent/30 text-ef-accent text-xs font-black uppercase tracking-wider mb-4">
                            <Sparkles className="w-3.5 h-3.5" />
                            Official Companion Extension
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-wider text-white mb-4">
                            eFootball <span className="text-ef-accent">PESDB Importer</span>
                        </h1>
                        <p className="text-sm md:text-base text-white/70 leading-relaxed mb-6">
                            Import any player from PESDB with a single click. Injects floating action buttons, captures accurate dual playstyles (Att & Def), exact ages, and features an in-page live summary HUD with instant Undo support.
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            <a
                                href="/downloads/efootball-extension.zip"
                                download="efootball-extension.zip"
                                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-ef-accent text-ef-dark font-black text-sm uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg shadow-ef-accent/25"
                            >
                                <Download className="w-5 h-5" />
                                Download Extension (.zip)
                            </a>
                            <a
                                href="https://pesdb.net/efootball/"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                Open PESDB ↗
                            </a>
                        </div>
                    </div>

                    {/* Quick Specs Card */}
                    <div className="w-full md:w-80 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                        <span className="text-xs font-black text-white/40 uppercase tracking-widest">Compatibility</span>
                        <div className="flex items-center gap-3 py-2 border-b border-white/5">
                            <Monitor className="w-5 h-5 text-ef-accent" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">Chrome, Edge & Brave</span>
                                <span className="text-[10px] text-white/40">Manifest V3 Extension</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 py-2 border-b border-white/5">
                            <Smartphone className="w-5 h-5 text-cyan-400" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">Kiwi Browser (Android)</span>
                                <span className="text-[10px] text-white/40">Full mobile 1-click import</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 py-2">
                            <Globe className="w-5 h-5 text-orange-400" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">Firefox Browser</span>
                                <span className="text-[10px] text-white/40">Temporary Add-on support</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Features Grid */}
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-ef-accent" />
                    <h2 className="text-lg font-black uppercase tracking-wider text-white">Extension Capabilities</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 flex flex-col gap-3 hover:border-ef-accent/40 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-ef-accent/10 border border-ef-accent/30 text-ef-accent flex items-center justify-center font-black text-lg">
                            ⚡
                        </div>
                        <h3 className="text-base font-black uppercase text-white">1-Click Floating Importer</h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                            A floating action button automatically appears on every PESDB player profile. Tap it to extract all player attributes instantly with zero latency.
                        </p>
                    </div>

                    <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 flex flex-col gap-3 hover:border-cyan-400/40 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center font-black text-lg">
                            ▲▼
                        </div>
                        <h3 className="text-base font-black uppercase text-white">Dual Playstyles Support</h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                            Automatically captures both Offensive (<span className="text-pink-400 font-bold">Att: ▲</span>) and Defensive (<span className="text-cyan-400 font-bold">Def: ▼</span>) playstyles with fallback to Basic.
                        </p>
                    </div>

                    <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 flex flex-col gap-3 hover:border-pink-500/40 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center font-black text-lg">
                            🛡️
                        </div>
                        <h3 className="text-base font-black uppercase text-white">Live In-Page HUD & Undo</h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                            An in-page HUD modal pops up right on PESDB immediately upon addition, showing all stats with dedicated <b>Undo Scrape</b> and <b>Done</b> buttons.
                        </p>
                    </div>
                </div>
            </div>

            {/* Installation Guides */}
            <div className="bg-[#121620] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-wider text-white mb-1">
                            Installation Guides
                        </h2>
                        <p className="text-xs text-white/50">Follow the quick 1-minute setup for your browser.</p>
                    </div>

                    {/* Browser Tabs */}
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
                        <button
                            onClick={() => setActiveTab('chrome')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'chrome'
                                    ? 'bg-ef-accent text-ef-dark shadow-md'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Monitor className="w-4 h-4" />
                            Desktop Chrome / Edge
                        </button>
                        <button
                            onClick={() => setActiveTab('kiwi')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'kiwi'
                                    ? 'bg-ef-accent text-ef-dark shadow-md'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Smartphone className="w-4 h-4" />
                            Kiwi Mobile
                        </button>
                        <button
                            onClick={() => setActiveTab('firefox')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'firefox'
                                    ? 'bg-ef-accent text-ef-dark shadow-md'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Globe className="w-4 h-4" />
                            Firefox
                        </button>
                    </div>
                </div>

                {/* Tab 1: Chrome / Edge / Brave */}
                {activeTab === 'chrome' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-ef-accent/20 border border-ef-accent/40 text-ef-accent font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                1
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Download & Extract Extension</h4>
                                <p className="text-xs text-white/60 mb-3">
                                    Download the zip package and extract the folder to a convenient location on your PC.
                                </p>
                                <a
                                    href="/downloads/efootball-extension.zip"
                                    download="efootball-extension.zip"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs uppercase"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download efootball-extension.zip
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-ef-accent/20 border border-ef-accent/40 text-ef-accent font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                2
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Open Extensions Manager</h4>
                                <p className="text-xs text-white/60 mb-2">
                                    Navigate to your browser's extension settings URL:
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 font-mono text-xs text-ef-accent">
                                    <span>chrome://extensions</span>
                                    <button onClick={() => handleCopy('chrome://extensions')} className="text-white/40 hover:text-white ml-2">
                                        {copiedPath ? <Check className="w-3.5 h-3.5 text-ef-accent" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-ef-accent/20 border border-ef-accent/40 text-ef-accent font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                3
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Enable Developer Mode & Load Unpacked</h4>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    1. Toggle the <b>Developer mode</b> switch at the top right of the page.<br />
                                    2. Click the <b>"Load unpacked"</b> button in the top left.<br />
                                    3. Select the unzipped <b><code className="text-ef-accent">extension</code></b> directory.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-ef-accent/20 border border-ef-accent/40 text-ef-accent font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                4
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Pin & Start Scraping on PESDB</h4>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    Pin the extension icon in your toolbar, click it to connect your account, and visit any player on <b>pesdb.net</b> to see the ⚡ <b>Add to Tracker</b> button!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Kiwi Browser (Mobile) */}
                {activeTab === 'kiwi' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                1
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Install Kiwi Browser on Android</h4>
                                <p className="text-xs text-white/60 mb-2">
                                    Kiwi Browser supports full Chrome extension capabilities on mobile.
                                </p>
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.kiwibrowser.browser"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-bold text-xs uppercase"
                                >
                                    Get Kiwi Browser on Google Play ↗
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                2
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Download Extension Zip on Phone</h4>
                                <p className="text-xs text-white/60 mb-3">
                                    Download the extension zip directly onto your mobile phone.
                                </p>
                                <a
                                    href="/downloads/efootball-extension.zip"
                                    download="efootball-extension.zip"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs uppercase"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download efootball-extension.zip
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                3
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Load into Kiwi Extensions</h4>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    1. In Kiwi Browser, tap the <b>three dots (⋮)</b> in top right $\rightarrow$ tap <b>Extensions</b>.<br />
                                    2. Turn on <b>Developer mode</b>.<br />
                                    3. Tap <b>+(from .zip/.crx/.user.js)</b> and choose the downloaded <code className="text-cyan-400">efootball-extension.zip</code>.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                4
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Ready for Mobile Scraping</h4>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    Open <b>pesdb.net</b> in Kiwi Browser. The floating ⚡ <b>Add to Tracker</b> button and in-page HUD summary will work seamlessly on your phone!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 3: Firefox */}
                {activeTab === 'firefox' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-400/20 border border-orange-400/40 text-orange-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                1
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Download Firefox Extension Package</h4>
                                <p className="text-xs text-white/60 mb-3">
                                    Download the Firefox-compatible add-on package:
                                </p>
                                <a
                                    href="/downloads/efootball-extension-firefox.zip"
                                    download="efootball-extension-firefox.zip"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold text-xs uppercase hover:bg-orange-500/30 transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download efootball-extension-firefox.zip
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-400/20 border border-orange-400/40 text-orange-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                2
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Open Firefox Debugging</h4>
                                <p className="text-xs text-white/60 mb-2">
                                    In Firefox address bar, navigate to:
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 font-mono text-xs text-orange-400">
                                    <span>about:debugging#/runtime/this-firefox</span>
                                    <button onClick={() => handleCopy('about:debugging#/runtime/this-firefox')} className="text-white/40 hover:text-white ml-2">
                                        {copiedPath ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-400/20 border border-orange-400/40 text-orange-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                3
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase text-white mb-1">Load Temporary Add-on</h4>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    Click <b>"Load Temporary Add-on..."</b> and select <b><code className="text-orange-400">manifest.json</code></b> inside the <b><code className="text-orange-400">extension-firefox/</code></b> folder (or select the downloaded <b><code className="text-orange-400">efootball-extension-firefox.zip</code></b> file).
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExtensionsPage;
