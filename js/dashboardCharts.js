/* ==========================================================
   Dashboard Charts Module
   Renders Chart.js interactive graphs inside the Dashboard
   ========================================================== */
window.FitnessApp = window.FitnessApp || {};

FitnessApp.DashboardCharts = (() => {
  let chartInstance = null;
  let currentMetric = 'volume'; // 'volume' or 'weight'

  // Standard CSS Variable Extractor for Charts
  function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function render(container) {
    container.innerHTML = '';
    container.className = 'card';
    container.style.marginBottom = '24px';
    container.style.position = 'relative';

    const header = document.createElement('div');
    header.className = 'card-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Progress Insights';
    
    // Toggle controls
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.background = 'rgba(0,0,0,0.3)';
    controls.style.padding = '4px';
    controls.style.borderRadius = 'var(--radius-md)';

    const btnVolume = document.createElement('button');
    btnVolume.textContent = 'Work Volume';
    btnVolume.className = 'btn btn-sm ' + (currentMetric === 'volume' ? 'btn-primary' : 'btn-secondary');
    btnVolume.style.minWidth = '100px';

    const btnWeight = document.createElement('button');
    btnWeight.textContent = 'Body Weight';
    btnWeight.className = 'btn btn-sm ' + (currentMetric === 'weight' ? 'btn-primary' : 'btn-secondary');
    btnWeight.style.minWidth = '100px';

    controls.appendChild(btnVolume);
    controls.appendChild(btnWeight);
    
    header.appendChild(title);
    header.appendChild(controls);
    container.appendChild(header);

    // Canvas container
    const chartWrapper = document.createElement('div');
    chartWrapper.style.position = 'relative';
    chartWrapper.style.height = '250px';
    chartWrapper.style.width = '100%';
    chartWrapper.style.marginTop = '16px';

    const canvas = document.createElement('canvas');
    chartWrapper.appendChild(canvas);
    container.appendChild(chartWrapper);

    // Event listeners
    btnVolume.addEventListener('click', () => {
      currentMetric = 'volume';
      btnVolume.className = 'btn btn-sm btn-primary';
      btnWeight.className = 'btn btn-sm btn-secondary';
      drawChart(canvas);
    });

    btnWeight.addEventListener('click', () => {
      currentMetric = 'weight';
      btnWeight.className = 'btn btn-sm btn-primary';
      btnVolume.className = 'btn btn-sm btn-secondary';
      drawChart(canvas);
    });

    // Wait until attached to DOM before drawing to ensure CSS variables are accessible
    setTimeout(() => drawChart(canvas), 0);
  }

  function drawChart(canvas) {
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Theme Colors derived from CSS Custom Properties
    const textColor = getCssVar('--text-muted') || '#94a3b8';
    const gridColor = getCssVar('--border-subtle') || 'rgba(255,255,255,0.05)';
    const primaryColor = getCssVar('--accent-primary') || '#7c3aed';
    const accentSecondary = getCssVar('--accent-secondary') || '#d946ef';

    // Build data based on currentMetric
    let labels = [];
    let dataPoints = [];
    let datasetLabel = '';
    let isLine = true;

    if (currentMetric === 'weight') {
      const wHistory = FitnessApp.Storage.getWeightHistory();
      // Reverse to chronological
      const chronological = [...wHistory].reverse();
      
      // If we don't have enough data points, we might just show an empty graph
      if (chronological.length > 0) {
        labels = chronological.map(entry => entry.date.substring(5)); // Show MM-DD
        dataPoints = chronological.map(entry => entry.weight);
      }
      datasetLabel = 'Body Weight (kg)';

    } else if (currentMetric === 'volume') {
      isLine = false; // Bar chart looks better for volume
      
      // Calculate last 14 active workout dates
      // Or simply gather the total reps per day recorded
      const datesSet = FitnessApp.Storage.getWorkoutDates();
      const allDates = Array.from(datesSet).sort();
      const chronological = allDates.slice(-14); // last 14 active days
      
      labels = chronological.map(d => d.substring(5));
      
      // Compute total reps for each date
      const exercises = ['pullups', 'pushups', 'squats', 'benchpress', 'dips', 'curls'];
      chronological.forEach(date => {
        let dailyReps = 0;
        exercises.forEach(ex => {
          const history = FitnessApp.Storage.getHistory(ex);
          const dayWorkouts = history.filter(w => w.date === date);
          dayWorkouts.forEach(workout => {
            workout.sets.forEach(s => dailyReps += (s.reps || 0));
          });
        });
        dataPoints.push(dailyReps);
      });

      datasetLabel = 'Total Reps';
    }

    // Default graph if empty
    if (labels.length === 0) {
      labels = ['No Data Yet'];
      dataPoints = [0];
    }

    // Gradient background for Line Chart
    let bgGradient = 'rgba(124, 58, 237, 0.4)';
    if (isLine) {
       bgGradient = ctx.createLinearGradient(0, 0, 0, 250);
       bgGradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)'); // primary with opacity
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
          borderWidth: 2,
          pointBackgroundColor: accentSecondary,
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: isLine,
          borderRadius: isLine ? 0 : 4,
          tension: 0.3 // smooth curves
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // We use our own toggles
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return currentMetric === 'weight' ? 
                  context.parsed.y + ' kg' : 
                  context.parsed.y + ' reps';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: textColor,
              font: {
                family: "'Inter', sans-serif",
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: gridColor,
              drawBorder: false,
              borderDash: [5, 5]
            },
            ticks: {
              color: textColor,
              font: {
                family: "'Inter', sans-serif",
                size: 11
              },
              padding: 10
            },
            beginAtZero: currentMetric === 'volume'
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      }
    };

    chartInstance = new Chart(ctx, config);
  }

  return { render };
})();
