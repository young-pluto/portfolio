// Workouts Module
const WorkoutsModule = (() => {
    // DOM Elements
    const newWorkoutSection = document.getElementById('new-workout-section');
    const selectExercisesBtn = document.getElementById('select-exercises-btn');
    const saveWorkoutBtn = document.getElementById('save-workout-btn');
    const workoutDate = document.getElementById('workout-date');
    const workoutName = document.getElementById('workout-name');
    const exerciseSelection = document.getElementById('exercise-selection');
    const exerciseSelectionList = document.getElementById('exercise-selection-list');
    const confirmExercisesBtn = document.getElementById('confirm-exercises-btn');
    const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
    const currentWorkout = document.getElementById('current-workout');
    const workoutHistorySection = document.getElementById('workout-history-section');
    const workoutHistoryList = document.getElementById('workout-history-list');

    // State
    let selectedExercises = [];
    let currentWorkoutExercises = [];
    let workoutHistory = [];

    // Firebase references
    const getWorkoutsRef = () => {
        const user = AuthModule.getCurrentUser();
        return database.ref(`users/${user.uid}/workouts`);
    };

    // Load workout history from Firebase
    const loadWorkoutHistory = () => {
        const workoutsRef = getWorkoutsRef();
        
        workoutsRef.on('value', (snapshot) => {
            workoutHistory = [];
            workoutHistoryList.innerHTML = '';
            
            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach(key => {
                    const workout = {
                        id: key,
                        ...data[key]
                    };
                    workoutHistory.push(workout);
                });
                
                // Sort workouts by date (newest first)
                workoutHistory.sort((a, b) => b.timestamp - a.timestamp);
                
                renderWorkoutHistory();
            }
        });
    };

    // Render workout history
    const renderWorkoutHistory = () => {
        workoutHistoryList.innerHTML = '';
        
        if (workoutHistory.length === 0) {
            workoutHistoryList.innerHTML = '<p>No workout history yet. Start a new workout to see your history here.</p>';
            return;
        }
        
        workoutHistory.forEach(workout => {
            const workoutItem = createWorkoutHistoryElement(workout);
            workoutHistoryList.appendChild(workoutItem);
        });
    };

    // Create workout history element from template
    const createWorkoutHistoryElement = (workout) => {
        const template = document.getElementById('workout-history-item-template');
        const workoutItem = document.importNode(template.content, true).querySelector('.workout-history-item');
        
        workoutItem.dataset.id = workout.id;
        
        // Set workout name and date
        workoutItem.querySelector('.workout-name').textContent = workout.name || 'Unnamed Workout';
        
        const workoutDateObj = new Date(workout.date);
        const formattedDate = workoutDateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        workoutItem.querySelector('.workout-date').textContent = formattedDate;
        
        // Set workout summary
        const exerciseCount = workout.exercises ? Object.keys(workout.exercises).length : 0;
        workoutItem.querySelector('.workout-summary').textContent = `${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}`;
        
        // Set workout details (hidden by default)
        const detailsContainer = workoutItem.querySelector('.workout-details');
        
        if (workout.exercises) {
            const exercisesList = document.createElement('ul');
            exercisesList.className = 'workout-details-list';
            
            Object.keys(workout.exercises).forEach(exerciseId => {
                const exercise = workout.exercises[exerciseId];
                const setCount = exercise.sets ? Object.keys(exercise.sets).length : 0;
                
                const exerciseItem = document.createElement('li');
                exerciseItem.innerHTML = `<strong>${exercise.name}</strong>: ${setCount} set${setCount === 1 ? '' : 's'}`;
                exercisesList.appendChild(exerciseItem);
            });
            
            detailsContainer.appendChild(exercisesList);
        }
        
        // Add event listeners
        workoutItem.querySelector('.view-workout-btn').addEventListener('click', () => {
            detailsContainer.classList.toggle('hidden');
        });
        
        return workoutItem;
    };

    // Initialize new workout
    const initNewWorkout = () => {
        // Set default date to today
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        workoutDate.value = `${yyyy}-${mm}-${dd}`;
        
        // Clear name field
        workoutName.value = '';
        
        // Clear current workout exercises
        currentWorkoutExercises = [];
        currentWorkout.innerHTML = '';
    };

    // Open exercise selection dialog
    const openExerciseSelection = () => {
        // Get all exercises from the Exercises Module
        const allExercises = ExercisesModule.getAllExercises();
        
        // Clear previous selection
        exerciseSelectionList.innerHTML = '';
        selectedExercises = [];
        
        if (allExercises.length === 0) {
            exerciseSelectionList.innerHTML = '<p>No exercises available. Please add exercises first.</p>';
            confirmExercisesBtn.disabled = true;
        } else {
            // Create checklist items for each exercise
            allExercises.forEach(exercise => {
                const item = document.createElement('div');
                item.className = 'checklist-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `select-exercise-${exercise.id}`;
                checkbox.dataset.id = exercise.id;
                
                // Check if exercise is already in current workout
                const isAlreadySelected = currentWorkoutExercises.some(e => e.id === exercise.id);
                if (isAlreadySelected) {
                    checkbox.checked = true;
                    checkbox.disabled = true;
                }
                
                const label = document.createElement('label');
                label.htmlFor = `select-exercise-${exercise.id}`;
                label.textContent = exercise.name;
                
                item.appendChild(checkbox);
                item.appendChild(label);
                exerciseSelectionList.appendChild(item);
            });
            
            confirmExercisesBtn.disabled = false;
        }
        
        exerciseSelection.classList.remove('hidden');
    };

    // Close exercise selection dialog
    const closeExerciseSelection = () => {
        exerciseSelection.classList.add('hidden');
        selectedExercises = [];
    };

    // Handle exercise selection confirmation
    const confirmExerciseSelection = () => {
        // Get all checked checkboxes
        const checkboxes = exerciseSelectionList.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)');
        
        checkboxes.forEach(checkbox => {
            const exerciseId = checkbox.dataset.id;
            const exercise = ExercisesModule.getExerciseById(exerciseId);
            
            if (exercise) {
                addExerciseToWorkout(exercise);
            }
        });
        
        closeExerciseSelection();
    };

    // Add exercise to current workout
    const addExerciseToWorkout = (exercise) => {
        // Check if exercise is already in workout
        if (currentWorkoutExercises.some(e => e.id === exercise.id)) {
            return;
        }
        
        // Add to current workout exercises
        currentWorkoutExercises.push(exercise);
        
        // Create exercise element
        const exerciseElement = createWorkoutExerciseElement(exercise);
        currentWorkout.appendChild(exerciseElement);
    };

    // Create workout exercise element from template
    const createWorkoutExerciseElement = (exercise) => {
        const template = document.getElementById('workout-exercise-template');
        const exerciseElement = document.importNode(template.content, true).querySelector('.workout-exercise');
        
        exerciseElement.dataset.id = exercise.id;
        
        // Set exercise name
        exerciseElement.querySelector('.exercise-name').textContent = exercise.name;
        
        // Add event listeners
        exerciseElement.querySelector('.history-btn').addEventListener('click', () => {
            toggleExerciseHistory(exerciseElement, exercise.id);
        });
        
        exerciseElement.querySelector('.add-set-btn').addEventListener('click', () => {
            addSetToExercise(exerciseElement);
        });
        
        exerciseElement.querySelector('.remove-exercise-btn').addEventListener('click', () => {
            removeExerciseFromWorkout(exerciseElement, exercise.id);
        });
        
        // Add initial set
        addSetToExercise(exerciseElement);
        
        return exerciseElement;
    };

    // Add set to exercise
    const addSetToExercise = (exerciseElement) => {
        const setsContainer = exerciseElement.querySelector('.sets-container');
        const setCount = setsContainer.children.length + 1;
        
        const template = document.getElementById('set-template');
        const setElement = document.importNode(template.content, true).querySelector('.set-item');
        
        // Set the set number
        setElement.querySelector('.set-label').textContent = `Set ${setCount}`;
        
        // Add event listener for delete button
        setElement.querySelector('.delete-set-btn').addEventListener('click', () => {
            if (setsContainer.children.length > 1) {
                setElement.remove();
                
                // Update set numbers
                Array.from(setsContainer.children).forEach((set, index) => {
                    set.querySelector('.set-label').textContent = `Set ${index + 1}`;
                });
            } else {
                alert('You need at least one set. Remove the exercise instead if not needed.');
            }
        });
        
        setsContainer.appendChild(setElement);
    };

    // Toggle exercise history display
    const toggleExerciseHistory = (exerciseElement, exerciseId) => {
        const historySection = exerciseElement.querySelector('.exercise-history');
        const historyData = historySection.querySelector('.history-data');
        
        if (historySection.classList.contains('hidden')) {
            // Load history data
            loadExerciseHistory(exerciseId, historyData);
            historySection.classList.remove('hidden');
        } else {
            historySection.classList.add('hidden');
        }
    };

    // Load exercise history data
    const loadExerciseHistory = (exerciseId, container) => {
        container.innerHTML = '<p>Loading history...</p>';
        
        const user = AuthModule.getCurrentUser();
        const historyRef = database.ref(`users/${user.uid}/workouts`);
        
        historyRef.orderByChild('timestamp').limitToLast(5).once('value', (snapshot) => {
            let historyFound = false;
            container.innerHTML = '';
            
            // Process each workout, starting from the most recent
            const workouts = [];
            snapshot.forEach(childSnapshot => {
                workouts.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            // Sort by timestamp (newest first)
            workouts.sort((a, b) => b.timestamp - a.timestamp);
            
            // Find the exercise in recent workouts
            for (const workout of workouts) {
                if (workout.exercises && workout.exercises[exerciseId]) {
                    historyFound = true;
                    const exerciseData = workout.exercises[exerciseId];
                    
                    const workoutDate = new Date(workout.date || workout.timestamp);
                    const dateStr = workoutDate.toLocaleDateString();
                    
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    
                    const historyHeader = document.createElement('div');
                    historyHeader.className = 'history-header';
                    historyHeader.innerHTML = `<strong>${dateStr}</strong>`;
                    historyItem.appendChild(historyHeader);
                    
                    if (exerciseData.sets) {
                        const setsList = document.createElement('ul');
                        setsList.className = 'history-sets';
                        
                        Object.values(exerciseData.sets).forEach(set => {
                            const setItem = document.createElement('li');
                            setItem.innerHTML = `<strong>${set.weight || 0}</strong> kg/lbs × <strong>${set.reps || 0}</strong> reps`;
                            
                            if (set.remarks) {
                                setItem.innerHTML += ` <span class="history-remarks">(${set.remarks})</span>`;
                            }
                            
                            setsList.appendChild(setItem);
                        });
                        
                        historyItem.appendChild(setsList);
                    }
                    
                    container.appendChild(historyItem);
                    
                    // Only show the most recent workout for this exercise
                    break;
                }
            }
            
            if (!historyFound) {
                container.innerHTML = '<p>No previous data for this exercise.</p>';
            }
        });
    };

    // Remove exercise from workout
    const removeExerciseFromWorkout = (exerciseElement, exerciseId) => {
        if (confirm('Are you sure you want to remove this exercise from the workout?')) {
            // Remove from DOM
            exerciseElement.remove();
            
            // Remove from array
            currentWorkoutExercises = currentWorkoutExercises.filter(exercise => exercise.id !== exerciseId);
        }
    };

    // Save workout to Firebase
    const saveWorkout = () => {
        // Validate
        if (currentWorkoutExercises.length === 0) {
            alert('Please add at least one exercise to the workout.');
            return;
        }
        
        if (!workoutDate.value) {
            alert('Please select a date for the workout.');
            return;
        }
        
        // Collect workout data
        const workoutData = {
            name: workoutName.value.trim() || 'Workout',
            date: workoutDate.value,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            exercises: {}
        };
        
        // Process each exercise and its sets
        const exerciseElements = currentWorkout.querySelectorAll('.workout-exercise');
        let hasValidSets = false;
        
        exerciseElements.forEach(exerciseElement => {
            const exerciseId = exerciseElement.dataset.id;
            const exercise = ExercisesModule.getExerciseById(exerciseId);
            
            if (exercise) {
                const sets = {};
                const setElements = exerciseElement.querySelectorAll('.set-item');
                
                setElements.forEach((setElement, index) => {
                    const weight = setElement.querySelector('.weight-input').value;
                    const reps = setElement.querySelector('.reps-input').value;
                    const remarks = setElement.querySelector('.remarks-input').value;
                    
                    // Only add sets with at least weight or reps
                    if (weight || reps) {
                        sets[`set${index + 1}`] = {
                            weight: weight || 0,
                            reps: reps || 0,
                            remarks: remarks || ''
                        };
                        hasValidSets = true;
                    }
                });
                
                workoutData.exercises[exerciseId] = {
                    name: exercise.name,
                    category: exercise.category,
                    sets: sets
                };
                
                // Update exercise usage count
                ExercisesModule.updateExerciseUsageCount(exerciseId);
            }
        });
        
        if (!hasValidSets) {
            alert('Please enter at least weight or reps for one set.');
            return;
        }
        
        // Save to Firebase
        const workoutsRef = getWorkoutsRef();
        
        workoutsRef.push(workoutData)
            .then(() => {
                alert('Workout saved successfully!');
                initNewWorkout();
            })
            .catch(error => {
                alert(`Error saving workout: ${error.message}`);
            });
    };

    // Initialize
    const init = () => {
        // Set default date
        initNewWorkout();
        
        // Event listeners
        selectExercisesBtn.addEventListener('click', openExerciseSelection);
        confirmExercisesBtn.addEventListener('click', confirmExerciseSelection);
        cancelSelectionBtn.addEventListener('click', closeExerciseSelection);
        saveWorkoutBtn.addEventListener('click', saveWorkout);
        
        // Load workout history
        loadWorkoutHistory();
    };

    // Public methods and properties
    return {
        init,
        initNewWorkout
    };
})();