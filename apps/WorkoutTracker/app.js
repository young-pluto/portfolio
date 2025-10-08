// Main App Module
const AppModule = (() => {
    // DOM Elements
    const viewExercisesBtn = document.getElementById('view-exercises-btn');
    const newWorkoutBtn = document.getElementById('new-workout-btn');
    const workoutHistoryBtn = document.getElementById('workout-history-btn');
    const exercisesSection = document.getElementById('exercises-section');
    const newWorkoutSection = document.getElementById('new-workout-section');
    const workoutHistorySection = document.getElementById('workout-history-section');
    const exerciseProgressSection = document.getElementById('exercise-progress-section');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Show exercises section
    const showExercisesSection = () => {
        // Cleanup workout history when navigating away
        if (typeof WorkoutsModule !== 'undefined' && WorkoutsModule.cleanupWorkoutHistory) {
            WorkoutsModule.cleanupWorkoutHistory();
        }
        
        exercisesSection.classList.remove('hidden');
        newWorkoutSection.classList.add('hidden');
        workoutHistorySection.classList.add('hidden');
        exerciseProgressSection.classList.add('hidden');
        
        // Update active nav button
        updateActiveNavButton(viewExercisesBtn);
    };

    // Show new workout section
    const showNewWorkoutSection = () => {
        // Cleanup workout history when navigating away
        if (typeof WorkoutsModule !== 'undefined' && WorkoutsModule.cleanupWorkoutHistory) {
            WorkoutsModule.cleanupWorkoutHistory();
        }
        
        exercisesSection.classList.add('hidden');
        newWorkoutSection.classList.remove('hidden');
        workoutHistorySection.classList.add('hidden');
        exerciseProgressSection.classList.add('hidden');
        
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
        exerciseProgressSection.classList.add('hidden');
        
        // Update active nav button
        updateActiveNavButton(workoutHistoryBtn);
        
        // Load workout history only when accessing the section
        // This prevents unnecessary memory usage when not viewing history
        if (typeof WorkoutsModule !== 'undefined' && WorkoutsModule.loadWorkoutHistory) {
            WorkoutsModule.loadWorkoutHistory();
        }
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

    // Dark mode toggle functionality
    const toggleTheme = () => {
        const body = document.body;
        const isDark = body.classList.toggle('dark-mode');
        
        // Update button text and icon
        if (themeToggleBtn) {
            const icon = themeToggleBtn.querySelector('i');
            const text = themeToggleBtn.querySelector('span');
            
            if (isDark) {
                icon.className = 'fas fa-sun';
                text.textContent = 'Light';
            } else {
                icon.className = 'fas fa-moon';
                text.textContent = 'Dark';
            }
        }
        
        // Save preference to localStorage
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    // Load saved theme preference (defaults to dark)
    const loadThemePreference = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeToggleBtn) {
                const icon = themeToggleBtn.querySelector('i');
                const text = themeToggleBtn.querySelector('span');
                if (icon && text) {
                    icon.className = 'fas fa-sun';
                    text.textContent = 'Light';
                }
            }
        }
    };

    // Initialize
    const init = () => {
        // Load theme preference
        loadThemePreference();
        
        // Event listeners
        viewExercisesBtn.addEventListener('click', showExercisesSection);
        newWorkoutBtn.addEventListener('click', showNewWorkoutSection);
        workoutHistoryBtn.addEventListener('click', showWorkoutHistorySection);
        
        // Theme toggle
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }
        
        // Show exercises section by default
        showExercisesSection();
    };

    // Public methods and properties
    return {
        init,
        initAfterAuth: () => {
            ExercisesModule.init();
            WorkoutsModule.init();
            TimerModule.init();
            ProgressModule.init();
            init();
        }
    };
})();