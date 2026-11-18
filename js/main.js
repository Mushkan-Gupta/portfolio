// js/main.js
// General portfolio scripts: theme, scroll, clipboard, tabs, simulator, SQL, skills, clock.

// --- 1. Theme Management (Dark / Light with LocalStorage) ---
const themeBtn = document.getElementById('theme-btn');
const htmlEl = document.documentElement;

function initTheme() {
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem('mg_theme');
    } catch (e) {}
    if (savedTheme) {
        htmlEl.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        htmlEl.setAttribute('data-theme', 'light');
    } else {
        htmlEl.setAttribute('data-theme', 'dark');
    }
}

if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        try {
            localStorage.setItem('mg_theme', newTheme);
        } catch (e) {}
        showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} theme`);
    });
}

initTheme();

// --- Hamburger / Mobile Nav Toggle ---
(function setupMobileNav() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const menu = document.getElementById('mobile-nav-menu');
    if (!toggle || !menu) return;

    function openMenu() {
        menu.classList.add('is-open');
        menu.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
        const hamburger = toggle.querySelector('.hamburger-icon');
        const close = toggle.querySelector('.close-icon');
        if (hamburger) hamburger.style.display = 'none';
        if (close) close.style.display = '';
    }

    function closeMenu() {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        const hamburger = toggle.querySelector('.hamburger-icon');
        const close = toggle.querySelector('.close-icon');
        if (hamburger) hamburger.style.display = '';
        if (close) close.style.display = 'none';
    }

    toggle.addEventListener('click', () => {
        if (menu.classList.contains('is-open')) closeMenu();
        else openMenu();
    });

    // Close on nav link click
    menu.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
            closeMenu();
        }
    });

    // Close on Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
            closeMenu();
            toggle.focus();
        }
    });
})();

// --- 2. Scroll Progress Bar & Active Nav Highlight ---
const progressBar = document.getElementById('scroll-progress');
const navLinks = document.querySelectorAll('.nav-menu a');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    if (progressBar) progressBar.style.width = scrolled + '%';

    // Active section spy
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (winScroll >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}, { passive: true });

// --- 3. Clipboard & Toast Helper ---
function copyEmailToClipboard() {
    const email = 'musugu2005@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
        showToast('Copied musugu2005@gmail.com to clipboard! ✨');
    }).catch(() => {
        showToast('musugu2005@gmail.com');
    });
}

let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    msgEl.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('visible');
    }, 3200);
}

// --- 4. Project Card Tab Switcher ---
function switchTab(projectId, tabKey) {
    const btn = (typeof event !== 'undefined' && event) ? (event.currentTarget || event.target) : null;
    const card = btn.closest('.browser-mockup');
    if (!card) return;
    const buttons = card.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const contentPanels = card.querySelectorAll('.tab-content');
    contentPanels.forEach(panel => panel.classList.remove('active'));

    const targetPanel = document.getElementById(`${projectId}-tab-${tabKey}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
        // If switching to a live frame, load its iframe if card is front card
        const deckCard = card.closest('.deck-card');
        if (!deckCard || deckCard.getAttribute('data-deck-position') === 'front') {
            const frame = targetPanel.querySelector('.live-frame');
            if (frame && frame.dataset.src && (!frame.src || frame.src === 'about:blank' || frame.src.endsWith('/'))) {
                frame.src = frame.dataset.src;
            }
        }
    }
}

// --- 5. Interactive MindEase NLP Classifier Simulator ---
const simData = {
    positive: {
        text: "Felt energetic today, completed my coding assignment and cooked dinner with family.",
        risk: "LOW RISK",
        className: "risk-low",
        confidence: "94.2%",
        percent: 94,
        notes: "Dominant tokens: energetic, completed, family · No distress or crisis terms found."
    },
    moderate: {
        text: "Exam stress is really piling up and I'm feeling constantly anxious about deadlines.",
        risk: "MODERATE RISK",
        className: "risk-moderate",
        confidence: "74.8%",
        percent: 75,
        notes: "Detected elevated stress tokens: anxious, deadlines, stress · Recommended peer check-in."
    },
    high: {
        text: "I feel so lonely, empty, and exhausted. Nothing brings me joy anymore and I want to quit.",
        risk: "HIGH RISK",
        className: "risk-high",
        confidence: "91.5%",
        percent: 92,
        notes: "Severe depressive lexicon match: empty, exhausted, lonely · Crisis intervention hotline flagged."
    }
};

function runSimPreset(key) {
    const sample = simData[key];
    if (!sample) return;
    const textarea = document.getElementById('sim-text-input');
    if (!textarea) return;
    textarea.value = sample.text;
    updateSimResults(sample.risk, sample.className, sample.confidence, sample.percent, sample.notes);
}

function analyzeSimText() {
    const inputEl = document.getElementById('sim-text-input');
    if (!inputEl) return;
    const text = inputEl.value.toLowerCase().trim();
    if (!text) {
        showToast('Please type a journal entry first!');
        return;
    }

    const highTokens = ['quit', 'hopeless', 'empty', 'suicide', 'die', 'alone', 'hurt', 'worthless', 'lonely', 'exhausted'];
    const modTokens = ['stressed', 'anxious', 'tired', 'sad', 'overwhelmed', 'pressure', 'hard', 'struggling'];

    let hasHigh = highTokens.some(t => text.includes(t));
    let hasMod = modTokens.some(t => text.includes(t));

    if (hasHigh) {
        updateSimResults("HIGH RISK", "risk-high", "88.4%", 88, "Trigger words detected by scikit-learn classifier. Safety override active.");
    } else if (hasMod) {
        updateSimResults("MODERATE RISK", "risk-moderate", "71.2%", 71, "Mild depressive cues identified. Suggesting reflective prompt.");
    } else {
        updateSimResults("LOW RISK", "risk-low", "93.0%", 93, "Positive/neutral linguistic valence. Emotional score balanced.");
    }
}

function updateSimResults(risk, badgeClass, confText, confPercent, notes) {
    const badge = document.getElementById('sim-risk-badge');
    if (!badge) return;
    badge.textContent = risk;
    badge.className = `risk-badge ${badgeClass}`;

    const scoreEl = document.getElementById('sim-confidence-score');
    if (scoreEl) scoreEl.textContent = confText;
    const barEl = document.getElementById('sim-confidence-bar');
    if (barEl) barEl.style.width = confPercent + '%';
    const notesEl = document.getElementById('sim-notes');
    if (notesEl) notesEl.textContent = notes;
}

// Initialize simulator if elements present
runSimPreset('positive');

// --- 6. Interactive SQL Workbench Engine ---
const sqlQueries = {
    inventory: {
        code: `<span class="sql-kw">SELECT</span> <span class="sql-col">model_name</span>, <span class="sql-col">category</span>, <span class="sql-col">price_npr</span>, <span class="sql-col">stock_qty</span>\n<span class="sql-kw">FROM</span> <span class="sql-tbl">dealership_inventory</span>\n<span class="sql-kw">WHERE</span> <span class="sql-col">stock_qty</span> &lt; <span class="sql-num">5</span>\n<span class="sql-kw">ORDER BY</span> <span class="sql-col">stock_qty</span> <span class="sql-kw">ASC</span>;`,
        table: 'dealership_inventory',
        columns: ['Model Name', 'Category', 'Price (NPR)', 'In Stock'],
        rows: [
            ['TVS Apache RTR 160 4V', 'Sport', '379,900', '<span style="color:#f43f5e;font-weight:700;">2 units (Low)</span>'],
            ['TVS Raider 125', 'Commuter', '264,900', '<span style="color:#f43f5e;font-weight:700;">3 units (Low)</span>'],
            ['TVS NTORQ 125 Race XP', 'Scooter', '305,900', '<span style="color:#f59e0b;font-weight:700;">4 units</span>']
        ],
        latency: '1.2ms'
    },
    sales: {
        code: `<span class="sql-kw">SELECT</span> <span class="sql-col">bike_model</span>, <span class="sql-kw">COUNT</span>(*) <span class="sql-kw">AS</span> units_sold, <span class="sql-kw">SUM</span>(<span class="sql-col">sale_amount_npr</span>) <span class="sql-kw">AS</span> total_revenue\n<span class="sql-kw">FROM</span> <span class="sql-tbl">sales_ledger</span>\n<span class="sql-kw">GROUP BY</span> <span class="sql-col">bike_model</span>\n<span class="sql-kw">ORDER BY</span> units_sold <span class="sql-kw">DESC</span>\n<span class="sql-kw">LIMIT</span> <span class="sql-num">3</span>;`,
        table: 'sales_ledger',
        columns: ['Bike Model', 'Units Sold', 'Total Revenue (NPR)'],
        rows: [
            ['TVS Apache RTR 200 4V', '14', 'NPR 6,158,600'],
            ['TVS NTORQ 125', '19', 'NPR 5,508,100'],
            ['TVS Raider 125 Disc', '12', 'NPR 3,178,800']
        ],
        latency: '2.1ms'
    },
    inquiries: {
        code: `<span class="sql-kw">SELECT</span> <span class="sql-col">status</span>, <span class="sql-kw">COUNT</span>(*) <span class="sql-kw">AS</span> count, \n       <span class="sql-kw">ROUND</span>(<span class="sql-kw">COUNT</span>(*) * <span class="sql-num">100.0</span> / <span class="sql-kw">SUM</span>(<span class="sql-kw">COUNT</span>(*)) <span class="sql-kw">OVER</span>(), <span class="sql-num">1</span>) <span class="sql-kw">AS</span> pct\n<span class="sql-kw">FROM</span> <span class="sql-tbl">customer_inquiries</span>\n<span class="sql-kw">GROUP BY</span> <span class="sql-col">status</span>;`,
        table: 'customer_inquiries',
        columns: ['Status', 'Total Inquiries', 'Percentage'],
        rows: [
            ['<span style="color:#10b981;font-weight:600;">Converted to Sale</span>', '48', '41.4%'],
            ['Follow-up Scheduled', '39', '33.6%'],
            ['New / Pending Review', '29', '25.0%']
        ],
        latency: '1.8ms'
    },
    mindease_risk: {
        code: `<span class="sql-kw">SELECT</span> <span class="sql-col">risk_level</span>, <span class="sql-kw">COUNT</span>(*) <span class="sql-kw">AS</span> assessments, \n       <span class="sql-kw">ROUND</span>(<span class="sql-kw">AVG</span>(<span class="sql-col">confidence_score</span>), <span class="sql-num">2</span>) <span class="sql-kw">AS</span> avg_confidence\n<span class="sql-kw">FROM</span> <span class="sql-tbl">mindease_assessments</span>\n<span class="sql-kw">GROUP BY</span> <span class="sql-col">risk_level</span>\n<span class="sql-kw">ORDER BY</span> assessments <span class="sql-kw">DESC</span>;`,
        table: 'mindease_assessments',
        columns: ['Risk Level', 'Assessments Count', 'Avg Model Confidence'],
        rows: [
            ['<span class="risk-badge risk-low">Low Risk</span>', '312 entries', '92.4%'],
            ['<span class="risk-badge risk-moderate">Moderate Risk</span>', '145 entries', '79.1%'],
            ['<span class="risk-badge risk-high">High Risk</span>', '68 entries', '87.6%']
        ],
        latency: '1.5ms'
    }
};

let currentActiveQuery = 'inventory';

function loadSqlQuery(key) {
    currentActiveQuery = key;
    const buttons = document.querySelectorAll('.sql-preset-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (typeof event !== 'undefined' && event && event.target && event.target.classList) {
        event.target.classList.add('active');
    } else {
        const activeBtn = document.querySelector(`.sql-preset-btn[onclick*="${key}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    const queryObj = sqlQueries[key];
    if (!queryObj) return;

    const codeView = document.getElementById('sql-code-view');
    if (codeView) codeView.innerHTML = queryObj.code;
    const perfIndicator = document.getElementById('sql-perf-indicator');
    if (perfIndicator) perfIndicator.textContent = `Latency: ${queryObj.latency} · PostgreSQL Index Scan`;
    renderSqlTable(queryObj);
}

function executeCurrentQuery() {
    const queryObj = sqlQueries[currentActiveQuery];
    if (queryObj) {
        renderSqlTable(queryObj);
        showToast(`Executed query in ${queryObj.latency}!`);
    }
}

function renderSqlTable(queryObj) {
    const tableName = document.getElementById('sql-table-name');
    if (tableName) tableName.textContent = `Query Target: ${queryObj.table}`;
    const rowCount = document.getElementById('sql-row-count');
    if (rowCount) rowCount.textContent = `${queryObj.rows.length} rows returned`;

    const tableOutput = document.getElementById('sql-table-output');
    if (!tableOutput) return;

    let html = '<thead><tr>';
    queryObj.columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';

    queryObj.rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td>${cell}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody>';

    tableOutput.innerHTML = html;
}

// Initialize with default query
loadSqlQuery('inventory');

// --- 7. Skills Filtering Controller ---
function filterSkills(category) {
    const buttons = document.querySelectorAll('.filter-pill');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (typeof event !== 'undefined' && event && event.target && event.target.classList) { event.target.classList.add('active'); } else { const activeBtn = document.querySelector(`.sql-preset-btn[onclick*="${key}"]`); if (activeBtn) activeBtn.classList.add('active'); }

    const cards = document.querySelectorAll('.skill-group-card');
    cards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (category === 'all' || cardCat === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- 8. Live Vadodara IST Clock in Footer ---
function updateISTClock() {
    try {
        const clockEl = document.getElementById('live-ist-clock');
        if (!clockEl) return;
        const now = new Date();
        const options = {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        clockEl.textContent = new Intl.DateTimeFormat('en-US', options).format(now);
    } catch (e) {
        // Fallback
    }
}
setInterval(updateISTClock, 1000);
updateISTClock();

// --- 9. Copy Email buttons (delegated, removes need for inline onclick) ---
document.querySelectorAll('[data-action="copy-email"]').forEach(btn => {
    btn.addEventListener('click', copyEmailToClipboard);
});


// ==========================================================================
// 10. Interactive Stacked Deck Controller (Projects & Certificates)
// ==========================================================================

// --- 10. Reusable Deck Modal & Static Stacked Decks ---

const PROJECTS_DATA = [
    {
        id: 'tvs',
        title: 'TVS Raj Automobiles',
        role: 'Full-Stack Dealership Platform · Lahan, Nepal',
        pills: [
            { text: 'Live on Vercel', cls: 'pill-emerald' },
            { text: 'Solo Client Project', cls: 'pill-sky' },
            { text: 'Commercial System', cls: 'pill-amber' }
        ],
        summary: 'Built single-handedly for a bustling motorcycle dealership in Lahan, Nepal. Transformed manual paper inquiry logging and stock coordination into a unified, secure cloud system.',
        bullets: [
            { strong: 'Multi-Role RBAC', text: 'Engineered isolated views for public customer inquiries, employee inventory & sales intake, and owner-level revenue summaries.' },
            { strong: 'End-to-End Architecture', text: 'Designed the normalized PostgreSQL schema on Supabase, implemented Row Level Security (RLS) policies, and crafted a responsive React + Tailwind interface.' },
            { strong: 'Business Impact', text: 'Replaced scattered physical ledgers with real-time stock counts and instant customer inquiry tracking.' }
        ],
        tech: ['React', 'Vite', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Vercel'],
        liveUrl: 'https://tvs-raj-automobiles.vercel.app',
        githubUrl: 'https://github.com/Mushkan-Gupta/tvs-raj-automobiles',
        hasIframe: true,
        iframeSrc: 'https://tvs-raj-automobiles.vercel.app',
        tabs: [
            { id: 'preview', label: 'Live Frame', isIframe: true },
            {
                id: 'arch', label: 'RBAC Flow', isIframe: false, html: `
                <div class="arch-view">
                    <div class="arch-flow-node">
                        <div class="node-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <div class="node-details">
                            <h5>1. Public Inquiries Portal</h5>
                            <p>Customers browse TVS motorcycles, compare models, and submit inquiries directly into the Supabase database without requiring authentication.</p>
                        </div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                        </div>
                        <div class="node-details">
                            <h5>2. Secured Staff Portal</h5>
                            <p>Authorized dealership staff log daily customer walk-ins, process test-ride bookings, and update physical engine chassis inventory status.</p>
                        </div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <div class="node-details">
                            <h5>3. Owner Executive Dashboard</h5>
                            <p>Dealership owners access sensitive gross sales tallies, pending stock shipments from TVS regional distributors, and high-margin model trends.</p>
                        </div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </div>
                        <div class="node-details">
                            <h5>4. Row-Level Security Enforced</h5>
                            <p>PostgreSQL RLS policies guarantee non-elevated staff can never access executive financial summaries or raw customer contact exports.</p>
                        </div>
                    </div>
                </div>`
            }
        ]
    },
    {
        id: 'mindease',
        title: 'MindEase',
        role: 'Team Lead · Backend & ML Architecture',
        pills: [
            { text: 'Live on Render', cls: 'pill-emerald' },
            { text: 'Team Project', cls: 'pill-sky' },
            { text: 'NLP & Machine Learning', cls: 'pill-amber' }
        ],
        summary: 'A mental health journaling tool that analyzes user-written reflections with an NLP classification pipeline to provide early risk assessment (Low, Moderate, High), confidence scoring, and crisis intervention.',
        bullets: [
            { strong: 'Model & Pipeline', text: 'Trained a text classifier using scikit-learn (TF-IDF vectorizer + Logistic Regression) blended with a high-priority safety heuristic keyword override for emergency distress terms.' },
            { strong: 'Production REST API', text: 'Owned and delivered the Flask backend, creating an authenticated real-time <code>/predict</code> endpoint with serialized model inference.' },
            { strong: 'Privacy & Support', text: 'Architected anonymous journaling and confidential peer-support connection matching.' }
        ],
        tech: ['Python', 'Flask REST API', 'scikit-learn', 'TF-IDF', 'Logistic Regression', 'Render'],
        liveUrl: 'https://ai-depression-detector.onrender.com',
        githubUrl: 'https://github.com/Mushkan-Gupta/ai-depression-detector',
        hasIframe: true,
        iframeSrc: 'https://ai-depression-detector.onrender.com',
        tabs: [
            { id: 'preview', label: 'Live Detector', isIframe: true },
            {
                id: 'arch', label: 'NLP Pipeline', isIframe: false, html: `
                <div class="arch-view">
                    <div class="arch-flow-node">
                        <div class="node-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
                        </div>
                        <div class="node-details">
                            <h5>1. Raw Text Preprocessing</h5>
                            <p>Lowercases, removes punctuation, eliminates stopwords, and applies lemmatization to unstructured journal entries.</p>
                        </div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        </div>
                        <div class="node-details">
                            <h5>2. TF-IDF Vectorization</h5>
                            <p>Extracts n-gram statistical weights across clinical sentiment vocabularies to generate feature vectors.</p>
                        </div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        </div>
                        <div class="node-details">
                            <h5>3. Logistic Regression Classifier</h5>
                            <p>Evaluates probability distributions to score suicide/self-harm risk vs. baseline sentiment.</p>
                        </div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        </div>
                        <div class="node-details">
                            <h5>4. Risk Mitigation Alerting</h5>
                            <p>Flags high-confidence depression signals and triggers immediate crisis hotline and clinical support recommendations.</p>
                        </div>
                    </div>
                </div>`
            }
        ]
    },
    {
        id: 'saheli',
        title: 'Saheli',
        role: 'ScriptedBy{Her} 2.0 · Agentic AI',
        pills: [
            { text: 'Hackathon Project', cls: 'pill-sky' }
        ],
        summary: 'An agentic multilingual assistant built for vernacular regional Meesho sellers on a 100% zero-cost stack: Ollama local LLM, Bhashini voice/text translation, LangGraph multi-agent flow, and Streamlit.',
        bullets: [],
        tech: ['Ollama', 'Bhashini', 'LangGraph', 'Streamlit'],
        liveUrl: null,
        githubUrl: null,
        hasIframe: false,
        iframeSrc: null,
        tabs: [
            {
                id: 'arch', label: 'Architecture Overview', isIframe: false, html: `
                <div class="arch-view">
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></div>
                        <div class="node-details"><h5>1. Multilingual Voice Intake</h5><p>Accepts voice recordings in vernacular languages; transcribes and translates offline through Bhashini.</p></div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div>
                        <div class="node-details"><h5>2. LangGraph Multi-Agent Router</h5><p>Routes business and customer inquiries across regional catalog assistants with structured state graphs.</p></div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
                        <div class="node-details"><h5>3. Local Offline LLM Inference</h5><p>Runs quantized open weights via Ollama on local machines with zero cloud API costs.</p></div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
                        <div class="node-details"><h5>4. Streamlit Interactive Interface</h5><p>Provides zero-friction responsive web access for non-technical marketplace sellers.</p></div>
                    </div>
                </div>`
            }
        ]
    },
    {
        id: 'frontend-suite',
        title: 'Front-End Internship Suite',
        role: '6 Core Web Applications',
        pills: [
            { text: 'Internship', cls: 'pill-emerald' }
        ],
        summary: 'Built semantic HTML5/CSS Grid layouts, a responsive Instagram-style photo feed, a dynamic JS quiz app with instant scoring, and interactive DOM task management applications.',
        bullets: [],
        tech: ['JavaScript', 'DOM API', 'CSS Grid', 'Responsive UI'],
        liveUrl: null,
        githubUrl: null,
        hasIframe: false,
        iframeSrc: null,
        tabs: [
            {
                id: 'arch', label: 'Architecture Overview', isIframe: false, html: `
                <div class="arch-view">
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></div>
                        <div class="node-details"><h5>1. Semantic HTML5 Foundation</h5><p>Built accessible document structures with screen-reader compliance and semantic elements.</p></div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg></div>
                        <div class="node-details"><h5>2. Flexbox & Grid Systems</h5><p>Responsive multi-column layouts adapting smoothly across mobile and desktop displays without UI libraries.</p></div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg></div>
                        <div class="node-details"><h5>3. Pure DOM State Handling</h5><p>Dynamic UI event handling and live scoring logic built with vanilla JavaScript.</p></div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
                        <div class="node-details"><h5>4. Production Practice</h5><p>Delivered 6 distinct web applications meeting cross-browser standards.</p></div>
                    </div>
                </div>`
            }
        ]
    },
    {
        id: 'ml-crypto',
        title: 'ML Algorithms & Cryptography',
        role: 'Python & R Implementations',
        pills: [
            { text: 'Data & Lab Work', cls: 'pill-amber' }
        ],
        summary: 'Implemented Naive Bayes classifiers, K-Means clustering, Apriori market-basket association rule mining, and a custom algebraic Hill Cipher matrix encryption system in Python.',
        bullets: [],
        tech: ['Python', 'R', 'Naive Bayes', 'K-Means'],
        liveUrl: null,
        githubUrl: null,
        hasIframe: false,
        iframeSrc: null,
        tabs: [
            {
                id: 'arch', label: 'Architecture Overview', isIframe: false, html: `
                <div class="arch-view">
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg></div>
                        <div class="node-details"><h5>1. Statistical Classification</h5><p>Implemented Naive Bayes models with conditional probability formulations for prediction.</p></div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg></div>
                        <div class="node-details"><h5>2. Unsupervised Clustering</h5><p>K-Means iterative centroid convergence calculating Euclidean distances in multidimensional feature space.</p></div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg></div>
                        <div class="node-details"><h5>3. Association Rule Mining</h5><p>Apriori frequent itemset candidate generation evaluating support, confidence, and lift.</p></div>
                    </div>
                    <div class="arch-flow-node">
                        <div class="node-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                        <div class="node-details"><h5>4. Algebraic Encryption</h5><p>Polygraphic Hill Cipher computing invertible square matrices modulo 26 in Python.</p></div>
                    </div>
                </div>`
            }
        ]
    }
];

const CERTS_DATA = [
    {
        id: 'sql-basic',
        title: 'SQL (Basic) Skill Certification',
        issuer: 'HackerRank',
        date: '',
        tags: ['Complex Queries', 'Joins', 'Aggregations'],
        file: 'certificates/sql-basic.pdf',
        isPending: false
    },
    {
        id: 'aws-cloud',
        title: 'AWS Academy Cloud Foundations',
        issuer: 'Amazon Web Services (AWS)',
        date: '',
        tags: ['Cloud Architecture', 'Core Services', 'Security & Pricing'],
        file: null,
        isPending: true
    },
    {
        id: 'ai-agents',
        title: 'Cloud Technical Series: AI Agents',
        issuer: 'Google Cloud',
        date: '',
        tags: ['AI Agents', 'Gemini API', 'Cloud Orchestration'],
        file: null,
        isPending: true
    },
    {
        id: 'networking',
        title: 'Networking Basics',
        issuer: 'Cisco Networking Academy',
        date: '',
        tags: ['TCP/IP', 'Subnetting', 'Network Architecture'],
        file: 'certificates/networking-basics.pdf',
        isPending: false
    },
    {
        id: 'intro-iot',
        title: 'Intro to IoT & Digital Transformation',
        issuer: 'Cisco Networking Academy',
        date: '',
        tags: ['Sensors', 'Automation', 'Edge Computing'],
        file: 'certificates/intro-to-iot.pdf',
        isPending: false
    },
    {
        id: 'vadodara-hackathon',
        title: 'Vadodara Hackathon 6.0',
        issuer: 'Parul University',
        date: '',
        tags: ['Rapid Prototyping', 'Team Collaboration'],
        file: 'certificates/vadodara-hackathon.pdf',
        isPending: false
    }
];

let panelObserver = null;
let isPointerDragging = false;
let pointerStartX = 0;
let pointerStartScrollLeft = 0;
let hasPointerDragged = false;
const DRAG_MOVE_THRESHOLD = 6;

function initDeckModal() {
    const modal = document.getElementById('deck-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('deck-modal-close');
    const backdrop = document.getElementById('deck-modal-backdrop');
    const backBtn = document.getElementById('btn-back-to-grid');

    if (closeBtn) closeBtn.addEventListener('click', () => closeDeckModal(false));
    if (backdrop) backdrop.addEventListener('click', () => closeDeckModal(false));
    if (backBtn) backBtn.addEventListener('click', () => {
        backToGrid();
    });

    // Browser Back button navigation support via popstate
    window.addEventListener('popstate', (e) => {
        const modalEl = document.getElementById('deck-modal');
        if (!modalEl || !modalEl.classList.contains('is-open')) return;
        const state = e.state;
        if (state && state.deck === 'grid') {
            showGridView();
        } else if (state && state.deck === 'detail') {
            showDetailView(state.type, state.index);
        } else {
            closeDeckModal(true);
        }
    });

    // Keyboard controls
    modal.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('is-open')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            if (currentModalLevel === 'detail') backToGrid();
            else closeDeckModal(false);
            return;
        }

        if (currentModalLevel === 'detail') {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                scrollModalTrack(-1);
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                scrollModalTrack(1);
                return;
            }
        }

        // Focus trap
        if (e.key === 'Tab') {
            const focusable = modal.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // Mouse drag-to-scroll on track (desktop pointer events)
    // Set up lazily when detail panel opens
}

function setupTrackPointerDrag(track) {
    track.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return; // Only primary button
        // Don't start drag if clicking an interactive control
        if (e.target.closest('button, a, input, select, textarea, .tab-btn')) return;

        isPointerDragging = true;
        hasPointerDragged = false;
        pointerStartX = e.clientX;
        pointerStartScrollLeft = track.scrollLeft;
    });

    window.addEventListener('pointermove', (e) => {
        if (!isPointerDragging) return;
        const dx = e.clientX - pointerStartX;
        if (!hasPointerDragged && Math.abs(dx) > DRAG_MOVE_THRESHOLD) {
            hasPointerDragged = true;
            track.classList.add('is-dragging');
            try { track.setPointerCapture?.(e.pointerId); } catch (_) {}
        }
        if (hasPointerDragged) {
            track.scrollLeft = pointerStartScrollLeft - dx;
        }
    });

    function endPointerDrag(e) {
        if (!isPointerDragging) return;
        isPointerDragging = false;
        if (hasPointerDragged) {
            track.classList.remove('is-dragging');
            try { track.releasePointerCapture?.(e.pointerId); } catch (_) {}
            snapTrackToNearestPanel(track);
        }
    }

    window.addEventListener('pointerup', endPointerDrag);
    window.addEventListener('pointercancel', endPointerDrag);

    // Prevent accidental link / button clicks if user dragged
    track.addEventListener('click', (e) => {
        if (hasPointerDragged) {
            e.preventDefault();
            e.stopPropagation();
            hasPointerDragged = false;
        }
    }, true);
}

function snapTrackToNearestPanel(track) {
    const panels = Array.from(track.children);
    if (!panels.length) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    panels.forEach((p, idx) => {
        const pCenter = p.offsetLeft + p.offsetWidth / 2;
        const dist = Math.abs(pCenter - center);
        if (dist < minDistance) {
            minDistance = dist;
            closestIndex = idx;
        }
    });

    const target = panels[closestIndex];
    if (target) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.scrollTo({
            left: target.offsetLeft,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    }
}

function scrollModalTrack(direction) {
    const track = document.getElementById('deck-modal-track');
    if (!track) return;
    const panels = Array.from(track.children);
    if (!panels.length) return;

    const nextIndex = Math.max(0, Math.min(panels.length - 1, currentModalIndex + direction));
    const target = panels[nextIndex];
    if (target) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.scrollTo({
            left: target.offsetLeft,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    }
}

function updateModalIndicatorFromScroll(track) {
    const panels = Array.from(track.children);
    if (!panels.length) return;

    const center = track.scrollLeft + track.clientWidth / 2;
    let activeIdx = 0;
    let minDistance = Infinity;

    panels.forEach((p, idx) => {
        const pCenter = p.offsetLeft + p.offsetWidth / 2;
        const dist = Math.abs(pCenter - center);
        if (dist < minDistance) {
            minDistance = dist;
            activeIdx = idx;
        }
    });

    if (activeIdx !== currentModalIndex) {
        currentModalIndex = activeIdx;
        applyIndicatorState(currentModalIndex, panels.length);
    }
}

function applyIndicatorState(index, total) {
    const counterText = document.getElementById('deck-modal-counter-text');
    if (counterText) {
        counterText.textContent = `${index + 1} / ${total}`;
    }

    const dots = document.querySelectorAll('.deck-modal-dot');
    dots.forEach((dot, idx) => {
        if (idx === index) {
            dot.classList.add('active');
            dot.setAttribute('aria-current', 'true');
        } else {
            dot.classList.remove('active');
            dot.removeAttribute('aria-current');
        }
    });

    // title is set in openDeckTable
}

// openDeckModal replaced by openDeckTable + openDeckDetail

function setupPanelObserver(track) {
    if (panelObserver) {
        panelObserver.disconnect();
        panelObserver = null;
    }

    if (!('IntersectionObserver' in window)) {
        // Fallback: load current frame
        loadPanelFrames(track.children[currentModalIndex]);
        return;
    }

    panelObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const panel = entry.target;
            const wrapper = panel.querySelector('.modal-iframe-wrapper');

            if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
                // In view: load iframe / object
                loadPanelFrames(panel);
            } else if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
                // Out of view: unload iframe to about:blank & reset interactive shield
                unloadPanelFrames(panel);
                if (wrapper) {
                    wrapper.classList.remove('is-interactive');
                    const span = wrapper.querySelector('.btn-interact-preview span');
                    if (span) span.textContent = 'Interact with preview';
                }
            }
        });
    }, {
        root: track,
        threshold: [0.15, 0.45, 0.75]
    });

    Array.from(track.children).forEach(p => panelObserver.observe(p));
}

function loadPanelFrames(panel) {
    if (!panel) return;
    const iframes = panel.querySelectorAll('iframe[data-src]');
    iframes.forEach(iframe => {
        if (iframe.dataset.src && (!iframe.src || iframe.src.includes('about:blank') || iframe.src === '')) {
            iframe.src = iframe.dataset.src;
        }
    });

    const objects = panel.querySelectorAll('object[data-src]');
    objects.forEach(obj => {
        if (obj.dataset.src && obj.getAttribute('data') !== obj.dataset.src) {
            obj.setAttribute('data', obj.dataset.src);
        }
    });
}

function unloadPanelFrames(panel) {
    if (!panel) return;
    const iframes = panel.querySelectorAll('iframe[data-src]');
    iframes.forEach(iframe => {
        if (iframe.src && !iframe.src.includes('about:blank')) {
            iframe.src = 'about:blank';
        }
    });

    const objects = panel.querySelectorAll('object[data-src]');
    objects.forEach(obj => {
        if (obj.getAttribute('data') && obj.getAttribute('data') !== 'about:blank') {
            obj.setAttribute('data', 'about:blank');
        }
    });
}

// closeDeckModal defined in new setupStaticDecks section below

function getProjectPanelHtml(p, panelIdx) {
    let mockupHtml = '';
    if (p.tabs && p.tabs.length > 0) {
        const tabsBtns = p.tabs.map((tab, idx) => `
            <button type="button" class="tab-btn ${idx === 0 ? 'active' : ''}" onclick="switchModalTab(${panelIdx}, '${tab.id}')">
                ${tab.label}
            </button>
        `).join('');

        const tabPanels = p.tabs.map((tab, idx) => {
            if (tab.isIframe) {
                return `
                <div class="tab-content ${idx === 0 ? 'active' : ''}" id="modal-tab-panel-${panelIdx}-${tab.id}">
                    <div class="modal-iframe-wrapper">
                        <iframe class="modal-live-frame" data-src="${p.iframeSrc}" src="about:blank" title="${p.title} Live Preview"></iframe>
                        <div class="iframe-touch-shield" aria-hidden="true"></div>
                        <button type="button" class="btn-interact-preview" aria-label="Interact with live preview inside frame">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                            <span>Interact with preview</span>
                        </button>
                    </div>
                    <div class="frame-fallback-note">
                        <span>Interactive preview running live on web</span>
                        <a href="${p.liveUrl}" target="_blank" rel="noopener" class="frame-link">Open full window ↗</a>
                    </div>
                </div>`;
            } else {
                return `
                <div class="tab-content ${idx === 0 ? 'active' : ''}" id="modal-tab-panel-${panelIdx}-${tab.id}">
                    ${tab.html}
                </div>`;
            }
        }).join('');

        mockupHtml = `
        <div class="project-modal-mockup">
            <div class="browser-mockup">
                <div class="browser-header">
                    <div class="browser-dots"><span></span><span></span><span></span></div>
                    <div class="browser-address">${p.liveUrl ? p.liveUrl.replace('https://', '') : 'mushkan-gupta.github.io'}</div>
                    <div class="browser-tabs">
                        ${tabsBtns}
                    </div>
                </div>
                ${tabPanels}
            </div>
        </div>`;
    }

    return `
        <div class="project-modal-view two-sides">
            <div class="modal-side-left">
                <div class="project-modal-header-meta">
                    ${p.pills && p.pills.length ? `
                    <div class="project-pill-row">
                        ${p.pills.map(pill => `<span class="pill-badge ${pill.cls}">${pill.text}</span>`).join('')}
                    </div>` : ''}
                    <h2 class="project-modal-title">${p.title}</h2>
                    <div class="project-role-tag">${p.role}</div>
                </div>

                <div class="project-modal-details">
                    <p class="project-summary">${p.summary}</p>
                    ${p.bullets && p.bullets.length ? `
                    <ul class="project-bullets">
                        ${p.bullets.map(b => `<li><strong>${b.strong}:</strong> ${b.text}</li>`).join('')}
                    </ul>` : ''}
                    <div class="tech-pill-list">
                        ${p.tech.map(t => `<span class="tech-pill">${t}</span>`).join('')}
                    </div>
                </div>

                ${(p.liveUrl || p.githubUrl) ? `
                <div class="project-modal-actions">
                    ${p.liveUrl ? `
                    <a href="${p.liveUrl}" target="_blank" rel="noopener" class="btn btn-primary">
                        <span>Open live site</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>` : ''}
                    ${p.githubUrl ? `
                    <a href="${p.githubUrl}" target="_blank" rel="noopener" class="btn btn-secondary">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                        <span>View code</span>
                    </a>` : ''}
                </div>` : ''}
            </div>

            <div class="modal-side-right">
                ${mockupHtml}
            </div>
        </div>
    `;
}

function switchModalTab(panelIdx, tabId) {
    const track = document.getElementById('deck-modal-track');
    if (!track) return;
    const panel = track.children[panelIdx];
    if (!panel) return;

    const btns = panel.querySelectorAll('.browser-tabs .tab-btn');
    btns.forEach(btn => btn.classList.remove('active'));

    const panels = panel.querySelectorAll('.tab-content');
    panels.forEach(p => p.classList.remove('active'));

    const targetBtn = Array.from(btns).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${tabId}'`));
    if (targetBtn) targetBtn.classList.add('active');

    const targetPanel = document.getElementById(`modal-tab-panel-${panelIdx}-${tabId}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
        const frame = targetPanel.querySelector('.modal-live-frame');
        if (frame && frame.dataset.src && (!frame.src || frame.src.includes('about:blank') || frame.src === '')) {
            frame.src = frame.dataset.src;
        }
    }
}

function getCertificatePanelHtml(c, panelIdx) {
    return `
        <div class="cert-modal-view two-sides">
            <div class="modal-side-left">
                <div class="cert-modal-header-meta">
                    <div class="cert-modal-badge-row">
                        <span class="cert-issuer-badge">${c.issuer}</span>
                        ${c.isPending ? `<span class="cert-pending-badge">Pending file</span>` : `<span class="cert-view-badge">Verified Credential</span>`}
                    </div>
                    <h2 class="cert-modal-title">${c.title}</h2>
                    <div class="cert-skills-tags">
                        ${c.tags.map(t => `<span class="cert-tag">${t}</span>`).join('')}
                    </div>
                </div>

                ${!c.isPending ? `
                <div class="cert-modal-actions">
                    <a href="${c.file}" target="_blank" rel="noopener" class="btn btn-primary">
                        <span>Open in new tab</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                    <a href="${c.file}" download class="btn btn-secondary">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        <span>Download PDF</span>
                    </a>
                </div>` : ''}
            </div>

            <div class="modal-side-right">
                ${c.isPending ? `
                <div class="cert-modal-pending-box">
                    <div class="cert-pending-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <h3>Certificate file will be added soon.</h3>
                    <p>This credential examination has been completed with ${c.issuer}. The official digital certificate document will be attached here once processed.</p>
                </div>` : `
                <div class="cert-modal-pdf-wrap">
                    <div class="cert-desktop-pdf">
                        <div class="modal-iframe-wrapper">
                            <object data-src="${c.file}" data="about:blank" type="application/pdf" class="cert-pdf-object" title="${c.title} PDF">
                                <iframe data-src="${c.file}" src="about:blank" class="cert-pdf-iframe" title="${c.title} PDF">
                                    <p>Inline PDF preview is not supported. <a href="${c.file}" target="_blank" rel="noopener">Open certificate directly ↗</a></p>
                                </iframe>
                            </object>
                            <div class="iframe-touch-shield" aria-hidden="true"></div>
                            <button type="button" class="btn-interact-preview" aria-label="Interact with PDF viewer">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                                <span>Interact with PDF</span>
                            </button>
                        </div>
                    </div>
                    <div class="cert-touch-fallback">
                        <div class="cert-touch-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <p>PDF documents are best viewed externally on mobile and touch devices.</p>
                        <a href="${c.file}" target="_blank" rel="noopener" class="btn btn-primary btn-large">
                            <span>View Certificate (PDF) ↗</span>
                        </a>
                    </div>
                </div>`}
            </div>
        </div>
    `;
}

// ============================================================
// DECK MODAL — TWO-LEVEL SYSTEM (Table → Detail)
// ============================================================

// Badge color palette cycling (5 colors from brand vars)
const BADGE_COLORS = [
    'var(--accent-amber)',
    'var(--accent-emerald)',
    'var(--accent-sky)',
    'var(--accent-coral)',
    '#a78bfa'
];

function getBadgeLetter(item, type, idx) {
    if (type === 'project') {
        const letters = ['T', 'M', 'S', 'F', 'M'];
        return letters[idx] || item.title.charAt(0).toUpperCase();
    }
    const letters = ['H', 'A', 'G', 'C', 'C', 'P'];
    return letters[idx] || item.issuer.charAt(0).toUpperCase();
}

// --- Static Stack Decks Setup ---
function setupStaticDecks() {
    const deckConfigs = [
        { id: 'projects-deck', overlayId: 'projects-deck-overlay', type: 'project' },
        { id: 'certs-deck', overlayId: 'certs-deck-overlay', type: 'certificate' }
    ];

    deckConfigs.forEach(cfg => {
        const container = document.getElementById(cfg.id);
        if (!container) return;

        // Initialize deck: assign static positions
        container.classList.add('deck-initialized');
        const cards = Array.from(container.querySelectorAll('.deck-card'));
        cards.forEach((card, idx) => {
            const pos = idx === 0 ? 'front' : `back-${idx}`;
            card.setAttribute('data-deck-position', pos);
            card.removeAttribute('tabindex');
            card.removeAttribute('role');
            card.style.cursor = 'default';
        });

        // Single overlay button opens the Level 1 Grid
        const overlayBtn = document.getElementById(cfg.overlayId);
        if (overlayBtn) {
            overlayBtn.addEventListener('click', () => {
                openDeckGrid(cfg.type, overlayBtn);
            });
            overlayBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDeckGrid(cfg.type, overlayBtn);
                }
            });
        }
    });
}

// --- Modal state ---
let currentModalType = null;
let currentModalIndex = 0;
let currentModalLevel = null; // 'grid' | 'detail'
let lastFocusedOverlay = null;

function openModalBase(type) {
    const modal = document.getElementById('deck-modal');
    if (!modal) return;

    currentModalType = type;
    const title = type === 'project' ? 'Projects' : 'Certificates';
    const titleEl = document.getElementById('deck-modal-title');
    if (titleEl) titleEl.textContent = title;

    // Lock background
    const siteWrapper = document.getElementById('site-wrapper');
    if (siteWrapper) siteWrapper.setAttribute('inert', '');
    const chatRoot = document.getElementById('chat-widget-root');
    if (chatRoot) chatRoot.setAttribute('inert', '');

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = scrollbarWidth + 'px';

    modal.removeAttribute('inert');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
}

// ============================================================
// LEVEL 1: THE GRID
// ============================================================
function openDeckGrid(type, overlayEl) {
    lastFocusedOverlay = overlayEl || document.activeElement;
    currentModalType = type;
    openModalBase(type);

    const gridWrap = document.getElementById('deck-modal-grid-wrap');
    renderGrid(type, gridWrap);
    showGridView();

    try { history.pushState({ deckModal: 'grid', deck: 'grid', type }, ''); } catch (_) {}
}

function showGridView() {
    currentModalLevel = 'grid';

    // Unload iframes from detail carousel
    if (panelObserver) { panelObserver.disconnect(); panelObserver = null; }
    const track = document.getElementById('deck-modal-track');
    if (track) Array.from(track.children).forEach(p => unloadPanelFrames(p));

    const gridWrap = document.getElementById('deck-modal-grid-wrap');
    const detailWrap = document.getElementById('deck-modal-detail-wrap');
    const backBtn = document.getElementById('btn-back-to-grid');
    const swipeHint = document.getElementById('deck-modal-swipe-hint');
    const titleEl = document.getElementById('deck-modal-title');
    if (titleEl) titleEl.textContent = currentModalType === 'project' ? 'Projects' : 'Certificates';

    if (gridWrap) gridWrap.style.display = '';
    if (detailWrap) detailWrap.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (swipeHint) swipeHint.style.display = 'none';

    // Focus the tile previously viewed or close button
    const tiles = gridWrap ? gridWrap.querySelectorAll('.deck-grid-tile') : [];
    if (tiles.length > currentModalIndex && tiles[currentModalIndex]) {
        tiles[currentModalIndex].focus();
    } else {
        const closeBtn = document.getElementById('deck-modal-close');
        if (closeBtn) closeBtn.focus();
    }
}

function renderGrid(type, container) {
    if (!container) return;
    const items = type === 'project' ? PROJECTS_DATA : CERTS_DATA;

    let tilesHtml = '';
    items.forEach((item, idx) => {
        const letter = getBadgeLetter(item, type, idx);
        const badgeClass = `badge-${idx % 5}`;

        let pillHtml = '';
        let bodyHtml = '';

        if (type === 'project') {
            if (item.liveUrl) {
                pillHtml = '<span class="tile-status-pill tile-status-live">Live</span>';
            }
            const firstSentence = item.summary.split('. ')[0] + '.';
            const chipsHtml = item.tech.slice(0, 3).map(t => `<span class="tile-chip">${t}</span>`).join('');
            bodyHtml = `
                <p class="tile-desc">${firstSentence}</p>
                <div class="tile-tech-chips">${chipsHtml}</div>
            `;
        } else {
            if (item.isPending) {
                pillHtml = '<span class="tile-status-pill tile-status-soon">Soon</span>';
            } else {
                pillHtml = '<span class="tile-status-pill tile-status-pdf">PDF</span>';
            }
            const chipsHtml = item.tags.slice(0, 3).map(t => `<span class="tile-chip">${t}</span>`).join('');
            bodyHtml = `
                <p class="tile-issuer">${item.issuer}</p>
                <div class="tile-tech-chips">${chipsHtml}</div>
            `;
        }

        tilesHtml += `
            <button type="button" class="deck-grid-tile" role="button" tabindex="0"
                    data-tile-index="${idx}" aria-label="View details for ${item.title}">
                <div class="tile-top-row">
                    <span class="tile-badge ${badgeClass}">${letter}</span>
                    ${pillHtml}
                </div>
                <h4 class="tile-title">${item.title}</h4>
                ${bodyHtml}
            </button>
        `;
    });

    container.innerHTML = `<div class="deck-grid-container">${tilesHtml}</div>`;

    // Attach tile click/keyboard listener
    container.querySelectorAll('.deck-grid-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            const idx = parseInt(tile.getAttribute('data-tile-index'), 10);
            openDeckDetail(currentModalType, idx);
        });
        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const idx = parseInt(tile.getAttribute('data-tile-index'), 10);
                openDeckDetail(currentModalType, idx);
            }
        });
    });
}

// ============================================================
// LEVEL 2: THE DETAIL
// ============================================================
function openDeckDetail(type, targetIndex) {
    showDetailView(type, targetIndex);
    try { history.pushState({ deckModal: 'detail', deck: 'detail', type, index: targetIndex }, ''); } catch (_) {}
}

function showDetailView(type, targetIndex) {
    currentModalLevel = 'detail';
    currentModalIndex = targetIndex;
    currentModalType = type;

    const gridWrap = document.getElementById('deck-modal-grid-wrap');
    const detailWrap = document.getElementById('deck-modal-detail-wrap');
    const backBtn = document.getElementById('btn-back-to-grid');
    const swipeHint = document.getElementById('deck-modal-swipe-hint');
    const titleEl = document.getElementById('deck-modal-title');
    if (titleEl) titleEl.textContent = type === 'project' ? 'Projects' : 'Certificates';

    if (gridWrap) gridWrap.style.display = 'none';
    if (detailWrap) detailWrap.style.display = '';
    if (backBtn) backBtn.style.display = '';
    if (swipeHint) swipeHint.style.display = '';

    const track = document.getElementById('deck-modal-track');
    const dotsContainer = document.getElementById('deck-modal-dots');
    if (!track) return;

    const items = type === 'project' ? PROJECTS_DATA : CERTS_DATA;
    const total = items.length;

    // Build all panels
    track.innerHTML = '';
    items.forEach((item, idx) => {
        const panel = document.createElement('div');
        panel.className = 'deck-modal-panel';
        panel.setAttribute('data-panel-index', idx);
        panel.setAttribute('role', 'group');
        panel.setAttribute('aria-label', `${item.title} (${idx + 1} of ${total})`);
        panel.innerHTML = type === 'project' ? getProjectPanelHtml(item, idx) : getCertificatePanelHtml(item, idx);
        track.appendChild(panel);
    });

    // Build dots
    if (dotsContainer) {
        dotsContainer.innerHTML = items.map((_, idx) =>
            `<span class="deck-modal-dot ${idx === targetIndex ? 'active' : ''}" aria-label="Item ${idx + 1} of ${total}"></span>`
        ).join('');
    }
    applyIndicatorState(targetIndex, total);

    // Attach "Interact with preview" buttons
    track.querySelectorAll('.btn-interact-preview').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wrapper = btn.closest('.modal-iframe-wrapper');
            if (!wrapper) return;
            const isNowInteractive = !wrapper.classList.contains('is-interactive');
            wrapper.classList.toggle('is-interactive', isNowInteractive);
            const span = btn.querySelector('span');
            if (span) span.textContent = isNowInteractive ? 'Interacting (swipe outside to exit)' : 'Interact with preview';
        });
    });

    // Instant scroll to target panel
    track.style.scrollBehavior = 'auto';
    const targetPanel = track.children[targetIndex];
    if (targetPanel) track.scrollLeft = targetPanel.offsetLeft;
    requestAnimationFrame(() => { track.style.scrollBehavior = ''; });

    // Setup drag & scroll observer
    setupTrackPointerDrag(track);
    let scrollTimeout = null;
    track.addEventListener('scroll', () => {
        if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
        scrollTimeout = requestAnimationFrame(() => updateModalIndicatorFromScroll(track));
    }, { passive: true });
    setupPanelObserver(track);

    if (backBtn) backBtn.focus();
}

function backToGrid() {
    if (currentModalLevel !== 'detail') return;
    try {
        if (history.state && (history.state.deckModal === 'detail' || history.state.deck === 'detail')) {
            history.back();
        }
    } catch (_) {}
    showGridView();
}

function closeDeckModal(fromPopState = false) {
    const modal = document.getElementById('deck-modal');
    if (!modal || !modal.classList.contains('is-open')) return;

    if (!fromPopState) {
        try {
            if (history.state && (history.state.deckModal === 'detail' || history.state.deck === 'detail')) {
                history.go(-2);
            } else if (history.state && (history.state.deckModal === 'grid' || history.state.deck === 'grid')) {
                history.back();
            }
        } catch (_) {}
    }

    if (panelObserver) { panelObserver.disconnect(); panelObserver = null; }
    const track = document.getElementById('deck-modal-track');
    if (track) {
        Array.from(track.children).forEach(p => unloadPanelFrames(p));
        track.classList.remove('is-dragging');
    }

    modal.classList.remove('is-open');
    modal.setAttribute('inert', '');
    modal.setAttribute('aria-hidden', 'true');

    const siteWrapper = document.getElementById('site-wrapper');
    if (siteWrapper) siteWrapper.removeAttribute('inert');
    const chatRoot = document.getElementById('chat-widget-root');
    if (chatRoot) chatRoot.removeAttribute('inert');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    currentModalLevel = null;

    if (lastFocusedOverlay && typeof lastFocusedOverlay.focus === 'function') {
        lastFocusedOverlay.focus();
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initDeckModal();
        setupStaticDecks();
    });
} else {
    initDeckModal();
    setupStaticDecks();
}
