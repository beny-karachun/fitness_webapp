/* Daily Unified Log Module */
window.FitnessApp = window.FitnessApp || {};

FitnessApp.DailyLog = (() => {
  function render(container) {
    const settings = FitnessApp.Storage.getSettings();
    container.innerHTML = '';
    container.className = 'main-content exercise-page';

    // Header
    const header = document.createElement('div');
    header.className = 'exercise-header';
    header.innerHTML = `<div class="exercise-icon-large">📝</div><div class="exercise-header-text"><h1>Log Daily Workout</h1><div class="exercise-header-meta"><span class="exercise-muscles">Log your weight and multiple exercises at once</span></div></div>`;
    container.appendChild(header);

    // Form Wrapper for Date and Weight
    const formCard = document.createElement('div');
    formCard.className = 'card';
    formCard.style.marginBottom = '24px';

    const formTitle = document.createElement('div');
    formTitle.className = 'card-header';
    formTitle.innerHTML = `<h3 class="card-title">Daily Details</h3>`;
    formCard.appendChild(formTitle);

    // Daily Global Properties
    const globalsRow = document.createElement('div');
    globalsRow.className = 'form-row';
    globalsRow.style.gap = '20px';

    globalsRow.innerHTML = `<div class="form-group" style="flex:1;"><label class="form-label">Date</label><input type="date" class="form-input" id="daily-date" value="${FitnessApp.Storage.todayStr()}"></div><div class="form-group" style="flex:1;"><label class="form-label">Body Weight (kg)</label><input type="number" class="form-input" id="daily-weight" value="${settings.bodyweight}" step="0.5" min="30"></div>`;
    formCard.appendChild(globalsRow);

    container.appendChild(formCard);

    const exercisesContainer = document.createElement('div');
    exercisesContainer.id = 'daily-exercises-container';
    exercisesContainer.style.display = 'flex';
    exercisesContainer.style.flexDirection = 'column';
    exercisesContainer.style.gap = '24px';
    container.appendChild(exercisesContainer);

    // Add buttons
    const addActions = document.createElement('div');
    addActions.style.marginTop = '20px';
    addActions.innerHTML = `<button class="btn btn-secondary btn-sm" id="btn-add-exercise" style="width:100%; border: 1px dashed var(--border-subtle); padding: 14px;">+ Add Another Exercise</button>`;
    container.appendChild(addActions);

    const hr = document.createElement('hr');
    hr.style.borderTop = '1px solid var(--border-subtle)';
    hr.style.borderBottom = 'none';
    hr.style.margin = '24px 0';
    container.appendChild(hr);

    const saveRow = document.createElement('div');
    saveRow.innerHTML = `<button class="btn btn-primary btn-lg" style="width:100%;">💾 Save Daily Log</button>`;
    container.appendChild(saveRow);

    // State
    const EXERCISES = ['pullups', 'pushups', 'squats', 'benchpress', 'dips', 'curls'];
    let records = [];

    // Componentized renderer for each exercise entry
    function createExerciseCard(existingRecord = null) {
      const record = existingRecord || {
        exerciseId: 'pullups', // Default first item
        sets: [{reps: '', weight: ''}],
        isWeighted: false,
        calcController: null
      };
      if (!existingRecord) records.push(record);

      const recordCard = document.createElement('div');
      recordCard.className = 'card';
      recordCard.style.position = 'relative';

      let config = FitnessApp.Modules[record.exerciseId];

      const recHeader = document.createElement('div');
      recHeader.className = 'card-header';
      recHeader.style.display = 'flex';
      recHeader.style.justifyContent = 'space-between';
      recHeader.style.alignItems = 'center';
      recHeader.style.marginBottom = '20px';

      const sel = document.createElement('select');
      sel.className = 'form-input';
      sel.style.width = '200px';
      sel.style.fontWeight = 'bold';
      sel.style.color = 'var(--text-heading)';
      sel.style.background = 'var(--bg-input)';
      sel.style.padding = '8px 12px';

      function populateSelect() {
        sel.innerHTML = '';
        EXERCISES.forEach(id => {
          const mod = FitnessApp.Modules[id];
          const opt = document.createElement('option');
          opt.value = id;
          opt.textContent = mod.icon + ' ' + mod.name;
          if (id === record.exerciseId) opt.selected = true;
          sel.appendChild(opt);
        });
      }
      populateSelect();

      sel.addEventListener('change', (e) => {
        record.exerciseId = e.target.value;
        record.sets = [{reps: '', weight: ''}];
        record.isWeighted = false;
        config = FitnessApp.Modules[record.exerciseId];
        renderCardContent();
      });

      const remBtn = document.createElement('button');
      remBtn.className = 'btn btn-danger btn-sm';
      remBtn.innerHTML = '✕ Remove';
      remBtn.addEventListener('click', () => {
        const idx = records.indexOf(record);
        if (idx !== -1) records.splice(idx, 1);
        recordCard.remove();
        if (records.length === 0) showEmptyState();
      });

      recHeader.appendChild(sel);
      recHeader.appendChild(remBtn);
      recordCard.appendChild(recHeader);

      const cardBody = document.createElement('div');
      recordCard.appendChild(cardBody);
      exercisesContainer.appendChild(recordCard);

      hideEmptyState();

      // Card inner content updates when exercise changes
      function renderCardContent() {
        cardBody.innerHTML = '';

        // Weighted toggle
        if (config.hasWeighted) {
          const tRow = document.createElement('div');
          tRow.className = 'toggle-container';
          tRow.innerHTML = '<span class="toggle-label">Weighted</span><label class="toggle-switch"><input type="checkbox" class="rec-weighted-toggle" ' + (record.isWeighted ? 'checked' : '') + '><span class="toggle-slider"></span></label><span class="toggle-label rec-weighted-status" style="color:' + (record.isWeighted ? 'var(--accent-primary)' : 'var(--text-muted)') + ';">' + (record.isWeighted ? 'Added weight' : 'Bodyweight only') + '</span>';
          
          const chk = tRow.querySelector('input');
          const statusText = tRow.querySelector('.rec-weighted-status');
          chk.addEventListener('change', () => {
            record.isWeighted = chk.checked;
            statusText.textContent = record.isWeighted ? 'Added weight' : 'Bodyweight only';
            statusText.style.color = record.isWeighted ? 'var(--accent-primary)' : 'var(--text-muted)';
            renderSets();
          });
          cardBody.appendChild(tRow);
        }

        const setsSection = document.createElement('div');
        setsSection.className = 'sets-container';
        setsSection.innerHTML = `<div class="sets-title">Sets</div>`;
        const setsListEl = document.createElement('div');
        setsSection.appendChild(setsListEl);

        function renderSets() {
          setsListEl.innerHTML = '';
          record.sets.forEach((set, setIdx) => {
            const setRow = document.createElement('div');
            setRow.className = 'set-row';
            
            const showWeight = config.type === 'barbell' || (config.hasWeighted && record.isWeighted);

            let innerHTML = '<span class="set-number">Set ' + (setIdx + 1) + '</span><div style="display:flex;align-items:center;gap:6px;flex:1;"><input type="number" class="form-input set-reps" placeholder="Reps" min="0" value="' + set.reps + '">';
            if (showWeight) {
               innerHTML += '<span style="color:var(--text-muted);font-size:12px;">×</span><input type="number" class="form-input set-weight" placeholder="' + (config.type === 'barbell' ? 'kg' : '+kg') + '" min="0" step="0.25" value="' + set.weight + '"><span style="color:var(--text-muted);font-size:12px;">kg</span>';
            }
            innerHTML += '</div>';
            
            if (record.sets.length > 1) {
               innerHTML += '<button class="set-remove-btn" title="Remove set">✕</button>';
            }
            
            setRow.innerHTML = innerHTML;

            const rInp = setRow.querySelector('.set-reps');
            rInp.addEventListener('input', e => record.sets[setIdx].reps = e.target.value);

            if (showWeight) {
              const wInp = setRow.querySelector('.set-weight');
              wInp.addEventListener('input', e => record.sets[setIdx].weight = e.target.value);
            }

            if (record.sets.length > 1) {
               setRow.querySelector('.set-remove-btn').addEventListener('click', () => {
                 record.sets.splice(setIdx, 1);
                 renderSets();
               });
            }

            setsListEl.appendChild(setRow);
          });
        }

        renderSets();

        const addSetBtn = document.createElement('button');
        addSetBtn.className = 'btn btn-secondary btn-sm';
        addSetBtn.style.marginTop = '8px';
        addSetBtn.innerHTML = '+ Add Set';
        addSetBtn.addEventListener('click', () => {
          const lastW = record.sets.length > 0 ? record.sets[record.sets.length - 1].weight : '';
          record.sets.push({reps: '', weight: lastW});
          renderSets(); // Only re-render sets for THIS card
        });

        setsSection.appendChild(addSetBtn);
        cardBody.appendChild(setsSection);

        // Plate Calc
        if (config.type === 'barbell') {
          const pcContainer = document.createElement('div');
          cardBody.appendChild(pcContainer);
          
          let initialTot = config.barWeight || 20;
          if (record.sets.length > 0 && record.sets[0].weight) {
            initialTot = parseFloat(record.sets[0].weight);
          }

          let skipFirstNotify = true;
          record.calcController = FitnessApp.PlateCalc.render(pcContainer, config.id, (tot) => {
             if (skipFirstNotify) {
               skipFirstNotify = false;
               return; // Prevent wiping diverse loaded set weights
             }
             // Push weight to all sets in memory on manual plate clicks
             record.sets.forEach((s) => { s.weight = tot; });
             // Dynamically update existing inputs so we don't lose focus or re-render
             const weightInputs = setsListEl.querySelectorAll('.set-weight');
             weightInputs.forEach(inp => inp.value = tot);
          }, initialTot);
        }
      }

      renderCardContent();
    }

    function showEmptyState() {
      if (exercisesContainer.querySelector('.empty-state-msg')) return;
      exercisesContainer.innerHTML = '';
      const empty = document.createElement('div');
      empty.className = 'empty-state-msg';
      empty.style.color = 'var(--text-muted)';
      empty.style.fontSize = '14px';
      empty.style.fontStyle = 'italic';
      empty.textContent = 'No exercises added yet. Click "+ Add Another Exercise" to start logging.';
      exercisesContainer.appendChild(empty);
    }

    function hideEmptyState() {
      const empty = exercisesContainer.querySelector('.empty-state-msg');
      if (empty) empty.remove();
    }

    function loadDateData(dateStr) {
      records = [];
      exercisesContainer.innerHTML = '';
      
      let loadedCount = 0;
      EXERCISES.forEach(ex => {
         const todayLogs = FitnessApp.Storage.getHistory(ex).filter(h => h.date === dateStr);
         // For each log entry of this exercise on this day
         todayLogs.forEach(entry => {
            const newRec = {
               exerciseId: ex,
               sets: entry.sets.map(s => ({ reps: s.reps||'', weight: s.weight||'' })),
               isWeighted: !!entry.weighted,
               calcController: null
            };
            records.push(newRec);
            createExerciseCard(newRec);
            loadedCount++;
         });
      });

      // Load specific weight for date
      const wHist = FitnessApp.Storage.getWeightHistory();
      const weightEntry = wHist.find(w => w.date === dateStr);
      if (weightEntry) {
         document.getElementById('daily-weight').value = weightEntry.weight;
      } else {
         document.getElementById('daily-weight').value = settings.bodyweight;
      }

      if (loadedCount === 0) {
        showEmptyState();
      }
    }

    // Initialize logic
    addActions.querySelector('#btn-add-exercise').addEventListener('click', () => createExerciseCard(null));

    const dateInput = document.getElementById('daily-date');
    dateInput.addEventListener('change', (e) => {
       loadDateData(e.target.value);
    });

    saveRow.querySelector('button').addEventListener('click', () => {
      const date = document.getElementById('daily-date').value;
      const weight = document.getElementById('daily-weight').value;

      if (!date || !weight) {
        FitnessApp.showToast('Please provide a date and body weight', 'error');
        return;
      }

      // Filter and validate records
      const parsedRecords = [];
      for (const rec of records) {
        const validSets = rec.sets.filter(s => s.reps && parseInt(s.reps) > 0);
        if (validSets.length > 0) {
          parsedRecords.push({
             config: FitnessApp.Modules[rec.exerciseId],
             sets: validSets.map(s => ({ reps: parseInt(s.reps), weight: parseFloat(s.weight) || 0 })),
             isWeighted: rec.isWeighted
          });
        }
      }

      // 1. Save body weight
      FitnessApp.Storage.addWeight(date, weight);

      // WIPE existing data for this date off the history to support safe Overwriting.
      EXERCISES.forEach(ex => {
        const hist = FitnessApp.Storage.getHistory(ex);
        // Loop backwards to splice safely
        for (let i = hist.length - 1; i >= 0; i--) {
          if (hist[i].date === date) {
            FitnessApp.Storage.deleteWorkout(ex, i);
          }
        }
      });

      // 2. Save NEW exercises array
      parsedRecords.forEach(rec => {
        let best1RM = 0;
        let bestLevel = null;

        if (rec.config.type === 'barbell') {
          rec.sets.forEach(s => {
            const e1rm = FitnessApp.Standards.estimate1RM(s.weight, s.reps);
            if (e1rm > best1RM) best1RM = e1rm;
          });
          bestLevel = FitnessApp.Standards.getBarbellLevel(
            rec.config.id, rec.sets[0].weight, rec.sets[0].reps, weight, settings.gender
          );
        } else if (rec.isWeighted) {
          const maxW = Math.max(...rec.sets.map(s => s.weight));
          bestLevel = FitnessApp.Standards.getWeightedBWLevel(rec.config.id, maxW, weight, settings.gender);
        } else {
          const maxR = Math.max(...rec.sets.map(s => s.reps));
          bestLevel = FitnessApp.Standards.getBodyweightLevel(rec.config.id, maxR, weight, settings.gender);
        }

        const entry = {
          date,
          sets: rec.sets,
          weighted: rec.isWeighted,
          level: bestLevel ? bestLevel.level : 'beginner',
          e1rm: best1RM,
          timestamp: Date.now()
        };
        FitnessApp.Storage.addWorkout(rec.config.id, entry);
      });

      FitnessApp.showToast('🎉 Daily Log Saved!', 'success');
      
      // Update sidebar states / stats just in case! 
      if (window.FitnessApp.navigate) {
         window.FitnessApp.navigate('daily-log');
      }
    });

    // Load initial data
    loadDateData(FitnessApp.Storage.todayStr());
  }

  return { render };
})();
