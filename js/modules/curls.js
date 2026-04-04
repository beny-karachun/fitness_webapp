/* Curls Module */
window.FitnessApp = window.FitnessApp || {};
FitnessApp.Modules = FitnessApp.Modules || {};

FitnessApp.Modules.curls = {
  id: 'curls',
  name: 'Curls',
  icon: '💪',
  difficulty: 'beginner',
  type: 'barbell',
  hasWeighted: false,
  barWeight: 10,  // EZ curl bar
  muscles: ['Biceps', 'Forearms'],
  render(container) {
    FitnessApp.ExerciseBase.render(container, this);
  }
};
