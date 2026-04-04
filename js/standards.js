/* ==========================================================
   Strength Standards Module
   - Weight-class-adjusted tables for bodyweight exercises
   - Bodyweight-ratio tables for barbell exercises
   - Separate male/female standards
   - Epley 1RM estimation
   ========================================================== */
window.FitnessApp = window.FitnessApp || {};

FitnessApp.Standards = (() => {

  // ---- Levels (ordered) ----
  const LEVELS = ['beginner', 'novice', 'intermediate', 'advanced', 'elite'];
  const LEVEL_LABELS = {
    beginner: 'Beginner',
    novice: 'Novice',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    elite: 'Elite',
  };
  const LEVEL_COLORS = {
    beginner: '#64748b',
    novice: '#06b6d4',
    intermediate: '#10b981',
    advanced: '#f59e0b',
    elite: '#ef4444',
  };

  // ---- Weight class brackets (kg) ----
  // Used for bodyweight exercises where heavier = harder
  const WEIGHT_CLASSES = [
    { max: 60,  label: '<60kg' },
    { max: 70,  label: '60-70kg' },
    { max: 80,  label: '70-80kg' },
    { max: 90,  label: '80-90kg' },
    { max: 100, label: '90-100kg' },
    { max: 110, label: '100-110kg' },
    { max: Infinity, label: '110+kg' },
  ];

  function getWeightClassIndex(bw) {
    for (let i = 0; i < WEIGHT_CLASSES.length; i++) {
      if (bw <= WEIGHT_CLASSES[i].max) return i;
    }
    return WEIGHT_CLASSES.length - 1;
  }

  // ============================================================
  //  BODYWEIGHT EXERCISE STANDARDS (reps)
  //  Indexed by weight class (0=<60, 1=60-70, ... 6=110+)
  //  Each array: [beginner, novice, intermediate, advanced, elite]
  // ============================================================

  const BW_STANDARDS = {
    pullups: {
      male: [
        [1, 8,  15, 22, 30],   // <60kg
        [1, 7,  13, 20, 28],   // 60-70
        [1, 6,  12, 18, 25],   // 70-80
        [1, 5,  10, 16, 23],   // 80-90
        [1, 4,  9,  14, 20],   // 90-100
        [1, 3,  7,  12, 18],   // 100-110
        [1, 2,  6,  10, 15],   // 110+
      ],
      female: [
        [1, 5,  10, 16, 22],
        [1, 4,  8,  14, 20],
        [1, 3,  7,  12, 18],
        [1, 2,  5,  10, 15],
        [1, 2,  4,  8,  13],
        [1, 1,  3,  7,  11],
        [1, 1,  3,  6,  10],
      ],
    },

    pushups: {
      male: [
        [5,  25, 45, 70, 90],   // <60kg
        [5,  22, 42, 65, 85],   // 60-70
        [5,  20, 40, 60, 80],   // 70-80
        [5,  18, 35, 55, 75],   // 80-90
        [4,  15, 30, 50, 70],   // 90-100
        [3,  12, 25, 45, 60],   // 100-110
        [3,  10, 22, 40, 55],   // 110+
      ],
      female: [
        [3,  15, 30, 50, 70],
        [3,  12, 25, 45, 65],
        [2,  10, 22, 40, 60],
        [2,  8,  18, 35, 50],
        [2,  7,  15, 30, 45],
        [1,  5,  12, 25, 40],
        [1,  5,  10, 22, 35],
      ],
    },

    dips: {
      male: [
        [1, 8,  18, 30, 45],   // <60kg
        [1, 7,  16, 28, 42],   // 60-70
        [1, 6,  15, 25, 40],   // 70-80
        [1, 5,  12, 22, 35],   // 80-90
        [1, 4,  10, 20, 30],   // 90-100
        [1, 3,  8,  16, 25],   // 100-110
        [1, 2,  6,  13, 22],   // 110+
      ],
      female: [
        [1, 5,  12, 22, 35],
        [1, 4,  10, 18, 30],
        [1, 3,  8,  15, 25],
        [1, 2,  6,  12, 20],
        [1, 2,  5,  10, 18],
        [1, 1,  4,  8,  15],
        [1, 1,  3,  7,  12],
      ],
    },
  };

  // ============================================================
  //  WEIGHTED BODYWEIGHT EXERCISE STANDARDS
  //  Expressed as added weight as % of bodyweight
  //  e.g. 0.25 means you add 25% of your bodyweight
  //  Also adjusted by weight class
  // ============================================================
  const WEIGHTED_BW_STANDARDS = {
    pullups: {
      male: [
        [0, 0.10, 0.30, 0.55, 0.80],  // <60kg
        [0, 0.10, 0.28, 0.50, 0.75],  // 60-70
        [0, 0.08, 0.25, 0.50, 0.75],  // 70-80
        [0, 0.08, 0.22, 0.45, 0.70],  // 80-90
        [0, 0.06, 0.20, 0.40, 0.65],  // 90-100
        [0, 0.05, 0.18, 0.35, 0.55],  // 100-110
        [0, 0.05, 0.15, 0.30, 0.50],  // 110+
      ],
      female: [
        [0, 0.05, 0.18, 0.35, 0.55],
        [0, 0.05, 0.15, 0.30, 0.50],
        [0, 0.04, 0.12, 0.25, 0.45],
        [0, 0.03, 0.10, 0.22, 0.40],
        [0, 0.03, 0.08, 0.20, 0.35],
        [0, 0.02, 0.07, 0.18, 0.30],
        [0, 0.02, 0.06, 0.15, 0.28],
      ],
    },

    dips: {
      male: [
        [0, 0.15, 0.35, 0.65, 1.05],
        [0, 0.12, 0.32, 0.60, 1.00],
        [0, 0.10, 0.30, 0.55, 0.90],
        [0, 0.10, 0.25, 0.50, 0.85],
        [0, 0.08, 0.22, 0.45, 0.75],
        [0, 0.06, 0.20, 0.40, 0.65],
        [0, 0.05, 0.18, 0.35, 0.55],
      ],
      female: [
        [0, 0.10, 0.22, 0.42, 0.65],
        [0, 0.08, 0.20, 0.38, 0.60],
        [0, 0.06, 0.18, 0.35, 0.55],
        [0, 0.05, 0.15, 0.30, 0.50],
        [0, 0.04, 0.12, 0.25, 0.45],
        [0, 0.03, 0.10, 0.22, 0.38],
        [0, 0.03, 0.08, 0.20, 0.35],
      ],
    },
  };

  // ============================================================
  //  BARBELL EXERCISE STANDARDS (1RM as ratio of bodyweight)
  //  These don't need weight-class adjustment since they're ratios
  // ============================================================
  const BARBELL_STANDARDS = {
    benchpress: {
      male:   [0.50, 0.75, 1.00, 1.25, 1.50],
      female: [0.25, 0.50, 0.75, 1.00, 1.25],
    },
    squats: {
      male:   [0.75, 1.00, 1.50, 2.00, 2.50],
      female: [0.50, 0.75, 1.00, 1.50, 2.00],
    },
    curls: {
      male:   [0.20, 0.35, 0.50, 0.65, 0.85],
      female: [0.10, 0.20, 0.35, 0.50, 0.65],
    },
  };

  // ---- Epley 1RM Formula ----
  function estimate1RM(weight, reps) {
    if (reps <= 0) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  }

  // ---- Get strength level for a barbell exercise ----
  function getBarbellLevel(exerciseId, weight, reps, bodyweight, gender) {
    const stds = BARBELL_STANDARDS[exerciseId];
    if (!stds) return { level: 'beginner', percent: 0, e1rm: 0 };

    const thresholds = stds[gender] || stds.male;
    const e1rm = estimate1RM(weight, reps);
    const ratio = e1rm / bodyweight;

    return _calcLevel(ratio, thresholds, e1rm);
  }

  // ---- Get strength level for a bodyweight exercise (reps) ----
  function getBodyweightLevel(exerciseId, reps, bodyweight, gender) {
    const stds = BW_STANDARDS[exerciseId];
    if (!stds) return { level: 'beginner', percent: 0 };

    const wci = getWeightClassIndex(bodyweight);
    const genderData = stds[gender] || stds.male;
    const thresholds = genderData[wci];

    return _calcLevel(reps, thresholds);
  }

  // ---- Get strength level for weighted bodyweight exercise ----
  function getWeightedBWLevel(exerciseId, addedWeight, bodyweight, gender) {
    const stds = WEIGHTED_BW_STANDARDS[exerciseId];
    if (!stds) return { level: 'beginner', percent: 0 };

    const wci = getWeightClassIndex(bodyweight);
    const genderData = stds[gender] || stds.male;
    const thresholds = genderData[wci];
    const ratio = addedWeight / bodyweight;

    return _calcLevel(ratio, thresholds);
  }

  // ---- Unified level calculation ----
  function _calcLevel(value, thresholds, e1rm) {
    let level = 'beginner';
    let percent = 0;

    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]) {
        level = LEVELS[i];
      }
    }

    // Calculate percentage within the full range
    const minVal = thresholds[0];
    const maxVal = thresholds[thresholds.length - 1];
    if (maxVal > minVal) {
      percent = Math.min(100, Math.max(0, ((value - minVal) / (maxVal - minVal)) * 100));
    }
    if (value >= maxVal) percent = 100;

    const result = { level, percent, label: LEVEL_LABELS[level], color: LEVEL_COLORS[level] };
    if (e1rm !== undefined) result.e1rm = e1rm;
    return result;
  }

  // ---- Get thresholds for display ----
  function getThresholds(exerciseId, type, bodyweight, gender, isWeighted) {
    if (type === 'barbell') {
      const stds = BARBELL_STANDARDS[exerciseId];
      if (!stds) return null;
      const t = stds[gender] || stds.male;
      // Convert ratios to actual weights for display
      return t.map(r => Math.round(r * bodyweight) + 'kg');
    } else if (isWeighted) {
      const stds = WEIGHTED_BW_STANDARDS[exerciseId];
      if (!stds) return null;
      const wci = getWeightClassIndex(bodyweight);
      const t = (stds[gender] || stds.male)[wci];
      return t.map(r => (r === 0 ? 'BW' : '+' + Math.round(r * bodyweight) + 'kg'));
    } else {
      const stds = BW_STANDARDS[exerciseId];
      if (!stds) return null;
      const wci = getWeightClassIndex(bodyweight);
      const t = (stds[gender] || stds.male)[wci];
      return t.map(r => r + ' reps');
    }
  }

  // ---- Get user's weight class label ----
  function getWeightClassLabel(bodyweight) {
    const wci = getWeightClassIndex(bodyweight);
    return WEIGHT_CLASSES[wci].label;
  }

  return {
    LEVELS, LEVEL_LABELS, LEVEL_COLORS,
    estimate1RM,
    getBarbellLevel,
    getBodyweightLevel,
    getWeightedBWLevel,
    getThresholds,
    getWeightClassLabel,
  };
})();
