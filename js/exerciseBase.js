/* ==========================================================
   Exercise Base Module
   Shared rendering logic for all exercise pages:
   - Date picker, sets/reps/weight form
   - Strength indicator bar
   - Plate calculator (for barbell types)
   - Weighted toggle (for BW exercises)
   - History grouped by day
   - Mini progress chart
   ========================================================== */
window.FitnessApp = window.FitnessApp || {};

FitnessApp.ExerciseBase = (() => {

  /**
   * Render a full exercise page
   * @param {HTMLElement} container - Target container
   * @param {object} config - Exercise configuration
   */
  function render(container, config) {
    const settings = FitnessApp.Storage.getSettings();
    const history = FitnessApp.Storage.getHistory(config.id);

    container.innerHTML = '';
    container.className = 'main-content exercise-page';

    // ---- Header ----
    const header = document.createElement('div');
    header.className = 'exercise-header';
    header.innerHTML = `
      <div class="exercise-icon-large">${config.icon}</div>
      <div class="exercise-header-text">
        <h1>${config.name}</h1>
        <div class="exercise-header-meta">
          <span class="exercise-muscles">${config.muscles.join(' • ')}</span>
          <span class="difficulty-badge ${config.difficulty}">${_difficultyLabel(config.difficulty)}</span>
        </div>
      </div>
    `;
    container.appendChild(header);

    // ---- Strength Indicator ----
    const strengthSection = _renderStrengthIndicator(config, settings, history);
    container.appendChild(strengthSection);

    // ---- Workout Form Card ----
    const formCard = document.createElement('div');
    formCard.className = 'card';
    formCard.style.marginBottom = '24px';

    const formTitle = document.createElement('div');
    formTitle.className = 'card-header';
    formTitle.innerHTML = `<h3 class="card-title">Log Workout</h3>`;
    formCard.appendChild(formTitle);

    // Date picker
    const dateRow = document.createElement('div');
    dateRow.className = 'form-row';
    dateRow.style.marginBottom = '12px';
    const dateGroup = document.createElement('div');
    dateGroup.className = 'form-group';
    dateGroup.innerHTML = `<label class="form-label">Date</label>`;
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'form-input';
    dateInput.id = 'workout-date';
    dateInput.value = FitnessApp.Storage.todayStr();
    dateGroup.appendChild(dateInput);
    dateRow.appendChild(dateGroup);
    formCard.appendChild(dateRow);

    // Weighted toggle (for BW exercises with weighted option)
    let weightedToggle = null;
    let isWeighted = false;
    if (config.hasWeighted) {
      const toggleRow = document.createElement('div');
      toggleRow.className = 'toggle-container';
      toggleRow.innerHTML = `
        <span class="toggle-label">Weighted</span>
        <label class="toggle-switch">
          <input type="checkbox" id="weighted-toggle">
          <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label" id="weighted-status" style="color:var(--text-muted);">Bodyweight only</span>
      `;
      formCard.appendChild(toggleRow);
      weightedToggle = toggleRow.querySelector('#weighted-toggle');
    }

    // Sets container
    const setsSection = document.createElement('div');
    setsSection.className = 'sets-container';
    setsSection.innerHTML = `<div class="sets-title">Sets</div>`;
    const setsListEl = document.createElement('div');
    setsListEl.id = 'sets-list';
    setsSection.appendChild(setsListEl);

    // Add set button
    const addSetBtn = document.createElement('button');
    addSetBtn.className = 'btn btn-secondary btn-sm';
    addSetBtn.style.marginTop = '8px';
    addSetBtn.innerHTML = '+ Add Set';
    setsSection.appendChild(addSetBtn);

    formCard.appendChild(setsSection);

    // Plate calculator (for barbell exercises)
    let plateCalcController = null;
    let plateCalcContainer = null;
    if (config.type === 'barbell') {
      plateCalcContainer = document.createElement('div');
      plateCalcContainer.id = 'plate-calc-container';
      formCard.appendChild(plateCalcContainer);
    }

    // Save button
    const saveRow = document.createElement('div');
    saveRow.style.marginTop = '20px';
    saveRow.style.display = 'flex';
    saveRow.style.gap = '12px';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary btn-lg';
    saveBtn.style.flex = '1';
    saveBtn.innerHTML = '💾 Save Workout';
    saveRow.appendChild(saveBtn);
    formCard.appendChild(saveRow);

    container.appendChild(formCard);

    // ---- History Section ----
    const historySection = _renderHistory(config, history);
    container.appendChild(historySection);

    // ======== INTERACTIVITY ========

    // Track sets
    let sets = [{ reps: '', weight: '' }];

    function renderSets() {
      setsListEl.innerHTML = '';
      sets.forEach((set, i) => {
        const row = document.createElement('div');
        row.className = 'set-row';

        let weightField = '';
        const showWeight = config.type === 'barbell' ||
          (config.hasWeighted && weightedToggle && weightedToggle.checked);

        row.innerHTML = `
          <span class="set-number">Set ${i + 1}</span>
          <div style="display:flex;align-items:center;gap:6px;flex:1;">
            <input type="number" class="form-input set-reps" placeholder="Reps" 
              min="0" value="${set.reps}" data-index="${i}">
            ${showWeight ? `
              <span style="color:var(--text-muted);font-size:12px;">×</span>
              <input type="number" class="form-input set-weight" placeholder="${config.type === 'barbell' ? 'kg' : '+kg'}" 
                min="0" step="0.25" value="${set.weight}" data-index="${i}">
              <span style="color:var(--text-muted);font-size:12px;">kg</span>
            ` : ''}
          </div>
          ${sets.length > 1 ? `<button class="set-remove-btn" data-index="${i}" title="Remove set">✕</button>` : ''}
        `;

        // Event listeners
        row.querySelectorAll('.set-reps').forEach(inp => {
          inp.addEventListener('input', (e) => {
            sets[e.target.dataset.index].reps = e.target.value;
          });
        });
        row.querySelectorAll('.set-weight').forEach(inp => {
          inp.addEventListener('input', (e) => {
            sets[e.target.dataset.index].weight = e.target.value;
          });
        });
        row.querySelectorAll('.set-remove-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            sets.splice(parseInt(e.target.dataset.index), 1);
            renderSets();
          });
        });

        setsListEl.appendChild(row);
      });
    }

    addSetBtn.addEventListener('click', () => {
      // Copy weight from last set for convenience
      const lastWeight = sets.length > 0 ? sets[sets.length - 1].weight : '';
      sets.push({ reps: '', weight: lastWeight });
      renderSets();
    });

    // Weighted toggle handler
    if (weightedToggle) {
      weightedToggle.addEventListener('change', () => {
        const status = formCard.querySelector('#weighted-status');
        if (weightedToggle.checked) {
          status.textContent = 'Added weight';
          status.style.color = 'var(--accent-primary)';
        } else {
          status.textContent = 'Bodyweight only';
          status.style.color = 'var(--text-muted)';
        }
        renderSets();
      });
    }

    // Plate calculator init
    if (config.type === 'barbell' && plateCalcContainer) {
      plateCalcController = FitnessApp.PlateCalc.render(
        plateCalcContainer,
        config.id,
        (totalWeight) => {
          // Sync plate calc weight to all set weight inputs
          const weightInputs = setsListEl.querySelectorAll('.set-weight');
          weightInputs.forEach((inp, i) => {
            sets[i].weight = totalWeight;
            inp.value = totalWeight;
          });
        }
      );
    }

    // Save handler
    saveBtn.addEventListener('click', () => {
      const date = dateInput.value;
      if (!date) {
        FitnessApp.showToast('Please select a date', 'error');
        return;
      }

      const validSets = sets.filter(s => s.reps && parseInt(s.reps) > 0);
      if (validSets.length === 0) {
        FitnessApp.showToast('Add at least one set with reps', 'error');
        return;
      }

      const entryIsWeighted = weightedToggle ? weightedToggle.checked : false;
      const processedSets = validSets.map(s => ({
        reps: parseInt(s.reps),
        weight: parseFloat(s.weight) || 0,
      }));

      // Calculate best estimated 1RM for this session
      let best1RM = 0;
      let bestLevel = null;

      if (config.type === 'barbell') {
        processedSets.forEach(s => {
          const e1rm = FitnessApp.Standards.estimate1RM(s.weight, s.reps);
          if (e1rm > best1RM) best1RM = e1rm;
        });
        bestLevel = FitnessApp.Standards.getBarbellLevel(
          config.id, processedSets[0].weight, processedSets[0].reps,
          settings.bodyweight, settings.gender
        );
      } else if (entryIsWeighted) {
        const maxAddedWeight = Math.max(...processedSets.map(s => s.weight));
        bestLevel = FitnessApp.Standards.getWeightedBWLevel(
          config.id, maxAddedWeight, settings.bodyweight, settings.gender
        );
      } else {
        const maxReps = Math.max(...processedSets.map(s => s.reps));
        bestLevel = FitnessApp.Standards.getBodyweightLevel(
          config.id, maxReps, settings.bodyweight, settings.gender
        );
      }

      const entry = {
        date,
        sets: processedSets,
        weighted: entryIsWeighted,
        level: bestLevel ? bestLevel.level : 'beginner',
        e1rm: best1RM,
        timestamp: Date.now(),
      };

      // Check for PR
      const prevHistory = FitnessApp.Storage.getHistory(config.id);
      let isPR = false;
      if (config.type === 'barbell' && best1RM > 0) {
        const prevBest = Math.max(0, ...prevHistory.map(h => h.e1rm || 0));
        if (best1RM > prevBest && prevHistory.length > 0) isPR = true;
      }

      FitnessApp.Storage.addWorkout(config.id, entry);

      if (isPR) {
        FitnessApp.showToast('🎉 New Personal Record!', 'success');
      } else {
        FitnessApp.showToast('Workout saved!', 'success');
      }

      // Reset form
      sets = [{ reps: '', weight: '' }];
      renderSets();
      if (plateCalcController) plateCalcController.reset();
      dateInput.value = FitnessApp.Storage.todayStr();

      // Re-render page to update history & strength
      render(container, config);
    });

    // Initial render
    renderSets();
  }

  // ---- Strength Indicator ----
  function _renderStrengthIndicator(config, settings, history) {
    const section = document.createElement('div');
    section.className = 'card';
    section.style.marginBottom = '24px';

    // Determine current level from latest workout
    let currentLevel = { level: 'beginner', percent: 0, label: 'Beginner', color: '#64748b' };
    const latest = history.length > 0 ? history[0] : null;

    if (latest) {
      if (config.type === 'barbell' && latest.sets.length > 0) {
        const bestSet = latest.sets.reduce((best, s) => {
          const e = FitnessApp.Standards.estimate1RM(s.weight, s.reps);
          return e > (best.e1rm || 0) ? { ...s, e1rm: e } : best;
        }, { e1rm: 0 });
        currentLevel = FitnessApp.Standards.getBarbellLevel(
          config.id, bestSet.weight, bestSet.reps, settings.bodyweight, settings.gender
        );
      } else if (latest.weighted && latest.sets.length > 0) {
        const maxWeight = Math.max(...latest.sets.map(s => s.weight));
        currentLevel = FitnessApp.Standards.getWeightedBWLevel(
          config.id, maxWeight, settings.bodyweight, settings.gender
        );
      } else if (latest.sets.length > 0) {
        const maxReps = Math.max(...latest.sets.map(s => s.reps));
        currentLevel = FitnessApp.Standards.getBodyweightLevel(
          config.id, maxReps, settings.bodyweight, settings.gender
        );
      }
    }

    // Get thresholds for display
    const isWeightedLatest = latest && latest.weighted;
    const thresholds = FitnessApp.Standards.getThresholds(
      config.id, config.type, settings.bodyweight, settings.gender, isWeightedLatest
    );

    section.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">Strength Level</h3>
        <span class="strength-current-value ${currentLevel.level}">${currentLevel.label}</span>
      </div>
      <div class="strength-indicator">
        <div class="strength-bar-container">
          <div class="strength-bar-fill ${currentLevel.level}" style="width: ${currentLevel.percent}%">
            <div class="strength-bar-marker"></div>
          </div>
        </div>
        <div class="strength-labels">
          ${FitnessApp.Standards.LEVELS.map((l, i) => `
            <span style="color:${FitnessApp.Standards.LEVEL_COLORS[l]}">${FitnessApp.Standards.LEVEL_LABELS[l]}${thresholds ? '<br>' + thresholds[i] : ''}</span>
          `).join('')}
        </div>
      </div>
      ${currentLevel.e1rm ? `<div style="margin-top:8px;font-size:13px;color:var(--text-secondary);">Estimated 1RM: <strong style="color:var(--text-heading)">${currentLevel.e1rm}kg</strong></div>` : ''}
      <div style="margin-top:4px;font-size:12px;color:var(--text-muted);">
        Weight class: ${FitnessApp.Standards.getWeightClassLabel(settings.bodyweight)} • ${settings.gender === 'male' ? '♂ Male' : '♀ Female'} standards
      </div>
    `;

    // Mini progress chart
    if (history.length > 1) {
      const chart = _renderMiniChart(config, history);
      section.appendChild(chart);
    }

    return section;
  }

  // ---- Mini Chart ----
  function _renderMiniChart(config, history) {
    const chartContainer = document.createElement('div');
    chartContainer.style.marginTop = '16px';
    chartContainer.innerHTML = `<div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;">PROGRESS (last 20 sessions)</div>`;

    const chart = document.createElement('div');
    chart.className = 'mini-chart';

    const recent = history.slice(0, 20).reverse(); // oldest to newest
    let values = [];

    if (config.type === 'barbell') {
      values = recent.map(e => e.e1rm || Math.max(...e.sets.map(s => s.weight)));
    } else {
      values = recent.map(e => {
        if (e.weighted) return Math.max(...e.sets.map(s => s.weight));
        return Math.max(...e.sets.map(s => s.reps));
      });
    }

    const maxVal = Math.max(...values, 1);

    values.forEach((val, i) => {
      const bar = document.createElement('div');
      bar.className = 'mini-chart-bar';
      const h = Math.max(4, (val / maxVal) * 70);
      bar.style.height = h + 'px';
      bar.setAttribute('data-tooltip', `${recent[i].date}: ${val}${config.type === 'barbell' ? 'kg' : (recent[i].weighted ? 'kg' : ' reps')}`);
      chart.appendChild(bar);
    });

    chartContainer.appendChild(chart);
    return chartContainer;
  }

  // ---- History ----
  function _renderHistory(config, history) {
    const section = document.createElement('div');
    section.className = 'history-section';

    if (history.length === 0) {
      section.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">No workouts logged yet. Start your first set!</div>
        </div>
      `;
      return section;
    }

    section.innerHTML = `<div class="history-title">📋 Workout History</div>`;

    // Group by date
    const grouped = {};
    history.forEach((entry, idx) => {
      if (!grouped[entry.date]) grouped[entry.date] = [];
      grouped[entry.date].push({ ...entry, _index: idx });
    });

    Object.keys(grouped).forEach(date => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'history-day';

      const dateLabel = _formatDate(date);
      dayDiv.innerHTML = `<div class="history-date">${dateLabel}</div>`;

      grouped[date].forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'history-entry';

        const setsText = entry.sets.map((s, i) => {
          if (s.weight > 0) {
            return `<strong>${s.reps}</strong>×${s.weight}kg`;
          }
          return `<strong>${s.reps}</strong> reps`;
        }).join(', ');

        const levelBadge = entry.level ?
          `<span class="history-level-badge strength-current-value ${entry.level}">${FitnessApp.Standards.LEVEL_LABELS[entry.level] || entry.level}</span>` : '';

        entryDiv.innerHTML = `
          <div class="history-sets-summary">${setsText}</div>
          ${entry.e1rm ? `<div class="history-1rm">Est. 1RM: ${entry.e1rm}kg</div>` : ''}
          ${levelBadge}
          <button class="history-delete-btn" data-idx="${entry._index}" title="Delete entry">🗑</button>
        `;

        entryDiv.querySelector('.history-delete-btn').addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          FitnessApp.Storage.deleteWorkout(config.id, idx);
          // Fully re-render page so statistics and history update everywhere
          if (window.FitnessApp.navigate) {
            window.FitnessApp.navigate(config.id);
          } else {
            const mainContent = document.getElementById('app-content');
            if (mainContent) render(mainContent, config);
          }
        });

        dayDiv.appendChild(entryDiv);
      });

      section.appendChild(dayDiv);
    });

    return section;
  }

  // ---- Helpers ----
  function _difficultyLabel(diff) {
    const stars = { beginner: '★', intermediate: '★★', advanced: '★★★' };
    return `${stars[diff] || '★'} ${diff.charAt(0).toUpperCase() + diff.slice(1)}`;
  }

  function _formatDate(dateStr) {
    const today = FitnessApp.Storage.todayStr();
    if (dateStr === today) return 'Today';

    const d = new Date(dateStr + 'T00:00:00');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.getFullYear() + '-' +
      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
      String(yesterday.getDate()).padStart(2, '0');
    if (dateStr === yStr) return 'Yesterday';

    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  return { render };
})();
