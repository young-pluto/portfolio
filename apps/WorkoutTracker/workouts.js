// Workouts Module with improved exercise selection, save entry feature, and error handling
const WorkoutsModule = (() => {
    // DOM Elements
    const newWorkoutSection = document.getElementById('new-workout-section');
    const selectExercisesBtn = document.getElementById('select-exercises-btn');
    const saveWorkoutBtn = document.getElementById('save-workout-btn');
    const saveEntryBtn = document.getElementById('save-entry-btn');
    const workoutDate = document.getElementById('workout-date');
    const workoutName = document.getElementById('workout-name');
    const bodyWeight = document.getElementById('body-weight');
    const exerciseSelection = document.getElementById('exercise-selection');
    const exerciseSelectionList = document.getElementById('exercise-selection-list');
    const exerciseSearchInput = document.getElementById('exercise-search-input');
    const confirmExercisesBtn = document.getElementById('confirm-exercises-btn');
    const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
    const startWorkoutBtn = document.getElementById('start-workout-btn');
    const currentWorkout = document.getElementById('current-workout');
    const workoutHistorySection = document.getElementById('workout-history-section');
    const workoutHistoryList = document.getElementById('workout-history-list');
    const workoutHistoryTitle = document.getElementById('workout-history-title');
    const savedWorkoutsDialog = document.getElementById('saved-workouts-dialog');
    const savedWorkoutsList = document.getElementById('saved-workouts-list');
    const createNewWorkoutBtn = document.getElementById('create-new-workout-btn');
    const closeSavedWorkoutsBtn = document.getElementById('close-saved-workouts-btn');

    // State
    let selectedExercises = [];
    let currentWorkoutExercises = [];
    let workoutHistory = [];
    let savedWorkouts = [];
    let isWorkoutActive = false;
    let editingWorkoutId = null;
    let editingSavedEntryId = null;

    // Firebase references
    const getWorkoutsRef = () => {
        const user = AuthModule.getCurrentUser();
        return database.ref(`users/${user.uid}/workouts`);
    };

    const getSavedEntriesRef = () => {
        const user = AuthModule.getCurrentUser();
        return database.ref(`users/${user.uid}/savedWorkoutEntries`);
    };

    // Load workout history from Firebase
    const loadWorkoutHistory = () => {
        const workoutsRef = getWorkoutsRef();
        
        workoutsRef.on('value', (snapshot) => {
            workoutHistory = [];
            
            if (workoutHistoryList) {
                workoutHistoryList.innerHTML = '';
            }
            
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
            } else if (workoutHistoryList) {
                workoutHistoryList.innerHTML = '<p>No workout history yet. Start a new workout to see your history here.</p>';
            }
        });
        
        // Update history title with user's name
        const userData = AuthModule.getUserData();
        if (userData && userData.name && workoutHistoryTitle) {
            workoutHistoryTitle.textContent = `${userData.name}'s Workout History`;
        }
    };

    // Load saved workout entries
    const loadSavedEntries = () => {
        const savedEntriesRef = getSavedEntriesRef();
        
        return new Promise((resolve, reject) => {
            savedEntriesRef.once('value', (snapshot) => {
                savedWorkouts = [];
                
                const data = snapshot.val();
                if (data) {
                    Object.keys(data).forEach(key => {
                        const savedWorkout = {
                            id: key,
                            ...data[key]
                        };
                        savedWorkouts.push(savedWorkout);
                    });
                    
                    // Sort saved workouts by date (newest first)
                    savedWorkouts.sort((a, b) => b.timestamp - a.timestamp);
                }
                
                console.log(`Loaded ${savedWorkouts.length} saved entries`);
                resolve(savedWorkouts);
            }, (error) => {
                console.error("Error loading saved entries:", error);
                reject(error);
            });
        });
    };

    // Render workout history
    const renderWorkoutHistory = () => {
        if (!workoutHistoryList) return;
        
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
        if (!template) return document.createElement('div');
        
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
        
        // Set body weight if available
        const bodyWeightDisplay = workoutItem.querySelector('.workout-body-weight');
        if (workout.bodyWeight) {
            bodyWeightDisplay.innerHTML = `<i class="fas fa-weight"></i> Body Weight: <strong>${workout.bodyWeight} kg</strong>`;
            bodyWeightDisplay.classList.remove('hidden');
        }
        
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
                exerciseItem.className = 'exercise-detail';
                exerciseItem.innerHTML = `<strong>${exercise.name}</strong>: ${setCount} set${setCount === 1 ? '' : 's'}`;
                
                // Add set details
                if (exercise.sets && Object.keys(exercise.sets).length > 0) {
                    const setsContainer = document.createElement('div');
                    setsContainer.className = 'sets-details-container';
                    
                    Object.values(exercise.sets).forEach((set, index) => {
                        const setDetail = document.createElement('div');
                        setDetail.className = 'set-details';
                        
                        let setInfo = `Set ${index + 1}: `;
                        
                        if (set.weight || set.reps) {
                            setInfo += `<strong>${set.weight || 0}</strong> kg/lbs × <strong>${set.reps || 0}</strong> reps`;
                        } else {
                            setInfo += 'No data recorded';
                        }
                        
                        if (set.remarks) {
                            setInfo += ` <span class="set-remarks">(${set.remarks})</span>`;
                        }
                        
                        setDetail.innerHTML = setInfo;
                        setsContainer.appendChild(setDetail);
                    });
                    
                    exerciseItem.appendChild(setsContainer);
                }
                
                exercisesList.appendChild(exerciseItem);
            });
            
            detailsContainer.appendChild(exercisesList);
        }
        
        // Add event listeners
        const viewWorkoutBtn = workoutItem.querySelector('.view-workout-btn');
        if (viewWorkoutBtn) {
            viewWorkoutBtn.addEventListener('click', () => {
                detailsContainer.classList.toggle('hidden');
            });
        }
        
        // Add edit button event listener
        const editWorkoutBtn = workoutItem.querySelector('.edit-workout-btn');
        if (editWorkoutBtn) {
            editWorkoutBtn.addEventListener('click', () => {
                editWorkout(workout.id);
            });
        }
        
        return workoutItem;
    };

    // Initialize new workout
    const initNewWorkout = () => {
        // Check for saved entries
        loadSavedEntries().then(savedEntries => {
            if (savedEntries.length > 0) {
                // Show saved entries dialog
                showSavedEntriesDialog();
            } else {
                // No saved entries, create a new workout
                createNewWorkout();
            }
        }).catch(error => {
            console.error("Error loading saved entries:", error);
            // Default to creating a new workout if there's an error
            createNewWorkout();
        });
    };

    // Create new workout
    const createNewWorkout = () => {
        // Set default date to today
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        if (workoutDate) {
            workoutDate.value = `${yyyy}-${mm}-${dd}`;
        }
        
        // Clear name and body weight fields
        if (workoutName) {
            workoutName.value = '';
        }
        
        if (bodyWeight) {
            bodyWeight.value = '';
        }
        
        // Clear current workout exercises
        currentWorkoutExercises = [];
        if (currentWorkout) {
            currentWorkout.innerHTML = '';
        }
        
        // Hide start workout button
        if (startWorkoutBtn) {
            startWorkoutBtn.classList.add('hidden');
        }
        
        // Reset workout active state
        isWorkoutActive = false;
        
        // Reset editing state
        editingWorkoutId = null;
        editingSavedEntryId = null;
        
        // Hide timer
        if (typeof TimerModule !== 'undefined') {
            TimerModule.hideTimer();
        }
    };

    // Show saved entries dialog
    const showSavedEntriesDialog = () => {
        // First, make sure the element exists
        const savedWorkoutsList = document.getElementById('saved-workouts-list');
        const savedWorkoutsDialog = document.getElementById('saved-workouts-dialog');
        
        if (!savedWorkoutsList || !savedWorkoutsDialog) {
            console.error("Required DOM elements for saved entries dialog not found");
            // Create a backup approach - just create a new workout
            createNewWorkout();
            return;
        }
        
        // Clear previous list
        savedWorkoutsList.innerHTML = '';
        
        // Create a list item for each saved entry
        if (savedWorkouts && savedWorkouts.length > 0) {
            savedWorkouts.forEach(workout => {
                const workoutItem = document.createElement('div');
                workoutItem.className = 'saved-workout-item';
                workoutItem.dataset.id = workout.id;
                
                const workoutDate = new Date(workout.date);
                const formattedDate = workoutDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                const exerciseCount = workout.exercises ? Object.keys(workout.exercises).length : 0;
                
                workoutItem.innerHTML = `
                    <h4>${workout.name || 'Unnamed Workout'}</h4>
                    <div class="workout-date">${formattedDate}</div>
                    <div class="exercise-count">${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}</div>
                `;
                
                // Add click event to load the saved entry
                workoutItem.addEventListener('click', () => {
                    loadSavedEntry(workout.id);
                    savedWorkoutsDialog.classList.add('hidden');
                });
                
                savedWorkoutsList.appendChild(workoutItem);
            });
            
            // Show dialog
            savedWorkoutsDialog.classList.remove('hidden');
        } else {
            // No saved entries, just create a new workout
            console.log("No saved workouts found, creating a new workout");
            createNewWorkout();
        }
    };

    // Load saved entry
    const loadSavedEntry = (entryId) => {
        const savedEntry = savedWorkouts.find(entry => entry.id === entryId);
        if (!savedEntry) return;
        
        // Set form fields
        if (workoutDate) {
            workoutDate.value = savedEntry.date;
        }
        
        if (workoutName) {
            workoutName.value = savedEntry.name || '';
        }
        
        if (bodyWeight) {
            bodyWeight.value = savedEntry.bodyWeight || '';
        }
        
        // Clear current workout exercises
        currentWorkoutExercises = [];
        if (currentWorkout) {
            currentWorkout.innerHTML = '';
        }
        
        // Set editing state
        editingSavedEntryId = entryId;
        
        // Load exercises
        if (savedEntry.exercises) {
            Object.keys(savedEntry.exercises).forEach(exerciseId => {
                const exercise = ExercisesModule.getExerciseById(exerciseId);
                if (exercise) {
                    // Add to current workout exercises
                    currentWorkoutExercises.push(exercise);
                    
                    // Create exercise element
                    const exerciseElement = createWorkoutExerciseElement(exercise);
                    if (currentWorkout && exerciseElement) {
                        currentWorkout.appendChild(exerciseElement);
                    }
                    
                    // Load sets
                    const savedExercise = savedEntry.exercises[exerciseId];
                    if (savedExercise.sets && exerciseElement) {
                        const setsContainer = exerciseElement.querySelector('.sets-container');
                        if (setsContainer) {
                            setsContainer.innerHTML = ''; // Clear any default sets
                            
                            Object.keys(savedExercise.sets).forEach((setKey, index) => {
                                const set = savedExercise.sets[setKey];
                                const setElement = addSetToExercise(exerciseElement);
                                
                                if (setElement) {
                                    // Set values
                                    const weightInput = setElement.querySelector('.weight-input');
                                    const repsInput = setElement.querySelector('.reps-input');
                                    const remarksInput = setElement.querySelector('.remarks-input');
                                    
                                    if (weightInput) weightInput.value = set.weight || '';
                                    if (repsInput) repsInput.value = set.reps || '';
                                    if (remarksInput) remarksInput.value = set.remarks || '';
                                }
                            });
                        }
                    }
                }
            });
        }
        
        // Show start workout button if exercises are added
        if (currentWorkoutExercises.length > 0 && startWorkoutBtn) {
            startWorkoutBtn.classList.remove('hidden');
        }
    };

    // Edit workout from history
    const editWorkout = (workoutId) => {
        const workout = workoutHistory.find(w => w.id === workoutId);
        if (!workout) return;
        
        // Clear current workout
        currentWorkoutExercises = [];
        if (currentWorkout) {
            currentWorkout.innerHTML = '';
        }
        
        // Set form fields
        if (workoutDate) {
            workoutDate.value = workout.date;
        }
        
        if (workoutName) {
            workoutName.value = workout.name || '';
        }
        
        if (bodyWeight) {
            bodyWeight.value = workout.bodyWeight || '';
        }
        
        // Set editing state
        editingWorkoutId = workoutId;
        
        // Load exercises
        if (workout.exercises) {
            Object.keys(workout.exercises).forEach(exerciseId => {
                const exercise = ExercisesModule.getExerciseById(exerciseId);
                if (exercise) {
                    // Add to current workout exercises
                    currentWorkoutExercises.push(exercise);
                    
                    // Create exercise element
                    const exerciseElement = createWorkoutExerciseElement(exercise);
                    if (currentWorkout && exerciseElement) {
                        currentWorkout.appendChild(exerciseElement);
                    }
                    
                    // Load sets
                    const savedExercise = workout.exercises[exerciseId];
                    if (savedExercise.sets && exerciseElement) {
                        const setsContainer = exerciseElement.querySelector('.sets-container');
                        if (setsContainer) {
                            setsContainer.innerHTML = ''; // Clear any default sets
                            
                            Object.keys(savedExercise.sets).forEach((setKey, index) => {
                                const set = savedExercise.sets[setKey];
                                const setElement = addSetToExercise(exerciseElement);
                                
                                if (setElement) {
                                    // Set values
                                    const weightInput = setElement.querySelector('.weight-input');
                                    const repsInput = setElement.querySelector('.reps-input');
                                    const remarksInput = setElement.querySelector('.remarks-input');
                                    
                                    if (weightInput) weightInput.value = set.weight || '';
                                    if (repsInput) repsInput.value = set.reps || '';
                                    if (remarksInput) remarksInput.value = set.remarks || '';
                                }
                            });
                        }
                    }
                }
            });
        }
        
        // Show start workout button if exercises are added
        if (currentWorkoutExercises.length > 0 && startWorkoutBtn) {
            startWorkoutBtn.classList.remove('hidden');
        }
        
        // Switch to new workout section
        const newWorkoutBtn = document.getElementById('new-workout-btn');
        if (newWorkoutBtn) {
            newWorkoutBtn.click();
        }
    };

    // Open exercise selection dialog
    const openExerciseSelection = () => {
        if (!exerciseSelection || !exerciseSelectionList) {
            console.error("Exercise selection elements not found");
            return;
        }
        
        // Get all exercises from the Exercises Module
        const allExercises = ExercisesModule.getAllExercises();
        
        // Clear previous selection
        exerciseSelectionList.innerHTML = '';
        selectedExercises = [];
        
        if (allExercises.length === 0) {
            exerciseSelectionList.innerHTML = '<p>No exercises available. Please add exercises first.</p>';
            if (confirmExercisesBtn) {
                confirmExercisesBtn.disabled = true;
            }
        } else {
            // Create checklist items for each exercise
            allExercises.forEach(exercise => {
                const item = document.createElement('div');
                item.className = 'checklist-item';
                item.dataset.name = exercise.name.toLowerCase();
                
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
                
                // Ensure proper styling and layout
                item.style.display = 'flex';
                item.style.alignItems = 'center'; 
                item.style.width = '100%';
                checkbox.style.marginRight = '12px';
                label.style.flex = '1';
                
                item.appendChild(checkbox);
                item.appendChild(label);
                exerciseSelectionList.appendChild(item);
            });
            
            if (confirmExercisesBtn) {
                confirmExercisesBtn.disabled = false;
            }
        }
        
        exerciseSelection.classList.remove('hidden');
        
        // Reset search input
        if (exerciseSearchInput) {
            exerciseSearchInput.value = '';
            filterExercises('');
        }
    };

    // Filter exercises in selection list
    const filterExercises = (searchTerm) => {
        if (!exerciseSelectionList) return;
        
        const items = exerciseSelectionList.querySelectorAll('.checklist-item');
        searchTerm = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const exerciseName = item.dataset.name;
            if (exerciseName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    };

    // Close exercise selection dialog
    const closeExerciseSelection = () => {
        if (exerciseSelection) {
            exerciseSelection.classList.add('hidden');
        }
        selectedExercises = [];
    };

    // Handle exercise selection confirmation
    const confirmExerciseSelection = () => {
        if (!exerciseSelectionList) return;
        
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
        
        // Show start workout button if exercises are selected
        if (currentWorkoutExercises.length > 0 && startWorkoutBtn) {
            startWorkoutBtn.classList.remove('hidden');
        }
    };

    // Start workout timer
    const startWorkout = () => {
        if (!isWorkoutActive) {
            // Starting the workout
            isWorkoutActive = true;
            if (typeof TimerModule !== 'undefined') {
                TimerModule.startTimer();
            }
            if (startWorkoutBtn) {
                startWorkoutBtn.classList.add('active');
                startWorkoutBtn.innerHTML = '<i class="fas fa-stop-circle"></i> End Workout';
            }
        } else {
            // Ending the workout - ask if user wants to save
            if (currentWorkoutExercises.length > 0) {
                // Show custom confirm dialog
                const customDialog = document.getElementById('custom-confirm-dialog');
                const dialogMessage = document.getElementById('dialog-message');
                const yesBtn = document.getElementById('dialog-yes-btn');
                const noBtn = document.getElementById('dialog-no-btn');
                
                if (customDialog && yesBtn && noBtn) {
                    if (dialogMessage) {
                        dialogMessage.textContent = 'Would you like to save this workout?';
                    }
                    
                    customDialog.classList.remove('hidden');
                    
                    // Handle Yes button
                    yesBtn.onclick = () => {
                        customDialog.classList.add('hidden');
                        saveWorkout();
                    };
                    
                    // Handle No button
                    noBtn.onclick = () => {
                        customDialog.classList.add('hidden');
                        // Just end workout without saving
                        isWorkoutActive = false;
                        if (typeof TimerModule !== 'undefined') {
                            TimerModule.hideTimer();
                        }
                        if (startWorkoutBtn) {
                            startWorkoutBtn.classList.remove('active');
                            startWorkoutBtn.innerHTML = '<i class="fas fa-play-circle"></i> Start Workout';
                        }
                    };
                } else {
                    // Fallback if dialog elements don't exist
                    if (confirm('Would you like to save this workout?')) {
                        saveWorkout();
                    } else {
                        isWorkoutActive = false;
                        if (typeof TimerModule !== 'undefined') {
                            TimerModule.hideTimer();
                        }
                        if (startWorkoutBtn) {
                            startWorkoutBtn.classList.remove('active');
                            startWorkoutBtn.innerHTML = '<i class="fas fa-play-circle"></i> Start Workout';
                        }
                    }
                }
            } else {
                // No exercises to save, just end workout
                isWorkoutActive = false;
                if (typeof TimerModule !== 'undefined') {
                    TimerModule.hideTimer();
                }
                if (startWorkoutBtn) {
                    startWorkoutBtn.classList.remove('active');
                    startWorkoutBtn.innerHTML = '<i class="fas fa-play-circle"></i> Start Workout';
                }
            }
        }
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
        if (currentWorkout && exerciseElement) {
            currentWorkout.appendChild(exerciseElement);
        }
        
        // Show start workout button if not already shown
        if (startWorkoutBtn) {
            startWorkoutBtn.classList.remove('hidden');
        }
    };

    // Create workout exercise element from template
    const createWorkoutExerciseElement = (exercise) => {
        const template = document.getElementById('workout-exercise-template');
        if (!template) return null;
        
        const exerciseElement = document.importNode(template.content, true).querySelector('.workout-exercise');
        
        exerciseElement.dataset.id = exercise.id;
        
        // Set exercise name
        exerciseElement.querySelector('.exercise-name').textContent = exercise.name;
        
        // Add event listeners
        const historyBtn = exerciseElement.querySelector('.history-btn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                toggleExerciseHistory(exerciseElement, exercise.id);
            });
        }
        
        const progressBtn = exerciseElement.querySelector('.view-progress-btn');
        if (progressBtn) {
            progressBtn.addEventListener('click', () => {
                if (typeof ProgressModule !== 'undefined') {
                    ProgressModule.showExerciseProgress(exercise.id);
                }
            });
        }
        
        const addSetBtn = exerciseElement.querySelector('.add-set-btn');
        if (addSetBtn) {
            addSetBtn.addEventListener('click', () => {
                addSetToExercise(exerciseElement);
            });
        }
        
        const removeBtn = exerciseElement.querySelector('.remove-exercise-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                removeExerciseFromWorkout(exerciseElement, exercise.id);
            });
        }
        
        // Add initial set
        addSetToExercise(exerciseElement);
        
        return exerciseElement;
    };

    // Add set to exercise
    const addSetToExercise = (exerciseElement) => {
        const setsContainer = exerciseElement.querySelector('.sets-container');
        if (!setsContainer) return null;
        
        const setCount = setsContainer.children.length + 1;
        
        const template = document.getElementById('set-template');
        if (!template) return null;
        
        const setElement = document.importNode(template.content, true).querySelector('.set-item');
        
        // Set the set number
        const setLabel = setElement.querySelector('.set-label');
        if (setLabel) {
            setLabel.textContent = `Set ${setCount}`;
        }
        
        // Add event listener for delete button
        const deleteBtn = setElement.querySelector('.delete-set-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (setsContainer.children.length > 1) {
                    setElement.remove();
                    
                    // Update set numbers
                    Array.from(setsContainer.children).forEach((set, index) => {
                        const label = set.querySelector('.set-label');
                        if (label) {
                            label.textContent = `Set ${index + 1}`;
                        }
                    });
                } else {
                    alert('You need at least one set. Remove the exercise instead if not needed.');
                }
            });
        }
        
        setsContainer.appendChild(setElement);
        return setElement;
    };

    // Toggle exercise history display
    const toggleExerciseHistory = (exerciseElement, exerciseId) => {
        const historySection = exerciseElement.querySelector('.exercise-history');
        if (!historySection) return;
        
        const historyData = historySection.querySelector('.history-data');
        if (!historyData) return;
        
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
        
        historyRef.orderByChild('timestamp').limitToLast(10).once('value', (snapshot) => {
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
        
        if (workout.bodyWeight) {
            historyHeader.innerHTML += ` | Body Weight: <strong>${workout.bodyWeight} kg</strong>`;
        }
        
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

// Hide start workout button if no exercises remain
if (currentWorkoutExercises.length === 0 && startWorkoutBtn) {
    startWorkoutBtn.classList.add('hidden');
    
    // Also stop timer if active
    if (isWorkoutActive) {
        isWorkoutActive = false;
        if (typeof TimerModule !== 'undefined') {
            TimerModule.hideTimer();
        }
    }
}
}
};

// Save workout entry (without completing it)
const saveEntry = () => {
// Validate
if (currentWorkoutExercises.length === 0) {
alert('Please add at least one exercise to the workout.');
return;
}

if (!workoutDate || !workoutDate.value) {
alert('Please select a date for the workout.');
return;
}

// Collect workout data
const workoutData = {
name: workoutName ? workoutName.value.trim() || 'Workout in Progress' : 'Workout in Progress',
date: workoutDate.value,
bodyWeight: bodyWeight && bodyWeight.value ? parseFloat(bodyWeight.value) : null,
timestamp: firebase.database.ServerValue.TIMESTAMP,
exercises: {}
};

// Process each exercise and its sets
const exerciseElements = currentWorkout ? currentWorkout.querySelectorAll('.workout-exercise') : [];
let hasValidData = false;

exerciseElements.forEach(exerciseElement => {
const exerciseId = exerciseElement.dataset.id;
const exercise = ExercisesModule.getExerciseById(exerciseId);

if (exercise) {
    const sets = {};
    const setElements = exerciseElement.querySelectorAll('.set-item');
    
    setElements.forEach((setElement, index) => {
        const weightInput = setElement.querySelector('.weight-input');
        const repsInput = setElement.querySelector('.reps-input');
        const remarksInput = setElement.querySelector('.remarks-input');
        
        const weight = weightInput ? weightInput.value : '';
        const reps = repsInput ? repsInput.value : '';
        const remarks = remarksInput ? remarksInput.value : '';
        
        sets[`set${index + 1}`] = {
            weight: weight || '',
            reps: reps || '',
            remarks: remarks || ''
        };
        
        if (weight || reps) {
            hasValidData = true;
        }
    });
    
    workoutData.exercises[exerciseId] = {
        name: exercise.name,
        category: exercise.category,
        sets: sets
    };
}
});

// Save to Firebase
const savedEntriesRef = getSavedEntriesRef();

if (editingSavedEntryId) {
// Update existing entry
savedEntriesRef.child(editingSavedEntryId).update(workoutData)
    .then(() => {
        alert('Entry updated successfully!');
        // Reload saved entries to keep local data in sync
        loadSavedEntries();
    })
    .catch(error => {
        alert(`Error updating entry: ${error.message}`);
    });
} else {
// Add new entry
savedEntriesRef.push(workoutData)
    .then((reference) => {
        alert('Entry saved successfully!');
        // Set the editing ID to the new entry
        editingSavedEntryId = reference.key;
        // Reload saved entries to keep local data in sync
        loadSavedEntries();
    })
    .catch(error => {
        alert(`Error saving entry: ${error.message}`);
    });
}
};

// Save completed workout to Firebase
const saveWorkout = () => {
// Validate
if (currentWorkoutExercises.length === 0) {
alert('Please add at least one exercise to the workout.');
return;
}

if (!workoutDate || !workoutDate.value) {
alert('Please select a date for the workout.');
return;
}

// Collect workout data
const workoutData = {
name: workoutName ? workoutName.value.trim() || 'Workout' : 'Workout',
date: workoutDate.value,
bodyWeight: bodyWeight && bodyWeight.value ? parseFloat(bodyWeight.value) : null,
timestamp: firebase.database.ServerValue.TIMESTAMP,
exercises: {}
};

// Process each exercise and its sets
const exerciseElements = currentWorkout ? currentWorkout.querySelectorAll('.workout-exercise') : [];
let hasValidSets = false;

exerciseElements.forEach(exerciseElement => {
const exerciseId = exerciseElement.dataset.id;
const exercise = ExercisesModule.getExerciseById(exerciseId);

if (exercise) {
    const sets = {};
    const setElements = exerciseElement.querySelectorAll('.set-item');
    
    setElements.forEach((setElement, index) => {
        const weightInput = setElement.querySelector('.weight-input');
        const repsInput = setElement.querySelector('.reps-input');
        const remarksInput = setElement.querySelector('.remarks-input');
        
        const weight = weightInput ? weightInput.value : '';
        const reps = repsInput ? repsInput.value : '';
        const remarks = remarksInput ? remarksInput.value : '';
        
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

if (editingWorkoutId) {
// Update existing workout
workoutsRef.child(editingWorkoutId).update(workoutData)
    .then(() => {
        alert('Workout updated successfully!');
        
        // If this was also a saved entry, remove it
        if (editingSavedEntryId) {
            getSavedEntriesRef().child(editingSavedEntryId).remove()
                .then(() => {
                    console.log('Saved entry removed after completion');
                })
                .catch(error => {
                    console.error('Error removing saved entry:', error);
                });
        }
        
        createNewWorkout();
    })
    .catch(error => {
        alert(`Error updating workout: ${error.message}`);
    });
} else {
// Add new workout
workoutsRef.push(workoutData)
    .then(() => {
        alert('Workout saved successfully!');
        
        // If this was also a saved entry, remove it
        if (editingSavedEntryId) {
            getSavedEntriesRef().child(editingSavedEntryId).remove()
                .then(() => {
                    console.log('Saved entry removed after completion');
                })
                .catch(error => {
                    console.error('Error removing saved entry:', error);
                });
        }
        
        createNewWorkout();
    })
    .catch(error => {
        alert(`Error saving workout: ${error.message}`);
    });
}
};

// Initialize
const init = () => {
try {
// Set default date
createNewWorkout();

// Event listeners with null checks
if (selectExercisesBtn) {
    selectExercisesBtn.addEventListener('click', openExerciseSelection);
}

if (confirmExercisesBtn) {
    confirmExercisesBtn.addEventListener('click', confirmExerciseSelection);
}

if (cancelSelectionBtn) {
    cancelSelectionBtn.addEventListener('click', closeExerciseSelection);
}

if (saveWorkoutBtn) {
    saveWorkoutBtn.addEventListener('click', saveWorkout);
}

if (saveEntryBtn) {
    saveEntryBtn.addEventListener('click', saveEntry);
}

if (startWorkoutBtn) {
    startWorkoutBtn.addEventListener('click', startWorkout);
}

// Exercise search functionality
if (exerciseSearchInput) {
    exerciseSearchInput.addEventListener('input', (e) => {
        filterExercises(e.target.value);
    });
}

// Saved entries dialog buttons
if (createNewWorkoutBtn) {
    createNewWorkoutBtn.addEventListener('click', () => {
        if (savedWorkoutsDialog) {
            savedWorkoutsDialog.classList.add('hidden');
        }
        createNewWorkout();
    });
}

if (closeSavedWorkoutsBtn) {
    closeSavedWorkoutsBtn.addEventListener('click', () => {
        if (savedWorkoutsDialog) {
            savedWorkoutsDialog.classList.add('hidden');
        }
    });
}

// Load workout history
loadWorkoutHistory();

} catch (error) {
console.error("Error initializing WorkoutsModule:", error);
}
};

// Public methods and properties
return {
init,
initNewWorkout,
loadSavedEntries,
createNewWorkout
};
})();