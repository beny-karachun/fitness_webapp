/* Squats Module */
window.FitnessApp = window.FitnessApp || {};
FitnessApp.Modules = FitnessApp.Modules || {};

FitnessApp.Modules.squats = {
  id: 'squats',
  name: 'Squats',
  icon: '🦵',
  difficulty: 'intermediate',
  type: 'barbell',
  hasWeighted: false,
  barWeight: 20,
  muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'],
  render(container) {
    FitnessApp.ExerciseBase.render(container, this);
  }
};
