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
 * Add these functions to the WorkoutsModule in workouts.js
 * Place them before the return statement at the end of the module
 */

/**
 * Shows the create workout plan modal
 */
const showCreateWorkoutPlanModal = () => {
    const modal = document.getElementById('workout-plan-modal');
    if (!modal) {
      console.error('Workout plan modal not found in DOM');
      Utils.showNotification('Unable to create workout plan. Please try again later.', 'error');
      return;
    }
    
    // Reset form
    const form = document.getElementById('workout-plan-form');
    if (form) form.reset();
    
    // Set title
    const titleElement = document.getElementById('workout-plan-form-title');
    if (titleElement) titleElement.textContent = 'Create Workout Plan';
    
    // Setup day tabs
    setupWorkoutDayTabs();
    
    // Show modal
    modal.classList.add('active');
    
    // Add event listeners
    setupWorkoutPlanEventListeners();
  };
  
  /**
   * Sets up the workout day tabs
   */
  const setupWorkoutDayTabs = () => {
    const dayTabs = document.querySelectorAll('.day-tab');
    const dayForms = document.querySelectorAll('.day-form');
    
    // Create day forms if they don't exist yet
    const workoutDayContent = document.getElementById('workout-day-content');
    
    // Make sure day 1 exists already (it should according to HTML)
    const day1Form = document.querySelector('.day-form[data-day="day1"]');
    
    if (!day1Form) {
      console.error('Day 1 form template not found');
      return;
    }
    
    // Create forms for days 2-7 if they don't exist
    for (let i = 2; i <= 7; i++) {
      const dayKey = `day${i}`;
      const existingForm = document.querySelector(`.day-form[data-day="${dayKey}"]`);
      
      if (!existingForm && workoutDayContent) {
        // Clone day 1 form
        const newDayForm = day1Form.cloneNode(true);
        newDayForm.classList.remove('active');
        newDayForm.dataset.day = dayKey;
        
        // Update IDs and values
        const dayNameInput = newDayForm.querySelector('input[id="day1-name"]');
        if (dayNameInput) {
          dayNameInput.id = `${dayKey}-name`;
          dayNameInput.value = `Day ${i}`;
        }
        
        // Update exercise list container
        const exercisesList = newDayForm.querySelector('#day1-exercises');
        if (exercisesList) {
          exercisesList.id = `${dayKey}-exercises`;
          exercisesList.innerHTML = ''; // Clear exercises
        }
        
        // Update add exercise button
        const addExerciseBtn = newDayForm.querySelector('.add-day-exercise');
        if (addExerciseBtn) {
          addExerciseBtn.dataset.day = dayKey;
        }
        
        workoutDayContent.appendChild(newDayForm);
      }
    }
    
    // Add tab click handlers
    dayTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const day = tab.dataset.day;
        
        // Set active tab
        dayTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show active form
        dayForms.forEach(form => {
          form.classList.remove('active');
          if (form.dataset.day === day) {
            form.classList.add('active');
          }
        });
      });
    });
    
    // Add "Add Exercise" button handlers for each day
    document.querySelectorAll('.add-day-exercise').forEach(button => {
      button.addEventListener('click', () => {
        const day = button.dataset.day;
        addExerciseToDay(day);
      });
    });
  };
  
  /**
   * Sets up event listeners for the workout plan form
   */
  const setupWorkoutPlanEventListeners = () => {
    // Cancel button
    const cancelBtn = document.getElementById('cancel-workout-plan-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const modal = document.getElementById('workout-plan-modal');
        if (modal) modal.classList.remove('active');
      });
    }
    
    // Save button / form submission
    const form = document.getElementById('workout-plan-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        saveWorkoutPlan();
      };
    }
  };
  
  /**
   * Adds an exercise to a day
   */
  const addExerciseToDay = async (day) => {
    const exercisesContainer = document.getElementById(`${day}-exercises`);
    if (!exercisesContainer) return;
    
    // Get exercise template
    const template = document.getElementById('day-exercise-template');
    if (!template) {
      console.error('Exercise template not found');
      return;
    }
    
    // Clone template
    const exerciseElement = document.importNode(template.content, true).querySelector('.day-exercise');
    
    // Populate exercise select
    const exerciseSelect = exerciseElement.querySelector('.exercise-select');
    
    // Load exercises if needed
    if (!exerciseLibrary || exerciseLibrary.length === 0) {
      try {
        await loadExerciseLibrary();
      } catch (error) {
        console.error('Error loading exercise library:', error);
      }
    }
    
    // Add options to select
    exerciseSelect.innerHTML = '<option value="">Select an exercise</option>';
    
    exerciseLibrary.forEach(exercise => {
      const option = document.createElement('option');
      option.value = exercise.id;
      option.textContent = exercise.name;
      exerciseSelect.appendChild(option);
    });
    
    // Add event handlers
    exerciseElement.querySelector('.remove-exercise-btn').addEventListener('click', () => {
      exerciseElement.remove();
    });
    
    // Add to container
    exercisesContainer.appendChild(exerciseElement);
  };
  
  /**
   * Saves the workout plan
   */
  const saveWorkoutPlan = async () => {
    try {
      const coachId = AuthModule.getCurrentUser().uid;
      
      // Get plan name and description
      const planName = document.getElementById('workout-plan-name').value.trim();
      const planDescription = document.getElementById('workout-plan-description').value.trim();
      
      if (!planName) {
        Utils.showNotification('Please enter a plan name.', 'error');
        return;
      }
      
      // Build plan data
      const planData = {
        name: planName,
        description: planDescription,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      };
      
      // Add days
      for (let i = 1; i <= 7; i++) {
        const dayKey = `day${i}`;
        const dayNameInput = document.getElementById(`${dayKey}-name`);
        
        if (!dayNameInput) continue;
        
        const dayName = dayNameInput.value.trim();
        const dayExercisesContainer = document.getElementById(`${dayKey}-exercises`);
        
        if (!dayExercisesContainer) continue;
        
        const exerciseElements = dayExercisesContainer.querySelectorAll('.day-exercise');
        const exercises = [];
        
        exerciseElements.forEach(element => {
          const exerciseSelect = element.querySelector('.exercise-select');
          const setsInput = element.querySelector('.sets-input');
          const repsInput = element.querySelector('.reps-input');
          const notesInput = element.querySelector('.notes-input');
          
          if (exerciseSelect && exerciseSelect.value) {
            // Find exercise data
            const selectedExercise = exerciseLibrary.find(ex => ex.id === exerciseSelect.value);
            
            if (selectedExercise) {
              exercises.push({
                id: selectedExercise.id,
                name: selectedExercise.name,
                sets: setsInput ? parseInt(setsInput.value) || 3 : 3,
                reps: repsInput ? repsInput.value || '8-12' : '8-12',
                notes: notesInput ? notesInput.value.trim() : ''
              });
            }
          }
        });
        
        // Only add day if it has exercises
        if (exercises.length > 0) {
          planData[dayKey] = {
            name: dayName || `Day ${i}`,
            exercises
          };
        }
      }
      
      // Check if plan has at least one day with exercises
      let hasDays = false;
      for (let i = 1; i <= 7; i++) {
        if (planData[`day${i}`]) {
          hasDays = true;
          break;
        }
      }
      
      if (!hasDays) {
        Utils.showNotification('Please add at least one exercise to your plan.', 'error');
        return;
      }
      
      // Save to Firebase
      const newPlanRef = database.ref(`coaches/${coachId}/workoutPlans`).push();
      await newPlanRef.set(planData);
      
      // Close modal
      const modal = document.getElementById('workout-plan-modal');
      if (modal) modal.classList.remove('active');
      
      Utils.showNotification('Workout plan created successfully!', 'success');
      
    } catch (error) {
      console.error('Error saving workout plan:', error);
      Utils.showNotification('Error saving workout plan. Please try again.', 'error');
    }
  };
  
  /**
   * Add these to the return statement to make them publicly available
   */
  // Update your return statement to include:
  // showCreateWorkoutPlanModal,
  // saveWorkoutPlan
  
    /**
     * Public methods and properties
     */
    return {
      init,
      loadWorkoutPlan,
      showCreateWorkoutPlanModal,
      saveWorkoutPlan,
      saveWorkoutLog
    };
  })();