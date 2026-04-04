/* Dips Module */
window.FitnessApp = window.FitnessApp || {};
FitnessApp.Modules = FitnessApp.Modules || {};

FitnessApp.Modules.dips = {
  id: 'dips',
  name: 'Dips',
  icon: '⬇️',
  difficulty: 'intermediate',
  type: 'bodyweight',
  hasWeighted: true,
  muscles: ['Chest', 'Triceps', 'Shoulders'],
  render(container) {
    FitnessApp.ExerciseBase.render(container, this);
  }
};
