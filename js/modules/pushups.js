/* Push-ups Module */
window.FitnessApp = window.FitnessApp || {};
FitnessApp.Modules = FitnessApp.Modules || {};

FitnessApp.Modules.pushups = {
  id: 'pushups',
  name: 'Push-ups',
  icon: '💪',
  difficulty: 'beginner',
  type: 'bodyweight',
  hasWeighted: false,
  muscles: ['Chest', 'Triceps', 'Shoulders'],
  render(container) {
    FitnessApp.ExerciseBase.render(container, this);
  }
};
