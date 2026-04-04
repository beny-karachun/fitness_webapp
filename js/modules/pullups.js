/* Pull-ups Module */
window.FitnessApp = window.FitnessApp || {};
FitnessApp.Modules = FitnessApp.Modules || {};

FitnessApp.Modules.pullups = {
  id: 'pullups',
  name: 'Pull-ups',
  icon: '🔝',
  difficulty: 'advanced',
  type: 'bodyweight',
  hasWeighted: true,
  muscles: ['Back', 'Biceps', 'Forearms'],
  render(container) {
    FitnessApp.ExerciseBase.render(container, this);
  }
};
