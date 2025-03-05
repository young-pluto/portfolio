// Main App Module
const AppModule = (() => {
    // DOM Elements
    const viewExercisesBtn = document.getElementById('view-exercises-btn');
    const newWorkoutBtn = document.getElementById('new-workout-btn');
    const workoutHistoryBtn = document.getElementById('workout-history-btn');
    const exercisesSection = document.getElementById('exercises-section');
    const newWorkoutSection = document.getElementById('new-workout-section');
    const workoutHistorySection = document.getElementById('workout-history-section');

    // Show exercises section
    const showExercisesSection = () => {
        exercisesSection.classList.remove('hidden');
        newWorkoutSection.classList.add('hidden');
        workoutHistorySection.classList.add('hidden');
        
        // Update active nav button
        updateActiveNavButton(viewExercisesBtn);
    };

    // Show new workout section
    const showNewWorkoutSection = () => {
        exercisesSection.classList.add('hidden');
        newWorkoutSection.classList.remove('hidden');
        workoutHistorySection.classList.add('hidden');
        
        // Update active nav button
        updateActiveNavButton(newWorkoutBtn);
        
        // Initialize new workout
        WorkoutsModule.initNewWorkout();
    };

    // Show workout history section
    const showWorkoutHistorySection = () => {
        exercisesSection.classList.add('hidden');
        newWorkoutSection.classList.add('hidden');
        workoutHistorySection.classList.remove('hidden');
        
        // Update active nav button
        updateActiveNavButton(workoutHistoryBtn);
    };

    // Update active nav button
    const updateActiveNavButton = (activeButton) => {
        // Remove active class from all nav buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Add active class to active button
        activeButton.classList.add('active');
    };

    // Initialize
    const init = () => {
        // Event listeners
        viewExercisesBtn.addEventListener('click', showExercisesSection);
        newWorkoutBtn.addEventListener('click', showNewWorkoutSection);
        workoutHistoryBtn.addEventListener('click', showWorkoutHistorySection);
        
        // Show exercises section by default
        showExercisesSection();
    };

    // Public methods and properties
    return {
        init
    };
})();