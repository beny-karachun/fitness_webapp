/* ==========================================================
   Main Application — Routing, Dashboard, Settings, Toast
   ========================================================== */
window.FitnessApp = window.FitnessApp || {};

(function() {
  // Exercise module registry (order = nav order)
  const EXERCISES = ['pullups', 'pushups', 'squats', 'benchpress', 'dips', 'curls'];
  const PAGES = ['dashboard', 'daily-log', ...EXERCISES, 'settings'];

  let currentPage = 'dashboard';

  // ---- Init ----
  function init() {
    _createToastContainer();
    _renderNav();
    _renderMobileNav();
    _setupMenuToggle();
    navigate('dashboard');
  }

  // ---- Navigation ----
  function navigate(page) {
    currentPage = page;
    const content = document.getElementById('app-content');
    if (!content) return;

    // Update nav active states
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    document.querySelectorAll('.mobile-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Render page
    if (page === 'dashboard') {
      _renderDashboard(content);
    } else if (page === 'daily-log') {
      if (FitnessApp.DailyLog) FitnessApp.DailyLog.render(content);
    } else if (page === 'settings') {
      _renderSettings(content);
    } else if (FitnessApp.Modules[page]) {
      FitnessApp.Modules[page].render(content);
    }

    // Close mobile sidebar
    document.querySelector('.sidebar')?.classList.remove('open');

    // Scroll to top
    window.scrollTo(0, 0);
  }

  // ---- Sidebar Nav ----
  function _renderNav() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    let html = '';

    // Dashboard
    html += `<div class="nav-item active" data-page="dashboard">
      <span class="nav-item-icon">📊</span>
      <span class="nav-item-label">Dashboard</span>
    </div>`;

    html += `<div class="nav-item" data-page="daily-log">
      <span class="nav-item-icon">📝</span>
      <span class="nav-item-label">Log Daily Workout</span>
    </div>`;

    html += `<div class="nav-section-title">Exercises</div>`;

    EXERCISES.forEach(id => {
      const mod = FitnessApp.Modules[id];
      if (!mod) return;
      html += `<div class="nav-item" data-page="${id}">
        <span class="nav-item-icon">${mod.icon}</span>
        <span class="nav-item-label">${mod.name}</span>
        <span class="nav-item-badge difficulty-badge ${mod.difficulty}">${mod.difficulty.charAt(0).toUpperCase() + mod.difficulty.slice(1)}</span>
      </div>`;
    });

    html += `<div class="nav-section-title">App</div>`;
    html += `<div class="nav-item" data-page="settings">
      <span class="nav-item-icon">⚙️</span>
      <span class="nav-item-label">Settings</span>
    </div>`;

    nav.innerHTML = html;

    // Click handlers
    nav.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
    });

    // Update weight display in footer
    _updateWeightDisplay();
  }

  // ---- Mobile Nav ----
  function _renderMobileNav() {
    const mobileNav = document.getElementById('mobile-nav-items');
    if (!mobileNav) return;

    let html = `<div class="mobile-nav-item active" data-page="dashboard">
      <span class="mobile-nav-item-icon">📊</span>
      <span class="mobile-nav-item-label">Home</span>
    </div>`;

    html += `<div class="mobile-nav-item" data-page="daily-log">
      <span class="mobile-nav-item-icon">📝</span>
      <span class="mobile-nav-item-label">Log</span>
    </div>`;

    EXERCISES.forEach(id => {
      const mod = FitnessApp.Modules[id];
      if (!mod) return;
      html += `<div class="mobile-nav-item" data-page="${id}">
        <span class="mobile-nav-item-icon">${mod.icon}</span>
        <span class="mobile-nav-item-label">${mod.name}</span>
      </div>`;
    });

    html += `<div class="mobile-nav-item" data-page="settings">
      <span class="mobile-nav-item-icon">⚙️</span>
      <span class="mobile-nav-item-label">Settings</span>
    </div>`;

    mobileNav.innerHTML = html;

    mobileNav.querySelectorAll('.mobile-nav-item').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
    });
  }

  // ---- Menu Toggle (mobile) ----
  function _setupMenuToggle() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
      // Close sidebar when clicking outside
      document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !toggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  }

  // ---- Dashboard ----
  function _renderDashboard(container) {
    const settings = FitnessApp.Storage.getSettings();
    container.innerHTML = '';
    container.className = 'main-content exercise-page';

    // Page header
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Track your fitness journey</p>
    `;
    container.appendChild(header);

    // Today's summary
    const todaysWorkouts = FitnessApp.Storage.getAllTodaysWorkouts();
    const todaySection = document.createElement('div');
    todaySection.className = 'today-section';

    const todayExerciseCount = Object.keys(todaysWorkouts).length;
    let todaySetsCount = 0;
    let todayTotalReps = 0;
    Object.values(todaysWorkouts).forEach(entries => {
      entries.forEach(entry => {
        todaySetsCount += entry.sets.length;
        todayTotalReps += entry.sets.reduce((s, set) => s + set.reps, 0);
      });
    });

    todaySection.innerHTML = `
      <div class="today-header">
        <h2 class="card-title">Today's Activity</h2>
        <span class="today-date">${_formatTodayDate()}</span>
      </div>
      <div class="today-summary">
        <div class="today-stat">
          <div class="today-stat-value">${todayExerciseCount}</div>
          <div class="today-stat-label">Exercises</div>
        </div>
        <div class="today-stat">
          <div class="today-stat-value">${todaySetsCount}</div>
          <div class="today-stat-label">Total Sets</div>
        </div>
        <div class="today-stat">
          <div class="today-stat-value">${todayTotalReps}</div>
          <div class="today-stat-label">Total Reps</div>
        </div>
      </div>
    `;
    container.appendChild(todaySection);

    // Weekly calendar
    const weekCalendar = _renderWeeklyCalendar();
    container.appendChild(weekCalendar);

    // Exercise cards grid
    const gridTitle = document.createElement('div');
    gridTitle.innerHTML = `<h2 class="card-title" style="margin-bottom:16px;">Exercises</h2>`;
    container.appendChild(gridTitle);

    const grid = document.createElement('div');
    grid.className = 'dashboard-grid';

    EXERCISES.forEach(id => {
      const mod = FitnessApp.Modules[id];
      if (!mod) return;

      const latest = FitnessApp.Storage.getLatestWorkout(id);
      const history = FitnessApp.Storage.getHistory(id);

      // Calculate current level
      let levelInfo = { level: 'beginner', label: 'Beginner' };
      let statValue = '—';
      let statLabel = 'Best';

      if (latest) {
        if (mod.type === 'barbell' && latest.sets.length > 0) {
          const bestSet = latest.sets.reduce((best, s) => {
            const e = FitnessApp.Standards.estimate1RM(s.weight, s.reps);
            return e > (best.e1rm || 0) ? { ...s, e1rm: e } : best;
          }, { e1rm: 0 });
          levelInfo = FitnessApp.Standards.getBarbellLevel(
            id, bestSet.weight, bestSet.reps, settings.bodyweight, settings.gender
          );
          statValue = (levelInfo.e1rm || bestSet.weight) + 'kg';
          statLabel = 'Est. 1RM';
        } else if (latest.weighted && latest.sets.length > 0) {
          const maxW = Math.max(...latest.sets.map(s => s.weight));
          levelInfo = FitnessApp.Standards.getWeightedBWLevel(id, maxW, settings.bodyweight, settings.gender);
          statValue = '+' + maxW + 'kg';
          statLabel = 'Added Weight';
        } else if (latest.sets.length > 0) {
          const maxR = Math.max(...latest.sets.map(s => s.reps));
          levelInfo = FitnessApp.Standards.getBodyweightLevel(id, maxR, settings.bodyweight, settings.gender);
          statValue = maxR;
          statLabel = 'Best Reps';
        }
      }

      const card = document.createElement('div');
      card.className = 'exercise-card';
      card.dataset.page = id;

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div class="exercise-card-icon">${mod.icon}</div>
          <span class="difficulty-badge ${mod.difficulty}">${mod.difficulty.charAt(0).toUpperCase() + mod.difficulty.slice(1)}</span>
        </div>
        <div class="exercise-card-name">${mod.name}</div>
        <div class="exercise-card-muscles">${mod.muscles.join(' • ')}</div>
        <div class="exercise-card-stats">
          <div class="exercise-card-stat">
            <div class="exercise-card-stat-value">${statValue}</div>
            <div class="exercise-card-stat-label">${statLabel}</div>
          </div>
          <div class="exercise-card-stat">
            <div class="exercise-card-stat-value">${history.length}</div>
            <div class="exercise-card-stat-label">Sessions</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="strength-current-value ${levelInfo.level}" style="font-size:11px;">${levelInfo.label}</span>
          ${latest ? `<span style="font-size:11px;color:var(--text-muted);">Last: ${latest.date}</span>` : ''}
        </div>
      `;

      card.addEventListener('click', () => navigate(id));
      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  // ---- Weekly Calendar ----
  function _renderWeeklyCalendar() {
    const cal = document.createElement('div');
    cal.style.marginBottom = '32px';
    cal.innerHTML = `<h2 class="card-title" style="margin-bottom:12px;">This Week</h2>`;

    const weekDiv = document.createElement('div');
    weekDiv.className = 'weekly-calendar';

    const workoutDates = FitnessApp.Storage.getWorkoutDates();
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // get Monday

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');

      const isToday = dateStr === FitnessApp.Storage.todayStr();
      const hasWorkout = workoutDates.has(dateStr);

      const dayEl = document.createElement('div');
      dayEl.className = `week-day${hasWorkout ? ' has-workout' : ''}${isToday ? ' today' : ''}`;
      dayEl.innerHTML = `
        <div class="week-day-name">${dayNames[i]}</div>
        <div class="week-day-number">${d.getDate()}</div>
        <div class="week-day-dot"></div>
      `;
      weekDiv.appendChild(dayEl);
    }

    cal.appendChild(weekDiv);
    return cal;
  }

  // ---- Settings ----
  function _renderSettings(container) {
    const settings = FitnessApp.Storage.getSettings();
    container.innerHTML = '';
    container.className = 'main-content exercise-page';

    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your profile and preferences</p>
    `;
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'settings-grid';

    // Profile card
    const profileCard = document.createElement('div');
    profileCard.className = 'settings-card';
    profileCard.innerHTML = `
      <div class="settings-card-title">Profile</div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Body Weight</div>
          <div class="settings-row-desc">Used for strength level calculations</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <input type="number" class="settings-input" id="settings-bodyweight" 
            value="${settings.bodyweight}" min="30" max="250" step="0.5">
          <span style="color:var(--text-muted);font-size:13px;">kg</span>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Gender</div>
          <div class="settings-row-desc">Determines which strength standards to use</div>
        </div>
        <select class="settings-select" id="settings-gender">
          <option value="male" ${settings.gender === 'male' ? 'selected' : ''}>Male</option>
          <option value="female" ${settings.gender === 'female' ? 'selected' : ''}>Female</option>
        </select>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Weight Class</div>
          <div class="settings-row-desc">Your current bracket for bodyweight exercise standards</div>
        </div>
        <span id="settings-weight-class" style="font-weight:600;color:var(--accent-primary);">
          ${FitnessApp.Standards.getWeightClassLabel(settings.bodyweight)}
        </span>
      </div>
    `;
    grid.appendChild(profileCard);

    // Data card
    const dataCard = document.createElement('div');
    dataCard.className = 'settings-card';
    dataCard.innerHTML = `
      <div class="settings-card-title">Data</div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Export Data</div>
          <div class="settings-row-desc">Download all workout data as JSON</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="export-data-btn">📥 Export</button>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">Clear All Data</div>
          <div class="settings-row-desc">Permanently delete all workout history</div>
        </div>
        <button class="btn btn-danger btn-sm" id="clear-data-btn">🗑 Clear</button>
      </div>
    `;
    grid.appendChild(dataCard);

    container.appendChild(grid);

    // Event handlers
    const bwInput = container.querySelector('#settings-bodyweight');
    const genderSelect = container.querySelector('#settings-gender');
    const wcLabel = container.querySelector('#settings-weight-class');

    function saveSettings() {
      const newSettings = {
        bodyweight: parseFloat(bwInput.value) || 80,
        gender: genderSelect.value,
      };
      FitnessApp.Storage.setSettings(newSettings);
      wcLabel.textContent = FitnessApp.Standards.getWeightClassLabel(newSettings.bodyweight);
      _updateWeightDisplay();
      FitnessApp.showToast('Settings saved', 'success');
    }

    bwInput.addEventListener('change', saveSettings);
    genderSelect.addEventListener('change', saveSettings);

    container.querySelector('#export-data-btn').addEventListener('click', () => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('ft_')) {
          data[key] = JSON.parse(localStorage.getItem(key));
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-tracker-export-${FitnessApp.Storage.todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      FitnessApp.showToast('Data exported!', 'success');
    });

    container.querySelector('#clear-data-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete ALL workout data? This cannot be undone.')) {
        FitnessApp.Storage.clearAllData();
        FitnessApp.showToast('All data cleared', 'success');
        navigate('dashboard');
      }
    });
  }

  // ---- Weight Display (sidebar footer) ----
  function _updateWeightDisplay() {
    const el = document.getElementById('user-weight-value');
    if (el) {
      const settings = FitnessApp.Storage.getSettings();
      el.textContent = settings.bodyweight + ' kg';
    }
  }

  // ---- Toast System ----
  function _createToastContainer() {
    if (!document.getElementById('toast-container')) {
      const tc = document.createElement('div');
      tc.id = 'toast-container';
      tc.className = 'toast-container';
      document.body.appendChild(tc);
    }
  }

  function showToast(message, type = 'success') {
    const tc = document.getElementById('toast-container');
    if (!tc) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${message}`;
    tc.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  // ---- Helpers ----
  function _formatTodayDate() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  // Expose public API
  FitnessApp.init = init;
  FitnessApp.navigate = navigate;
  FitnessApp.showToast = showToast;

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
