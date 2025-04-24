/**
 * Workouts Module
 * Handles workouts display and logging functionality
 */
const WorkoutsModule = (() => {
    // DOM Elements - Workout Plan View
    const workoutDaysTabs = document.getElementById('workout-days-tabs');
    const workoutContent = document.getElementById('workout-content');
    
    // DOM Elements - Workout Logging
    const logDateInput = document.getElementById('log-date');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const exerciseSelection = document.getElementById('exercise-selection');
    const exerciseList = document.getElementById('exercise-list');
    const exerciseSearch = document.getElementById('exercise-search');
    const loggedExercises = document.getElementById('logged-exercises');
    const saveWorkoutLogBtn = document.getElementById('save-workout-log-btn');
    
    // Templates
    const exerciseLogTemplate = document.getElementById('exercise-log-template');
    const exerciseSetTemplate = document.getElementById('exercise-set-template');
    const workoutDayTemplate = document.getElementById('workout-day-template');
    const workoutExerciseTemplate = document.getElementById('workout-exercise-template');
    
    // State variables
    let currentWorkoutPlan = null;
    let exerciseLibrary = [];
    let activeDay = 'day1';
  
    /**
     * Loads the workout plan for the client
     */
    const loadWorkoutPlan = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const workoutPlanRef = database.ref(`clients/${userId}/workoutPlan`);
        const snapshot = await workoutPlanRef.once('value');
        currentWorkoutPlan = snapshot.val();
        
        // Display workout plan
        renderWorkoutPlan();
      } catch (error) {
        console.error('Error loading workout plan:', error);
        workoutContent.innerHTML = '<p>Error loading workout plan. Please try again later.</p>';
      }
    };
  
    /**
     * Renders the workout plan UI
     */
    const renderWorkoutPlan = () => {
      // Clear existing content
      workoutDaysTabs.innerHTML = '';
      workoutContent.innerHTML = '';
      
      if (!currentWorkoutPlan) {
        workoutContent.innerHTML = `
          <div class="empty-state">
            <p>No workout plan has been assigned to you yet.</p>
            <p>Your coach will create and assign a plan soon.</p>
          </div>
        `;
        return;
      }
      
      // Create day tabs
      for (let i = 1; i <= 7; i++) {
        const dayKey = `day${i}`;
        const dayData = currentWorkoutPlan[dayKey];
        
        if (!dayData) continue;
        
        const dayName = dayData.name || `Day ${i}`;
        const dayTab = document.createElement('button');
        dayTab.className = `workout-day-tab ${dayKey === activeDay ? 'active' : ''}`;
        dayTab.dataset.day = dayKey;
        dayTab.textContent = dayName;
        
        dayTab.addEventListener('click', () => {
          // Update active tab
          document.querySelectorAll('.workout-day-tab').forEach(tab => {
            tab.classList.remove('active');
          });
          dayTab.classList.add('active');
          
          // Show corresponding day content
          showWorkoutDay(dayKey);
        });
        
        workoutDaysTabs.appendChild(dayTab);
      }
      
      // Show the active day content
      showWorkoutDay(activeDay);
    };
  
    /**
     * Shows the workout day content
     */
    const showWorkoutDay = (dayKey) => {
      // Update active day
      activeDay = dayKey;
      
      // Get day data
      const dayData = currentWorkoutPlan[dayKey];
      
      if (!dayData || !dayData.exercises || dayData.exercises.length === 0) {
        workoutContent.innerHTML = `
          <div class="empty-state">
            <p>No exercises scheduled for this day.</p>
          </div>
        `;
        return;
      }
      
      // Create day content from template
      const dayTemplate = workoutDayTemplate.content.cloneNode(true);
      const dayElement = dayTemplate.querySelector('.workout-day');
      
      // Set day name
      dayElement.querySelector('.day-name').textContent = dayData.name || `Day ${dayKey.replace('day', '')}`;
      
      // Add exercises
      const exercisesContainer = dayElement.querySelector('.workout-exercises');
      
      dayData.exercises.forEach(exercise => {
        const exerciseTemplate = workoutExerciseTemplate.content.cloneNode(true);
        const exerciseElement = exerciseTemplate.querySelector('.workout-exercise');
        
        exerciseElement.querySelector('.exercise-name').textContent = exercise.name;
        exerciseElement.querySelector('.exercise-sets-reps').textContent = `${exercise.sets} sets × ${exercise.reps}`;
        
        if (exercise.notes) {
          exerciseElement.querySelector('.exercise-notes').textContent = exercise.notes;
        } else {
          exerciseElement.querySelector('.exercise-notes').classList.add('hidden');
        }
        
        exercisesContainer.appendChild(exerciseElement);
      });
      
      // Clear and add to workout content
      workoutContent.innerHTML = '';
      workoutContent.appendChild(dayElement);
    };
  
    /**
     * Loads the exercise library for exercise selection
     */
    const loadExerciseLibrary = async () => {
      try {
        const exercisesRef = database.ref('exercises');
        const snapshot = await exercisesRef.once('value');
        const exercises = snapshot.val();
        
        // Clear current library
        exerciseLibrary = [];
        
        if (exercises) {
          // Convert to array and sort alphabetically
          Object.keys(exercises).forEach(key => {
            exerciseLibrary.push({
              id: key,
              ...exercises[key]
            });
          });
          
          exerciseLibrary.sort((a, b) => a.name.localeCompare(b.name));
        }
      } catch (error) {
        console.error('Error loading exercise library:', error);
      }
    };
  
    /**
     * Shows the exercise selection UI
     */
    const showExerciseSelection = () => {
      exerciseSelection.classList.remove('hidden');
      
      // Populate exercise list
      renderExerciseList();
    };
  
    /**
     * Renders the exercise selection list
     */
    const renderExerciseList = (searchTerm = '') => {
      // Clear current list
      exerciseList.innerHTML = '';
      
      if (exerciseLibrary.length === 0) {
        exerciseList.innerHTML = '<p>No exercises available in library.</p>';
        return;
      }
      
      // Filter exercises if search term provided
      const filteredExercises = searchTerm 
        ? exerciseLibrary.filter(exercise => 
            exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (exercise.category && exercise.category.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : exerciseLibrary;
      
      if (filteredExercises.length === 0) {
        exerciseList.innerHTML = `<p>No exercises found matching "${searchTerm}".</p>`;
        return;
      }
      
      // Create exercise items
      filteredExercises.forEach(exercise => {
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'exercise-item';
        exerciseItem.textContent = exercise.name;
        exerciseItem.dataset.id = exercise.id;
        
        exerciseItem.addEventListener('click', () => {
          addExerciseToLog(exercise);
          exerciseSelection.classList.add('hidden');
        });
        
        exerciseList.appendChild(exerciseItem);
      });
    };
  
    /**
     * Adds an exercise to the workout log
     */
    const addExerciseToLog = (exercise) => {
      // Clone template
      const template = exerciseLogTemplate.content.cloneNode(true);
      const exerciseElement = template.querySelector('.logged-exercise');
      
      // Set exercise data
      exerciseElement.dataset.id = exercise.id;
      exerciseElement.querySelector('.exercise-name').textContent = exercise.name;
      
      // Add event listeners
      exerciseElement.querySelector('.add-set-btn').addEventListener('click', () => {
        addSetToExercise(exerciseElement);
      });
      
      exerciseElement.querySelector('.remove-exercise-btn').addEventListener('click', () => {
        if (confirm('Remove this exercise from your log?')) {
          exerciseElement.remove();
          
          // Check if there are any exercises left
          if (loggedExercises.querySelectorAll('.logged-exercise').length === 0) {
            loggedExercises.innerHTML = `
              <div class="empty-state">
                <p>No exercises logged yet. Click "Add Exercise" to start logging your workout.</p>
              </div>
            `;
          }
        }
      });
      
      // Add initial set
      const setsContainer = exerciseElement.querySelector('.sets-container');
      addSetToExercise(exerciseElement);
      
      // Check if empty state message exists and remove it
      const emptyState = loggedExercises.querySelector('.empty-state');
      if (emptyState) {
        loggedExercises.innerHTML = '';
      }
      
      // Add to logged exercises
      loggedExercises.appendChild(exerciseElement);
    };
  
    /**
     * Adds a set to an exercise
     */
    const addSetToExercise = (exerciseElement) => {
      const setsContainer = exerciseElement.querySelector('.sets-container');
      const setCount = setsContainer.children.length + 1;
      
      // Clone template
      const template = exerciseSetTemplate.content.cloneNode(true);
      const setElement = template.querySelector('.exercise-set');
      
      // Set set number
      setElement.querySelector('.set-label').textContent = `Set ${setCount}`;
      
      // Add event listener for remove button
      setElement.querySelector('.remove-set-btn').addEventListener('click', () => {
        // Make sure there's at least one set
        if (setsContainer.children.length > 1) {
          setElement.remove();
          
          // Renumber sets
          Array.from(setsContainer.children).forEach((set, index) => {
            set.querySelector('.set-label').textContent = `Set ${index + 1}`;
          });
        } else {
          alert('You must have at least one set. Remove the exercise instead if not needed.');
        }
      });
      
      setsContainer.appendChild(setElement);
    };
  
    /**
     * Saves the workout log to Firebase
     */
    const saveWorkoutLog = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const logDate = logDateInput.value;
        
        if (!logDate) {
          alert('Please select a date for your workout.');
          return;
        }
        
        const exerciseElements = loggedExercises.querySelectorAll('.logged-exercise');
        
        if (exerciseElements.length === 0) {
          alert('Please add at least one exercise to your workout log.');
          return;
        }
        
        // Build workout data
        const workoutData = {
          date: logDate,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          exercises: []
        };
        
        let isValid = false;
        
        // Process each exercise
        exerciseElements.forEach(exerciseElement => {
          const exerciseId = exerciseElement.dataset.id;
          const exerciseName = exerciseElement.querySelector('.exercise-name').textContent;
          const setElements = exerciseElement.querySelectorAll('.exercise-set');
          
          const sets = [];
          
          // Process each set
          setElements.forEach(setElement => {
            const weight = setElement.querySelector('.weight-input').value;
            const reps = setElement.querySelector('.reps-input').value;
            const notes = setElement.querySelector('.notes-input').value;
            
            // At least one of weight or reps must be filled
            if (weight || reps) {
              isValid = true;
              sets.push({
                weight: weight || 0,
                reps: reps || 0,
                notes: notes || ''
              });
            }
          });
          
          workoutData.exercises.push({
            id: exerciseId,
            name: exerciseName,
            sets
          });
        });
        
        if (!isValid) {
          alert('Please enter at least weight or reps for one set.');
          return;
        }
        
        // Save to Firebase
        await database.ref(`clients/${userId}/logs/${logDate}/workout`).set(workoutData);
        
        // Show success message
        Utils.showNotification('Workout saved successfully!', 'success');
        
        // Reset form
        resetWorkoutLog();
        
      } catch (error) {
        console.error('Error saving workout log:', error);
        Utils.showNotification('Error saving workout. Please try again.', 'error');
      }
    };
  
    /**
     * Resets the workout log form
     */
    const resetWorkoutLog = () => {
      // Clear logged exercises
      loggedExercises.innerHTML = `
        <div class="empty-state">
          <p>No exercises logged yet. Click "Add Exercise" to start logging your workout.</p>
        </div>
      `;
      
      // Update log date to today
      logDateInput.value = Utils.formatDateForInput(new Date());
    };
  
    /**
     * Initialize workout logging form
     */
    const initWorkoutLogging = () => {
      // Set default date to today
      logDateInput.value = Utils.formatDateForInput(new Date());
      
      // Add event listeners
      addExerciseBtn.addEventListener('click', showExerciseSelection);
      
      exerciseSearch.addEventListener('input', (e) => {
        renderExerciseList(e.target.value);
      });
      
      document.addEventListener('click', (e) => {
        // Close exercise selection if clicking outside
        if (!exerciseSelection.contains(e.target) && 
            e.target !== addExerciseBtn &&
            !exerciseSelection.classList.contains('hidden')) {
          exerciseSelection.classList.add('hidden');
        }
      });
      
      saveWorkoutLogBtn.addEventListener('click', saveWorkoutLog);
    };
  
    /**
     * Initialize Workouts Module
     */
    const init = async () => {
      // Load workout plan
      await loadWorkoutPlan();
      
      // Load exercise library
      await loadExerciseLibrary();
      
      // Initialize workout logging
      initWorkoutLogging();
    };
  
    /**
     * Public methods and properties
     */
    return {
      init,
      loadWorkoutPlan
    };
  })();