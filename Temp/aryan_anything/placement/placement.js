/**
 * ================================================================
 * PLACEMENT.JS — College Management System
 * Module: Placement Cell
 * Features: CRUD, Tab Switching, Search, Filter, Pagination, Toast
 * ================================================================
 */

/* ─── INITIAL DATA STORE ─────────────────────────────────────────
   In production, replace `PlacementStore` operations with
   real API calls (fetch/axios). The shape of each company object:
   {
     id        : number    — auto-incremented
     name      : string    — company name
     logo      : string    — logo URL (optional)
     role      : string    — job role
     package   : number    — LPA
     type      : string    — Full Time | Internship | Contract | PPO
     date      : string    — ISO date string (drive date)
     deadline  : string    — ISO date string (application deadline, optional)
     status    : string    — 'ongoing' | 'upcoming' | 'finished'
     cgpa      : number    — min CGPA (optional)
     branches  : string[]  — eligible branches
     location  : string    — work location
     desc      : string    — description / notes
     createdAt : number    — timestamp (for "NEW" detection)
   }
 ─────────────────────────────────────────────────────────────── */
const PlacementStore = (() => {
  const STORAGE_KEY = 'cms_placement_companies';

  // Seed data shown on first load
  const seedData = [
    {
      id: 1, name: 'Google', logo: 'https://logo.clearbit.com/google.com',
      role: 'Software Engineer', package: 45, type: 'Full Time',
      date: '2025-04-15', deadline: '2025-04-01', status: 'ongoing',
      cgpa: 7.5, branches: ['CSE', 'IT'], location: 'Bangalore (Hybrid)',
      desc: 'L3/L4 SWE roles. Rounds: Online Test → 3 Tech Interviews → HR.',
      createdAt: Date.now() - 1000 * 60 * 60 * 2 // 2h ago → "NEW"
    },
    {
      id: 2, name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com',
      role: 'Full Stack Developer', package: 38, type: 'Full Time',
      date: '2025-04-18', deadline: '2025-04-05', status: 'ongoing',
      cgpa: 7.0, branches: ['CSE', 'IT', 'ECE'], location: 'Hyderabad',
      desc: 'Azure & Office 365 product teams. Focus on distributed systems.',
      createdAt: Date.now() - 1000 * 60 * 60 * 48
    },
    {
      id: 3, name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com',
      role: 'SDE-I', package: 32, type: 'Full Time',
      date: '2025-05-10', deadline: '2025-04-25', status: 'upcoming',
      cgpa: 6.5, branches: ['CSE', 'IT', 'ECE', 'EEE'], location: 'Pune',
      desc: 'Backend microservices. Amazon Leadership Principles play a key role in interviews.',
      createdAt: Date.now() - 1000 * 60 * 60 * 1 // 1h ago → "NEW"
    },
    {
      id: 4, name: 'Infosys', logo: 'https://logo.clearbit.com/infosys.com',
      role: 'Systems Engineer', package: 7.5, type: 'Full Time',
      date: '2025-05-22', deadline: '2025-05-08', status: 'upcoming',
      cgpa: 6.0, branches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'EEE'], location: 'Multiple',
      desc: 'InfyTQ test mandatory. Aptitude + Coding + Communication rounds.',
      createdAt: Date.now() - 1000 * 60 * 60 * 72
    },
    {
      id: 5, name: 'TCS', logo: 'https://logo.clearbit.com/tcs.com',
      role: 'Assistant Systems Engineer', package: 7, type: 'Full Time',
      date: '2025-03-01', deadline: '2025-02-15', status: 'finished',
      cgpa: 6.0, branches: ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'EEE'], location: 'Pan India',
      desc: 'TCS NQT conducted. 320 students registered, 180 selected.',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10
    },
    {
      id: 6, name: 'Wipro', logo: 'https://logo.clearbit.com/wipro.com',
      role: 'Project Engineer', package: 6.5, type: 'Full Time',
      date: '2025-02-20', deadline: '2025-02-05', status: 'finished',
      cgpa: 6.0, branches: ['CSE', 'IT', 'ECE', 'EEE'], location: 'Bhubaneswar',
      desc: 'WILP (Work Integrated Learning Program). 200+ offers made.',
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15
    },
    {
      id: 7, name: 'Flipkart', logo: 'https://logo.clearbit.com/flipkart.com',
      role: 'SDE-I (Backend)', package: 28, type: 'Full Time',
      date: '2025-05-28', deadline: '2025-05-10', status: 'upcoming',
      cgpa: 7.0, branches: ['CSE', 'IT'], location: 'Bangalore',
      desc: 'Commerce platform team. Strong DSA and system design knowledge needed.',
      createdAt: Date.now() - 1000 * 60 * 30 // 30 min ago → "NEW"
    },
  ];

  // Load from localStorage or use seed
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [...seedData];
    } catch {
      return [...seedData];
    }
  };

  const save = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  let companies = load();
  let nextId = companies.length ? Math.max(...companies.map(c => c.id)) + 1 : 1;

  return {
    getAll:   ()     => [...companies],
    getById:  (id)   => companies.find(c => c.id === id) || null,
    add:      (data) => {
      const company = { ...data, id: nextId++, createdAt: Date.now() };
      companies.push(company);
      save(companies);
      return company;
    },
    update: (id, data) => {
      const idx = companies.findIndex(c => c.id === id);
      if (idx === -1) return null;
      companies[idx] = { ...companies[idx], ...data };
      save(companies);
      return companies[idx];
    },
    delete: (id) => {
      const idx = companies.findIndex(c => c.id === id);
      if (idx === -1) return false;
      companies.splice(idx, 1);
      save(companies);
      return true;
    },
  };
})();

/* ─── APP STATE ──────────────────────────────────────────────────── */
const AppState = {
  activeTab:   'ongoing',
  searchQuery: '',
  filterBranch: '',
  filterSort:  'newest',
  pagination: {
    ongoing:  { page: 1, perPage: 6 },
    upcoming: { page: 1, perPage: 6 },
    finished: { page: 1, perPage: 6 },
  },
  editingId:   null,
  deletingId:  null,
};

/* ─── UTILITY HELPERS ────────────────────────────────────────────── */

/** Format date to readable string */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Check if a company was created recently (< 3 hours) */
const isNew = (company) => Date.now() - company.createdAt < 1000 * 60 * 60 * 3;

/** Generate initials for logo fallback */
const getInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

/** Debounce utility */
const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

/* ─── TOAST NOTIFICATION ─────────────────────────────────────────── */
const Toast = {
  icons: { success: 'ri-checkbox-circle-fill', error: 'ri-error-warning-fill', info: 'ri-information-fill', warning: 'ri-alert-fill' },

  show(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${this.icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }
};

/* ─── RENDER ENGINE ──────────────────────────────────────────────── */

/** Build company card HTML */
const renderCard = (company) => {
  const newClass = isNew(company) ? 'is-new' : '';
  const logoHtml = company.logo
    ? `<img src="${company.logo}" alt="${company.name}" onerror="this.parentElement.textContent='${getInitials(company.name)}'">`
    : getInitials(company.name);

  const branchTags = company.branches
    .map(b => `<span class="branch-tag">${b}</span>`)
    .join('');

  const packageColor = company.package >= 20 ? 'highlight' : '';
  const deadlineHtml = company.deadline
    ? `<div class="info-chip"><i class="ri-calendar-close-line"></i><span>Deadline: <strong>${formatDate(company.deadline)}</strong></span></div>`
    : '';

  const descHtml = company.desc
    ? `<p class="card-desc">${company.desc}</p>`
    : '';

  return `
    <div class="company-card status-${company.status} ${newClass}" data-id="${company.id}">
      <!-- Status accent bar applied via ::after pseudo-element -->

      <div class="card-header">
        <div class="company-identity">
          <div class="company-logo">${logoHtml}</div>
          <div class="company-meta">
            <span class="company-name">${company.name}</span>
            <span class="company-type">${company.type}</span>
          </div>
        </div>
        <div class="status-badge ${company.status}">
          <span class="dot"></span>
          ${company.status.charAt(0).toUpperCase() + company.status.slice(1)}
        </div>
      </div>

      <div class="card-info">
        <div class="info-row">
          <div class="info-chip"><i class="ri-briefcase-line"></i><span><strong>${company.role}</strong></span></div>
          <div class="info-chip ${packageColor}"><i class="ri-money-rupee-circle-line"></i><span><strong>${company.package} LPA</strong></span></div>
        </div>
        <div class="info-row">
          <div class="info-chip"><i class="ri-calendar-event-line"></i><span>Drive: <strong>${formatDate(company.date)}</strong></span></div>
          ${company.location ? `<div class="info-chip"><i class="ri-map-pin-line"></i><span>${company.location}</span></div>` : ''}
        </div>
        <div class="info-row">
          ${company.cgpa ? `<div class="info-chip"><i class="ri-star-line"></i><span>Min CGPA: <strong>${company.cgpa}</strong></span></div>` : ''}
          ${deadlineHtml}
        </div>
        <div class="branch-tags">${branchTags}</div>
        ${descHtml}
      </div>

      <div class="card-actions">
        <button class="btn btn-edit" data-action="edit" data-id="${company.id}" title="Edit Company">
          <i class="ri-edit-line"></i> Edit
        </button>
        <button class="btn btn-status" data-action="cycle-status" data-id="${company.id}" title="Change Status">
          <i class="ri-toggle-line"></i> Status
        </button>
        <button class="btn btn-delete" data-action="delete" data-id="${company.id}" title="Delete Company">
          <i class="ri-delete-bin-line"></i> Delete
        </button>
      </div>
    </div>
  `;
};

/** Filter + sort + search the company list */
const getFilteredCompanies = (status) => {
  let list = PlacementStore.getAll().filter(c => c.status === status);

  // Apply search
  if (AppState.searchQuery) {
    const q = AppState.searchQuery.toLowerCase();
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.desc?.toLowerCase().includes(q)
    );
  }

  // Apply branch filter
  if (AppState.filterBranch) {
    list = list.filter(c => c.branches.includes(AppState.filterBranch));
  }

  // Apply sort
  switch (AppState.filterSort) {
    case 'newest':      list.sort((a, b) => b.createdAt - a.createdAt); break;
    case 'oldest':      list.sort((a, b) => a.createdAt - b.createdAt); break;
    case 'package_high':list.sort((a, b) => b.package - a.package); break;
    case 'package_low': list.sort((a, b) => a.package - b.package); break;
  }

  return list;
};

/** Render cards into a grid with pagination */
const renderGrid = (status) => {
  const grid  = document.getElementById(`grid-${status}`);
  const empty = document.getElementById(`empty-${status}`);
  const page  = document.getElementById(`page-${status}`);

  const all  = getFilteredCompanies(status);
  const pg   = AppState.pagination[status];
  const total = all.length;
  const start = (pg.page - 1) * pg.perPage;
  const slice = all.slice(start, start + pg.perPage);

  if (!grid || !empty) return;

  if (total === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    if (page) page.innerHTML = '';
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = slice.map(renderCard).join('');
  renderPagination(status, total, page);
};

/** Render pagination controls */
const renderPagination = (status, total, container) => {
  const pg = AppState.pagination[status];
  const totalPages = Math.ceil(total / pg.perPage);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="page-btn" data-status="${status}" data-page="${pg.page - 1}" ${pg.page === 1 ? 'disabled' : ''}><i class="ri-arrow-left-s-line"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - pg.page) > 1) {
      if (i === 3 || i === totalPages - 2) html += `<span class="page-btn" style="cursor:default">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${i === pg.page ? 'active' : ''}" data-status="${status}" data-page="${i}">${i}</button>`;
  }

  html += `<button class="page-btn" data-status="${status}" data-page="${pg.page + 1}" ${pg.page === totalPages ? 'disabled' : ''}><i class="ri-arrow-right-s-line"></i></button>`;
  container.innerHTML = html;
};

/** Update all stat counters and tab badges */
const updateStats = () => {
  const all = PlacementStore.getAll();
  const count = (s) => all.filter(c => c.status === s).length;

  const ongoing  = count('ongoing');
  const upcoming = count('upcoming');
  const finished = count('finished');
  const total    = all.length;

  document.getElementById('statOngoing').textContent  = ongoing;
  document.getElementById('statUpcoming').textContent = upcoming;
  document.getElementById('statFinished').textContent = finished;
  document.getElementById('statTotal').textContent    = total;

  document.getElementById('badgeOngoing').textContent  = ongoing;
  document.getElementById('badgeUpcoming').textContent = upcoming;
  document.getElementById('badgeFinished').textContent = finished;
};

/** Render everything (all grids + stats) */
const renderAll = () => {
  renderGrid('ongoing');
  renderGrid('upcoming');
  renderGrid('finished');
  updateStats();
};

/* ─── TAB SWITCHING ──────────────────────────────────────────────── */
const switchTab = (tabId) => {
  AppState.activeTab = tabId;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tabId}`);
  });
};

/* ─── MODAL MANAGEMENT ───────────────────────────────────────────── */
const Modal = {
  overlay:  document.getElementById('modalOverlay'),
  form:     document.getElementById('companyForm'),
  titleText:document.getElementById('modalTitleText'),
  icon:     document.getElementById('modalIcon'),
  saveBtn:  document.getElementById('saveBtnText'),

  /** Open modal for adding */
  openAdd() {
    AppState.editingId = null;
    this.titleText.textContent = 'Add New Company';
    this.icon.className = 'ri-add-circle-line';
    this.saveBtn.textContent = 'Save Company';
    this.resetForm();
    // Pre-set today's date
    document.getElementById('fieldDate').min = new Date().toISOString().split('T')[0];
    this.show();
  },

  /** Open modal for editing */
  openEdit(id) {
    const company = PlacementStore.getById(id);
    if (!company) return;
    AppState.editingId = id;
    this.titleText.textContent = 'Edit Company';
    this.icon.className = 'ri-edit-line';
    this.saveBtn.textContent = 'Update Company';
    this.populateForm(company);
    this.show();
  },

  show() {
    this.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => document.getElementById('fieldName').focus(), 100);
  },

  close() {
    this.overlay.classList.add('hidden');
    document.body.style.overflow = '';
    this.clearErrors();
  },

  resetForm() {
    this.form.reset();
    document.getElementById('fieldId').value = '';
    document.querySelectorAll('#branchCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
    this.clearErrors();
  },

  populateForm(company) {
    document.getElementById('fieldId').value      = company.id;
    document.getElementById('fieldName').value    = company.name;
    document.getElementById('fieldLogo').value    = company.logo || '';
    document.getElementById('fieldRole').value    = company.role;
    document.getElementById('fieldPackage').value = company.package;
    document.getElementById('fieldDate').value    = company.date;
    document.getElementById('fieldDeadline').value= company.deadline || '';
    document.getElementById('fieldStatus').value  = company.status;
    document.getElementById('fieldCGPA').value    = company.cgpa || '';
    document.getElementById('fieldDesc').value    = company.desc || '';
    document.getElementById('fieldLocation').value= company.location || '';
    document.getElementById('fieldType').value    = company.type;

    // Branches checkboxes
    document.querySelectorAll('#branchCheckboxes input[type="checkbox"]').forEach(cb => {
      cb.checked = company.branches.includes(cb.value);
    });
    this.clearErrors();
  },

  clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-wrapper, .textarea-wrapper').forEach(el => el.classList.remove('error'));
  },

  /** Validate and return form data, or null if invalid */
  validate() {
    this.clearErrors();
    let valid = true;

    const setErr = (fieldId, errId, msg) => {
      document.getElementById(errId).textContent = msg;
      document.getElementById(fieldId)?.closest('.input-wrapper, .textarea-wrapper')?.classList.add('error');
      valid = false;
    };

    const name = document.getElementById('fieldName').value.trim();
    if (!name) setErr('fieldName', 'errName', 'Company name is required.');

    const role = document.getElementById('fieldRole').value.trim();
    if (!role) setErr('fieldRole', 'errRole', 'Job role is required.');

    const pkg = parseFloat(document.getElementById('fieldPackage').value);
    if (!pkg || pkg <= 0) setErr('fieldPackage', 'errPackage', 'Enter a valid package.');

    const date = document.getElementById('fieldDate').value;
    if (!date) setErr('fieldDate', 'errDate', 'Drive date is required.');

    const status = document.getElementById('fieldStatus').value;
    if (!status) setErr('fieldStatus', 'errStatus', 'Please select a status.');

    const branches = Array.from(document.querySelectorAll('#branchCheckboxes input:checked')).map(cb => cb.value);
    if (!branches.length) {
      document.getElementById('errBranches').textContent = 'Select at least one branch.';
      valid = false;
    }

    if (!valid) return null;

    return {
      name,
      logo:     document.getElementById('fieldLogo').value.trim(),
      role,
      package:  pkg,
      type:     document.getElementById('fieldType').value,
      date,
      deadline: document.getElementById('fieldDeadline').value || '',
      status,
      cgpa:     parseFloat(document.getElementById('fieldCGPA').value) || null,
      branches,
      desc:     document.getElementById('fieldDesc').value.trim(),
      location: document.getElementById('fieldLocation').value.trim(),
    };
  }
};

/* ─── DELETE MODAL ───────────────────────────────────────────────── */
const DeleteModal = {
  overlay: document.getElementById('deleteOverlay'),
  nameEl:  document.getElementById('deleteCompanyName'),

  open(id) {
    const company = PlacementStore.getById(id);
    if (!company) return;
    AppState.deletingId = id;
    this.nameEl.textContent = company.name;
    this.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  close() {
    AppState.deletingId = null;
    this.overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

/* ─── STATUS CYCLE ───────────────────────────────────────────────── */
const cycleStatus = (id) => {
  const company = PlacementStore.getById(id);
  if (!company) return;

  const cycle = { ongoing: 'upcoming', upcoming: 'finished', finished: 'ongoing' };
  const next = cycle[company.status];
  PlacementStore.update(id, { status: next });

  // Switch to the new tab so user sees where it went
  switchTab(next);
  renderAll();
  Toast.show(`${company.name} moved to <strong>${next}</strong>.`, 'info');
};

/* ─── EVENT DELEGATION — Card Actions ───────────────────────────── */
document.querySelectorAll('.company-grid').forEach(grid => {
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const { action, id } = btn.dataset;
    const numId = parseInt(id, 10);

    switch (action) {
      case 'edit':         Modal.openEdit(numId); break;
      case 'delete':       DeleteModal.open(numId); break;
      case 'cycle-status': cycleStatus(numId); break;
    }
  });
});

/* ─── EVENT DELEGATION — Pagination ─────────────────────────────── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.page-btn[data-page]');
  if (!btn || btn.disabled) return;
  const { status, page } = btn.dataset;
  if (!status || !page) return;
  AppState.pagination[status].page = parseInt(page, 10);
  renderGrid(status);
  // Scroll tab panel into view
  document.getElementById(`panel-${status}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ─── TAB BUTTON CLICKS ──────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ─── TOPBAR ADD BUTTON ──────────────────────────────────────────── */
document.getElementById('openAddModal').addEventListener('click', () => Modal.openAdd());

/* ─── MODAL CLOSE BUTTONS ────────────────────────────────────────── */
document.getElementById('closeModal').addEventListener('click',  () => Modal.close());
document.getElementById('cancelModal').addEventListener('click', () => Modal.close());
document.getElementById('closeDelete').addEventListener('click', () => DeleteModal.close());
document.getElementById('cancelDelete').addEventListener('click',() => DeleteModal.close());

// Close modals on overlay click
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) Modal.close();
});
document.getElementById('deleteOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('deleteOverlay')) DeleteModal.close();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    Modal.close();
    DeleteModal.close();
  }
});

/* ─── SAVE COMPANY (ADD / EDIT) ──────────────────────────────────── */
document.getElementById('saveCompany').addEventListener('click', () => {
  const data = Modal.validate();
  if (!data) return;

  if (AppState.editingId) {
    // UPDATE
    PlacementStore.update(AppState.editingId, data);
    Toast.show(`✏️ <strong>${data.name}</strong> updated successfully.`, 'success');
  } else {
    // ADD
    PlacementStore.add(data);
    Toast.show(`🏢 <strong>${data.name}</strong> added to ${data.status} companies!`, 'success');
    // Switch to the appropriate tab
    switchTab(data.status);
  }

  Modal.close();
  renderAll();
});

/* ─── CONFIRM DELETE ─────────────────────────────────────────────── */
document.getElementById('confirmDelete').addEventListener('click', () => {
  const id = AppState.deletingId;
  const company = PlacementStore.getById(id);
  const name = company?.name || 'Company';
  PlacementStore.delete(id);
  DeleteModal.close();
  renderAll();
  Toast.show(`🗑️ <strong>${name}</strong> has been removed.`, 'warning');
});

/* ─── SEARCH ─────────────────────────────────────────────────────── */
const handleSearch = debounce((q) => {
  AppState.searchQuery = q;
  // Reset all pagination to page 1 on new search
  Object.keys(AppState.pagination).forEach(s => AppState.pagination[s].page = 1);
  renderAll();
}, 280);

document.getElementById('globalSearch').addEventListener('input', (e) => {
  handleSearch(e.target.value.trim());
});

// CMD+K / CTRL+K shortcut to focus search
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('globalSearch').focus();
  }
});

/* ─── FILTERS ────────────────────────────────────────────────────── */
document.getElementById('filterBranch').addEventListener('change', (e) => {
  AppState.filterBranch = e.target.value;
  Object.keys(AppState.pagination).forEach(s => AppState.pagination[s].page = 1);
  renderAll();
});

document.getElementById('filterSort').addEventListener('change', (e) => {
  AppState.filterSort = e.target.value;
  renderAll();
});

document.getElementById('clearFilters').addEventListener('click', () => {
  AppState.filterBranch = '';
  AppState.filterSort   = 'newest';
  AppState.searchQuery  = '';
  document.getElementById('filterBranch').value = '';
  document.getElementById('filterSort').value   = 'newest';
  document.getElementById('globalSearch').value = '';
  Object.keys(AppState.pagination).forEach(s => AppState.pagination[s].page = 1);
  renderAll();
  Toast.show('Filters cleared.', 'info', 2000);
});

/* ─── SIDEBAR TOGGLE ─────────────────────────────────────────────── */
document.getElementById('sidebarToggle').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
});

/* ─── UPCOMING BANNER — hide if no upcoming ──────────────────────── */
const updateBannerVisibility = () => {
  const count = PlacementStore.getAll().filter(c => c.status === 'upcoming').length;
  const banner = document.getElementById('upcomingBanner');
  if (banner) banner.classList.toggle('hidden', count === 0);
};

/* ─── ANIMATE STATS ON LOAD ──────────────────────────────────────── */
const animateCounter = (el, target, duration = 800) => {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(progress * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  };
  requestAnimationFrame(update);
};

const animateAllStats = () => {
  const all = PlacementStore.getAll();
  const statMap = {
    statOngoing:  all.filter(c => c.status === 'ongoing').length,
    statUpcoming: all.filter(c => c.status === 'upcoming').length,
    statFinished: all.filter(c => c.status === 'finished').length,
    statTotal:    all.length,
  };
  Object.entries(statMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) animateCounter(el, val);
  });
};

/* ─── INIT ───────────────────────────────────────────────────────── */
const init = () => {
  renderAll();
  updateBannerVisibility();
  // Delayed counter animation for visual delight
  setTimeout(animateAllStats, 200);
};

// Kick off
init();