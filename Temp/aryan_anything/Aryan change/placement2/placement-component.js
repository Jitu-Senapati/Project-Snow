/**
 * ================================================================
 * placement-component.js
 * Self-contained Placement Widget Logic
 * —— Drop this alongside placement-component.html/.css ——
 * ================================================================
 */

/* ────────────────────────────────────────────────────────────────
   STATIC DATA
   Replace with API fetch() if connecting to a backend later.
   Shape: { id, name, logo, role, package, type,
            date, status, cgpa, branches, location, desc, isNew }
   ──────────────────────────────────────────────────────────────── */
const COMPANIES = [
  {
    id: 1,
    name: 'Google',
    logo: 'https://logo.clearbit.com/google.com',
    role: 'Software Engineer (L3)',
    package: 45,
    type: 'Full Time',
    date: '20 Apr 2025',
    status: 'ongoing',
    cgpa: 7.5,
    branches: ['CSE', 'IT'],
    location: 'Bangalore',
    desc: 'Technical rounds focus on DSA, System Design, and Behavioural. 3-stage interview.',
    isNew: true,
  },
  {
    id: 2,
    name: 'Microsoft',
    logo: 'https://logo.clearbit.com/microsoft.com',
    role: 'Full Stack Developer',
    package: 38,
    type: 'Full Time',
    date: '18 Apr 2025',
    status: 'ongoing',
    cgpa: 7.0,
    branches: ['CSE', 'IT', 'ECE'],
    location: 'Hyderabad',
    desc: 'Azure & Office 365 product team. Competitive coding test followed by 2 tech rounds.',
    isNew: false,
  },
  {
    id: 3,
    name: 'Amazon',
    logo: 'https://logo.clearbit.com/amazon.com',
    role: 'SDE – I',
    package: 32,
    type: 'Full Time',
    date: '10 May 2025',
    status: 'upcoming',
    cgpa: 6.5,
    branches: ['CSE', 'IT', 'ECE', 'EEE'],
    location: 'Pune',
    desc: 'Backend microservices role. Amazon Leadership Principles assessed in every round.',
    isNew: true,
  },
  {
    id: 4,
    name: 'Flipkart',
    logo: 'https://logo.clearbit.com/flipkart.com',
    role: 'SDE – I (Backend)',
    package: 28,
    type: 'Full Time',
    date: '28 May 2025',
    status: 'upcoming',
    cgpa: 7.0,
    branches: ['CSE', 'IT'],
    location: 'Bangalore',
    desc: 'Commerce platform team. Strong DSA + system design knowledge essential.',
    isNew: true,
  },
  {
    id: 5,
    name: 'Infosys',
    logo: 'https://logo.clearbit.com/infosys.com',
    role: 'Systems Engineer',
    package: 7.5,
    type: 'Full Time',
    date: '22 May 2025',
    status: 'upcoming',
    cgpa: 6.0,
    branches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'EEE'],
    location: 'Multiple Locations',
    desc: 'InfyTQ test is mandatory. Aptitude + Coding + Verbal rounds.',
    isNew: false,
  },
  {
    id: 6,
    name: 'TCS',
    logo: 'https://logo.clearbit.com/tcs.com',
    role: 'Asst. Systems Engineer',
    package: 7,
    type: 'Full Time',
    date: '1 Mar 2025',
    status: 'finished',
    cgpa: 6.0,
    branches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'EEE'],
    location: 'Pan India',
    desc: 'TCS NQT conducted. 320 registered, 180 selected. Offers dispatched.',
    isNew: false,
  },
  {
    id: 7,
    name: 'Wipro',
    logo: 'https://logo.clearbit.com/wipro.com',
    role: 'Project Engineer',
    package: 6.5,
    type: 'Full Time',
    date: '20 Feb 2025',
    status: 'finished',
    cgpa: 6.0,
    branches: ['CSE', 'IT', 'ECE', 'EEE'],
    location: 'Bhubaneswar',
    desc: 'WILP program. 200+ offers made. Onboarding scheduled for July 2025.',
    isNew: false,
  },
];

/* ────────────────────────────────────────────────────────────────
   STATE
   ──────────────────────────────────────────────────────────────── */
let activeTab   = 'ongoing';
let searchQuery = '';

/* ────────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────────── */

/** Logo initials fallback */
const initials = (name) =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

/** Logo markup — image with fallback to initials */
const logoHTML = (c) =>
  c.logo
    ? `<img src="${c.logo}" alt="${c.name}" loading="lazy"
            onerror="this.replaceWith(document.createTextNode('${initials(c.name)}'))">`
    : initials(c.name);

/** Package highlight threshold */
const pkgClass = (pkg) => pkg >= 20 ? 'pkg' : '';

/** Filter companies by tab + search */
const getVisible = (status) => {
  const q = searchQuery.toLowerCase();
  return COMPANIES.filter(c => {
    if (c.status !== status) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.desc?.toLowerCase().includes(q)
    );
  });
};

/* ────────────────────────────────────────────────────────────────
   RENDER ONE CARD
   ──────────────────────────────────────────────────────────────── */
const renderCard = (company, index) => {
  const newCls  = company.isNew ? 'c-new' : '';
  const branches = company.branches.map(b => `<span class="pw-branch">${b}</span>`).join('');

  return `
    <div class="pw-card c-${company.status} ${newCls}"
         style="--delay:${index * 55}ms" data-id="${company.id}">

      <div class="pw-card-top">
        <div class="pw-logo">${logoHTML(company)}</div>
        <div class="pw-company-info">
          <div class="pw-company-name">${company.name}</div>
          <div class="pw-company-type">${company.type}</div>
        </div>
        <div class="pw-badge ${company.status}">
          <span class="bdot"></span>
          ${company.status.charAt(0).toUpperCase() + company.status.slice(1)}
        </div>
      </div>

      <div class="pw-chips">
        <div class="pw-chip">
          <i class="ri-briefcase-line"></i><b>${company.role}</b>
        </div>
        <div class="pw-chip ${pkgClass(company.package)}">
          <i class="ri-money-rupee-circle-line"></i><b>${company.package} LPA</b>
        </div>
        <div class="pw-chip">
          <i class="ri-calendar-line"></i>${company.date}
        </div>
        ${company.location ? `
        <div class="pw-chip">
          <i class="ri-map-pin-2-line"></i>${company.location}
        </div>` : ''}
        ${company.cgpa ? `
        <div class="pw-chip">
          <i class="ri-star-line"></i>CGPA ≥ <b>${company.cgpa}</b>
        </div>` : ''}
      </div>

      <div class="pw-branches">${branches}</div>

      ${company.desc ? `<p class="pw-desc">${company.desc}</p>` : ''}
    </div>
  `;
};

/* ────────────────────────────────────────────────────────────────
   RENDER A FULL PANEL
   ──────────────────────────────────────────────────────────────── */
const renderPanel = (status) => {
  const grid  = document.getElementById(`pw-grid-${status}`);
  const empty = document.getElementById(`pw-empty-${status}`);
  const list  = getVisible(status);

  if (!grid || !empty) return;

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    grid.innerHTML = list.map((c, i) => renderCard(c, i)).join('');
  }
};

/* ────────────────────────────────────────────────────────────────
   UPDATE COUNTS (tabs + stat pills)
   ──────────────────────────────────────────────────────────────── */
const updateCounts = () => {
  ['ongoing', 'upcoming', 'finished'].forEach(status => {
    const count = COMPANIES.filter(c => c.status === status).length;

    // Tab count badge
    const badge = document.getElementById(`cnt-${status}`);
    if (badge) badge.textContent = count;

    // Stat pills (header)
    const statEl = document.getElementById(`pwStat${status.charAt(0).toUpperCase() + status.slice(1)}`);
    if (statEl) {
      const span = statEl.querySelector('span');
      if (span) span.textContent = count;
    }
  });
};

/* ────────────────────────────────────────────────────────────────
   TAB SWITCHING
   ──────────────────────────────────────────────────────────────── */
const switchTab = (tab) => {
  activeTab = tab;

  // Update tab buttons
  document.querySelectorAll('.pw-tab').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  // Update panels
  document.querySelectorAll('.pw-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `pw-panel-${tab}`);
  });

  // Re-render only the now-active panel (performance: skip hidden panels)
  renderPanel(tab);
};

/* ────────────────────────────────────────────────────────────────
   SEARCH — debounced
   ──────────────────────────────────────────────────────────────── */
let searchTimer;
const handleSearch = (query) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = query.trim();
    renderPanel(activeTab); // Only re-render visible panel
  }, 220);
};

/* ────────────────────────────────────────────────────────────────
   COUNTER ANIMATION
   ──────────────────────────────────────────────────────────────── */
const animateCount = (el, target, ms = 700) => {
  const start = performance.now();
  const tick  = (now) => {
    const p = Math.min((now - start) / ms, 1);
    el.textContent = Math.round(p * target);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
};

const animateAllCounts = () => {
  ['ongoing', 'upcoming', 'finished'].forEach(status => {
    const count = COMPANIES.filter(c => c.status === status).length;

    // Badge on tab
    const badge = document.getElementById(`cnt-${status}`);
    if (badge) animateCount(badge, count);

    // Stat pill
    const statEl = document.getElementById(
      `pwStat${status.charAt(0).toUpperCase() + status.slice(1)}`
    );
    const span = statEl?.querySelector('span');
    if (span) animateCount(span, count);
  });
};

/* ────────────────────────────────────────────────────────────────
   ALERT BANNER VISIBILITY
   ──────────────────────────────────────────────────────────────── */
const syncAlertVisibility = () => {
  const banner  = document.getElementById('pwAlert');
  const hasNew  = COMPANIES.some(c => c.status === 'upcoming' && c.isNew);
  const dismissed = sessionStorage.getItem('pw_alert_dismissed');
  if (!banner) return;
  banner.classList.toggle('hidden', !hasNew || !!dismissed);
};

/* ────────────────────────────────────────────────────────────────
   BIND EVENTS
   ──────────────────────────────────────────────────────────────── */
const bindEvents = () => {

  // Tab clicks
  document.querySelectorAll('.pw-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Search input
  const searchInput = document.getElementById('pwSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  // Alert dismiss
  const alertClose = document.getElementById('pwAlertClose');
  if (alertClose) {
    alertClose.addEventListener('click', () => {
      document.getElementById('pwAlert')?.classList.add('hidden');
      sessionStorage.setItem('pw_alert_dismissed', '1');
    });
  }
};

/* ────────────────────────────────────────────────────────────────
   INIT
   ──────────────────────────────────────────────────────────────── */
const initPlacementWidget = () => {
  updateCounts();
  renderPanel('ongoing');   // Render default active tab
  bindEvents();
  syncAlertVisibility();
  // Animated count-up on load (slight delay for visual delight)
  setTimeout(animateAllCounts, 150);
};

// Bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlacementWidget);
} else {
  initPlacementWidget();
}