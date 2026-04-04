/* Bench Press Module */
window.FitnessApp = window.FitnessApp || {};
FitnessApp.Modules = FitnessApp.Modules || {};

FitnessApp.Modules.benchpress = {
  id: 'benchpress',
  name: 'Bench Press',
  icon: '🏋️',
  difficulty: 'intermediate',
  type: 'barbell',
  hasWeighted: false,
  barWeight: 20,
  muscles: ['Chest', 'Triceps', 'Shoulders'],
  render(container) {
    FitnessApp.ExerciseBase.render(container, this);
  }
};
