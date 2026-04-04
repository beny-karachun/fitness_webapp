/* ==========================================================
   Plate Calculator Module
   Visual barbell plate loading with Olympic-colored plates
   ========================================================== */
window.FitnessApp = window.FitnessApp || {};

FitnessApp.PlateCalc = (() => {

  // Available plates (per side), ordered heaviest to lightest
  const PLATES = [
    { kg: 25,   cls: 'kg25',   color: '#dc2626', label: '25' },
    { kg: 20,   cls: 'kg20',   color: '#2563eb', label: '20' },
    { kg: 15,   cls: 'kg15',   color: '#eab308', label: '15' },
    { kg: 10,   cls: 'kg10',   color: '#16a34a', label: '10' },
    { kg: 5,    cls: 'kg5',    color: '#e2e8f0', label: '5' },
    { kg: 2.5,  cls: 'kg2_5',  color: '#1e293b', label: '2.5' },
    { kg: 1.25, cls: 'kg1_25', color: '#94a3b8', label: '1.25' },
    { kg: 1,    cls: 'kg1',    color: '#7c3aed', label: '1' },
    { kg: 0.5,  cls: 'kg0_5',  color: '#0ea5e9', label: '0.5' },
    { kg: 0.25, cls: 'kg0_25', color: '#d946ef', label: '0.25' },
  ];

  // Plate dimensions (width in px, height in px) for visual
  const PLATE_DIMS = {
    25:   { w: 18, h: 110 },
    20:   { w: 16, h: 100 },
    15:   { w: 14, h: 88 },
    10:   { w: 13, h: 76 },
    5:    { w: 12, h: 64 },
    2.5:  { w: 10, h: 54 },
    1.25: { w: 8,  h: 44 },
    1:    { w: 7,  h: 38 },
    0.5:  { w: 6,  h: 32 },
    0.25: { w: 5,  h: 26 },
  };

  /**
   * Render a plate calculator into a container
   * @param {HTMLElement} container
   * @param {number} barWeight - Weight of the bar in kg (20 for Olympic, 10 for EZ curl)
   * @param {function} onWeightChange - Callback with total weight
   * @param {number} initialWeight - Optional initial total weight to set
   * @returns {object} Controller with getWeight(), setWeight(), reset()
   */
  function render(container, barWeight, onWeightChange, initialWeight) {
    let platesOnBar = []; // plates on ONE side (mirrored)

    container.innerHTML = '';
    container.className = 'plate-calculator';

    // Title
    const title = document.createElement('div');
    title.className = 'plate-calc-title';
    title.innerHTML = `<span>🏋️</span> Plate Calculator <span style="color:var(--text-muted);font-weight:400;font-size:12px;">(Bar: ${barWeight}kg)</span>`;
    container.appendChild(title);

    // Barbell visual
    const barbellContainer = document.createElement('div');
    barbellContainer.className = 'barbell-visual';
    container.appendChild(barbellContainer);

    // Total display
    const totalDisplay = document.createElement('div');
    totalDisplay.className = 'plate-total';
    container.appendChild(totalDisplay);

    // Plate selector buttons
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'plate-selector';
    PLATES.forEach(plate => {
      const btn = document.createElement('button');
      btn.className = 'plate-btn';
      btn.title = `Add ${plate.label}kg plate to each side`;
      btn.innerHTML = `
        <div class="plate-btn-color" style="background:${plate.color};"></div>
        <span class="plate-btn-label">${plate.label}kg</span>
      `;
      btn.addEventListener('click', () => {
        platesOnBar.push(plate.kg);
        platesOnBar.sort((a, b) => b - a); // keep sorted heavy→light
        _render();
        _notify();
      });
      selectorContainer.appendChild(btn);
    });
    container.appendChild(selectorContainer);

    // Action buttons (clear, undo)
    const actions = document.createElement('div');
    actions.className = 'plate-actions';
    const clearBtn = document.createElement('button');
    clearBtn.className = 'plate-action-btn';
    clearBtn.textContent = 'Clear All';
    clearBtn.addEventListener('click', () => {
      platesOnBar = [];
      _render();
      _notify();
    });
    const undoBtn = document.createElement('button');
    undoBtn.className = 'plate-action-btn';
    undoBtn.textContent = 'Remove Last';
    undoBtn.addEventListener('click', () => {
      platesOnBar.pop();
      _render();
      _notify();
    });
    actions.appendChild(undoBtn);
    actions.appendChild(clearBtn);
    container.appendChild(actions);

    function _getTotal() {
      const sideWeight = platesOnBar.reduce((s, p) => s + p, 0);
      return barWeight + sideWeight * 2;
    }

    function _notify() {
      if (onWeightChange) onWeightChange(_getTotal());
    }

    function _createPlateEl(kg, side) {
      const plate = document.createElement('div');
      const dims = PLATE_DIMS[kg] || { w: 8, h: 40 };
      const plateInfo = PLATES.find(p => p.kg === kg);
      const color = plateInfo ? plateInfo.color : '#666';

      plate.className = 'plate ' + (plateInfo ? plateInfo.cls : '');
      plate.style.width = dims.w + 'px';
      plate.style.height = dims.h + 'px';
      plate.style.background = `linear-gradient(180deg, ${_lighten(color)}, ${color}, ${_darken(color)})`;
      plate.style.boxShadow = `inset 0 0 4px rgba(255,255,255,0.1), 2px 0 8px rgba(0,0,0,0.3)`;
      plate.style.flexShrink = '0';
      plate.style.borderRadius = '3px';
      plate.style.display = 'flex';
      plate.style.alignItems = 'center';
      plate.style.justifyContent = 'center';
      plate.style.cursor = 'pointer';
      plate.style.position = 'relative';

      // Label for larger plates
      if (dims.w >= 10) {
        const label = document.createElement('span');
        label.style.fontSize = '8px';
        label.style.fontWeight = '700';
        label.style.writingMode = 'vertical-rl';
        label.style.textOrientation = 'mixed';
        label.style.color = (kg === 5 || kg === 15) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';
        label.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)';
        label.textContent = kg + '';
        plate.appendChild(label);
      }

      plate.title = `Click to remove ${kg}kg plate`;
      plate.addEventListener('click', () => {
        const idx = platesOnBar.indexOf(kg);
        if (idx !== -1) {
          platesOnBar.splice(idx, 1);
          _render();
          _notify();
        }
      });

      return plate;
    }

    function _render() {
      barbellContainer.innerHTML = '';

      // Left plates (reversed order visually)
      const leftSleeve = document.createElement('div');
      leftSleeve.className = 'barbell-sleeve left';
      leftSleeve.style.display = 'flex';
      leftSleeve.style.alignItems = 'center';
      leftSleeve.style.flexDirection = 'row-reverse';
      platesOnBar.forEach(kg => {
        leftSleeve.appendChild(_createPlateEl(kg, 'left'));
      });

      // Left collar
      const leftCollar = document.createElement('div');
      leftCollar.className = 'barbell-collar';

      // Bar
      const bar = document.createElement('div');
      bar.className = 'barbell-bar';

      // Right collar
      const rightCollar = document.createElement('div');
      rightCollar.className = 'barbell-collar';

      // Right plates
      const rightSleeve = document.createElement('div');
      rightSleeve.className = 'barbell-sleeve right';
      rightSleeve.style.display = 'flex';
      rightSleeve.style.alignItems = 'center';
      platesOnBar.forEach(kg => {
        rightSleeve.appendChild(_createPlateEl(kg, 'right'));
      });

      barbellContainer.appendChild(leftSleeve);
      barbellContainer.appendChild(leftCollar);
      barbellContainer.appendChild(bar);
      barbellContainer.appendChild(rightCollar);
      barbellContainer.appendChild(rightSleeve);

      // Update total
      const total = _getTotal();
      totalDisplay.innerHTML = `${total} <span>kg total</span>`;
    }

    // Initialize
    if (initialWeight && initialWeight > barWeight) {
      platesOnBar = _calculatePlates(initialWeight, barWeight);
    }
    _render();
    _notify();

    // Return controller
    return {
      getWeight: _getTotal,
      setWeight: function(total) {
        platesOnBar = _calculatePlates(total, barWeight);
        _render();
      },
      reset: function() {
        platesOnBar = [];
        _render();
        _notify();
      },
      getPlates: function() { return [...platesOnBar]; },
    };
  }

  // Auto-calculate plates needed for a given total weight
  function _calculatePlates(totalWeight, barWeight) {
    let remaining = (totalWeight - barWeight) / 2;
    const result = [];
    const available = PLATES.map(p => p.kg);

    for (const plateKg of available) {
      while (remaining >= plateKg - 0.001) {
        result.push(plateKg);
        remaining -= plateKg;
      }
    }
    return result;
  }

  // Color helpers
  function _lighten(hex) {
    return _adjustColor(hex, 30);
  }
  function _darken(hex) {
    return _adjustColor(hex, -30);
  }
  function _adjustColor(hex, amount) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));
    return `rgb(${r},${g},${b})`;
  }

  return { render, PLATES };
})();
