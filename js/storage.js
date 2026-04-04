/* ==========================================================
   Storage Module — localStorage abstraction
   Namespaced under 'ft_' prefix
   ========================================================== */
window.FitnessApp = window.FitnessApp || {};

FitnessApp.Storage = (() => {
  const PREFIX = 'ft_';

  function _key(k) { return PREFIX + k; }

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(_key(key));
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('Storage.get error:', e);
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(_key(key), JSON.stringify(value));
    } catch (e) {
      console.warn('Storage.set error:', e);
    }
  }

  function remove(key) {
    localStorage.removeItem(_key(key));
  }

  // --- User Settings ---
  function getSettings() {
    return get('settings', {
      bodyweight: 80,
      gender: 'male',
    });
  }

  function setSettings(settings) {
    set('settings', settings);
  }

  // --- Workout History ---
  // Each exercise stores array of entries: { date, sets: [{reps, weight}], estimated1RM, level }
  function getHistory(exerciseId) {
    return get('history_' + exerciseId, []);
  }

  function addWorkout(exerciseId, entry) {
    const history = getHistory(exerciseId);
    history.unshift(entry); // newest first
    set('history_' + exerciseId, history);
  }

  function deleteWorkout(exerciseId, index) {
    const history = getHistory(exerciseId);
    history.splice(index, 1);
    set('history_' + exerciseId, history);
  }

  function getLatestWorkout(exerciseId) {
    const history = getHistory(exerciseId);
    return history.length > 0 ? history[0] : null;
  }

  function getTodaysWorkouts(exerciseId) {
    const today = _todayStr();
    return getHistory(exerciseId).filter(e => e.date === today);
  }

  function getAllTodaysWorkouts() {
    const today = _todayStr();
    const exercises = ['pullups', 'pushups', 'squats', 'benchpress', 'dips', 'curls'];
    const result = {};
    exercises.forEach(ex => {
      const todayEntries = getHistory(ex).filter(e => e.date === today);
      if (todayEntries.length > 0) result[ex] = todayEntries;
    });
    return result;
  }

  function getWorkoutDates() {
    const exercises = ['pullups', 'pushups', 'squats', 'benchpress', 'dips', 'curls'];
    const dates = new Set();
    exercises.forEach(ex => {
      getHistory(ex).forEach(e => dates.add(e.date));
    });
    return dates;
  }

  function clearAllData() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }

  function _todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  return {
    get, set, remove,
    getSettings, setSettings,
    getHistory, addWorkout, deleteWorkout,
    getLatestWorkout, getTodaysWorkouts, getAllTodaysWorkouts,
    getWorkoutDates, clearAllData,
    todayStr: _todayStr
  };
})();
