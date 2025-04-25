/**
 * Exercises Module
 * Handles exercise library functionality
 */
const ExercisesModule = (() => {
    // DOM Elements
    const exercisesList = document.getElementById('exercises-list');
    const exerciseForm = document.getElementById('exercise-form');
    const exerciseFormModal = document.getElementById('exercise-form-modal');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const categorySelect = document.getElementById('category-select');
    const exerciseSearch = document.getElementById('exercise-search');
    
    // State variables
    let exercises = [];
    let editingExerciseId = null;
    
    /**
     * Initializes exercise library
     */
    const initExerciseLibrary = () => {
      // Load exercises
      loadExercises();
      
      // Add event listeners
      if (exerciseSearch) {
        exerciseSearch.addEventListener('input', filterExercises);
      }
      
      if (categorySelect) {
        categorySelect.addEventListener('change', filterExercises);
      }
      
      if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', showAddExerciseForm);
      }
      
      if (exerciseForm) {
        exerciseForm.addEventListener('submit', saveExercise);
      }
      
      // Close form buttons
      document.getElementById('cancel-exercise-btn')?.addEventListener('click', closeExerciseForm);
    };
    
    /**
     * Loads all exercises from Firebase
     */
    const loadExercises = async () => {
      try {
        console.log('Loading exercises...');
        const coachId = AuthModule.getCurrentUser()?.uid;
        
        if (!coachId) {
          console.error('No coach ID available to load exercises');
          return;
        }
        
        // Get list of exercises
        const exercisesRef = database.ref('exercises');
        const snapshot = await exercisesRef.once('value');
        const exercisesData = snapshot.val();
        
        if (!exercisesData) {
          if (exercisesList) {
            exercisesList.innerHTML = '<p class="empty-message">No exercises yet. Add your first exercise to get started.</p>';
          }
          return;
        }
        
        // Convert to array and sort by name
        exercises = [];
        Object.keys(exercisesData).forEach(exerciseId => {
          exercises.push({
            id: exerciseId,
            ...exercisesData[exerciseId]
          });
        });
        
        exercises.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        // Render exercises list
        renderExercisesList();
        
      } catch (error) {
        console.error('Error loading exercises:', error);
        if (exercisesList) {
          exercisesList.innerHTML = '<p class="error-message">Error loading exercises. Please try again.</p>';
        }
      }
    };
    
    /**
     * Renders the exercises list
     */
    const renderExercisesList = (filteredExercises = null) => {
      if (!exercisesList) return;
      
      // Clear existing content
      exercisesList.innerHTML = '';
      
      const exercisesToRender = filteredExercises || exercises;
      
      if (exercisesToRender.length === 0) {
        exercisesList.innerHTML = '<p class="empty-message">No exercises found.</p>';
        return;
      }
      
      // Create exercise cards
      exercisesToRender.forEach(exercise => {
        // Get template
        const template = document.getElementById('exercise-card-template');
        if (!template) return;
        
        const exerciseCard = document.importNode(template.content, true).querySelector('.exercise-card');
        
        // Set exercise data
        exerciseCard.dataset.id = exercise.id;
        exerciseCard.querySelector('.exercise-name').textContent = exercise.name || 'Unnamed Exercise';
        
        const categoryElement = exerciseCard.querySelector('.exercise-category');
        if (categoryElement) {
          categoryElement.textContent = exercise.category || 'Uncategorized';
        }
        
        // Add event listeners for actions
        exerciseCard.querySelector('.edit-exercise-btn')?.addEventListener('click', () => {
          editExercise(exercise.id);
        });
        
        exerciseCard.querySelector('.delete-exercise-btn')?.addEventListener('click', () => {
          deleteExercise(exercise.id);
        });
        
        // Append to list
        exercisesList.appendChild(exerciseCard);
      });
    };
    
    /**
     * Filters exercises based on search and category
     */
    const filterExercises = () => {
      const searchTerm = exerciseSearch?.value.toLowerCase() || '';
      const category = categorySelect?.value || 'all';
      
      const filteredExercises = exercises.filter(exercise => {
        const matchesSearch = 
          exercise.name.toLowerCase().includes(searchTerm) ||
          (exercise.instructions && exercise.instructions.toLowerCase().includes(searchTerm));
        
        const matchesCategory = 
          category === 'all' || 
          (exercise.category && exercise.category === category);
        
        return matchesSearch && matchesCategory;
      });
      
      renderExercisesList(filteredExercises);
    };
    
    /**
     * Shows the add exercise form
     */
    const showAddExerciseForm = () => {
      if (!exerciseFormModal) return;
      
      // Reset form and set title
      exerciseForm.reset();
      document.getElementById('exercise-form-title').textContent = 'Add New Exercise';
      editingExerciseId = null;
      
      // Show modal
      exerciseFormModal.classList.add('active');
    };
    
    /**
     * Shows the edit exercise form
     */
    const editExercise = async (exerciseId) => {
      if (!exerciseFormModal) return;
      
      try {
        editingExerciseId = exerciseId;
        
        // Set form title
        document.getElementById('exercise-form-title').textContent = 'Edit Exercise';
        
        // Get exercise data
        const exerciseRef = database.ref(`exercises/${exerciseId}`);
        const snapshot = await exerciseRef.once('value');
        const exerciseData = snapshot.val();
        
        if (!exerciseData) {
          Utils.showNotification('Exercise not found.', 'error');
          return;
        }
        
        // Fill form
        document.getElementById('exercise-name').value = exerciseData.name || '';
        document.getElementById('exercise-category').value = exerciseData.category || '';
        document.getElementById('exercise-instructions').value = exerciseData.instructions || '';
        
        // Show modal
        exerciseFormModal.classList.add('active');
        
      } catch (error) {
        console.error('Error loading exercise for edit:', error);
        Utils.showNotification('Error loading exercise data.', 'error');
      }
    };
    
    /**
     * Closes the exercise form
     */
    const closeExerciseForm = () => {
      if (!exerciseFormModal) return;
      
      exerciseFormModal.classList.remove('active');
      editingExerciseId = null;
    };
    
    /**
     * Saves exercise data
     */
    const saveExercise = async (e) => {
      e.preventDefault();
      
      try {
        const name = document.getElementById('exercise-name').value.trim();
        const category = document.getElementById('exercise-category').value;
        const instructions = document.getElementById('exercise-instructions').value.trim();
        
        if (!name) {
          Utils.showNotification('Exercise name is required.', 'error');
          return;
        }
        
        // Exercise data
        const exerciseData = {
          name,
          category,
          instructions,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        let exerciseId;
        
        if (editingExerciseId) {
          // Update existing exercise
          exerciseId = editingExerciseId;
          await database.ref(`exercises/${exerciseId}`).update(exerciseData);
          Utils.showNotification('Exercise updated successfully!', 'success');
        } else {
          // Create new exercise
          exerciseData.createdAt = firebase.database.ServerValue.TIMESTAMP;
          exerciseData.createdBy = AuthModule.getCurrentUser().uid;
          
          // Generate new ID
          const newExerciseRef = database.ref('exercises').push();
          exerciseId = newExerciseRef.key;
          
          await newExerciseRef.set(exerciseData);
          Utils.showNotification('Exercise added successfully!', 'success');
        }
        
        // Close form and reload exercises
        closeExerciseForm();
        loadExercises();
        
      } catch (error) {
        console.error('Error saving exercise:', error);
        Utils.showNotification('Error saving exercise. Please try again.', 'error');
      }
    };
    
    /**
     * Deletes an exercise
     */
    const deleteExercise = async (exerciseId) => {
      if (!confirm('Are you sure you want to delete this exercise?')) {
        return;
      }
      
      try {
        await database.ref(`exercises/${exerciseId}`).remove();
        Utils.showNotification('Exercise deleted successfully!', 'success');
        
        // Reload exercises
        loadExercises();
        
      } catch (error) {
        console.error('Error deleting exercise:', error);
        Utils.showNotification('Error deleting exercise. Please try again.', 'error');
      }
    };
    
    /**
     * Initialize Exercises Module
     */
    const init = () => {
      console.log('Initializing Exercises Module');
      initExerciseLibrary();
    };
    
    /**
     * Public methods and properties
     */
    return {
      init,
      loadExercises,
      getExercises: () => exercises
    };
  })();