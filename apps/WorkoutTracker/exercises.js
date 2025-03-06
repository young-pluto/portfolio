// Exercises Module
const ExercisesModule = (() => {
    // DOM Elements
    const exercisesSection = document.getElementById('exercises-section');
    const exercisesList = document.getElementById('exercises-list');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const exerciseForm = document.getElementById('exercise-form');
    const saveExerciseBtn = document.getElementById('save-exercise-btn');
    const cancelExerciseBtn = document.getElementById('cancel-exercise-btn');
    
    // State
    let exercises = [];
    let editingExerciseId = null;

    // Firebase references
    const getExercisesRef = () => {
        const user = AuthModule.getCurrentUser();
        return database.ref(`users/${user.uid}/exercises`);
    };

    // Load exercises from Firebase
    const loadExercises = () => {
        const exercisesRef = getExercisesRef();
        
        exercisesRef.on('value', (snapshot) => {
            exercises = [];
            exercisesList.innerHTML = '';
            
            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach(key => {
                    const exercise = {
                        id: key,
                        ...data[key]
                    };
                    exercises.push(exercise);
                });
                
                renderExercisesList();
            } else {
                exercisesList.innerHTML = '<div class="no-exercises-message">No exercises added yet. Click the "Add Exercise" button to create your first exercise.</div>';
            }
        });
    };

    // Render exercises list
    const renderExercisesList = () => {
        exercisesList.innerHTML = '';
        
        if (exercises.length === 0) {
            exercisesList.innerHTML = '<div class="no-exercises-message">No exercises added yet. Click the "Add Exercise" button to create your first exercise.</div>';
            return;
        }
        
        // Sort exercises by name
        exercises.sort((a, b) => a.name.localeCompare(b.name));
        
        exercises.forEach(exercise => {
            const exerciseItem = createExerciseElement(exercise);
            exercisesList.appendChild(exerciseItem);
        });
    };

    // Create exercise element from template
    const createExerciseElement = (exercise) => {
        const template = document.getElementById('exercise-item-template');
        const exerciseItem = document.importNode(template.content, true).querySelector('.exercise-item');
        
        exerciseItem.dataset.id = exercise.id;
        exerciseItem.querySelector('.exercise-name').textContent = exercise.name;
        exerciseItem.querySelector('.exercise-category').textContent = capitalizeFirstLetter(exercise.category);
        
        if (exercise.description) {
            exerciseItem.querySelector('.exercise-description').textContent = exercise.description;
        } else {
            exerciseItem.querySelector('.exercise-description').classList.add('hidden');
        }
        
        // Set usage count
        const usageCount = exercise.usageCount || 0;
        exerciseItem.querySelector('.usage-count').textContent = `Used in ${usageCount} workout${usageCount === 1 ? '' : 's'}`;
        
        // Add event listeners
        exerciseItem.querySelector('.edit-exercise-btn').addEventListener('click', () => {
            openEditExerciseForm(exercise);
        });
        
        exerciseItem.querySelector('.delete-exercise-btn').addEventListener('click', () => {
            deleteExercise(exercise.id);
        });
        
        return exerciseItem;
    };

    // Open form to add new exercise
    const openAddExerciseForm = () => {
        document.getElementById('exercise-name').value = '';
        document.getElementById('exercise-category').value = 'strength';
        document.getElementById('exercise-description').value = '';
        
        exerciseForm.classList.remove('hidden');
        editingExerciseId = null;
    };

    // Open form to edit exercise
    const openEditExerciseForm = (exercise) => {
        document.getElementById('exercise-name').value = exercise.name;
        document.getElementById('exercise-category').value = exercise.category;
        document.getElementById('exercise-description').value = exercise.description || '';
        
        exerciseForm.classList.remove('hidden');
        editingExerciseId = exercise.id;
    };

    // Close exercise form
    const closeExerciseForm = () => {
        exerciseForm.classList.add('hidden');
        editingExerciseId = null;
    };

    // Save exercise to Firebase
    const saveExercise = () => {
        const name = document.getElementById('exercise-name').value.trim();
        const category = document.getElementById('exercise-category').value;
        const description = document.getElementById('exercise-description').value.trim();
        
        if (!name) {
            alert('Please enter an exercise name');
            return;
        }
        
        const exerciseData = {
            name,
            category,
            description,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        const exercisesRef = getExercisesRef();
        
        if (editingExerciseId) {
            // Update existing exercise
            exercisesRef.child(editingExerciseId).update({
                name,
                category,
                description,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            })
            .then(() => {
                closeExerciseForm();
            })
            .catch(error => {
                alert(`Error updating exercise: ${error.message}`);
            });
        } else {
            // Add new exercise
            exercisesRef.push(exerciseData)
                .then(() => {
                    closeExerciseForm();
                })
                .catch(error => {
                    alert(`Error adding exercise: ${error.message}`);
                });
        }
    };

    // Delete exercise
    const deleteExercise = (exerciseId) => {
        if (!confirm('Are you sure you want to delete this exercise?')) {
            return;
        }
        
        const exercisesRef = getExercisesRef();
        exercisesRef.child(exerciseId).remove()
            .then(() => {
                console.log('Exercise deleted successfully');
            })
            .catch(error => {
                alert(`Error deleting exercise: ${error.message}`);
            });
    };

    // Utility: Capitalize first letter
    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    // Get all exercises
    const getAllExercises = () => {
        return [...exercises];
    };

    // Get exercise by ID
    const getExerciseById = (id) => {
        return exercises.find(exercise => exercise.id === id);
    };

    // Update exercise usage count
    const updateExerciseUsageCount = (exerciseId) => {
        const exercisesRef = getExercisesRef();
        const exerciseRef = exercisesRef.child(exerciseId);
        
        exerciseRef.once('value', (snapshot) => {
            const exercise = snapshot.val();
            if (exercise) {
                const currentCount = exercise.usageCount || 0;
                exerciseRef.update({
                    usageCount: currentCount + 1
                });
            }
        });
    };

    // Initialize
    const init = () => {
        // Event listeners
        addExerciseBtn.addEventListener('click', openAddExerciseForm);
        saveExerciseBtn.addEventListener('click', saveExercise);
        cancelExerciseBtn.addEventListener('click', closeExerciseForm);
        
        // Load exercises from Firebase
        loadExercises();
    };

    // Public methods and properties
    return {
        init,
        getAllExercises,
        getExerciseById,
        updateExerciseUsageCount
    };
})();