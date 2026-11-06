// js/main.js
// General portfolio scripts: theme, scroll, clipboard, tabs, simulator, SQL, skills, clock.

// --- 1. Theme Management (Dark / Light with LocalStorage) ---
const themeBtn = document.getElementById('theme-btn');
const htmlEl = document.documentElement;

function initTheme() {
    const savedTheme = localStorage.getItem('mg_theme');
    if (savedTheme) {
        htmlEl.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        htmlEl.setAttribute('data-theme', 'light');
    } else {
        htmlEl.setAttribute('data-theme', 'dark');
    }
}

themeBtn.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('mg_theme', newTheme);
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} theme`);
});

initTheme();

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
    const card = event.target.closest('.browser-mockup');
    const buttons = card.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const contentPanels = card.querySelectorAll('.tab-content');
    contentPanels.forEach(panel => panel.classList.remove('active'));

    const targetPanel = document.getElementById(`${projectId}-tab-${tabKey}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
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
    textarea.value = sample.text;
    updateSimResults(sample.risk, sample.className, sample.confidence, sample.percent, sample.notes);
}

function analyzeSimText() {
    const text = document.getElementById('sim-text-input').value.toLowerCase().trim();
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
    badge.textContent = risk;
    badge.className = `risk-badge ${badgeClass}`;

    document.getElementById('sim-confidence-score').textContent = confText;
    document.getElementById('sim-confidence-bar').style.width = confPercent + '%';
    document.getElementById('sim-notes').textContent = notes;
}

// Initialize simulator with positive preset
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
    if (event && event.target) event.target.classList.add('active');

    const queryObj = sqlQueries[key];
    if (!queryObj) return;

    document.getElementById('sql-code-view').innerHTML = queryObj.code;
    document.getElementById('sql-perf-indicator').textContent = `Latency: ${queryObj.latency} · PostgreSQL Index Scan`;
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
    document.getElementById('sql-table-name').textContent = `Query Target: ${queryObj.table}`;
    document.getElementById('sql-row-count').textContent = `${queryObj.rows.length} rows returned`;

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

    document.getElementById('sql-table-output').innerHTML = html;
}

// Initialize with default query
loadSqlQuery('inventory');

// --- 7. Skills Filtering Controller ---
function filterSkills(category) {
    const buttons = document.querySelectorAll('.filter-pill');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

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
