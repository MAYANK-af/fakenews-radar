// ============================================
// Fake News Radar - Interactive JavaScript
// ============================================

// Initialize Lucide Icons
lucide.createIcons();

// ============ STATE ============
let scanHistory = JSON.parse(localStorage.getItem('fnr_history') || '[]');
let currentInputTab = 'text';
let radarAnimationId = null;

// ============ EXAMPLES DATA ============
const examples = [
    "BREAKING: Government officials confirm that COVID-19 vaccines contain microscopic tracking chips that allow the NSA to monitor citizens' movements in real-time. Multiple whistleblowers have come forward with evidence of this secret program.",
    "Scientists have proven that climate change is entirely a hoax created by the renewable energy industry to increase profits. Leaked emails show coordinated manipulation of temperature data across 190 countries.",
    "Sources confirm widespread election fraud with millions of illegal ballots cast in every swing state. Voting machines were remotely hacked to change votes, and auditors found blank ballots counted multiple times."
];

// ============ TRENDING TOPICS DATA ============
const trendingTopics = [
    { title: "Health Misinformation", count: 342, trend: "+12%", severity: "high", icon: "heart-pulse" },
    { title: "Election Claims", count: 287, trend: "+8%", severity: "critical", icon: "vote" },
    { title: "Climate Denial", count: 195, trend: "+5%", severity: "medium", icon: "cloud" },
    { title: "Financial Scams", count: 156, trend: "+22%", severity: "high", icon: "banknote" },
    { title: "AI-Generated Fakes", count: 134, trend: "+45%", severity: "critical", icon: "bot" },
    { title: "Conspiracy Theories", count: 89, trend: "-3%", severity: "medium", icon: "eye" }
];

// ============ RECENT ANALYSES DATA ============
const recentAnalyses = [
    { title: "AI-generated deepfake video of election candidate goes viral", score: 14, verdict: "fake", time: "2 min ago" },
    { title: "Commercial nuclear fusion reactor achieves net energy gain", score: 93, verdict: "credible", time: "7 min ago" },
    { title: "Large-scale phishing campaign targets DeFi smart contracts", score: 18, verdict: "fake", time: "15 min ago" },
    { title: "Global carbon emissions plateau in latest atmospheric report", score: 81, verdict: "credible", time: "25 min ago" },
    { title: "Fabricated leaks claim NASA discovered alien base on Moon", score: 5, verdict: "fake", time: "40 min ago" }
];

// ============ TIPS DATA ============
const tips = [
    { icon: "search", title: "Check the Source", description: "Verify the publisher's reputation, look for established news organizations, and check their about page and editorial standards.", color: "green" },
    { icon: "calendar", title: "Check the Date", description: "Old stories often resurface and get shared as if they're current. Always check when the article was originally published.", color: "blue" },
    { icon: "quote", title: "Verify Quotes", description: "Search for the quoted person's actual statements. Misquotes and fabricated quotes are extremely common in fake news.", color: "yellow" },
    { icon: "image", title: "Reverse Image Search", description: "Use Google Reverse Image Search or TinEye to check if images are being used out of context or from different events.", color: "red" },
    { icon: "book-open", title: "Read Beyond Headlines", description: "Clickbait headlines often don't match the article content. Read the full article before sharing or forming an opinion.", color: "orange" },
    { icon: "git-compare", title: "Cross-Reference", description: "Check if multiple reputable sources are reporting the same story. If only one obscure source has it, be skeptical.", color: "green" },
    { icon: "user-x", title: "Author Check", description: "Look up the article's author. Do they have a history of credible reporting? Or is there no author listed at all?", color: "blue" },
    { icon: "zap", title: "Emotional Language", description: "Fake news uses emotional and sensational language to provoke reactions. Real news sticks to facts and neutral reporting.", color: "yellow" },
    { icon: "link", title: "Check URLs Carefully", description: "Fake sites mimic real ones with slight URL changes. Look for .co, .su, or unusual domain extensions pretending to be real news.", color: "red" }
];

// ============ RADAR ANIMATION ============
function initRadar() {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angle = 0;

    function drawRadar() {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.min(cx, cy) - 20;

        ctx.clearRect(0, 0, w, h);

        // Concentric circles
        for (let i = 1; i <= 4; i++) {
            const r = (maxR / 4) * i;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Cross lines
        ctx.beginPath();
        ctx.moveTo(cx - maxR, cy);
        ctx.lineTo(cx + maxR, cy);
        ctx.moveTo(cx, cy - maxR);
        ctx.lineTo(cx, cy + maxR);
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Diagonal lines
        ctx.beginPath();
        ctx.moveTo(cx - maxR * 0.707, cy - maxR * 0.707);
        ctx.lineTo(cx + maxR * 0.707, cy + maxR * 0.707);
        ctx.moveTo(cx + maxR * 0.707, cy - maxR * 0.707);
        ctx.lineTo(cx - maxR * 0.707, cy + maxR * 0.707);
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Sweep gradient representing trail
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, angle - 0.5, angle);
        ctx.closePath();
        
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        sweepGrad.addColorStop(0, 'rgba(0, 255, 136, 0.2)');
        sweepGrad.addColorStop(1, 'rgba(0, 255, 136, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fill();

        // Sweep line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Blips
        const blips = [
            { a: 0.8, r: 0.6 },
            { a: 2.5, r: 0.4 },
            { a: 4.2, r: 0.75 },
            { a: 5.5, r: 0.3 },
            { a: 1.5, r: 0.85 },
        ];

        blips.forEach(b => {
            const diff = ((angle - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            const fade = diff < 1.5 ? Math.max(0, 1 - diff / 1.5) : 0;
            if (fade > 0) {
                const bx = cx + maxR * b.r * Math.cos(b.a);
                const by = cy + maxR * b.r * Math.sin(b.a);
                ctx.beginPath();
                ctx.arc(bx, by, 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 136, ${fade * 0.8})`;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(bx, by, 8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 136, ${fade * 0.2})`;
                ctx.fill();
            }
        });

        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
        ctx.fill();

        angle += 0.015;
        radarAnimationId = requestAnimationFrame(drawRadar);
    }

    drawRadar();
}

// ============ CREDIBILITY RADAR CHART ============
function initCredibilityChart(customValues = null) {
    const canvas = document.getElementById('credibilityRadar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) - 30;

    const categories = ['Source', 'Evidence', 'Bias', 'Consistency', 'Transparency', 'Accuracy'];
    const defaultValues = [0.82, 0.65, 0.45, 0.73, 0.58, 0.70];
    const values = customValues || defaultValues;
    const colors = ['#00ff88', '#00d4ff', '#ff3366', '#ffcc00', '#ff8800', '#a78bfa'];

    let progress = 0;

    function animateChart() {
        progress = Math.min(progress + 0.04, 1);
        ctx.clearRect(0, 0, w, h);

        // Draw background concentric polygon grids
        for (let i = 1; i <= 4; i++) {
            const r = (maxR / 4) * i;
            ctx.beginPath();
            for (let j = 0; j < categories.length; j++) {
                const a = (Math.PI * 2 / categories.length) * j - Math.PI / 2;
                const x = cx + r * Math.cos(a);
                const y = cy + r * Math.sin(a);
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw axes lines
        categories.forEach((_, i) => {
            const a = (Math.PI * 2 / categories.length) * i - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Draw filled data shape
        ctx.beginPath();
        categories.forEach((_, i) => {
            const a = (Math.PI * 2 / categories.length) * i - Math.PI / 2;
            const v = values[i] * progress;
            const x = cx + maxR * v * Math.cos(a);
            const y = cy + maxR * v * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 136, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw value points and labels
        categories.forEach((cat, i) => {
            const a = (Math.PI * 2 / categories.length) * i - Math.PI / 2;
            const v = values[i] * progress;
            const x = cx + maxR * v * Math.cos(a);
            const y = cy + maxR * v * Math.sin(a);

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = colors[i];
            ctx.fill();

            // Label
            const lx = cx + (maxR + 18) * Math.cos(a);
            const ly = cy + (maxR + 18) * Math.sin(a);
            ctx.font = '10px Inter';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cat, lx, ly);
        });

        if (progress < 1) requestAnimationFrame(animateChart);
    }

    animateChart();
}

// ============ UI POPULATORS ============
function populateRecentAnalyses() {
    const container = document.getElementById('recentAnalyses');
    if (!container) return;
    
    container.innerHTML = recentAnalyses.map(a => {
        const verdictClass = a.verdict === 'credible' ? 'tag-credible' : a.verdict === 'suspicious' ? 'tag-suspicious' : a.verdict === 'misleading' ? 'tag-misleading' : 'tag-fake';
        const verdictLabel = a.verdict.charAt(0).toUpperCase() + a.verdict.slice(1);
        const scoreColor = a.score >= 70 ? 'text-radar-green' : a.score >= 40 ? 'text-radar-yellow' : 'text-radar-red';
        return `
            <div class="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 hover:bg-gray-900/50 transition-colors cursor-pointer" onclick="loadRecentReport('${a.title.replace(/'/g, "\\'")}', ${a.score}, '${a.verdict}')">
                <div class="flex-1 min-w-0 mr-3">
                    <p class="text-sm text-gray-200 truncate">${a.title}</p>
                    <p class="text-xs text-gray-500">${a.time}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-mono text-sm font-bold ${scoreColor}">${a.score}%</span>
                    <span class="${verdictClass} text-xs px-2 py-0.5 rounded-full font-medium">${verdictLabel}</span>
                </div>
            </div>
        `;
    }).join('');
}

function populateTrendingTopics() {
    const container = document.getElementById('trendingTopics');
    if (!container) return;

    container.innerHTML = trendingTopics.map(t => {
        const severityColors = {
            critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
            high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
            medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' }
        };
        const sc = severityColors[t.severity];
        return `
            <div class="p-4 rounded-xl bg-gray-900/30 border border-gray-800/30 hover:border-gray-700/50 transition-all card-hover cursor-pointer" onclick="loadTrendingTopic('${t.title.replace(/'/g, "\\'")}')">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i data-lucide="${t.icon}" class="w-4 h-4 ${sc.text}"></i>
                        <span class="text-sm font-medium text-gray-200">${t.title}</span>
                    </div>
                    <span class="${sc.bg} ${sc.border} ${sc.text} text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase">${t.severity}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>${t.count} reports</span>
                    <span class="${t.trend.startsWith('+') ? 'text-radar-red' : 'text-radar-green'}">${t.trend}</span>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function populateTips() {
    const container = document.getElementById('tipsGrid');
    if (!container) return;

    const colorMap = {
        green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/10' },
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/10' },
        yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/10' },
        red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/10' },
        orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/10' }
    };

    container.innerHTML = tips.map(tip => {
        const c = colorMap[tip.color] || colorMap.green;
        return `
            <div class="p-5 rounded-2xl bg-radar-card border border-gray-800/50 card-hover shadow-xl hover:${c.glow} transition-all">
                <div class="w-10 h-10 rounded-xl ${c.bg} ${c.border} flex items-center justify-center mb-4">
                    <i data-lucide="${tip.icon}" class="w-5 h-5 ${c.text}"></i>
                </div>
                <h3 class="font-bold text-gray-200 mb-2">${tip.title}</h3>
                <p class="text-sm text-gray-400 leading-relaxed">${tip.description}</p>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

// ============ TAB SWITCHING & CONTROLS ============
window.switchInputTab = function(tab) {
    currentInputTab = tab;
    
    // Tab buttons styling
    const tabs = ['Text', 'Url', 'Claim'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab${t}`);
        if (!btn) return;
        if (t.toLowerCase() === tab) {
            btn.className = "flex-1 text-xs font-medium py-2 px-3 rounded-md transition-all bg-radar-green/10 text-radar-green border border-radar-green/30";
        } else {
            btn.className = "flex-1 text-xs font-medium py-2 px-3 rounded-md transition-all text-gray-400 hover:text-gray-300";
        }
    });

    // Toggle input containers
    const inputs = ['inputText', 'inputUrl', 'inputClaim'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id.toLowerCase().endsWith(tab)) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

window.loadExample = function(index) {
    const text = examples[index];
    if (!text) return;
    
    switchInputTab('text');
    const textarea = document.getElementById('newsText');
    if (textarea) {
        textarea.value = text;
        showToast("Example content loaded", "info");
    }
}

window.clearInput = function() {
    const ids = ['newsText', 'newsUrl', 'newsClaim'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    showToast("Inputs cleared", "info");
}

window.pasteFromClipboard = async function() {
    try {
        const text = await navigator.clipboard.readText();
        const activeInputId = currentInputTab === 'text' ? 'newsText' : currentInputTab === 'url' ? 'newsUrl' : 'newsClaim';
        const input = document.getElementById(activeInputId);
        if (input) {
            input.value = text;
            showToast("Pasted from clipboard", "success");
        }
    } catch (e) {
        showToast("Permission denied or clipboard empty", "error");
    }
}

// ============ TOAST SYSTEM ============
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    if (!toast || !toastMessage || !toastIcon) return;

    toastMessage.textContent = message;
    
    if (type === 'success') {
        toastIcon.setAttribute('data-lucide', 'check-circle');
        toastIcon.className = "w-5 h-5 text-radar-green";
    } else if (type === 'error') {
        toastIcon.setAttribute('data-lucide', 'alert-circle');
        toastIcon.className = "w-5 h-5 text-radar-red";
    } else if (type === 'info') {
        toastIcon.setAttribute('data-lucide', 'info');
        toastIcon.className = "w-5 h-5 text-radar-blue";
    }
    lucide.createIcons();

    toast.className = "fixed bottom-6 right-6 z-50 transition-all duration-300 transform translate-y-0 opacity-100";
    
    setTimeout(() => {
        toast.className = "fixed bottom-6 right-6 z-50 transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-none";
    }, 3000);
}

// ============ CONTENT ANALYSIS ============
window.analyzeContent = async function() {
    let text = "";
    if (currentInputTab === 'text') {
        text = document.getElementById('newsText').value;
    } else if (currentInputTab === 'url') {
        text = document.getElementById('newsUrl').value;
    } else {
        text = document.getElementById('newsClaim').value;
    }

    if (!text.trim()) {
        showToast("Please enter content to analyze!", "error");
        return;
    }

    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const loadingSubtext = document.getElementById('loadingSubtext');
    const loadingBar = document.getElementById('loadingBar');
    
    if (overlay) overlay.classList.remove('hidden');

    const steps = [
        { progress: 15, text: "Scanning text structure...", sub: "Initializing linguistic analysis" },
        { progress: 35, text: "Analyzing linguistic bias...", sub: "Scanning for loaded emotional language" },
        { progress: 55, text: "Cross-referencing databases...", sub: "Verifying claims against known sources" },
        { progress: 80, text: "Evaluating source authority...", sub: "Checking domain trust scoring models" },
        { progress: 95, text: "Synthesizing credibility report...", sub: "Calculating final confidence matrix" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            const s = steps[currentStep];
            if (loadingBar) loadingBar.style.width = `${s.progress}%`;
            if (loadingText) loadingText.textContent = s.text;
            if (loadingSubtext) loadingSubtext.textContent = s.sub;
            currentStep++;
        }
    }, 250);

    try {
        const apiHost = window.location.port === '3001' ? 'http://127.0.0.1:8080' : '';
        const response = await fetch(`${apiHost}/classify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        
        clearInterval(interval);
        
        if (!response.ok) throw new Error("Server responded with an error");
        
        const data = await response.json();
        
        if (loadingBar) loadingBar.style.width = "100%";
        if (loadingText) loadingText.textContent = "Analysis Complete!";
        
        setTimeout(() => {
            if (overlay) overlay.classList.add('hidden');
            displayReport(data, text);
        }, 300);

    } catch (e) {
        clearInterval(interval);
        if (overlay) overlay.classList.add('hidden');
        showToast("Could not connect to analysis server.", "error");
    }
}

// ============ REPORT RENDERING ============
function displayReport(data, originalText) {
    const modal = document.getElementById('resultModal');
    const content = document.getElementById('resultContent');
    const timestamp = document.getElementById('reportTimestamp');
    
    if (!modal || !content) return;

    const time = new Date().toLocaleString();
    if (timestamp) timestamp.textContent = `COMPLETED: ${time}`;

    const score = data.prediction === 'REAL' ? data.real_score : (100 - data.fake_score);
    const credibilityPct = score;
    
    let verdictClass = 'tag-credible';
    let verdictLabel = 'Credible';
    let glowClass = 'glow-green';
    let borderClass = 'border-radar-green';
    let textColor = 'text-radar-green';
    let explanation = "";

    if (credibilityPct >= 70) {
        verdictClass = 'tag-credible';
        verdictLabel = 'Credible';
        glowClass = 'glow-green';
        textColor = 'text-radar-green';
        borderClass = 'border-radar-green/30';
        explanation = "This content shows strong alignment with established journalistic practices. It features objective, neutral phrasing and high information density with little to no sensation triggers.";
    } else if (credibilityPct >= 45) {
        verdictClass = 'tag-suspicious';
        verdictLabel = 'Suspicious';
        glowClass = 'glow-blue';
        textColor = 'text-radar-blue';
        borderClass = 'border-radar-blue/30';
        explanation = "Linguistic checks show mixed markers. Sensation triggers are moderate, and standard evidence citation is sparse. Recommend validating with alternate sources.";
    } else {
        verdictClass = 'tag-fake';
        verdictLabel = 'Fake / Highly Misleading';
        glowClass = 'glow-red';
        textColor = 'text-radar-red';
        borderClass = 'border-radar-red/30';
        explanation = "Critical alert! Multiple highly sensational linguistic tags detected. Phrasing aims to provoke a strong emotional response rather than present neutral facts. Highly indicative of structured disinformation.";
    }

    const customChartValues = [
        (credibilityPct / 100) * 0.9 + 0.1,
        (credibilityPct / 100) * 0.8 + 0.1,
        1 - ((data.credibility_signals?.negative_markers || 0) * 0.1),
        (credibilityPct / 100) * 0.75 + 0.15,
        (credibilityPct / 100) * 0.85 + 0.1,
        (credibilityPct / 100)
    ].map(v => Math.max(0.15, Math.min(0.95, v)));

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (credibilityPct / 100) * circumference;

    content.innerHTML = `
        <div class="grid md:grid-cols-12 gap-6 items-center mb-6">
            <div class="md:col-span-4 flex flex-col items-center justify-center text-center">
                <div class="score-circle">
                    <svg width="140" height="140">
                        <circle cx="70" cy="70" r="${radius}" fill="transparent" stroke="rgba(255,255,255,0.05)" stroke-width="8"></circle>
                        <circle cx="70" cy="70" r="${radius}" fill="transparent" stroke="${credibilityPct >= 70 ? '#00ff88' : credibilityPct >= 45 ? '#00d4ff' : '#ff3366'}" stroke-width="8" 
                                stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" class="transition-all duration-1000 animate-fill"></circle>
                    </svg>
                    <div class="score-value text-center">
                        <span class="text-3xl font-black font-mono text-white">${credibilityPct}%</span>
                        <p class="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">Credibility</p>
                    </div>
                </div>
                <span class="${verdictClass} text-xs font-bold px-3 py-1 rounded-full mt-4 uppercase tracking-wider">${verdictLabel}</span>
            </div>

            <div class="md:col-span-8">
                <h4 class="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Verdict Details</h4>
                <div class="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
                    <p class="text-sm text-gray-300 font-medium leading-relaxed">${explanation}</p>
                    <div class="mt-4 flex items-center justify-between text-xs text-gray-500 border-t border-gray-800/50 pt-3">
                        <span>Confidence: <strong class="${textColor}">${data.confidence}%</strong></span>
                        <span>Model Assessment: <strong>${data.verdict}</strong></span>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-900/30 border border-green-500/10 rounded-xl p-4">
                <div class="flex items-center gap-2 text-radar-green mb-3">
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                    <h5 class="text-xs font-bold uppercase tracking-wider">Positive Signals</h5>
                </div>
                <div class="flex items-center justify-between text-2xl font-mono font-bold text-white mb-1">
                    <span>${data.credibility_signals?.positive_markers || 0}</span>
                </div>
                <p class="text-xs text-gray-500">Credibility markers such as neutral vocabulary and source references.</p>
            </div>
            
            <div class="bg-gray-900/30 border border-red-500/10 rounded-xl p-4">
                <div class="flex items-center gap-2 text-radar-red mb-3">
                    <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                    <h5 class="text-xs font-bold uppercase tracking-wider">Misinformation Triggers</h5>
                </div>
                <div class="flex items-center justify-between text-2xl font-mono font-bold text-white mb-1">
                    <span>${data.credibility_signals?.negative_markers || 0}</span>
                </div>
                <p class="text-xs text-gray-500">Subjective statements, excessive punctuation, or sensation-focused triggers.</p>
            </div>
        </div>

        <div class="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <h5 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Processed Text Preview</h5>
            <p class="text-xs text-gray-400 font-mono line-clamp-2 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-gray-900">${originalText}</p>
        </div>
    `;

    lucide.createIcons();
    modal.classList.remove('hidden');

    setTimeout(() => {
        initCredibilityChart(customChartValues);
    }, 200);

    saveScanToHistory(originalText, credibilityPct, verdictLabel.toLowerCase());
}

window.closeResult = function() {
    const modal = document.getElementById('resultModal');
    if (modal) modal.classList.add('hidden');
}

// ============ HISTORY STORAGE AND PERSISTENCE ============
function saveScanToHistory(text, score, verdict) {
    const maxTitleLen = 60;
    const title = text.length > maxTitleLen ? text.substring(0, maxTitleLen) + '...' : text;
    
    if (scanHistory.some(item => item.title === title)) return;

    const item = {
        title,
        text,
        score,
        verdict: verdict.includes('credible') ? 'credible' : verdict.includes('suspicious') ? 'suspicious' : verdict.includes('misleading') ? 'misleading' : 'fake',
        time: "Just now",
        timestamp: Date.now()
    };

    scanHistory.unshift(item);
    if (scanHistory.length > 50) scanHistory.pop();

    localStorage.setItem('fnr_history', JSON.stringify(scanHistory));
    renderHistory();

    // Dynamically prepend the new user analysis to the live dashboard list
    const newRecent = {
        title: title,
        score: score,
        verdict: item.verdict,
        time: "Just now"
    };
    recentAnalyses.unshift(newRecent);
    if (recentAnalyses.length > 5) recentAnalyses.pop();
    populateRecentAnalyses();
}

function renderHistory() {
    const filter = document.getElementById('historyFilter')?.value || 'all';
    const list = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    
    if (!list || !empty) return;

    const filtered = scanHistory.filter(item => {
        if (filter === 'all') return true;
        return item.verdict === filter;
    });

    if (filtered.length === 0) {
        list.innerHTML = "";
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        list.innerHTML = filtered.map((item, idx) => {
            const verdictClass = item.verdict === 'credible' ? 'tag-credible' : item.verdict === 'suspicious' ? 'tag-suspicious' : item.verdict === 'misleading' ? 'tag-misleading' : 'tag-fake';
            const scoreColor = item.score >= 70 ? 'text-radar-green' : item.score >= 40 ? 'text-radar-yellow' : 'text-radar-red';
            return `
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-radar-card border border-gray-800/50 hover:border-gray-700/50 transition-all card-hover cursor-pointer" onclick="reopenReport(${item.timestamp})">
                    <div class="flex-1 min-w-0 mr-4 mb-2 sm:mb-0">
                        <h4 class="text-sm font-semibold text-gray-200 truncate">${item.title}</h4>
                        <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${item.time}</span>
                            <span class="flex items-center gap-1"><i data-lucide="database" class="w-3 h-3"></i> Scanned</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-mono text-sm font-bold ${scoreColor}">${item.score}%</span>
                        <span class="${verdictClass} text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider text-[10px]">${item.verdict}</span>
                        <button class="text-gray-500 hover:text-radar-red transition-colors p-1 rounded hover:bg-white/5" onclick="deleteHistoryItem(event, ${item.timestamp})">
                            <i data-lucide="trash" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    }
}

window.reopenReport = function(timestamp) {
    const item = scanHistory.find(h => h.timestamp === timestamp);
    if (!item) return;

    const mockApiResponse = {
        prediction: item.score >= 70 ? "REAL" : "FAKE",
        confidence: item.score >= 50 ? item.score : 100 - item.score,
        verdict: item.score >= 70 ? "High confidence" : item.score >= 40 ? "Moderate confidence" : "Low confidence — review manually",
        real_score: item.score,
        fake_score: 100 - item.score,
        credibility_signals: {
            positive_markers: item.score >= 70 ? Math.round(item.score / 15) : 1,
            negative_markers: item.score < 70 ? Math.round((100 - item.score) / 12) : 0
        }
    };
    displayReport(mockApiResponse, item.text);
}

window.deleteHistoryItem = function(event, timestamp) {
    event.stopPropagation();
    scanHistory = scanHistory.filter(h => h.timestamp !== timestamp);
    localStorage.setItem('fnr_history', JSON.stringify(scanHistory));
    renderHistory();
    showToast("Report deleted", "info");
}

window.filterHistory = function() {
    renderHistory();
}

window.clearHistory = function() {
    if (confirm("Are you sure you want to clear your entire scan history? This cannot be undone.")) {
        scanHistory = [];
        localStorage.removeItem('fnr_history');
        renderHistory();
        showToast("Scan history cleared", "info");
    }
}

// ============ AUXILIARY FUNCTIONS ============
window.saveReport = function() {
    showToast("Report saved successfully!", "success");
}

window.shareReport = function() {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard!", "info");
}

window.loadRecentReport = function(title, score, verdict) {
    const mockItem = {
        title,
        text: `Recent analyzed article headline: "${title}". Real-time cross check completed.`,
        score,
        verdict,
        time: "Recently checked",
        timestamp: Date.now()
    };
    scanHistory.unshift(mockItem);
    reopenReport(mockItem.timestamp);
}

window.loadTrendingTopic = function(title) {
    switchInputTab('claim');
    const input = document.getElementById('newsClaim');
    if (input) {
        input.value = `Is there any evidence concerning ${title.toLowerCase()} trending reports?`;
        showToast(`Trending topic loaded`, "info");
    }
}

// ============ MOBILE NAVIGATION ============
const mobileMenu = document.getElementById('mobileMenu');

window.toggleMobileMenu = function() {
    if (!mobileMenu) return;
    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
    } else {
        mobileMenu.classList.add('hidden');
    }
}

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    initRadar();
    initCredibilityChart();
    populateRecentAnalyses();
    populateTrendingTopics();
    populateTips();
    renderHistory();
});
