/* Progress Graphs Module */
window.FitnessApp = window.FitnessApp || {};

FitnessApp.Graphs = (() => {
  let chartInstance = null;
  const EXERCISES = ['pullups', 'pushups', 'squats', 'benchpress', 'dips', 'curls'];

  // UI State
  let currentMetric = 'bodyweight'; // 'bodyweight', 'volume', or exercise ID like 'benchpress'
  let currentTimeframe = 30; // 7, 30, 90, or 9999 (all time)

  function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function render(container) {
    const settings = FitnessApp.Storage.getSettings();
    container.innerHTML = '';
    container.className = 'main-content exercise-page';

    // Header
    const header = document.createElement('div');
    header.className = 'exercise-header';
    header.innerHTML = `
      <div class="exercise-icon-large">📉</div>
      <div class="exercise-header-text">
        <h1>Progress Graphs</h1>
        <div class="exercise-header-meta">
          <span class="exercise-muscles">Visualize your fitness data over time</span>
        </div>
      </div>
    `;
    container.appendChild(header);

    // Controls Card
    const controlsCard = document.createElement('div');
    controlsCard.className = 'card';
    controlsCard.style.marginBottom = '24px';
    controlsCard.style.border = '1px solid var(--border-active)';
    controlsCard.style.background = 'rgba(99, 102, 241, 0.03)';
    
    const cwRow = document.createElement('div');
    cwRow.className = 'form-row';
    cwRow.style.gap = '20px';

    const metricGroup = document.createElement('div');
    metricGroup.className = 'form-group';
    metricGroup.style.flex = '1';
    metricGroup.innerHTML = `<label class="form-label">Metric</label>`;
    const metricSelect = document.createElement('select');
    metricSelect.className = 'form-input';
    
    metricSelect.innerHTML = `
      <optgroup label="Global Metrics">
        <option value="bodyweight" ${currentMetric === 'bodyweight' ? 'selected' : ''}>Body Weight</option>
        <option value="volume" ${currentMetric === 'volume' ? 'selected' : ''}>Total Daily Reps</option>
      </optgroup>
      <optgroup label="Exercise Performance">
        ${EXERCISES.map(id => {
          const mod = FitnessApp.Modules[id];
          return `<option value="${id}" ${currentMetric === id ? 'selected' : ''}>${mod.icon} ${mod.name} (E1RM / Best)</option>`;
        }).join('')}
      </optgroup>
    `;
    metricGroup.appendChild(metricSelect);

    const timeGroup = document.createElement('div');
    timeGroup.className = 'form-group';
    timeGroup.style.flex = '1';
    timeGroup.innerHTML = `<label class="form-label">Timeframe</label>`;
    const timeSelect = document.createElement('select');
    timeSelect.className = 'form-input';
    timeSelect.innerHTML = `
      <option value="7" ${currentTimeframe === 7 ? 'selected' : ''}>Last 7 Days</option>
      <option value="30" ${currentTimeframe === 30 ? 'selected' : ''}>Last 30 Days</option>
      <option value="90" ${currentTimeframe === 90 ? 'selected' : ''}>Last 3 Months</option>
      <option value="9999" ${currentTimeframe === 9999 ? 'selected' : ''}>All Time</option>
    `;
    timeGroup.appendChild(timeSelect);

    cwRow.appendChild(metricGroup);
    cwRow.appendChild(timeGroup);
    controlsCard.appendChild(cwRow);
    container.appendChild(controlsCard);

    // Chart Card
    const chartCard = document.createElement('div');
    chartCard.className = 'card';
    chartCard.style.height = '400px';
    chartCard.style.position = 'relative';

    const canvas = document.createElement('canvas');
    chartCard.appendChild(canvas);
    container.appendChild(chartCard);

    // Bind events
    metricSelect.addEventListener('change', (e) => {
      currentMetric = e.target.value;
      drawChart(canvas);
    });
    timeSelect.addEventListener('change', (e) => {
      currentTimeframe = parseInt(e.target.value);
      drawChart(canvas);
    });

    setTimeout(() => drawChart(canvas), 0);
  }

  // Gets array of past N dates in 'YYYY-MM-DD' format up to today
  function generateDateRange(days) {
    const dates = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const str = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      dates.push(str);
    }
    return dates;
  }

  function drawChart(canvas) {
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const textColor = getCssVar('--text-muted') || '#94a3b8';
    const gridColor = getCssVar('--border-subtle') || 'rgba(255,255,255,0.05)';
    const primaryColor = getCssVar('--accent-primary') || '#7c3aed';
    const accentSecondary = getCssVar('--accent-secondary') || '#d946ef';

    // Figure out dates
    let targetDates = [];
    if (currentTimeframe === 9999) {
      targetDates = Array.from(FitnessApp.Storage.getWorkoutDates()).sort();
      const weightHistory = FitnessApp.Storage.getWeightHistory();
      weightHistory.forEach(w => {
         if (!targetDates.includes(w.date)) targetDates.push(w.date);
      });
      targetDates.sort();
      if (targetDates.length === 0) targetDates = [FitnessApp.Storage.todayStr()];
    } else {
      targetDates = generateDateRange(currentTimeframe);
    }

    let labels = targetDates.map(d => d.substring(5)); // Just MM-DD
    let dataPoints = [];
    let datasetLabel = '';
    let isLine = true;
    let yAxisSuffix = '';

    if (currentMetric === 'bodyweight') {
      const wHist = [...FitnessApp.Storage.getWeightHistory()].sort((a,b) => a.date.localeCompare(b.date));
      datasetLabel = 'Body Weight';
      yAxisSuffix = ' kg';

      // To fill data points continuously without breaking the line
      let lastKnownWeight = wHist.length > 0 ? wHist[0].weight : 80;
      dataPoints = targetDates.map(date => {
        const found = wHist.find(w => w.date === date);
        if (found) lastKnownWeight = found.weight;
        return lastKnownWeight;
      });

    } else if (currentMetric === 'volume') {
      isLine = false;
      datasetLabel = 'Total Volume (Reps)';
      yAxisSuffix = '';

      dataPoints = targetDates.map(date => {
        let dailyReps = 0;
        EXERCISES.forEach(ex => {
          const dayWorkouts = FitnessApp.Storage.getHistory(ex).filter(w => w.date === date);
          dayWorkouts.forEach(workout => {
            workout.sets.forEach(s => dailyReps += (parseInt(s.reps) || 0));
          });
        });
        return dailyReps;
      });

    } else {
      // Specific exercise progress
      const exId = currentMetric;
      const config = FitnessApp.Modules[exId];
      datasetLabel = config.name + ' Progression';
      yAxisSuffix = config.type === 'barbell' || config.hasWeighted ? ' kg' : ' reps';

      const expHist = [...FitnessApp.Storage.getHistory(exId)].sort((a,b) => a.date.localeCompare(b.date));

      let lastKnownScore = 0;
      dataPoints = targetDates.map(date => {
        const foundLogs = expHist.filter(h => h.date === date);
        if (foundLogs.length > 0) {
           let bestScore = 0;
           foundLogs.forEach(entry => {
              if (config.type === 'barbell') {
                 // best e1rm
                 entry.sets.forEach(s => {
                    const e1rm = FitnessApp.Standards.estimate1RM(s.weight, s.reps);
                    if (e1rm > bestScore) bestScore = e1rm;
                 });
              } else if (entry.weighted) {
                 entry.sets.forEach(s => {
                    if (s.weight > bestScore) bestScore = s.weight;
                 });
              } else {
                 entry.sets.forEach(s => {
                    if (s.reps > bestScore) bestScore = s.reps;
                 });
              }
           });
           lastKnownScore = bestScore;
        } else if (currentTimeframe === 9999) {
           return null; // Don't carry over blank spans for all-time
        }
        return lastKnownScore === 0 ? null : lastKnownScore;
      });
      // Filter out leading nulls conceptually, but let chart.js handle spanGaps or nulls.
    }

    let bgGradient = 'rgba(124, 58, 237, 0.4)';
    if (isLine) {
       bgGradient = ctx.createLinearGradient(0, 0, 0, 400);
       bgGradient.addColorStop(0, 'rgba(124, 58, 237, 0.6)');
       bgGradient.addColorStop(1, 'rgba(124, 58, 237, 0.0)');
    }

    const config = {
      type: isLine ? 'line' : 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: datasetLabel,
          data: dataPoints,
          borderColor: primaryColor,
          backgroundColor: isLine ? bgGradient : primaryColor,
          borderWidth: 3,
          pointBackgroundColor: accentSecondary,
          pointBorderColor: '#fff',
          pointRadius: isLine ? 4 : 0,
          pointHoverRadius: isLine ? 6 : 0,
          fill: isLine,
          borderRadius: isLine ? 0 : 4,
          tension: 0.3,
          spanGaps: true // connect discrete exercise logs
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                return val ? val + yAxisSuffix : '0' + yAxisSuffix;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { family: "'Inter', sans-serif", size: 11 },
              maxTicksLimit: 14 // don't crowd x axis
            }
          },
          y: {
            grid: { color: gridColor, borderDash: [5, 5] },
            ticks: {
              color: textColor,
              font: { family: "'Inter', sans-serif", size: 11 },
              padding: 10
            },
            beginAtZero: currentMetric === 'volume'
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    };

    chartInstance = new Chart(ctx, config);
  }

  return { render };
})();
