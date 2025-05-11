// Fix for the saved workouts dialog buttons
// Add this to your workouts.js file or a separate script that runs after the page loads

document.addEventListener('DOMContentLoaded', function() {
    // Direct DOM access for dialog buttons
    const createNewBtn = document.getElementById('create-new-workout-btn');
    const cancelBtn = document.getElementById('close-saved-workouts-btn');
    const savedWorkoutsDialog = document.getElementById('saved-workouts-dialog');
    
    if (createNewBtn) {
        // Replace any existing event listeners
        createNewBtn.replaceWith(createNewBtn.cloneNode(true));
        
        // Get the fresh reference
        const newCreateBtn = document.getElementById('create-new-workout-btn');
        
        // Add new event listener
        newCreateBtn.addEventListener('click', function() {
            console.log('Create New button clicked');
            if (savedWorkoutsDialog) {
                savedWorkoutsDialog.classList.add('hidden');
            }
            if (typeof WorkoutsModule !== 'undefined' && WorkoutsModule.createNewWorkout) {
                WorkoutsModule.createNewWorkout();
            } else {
                console.error('WorkoutsModule or createNewWorkout function not found');
                // Fallback - reload the page
                window.location.reload();
            }
        });
    }
    
    if (cancelBtn) {
        // Replace any existing event listeners
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        
        // Get the fresh reference
        const newCancelBtn = document.getElementById('close-saved-workouts-btn');
        
        // Add new event listener
        newCancelBtn.addEventListener('click', function() {
            console.log('Cancel button clicked');
            if (savedWorkoutsDialog) {
                savedWorkoutsDialog.classList.add('hidden');
            }
        });
    }
    
    // Fix for the saved workout items
    const savedWorkoutsList = document.getElementById('saved-workouts-list');
    if (savedWorkoutsList) {
        const savedWorkoutItems = savedWorkoutsList.querySelectorAll('.saved-workout-item');
        
        savedWorkoutItems.forEach(item => {
            // Replace with clone to remove any existing event listeners
            const clone = item.cloneNode(true);
            item.parentNode.replaceChild(clone, item);
            
            // Add new event listener
            clone.addEventListener('click', function() {
                const workoutId = this.dataset.id;
                console.log('Saved workout clicked:', workoutId);
                
                if (savedWorkoutsDialog) {
                    savedWorkoutsDialog.classList.add('hidden');
                }
                
                if (typeof WorkoutsModule !== 'undefined' && WorkoutsModule.loadSavedEntry) {
                    WorkoutsModule.loadSavedEntry(workoutId);
                }
            });
        });
    }
});

// Alternative solution - direct fix to the WorkoutsModule
// Add this immediately after the WorkoutsModule definition
// Only use if the above solution doesn't work

(function() {
    // Wait for the page to be fully loaded
    window.addEventListener('load', function() {
        console.log('Window loaded, fixing saved workouts dialog');
        
        // Make sure the module is initialized
        if (typeof WorkoutsModule === 'undefined') {
            console.error('WorkoutsModule not found');
            return;
        }
        
        // Fix the buttons in the saved workouts dialog
        const createNewBtn = document.getElementById('create-new-workout-btn');
        const cancelBtn = document.getElementById('close-saved-workouts-btn');
        const savedWorkoutsDialog = document.getElementById('saved-workouts-dialog');
        
        if (createNewBtn) {
            createNewBtn.onclick = function() {
                console.log('Create New button clicked (direct handler)');
                if (savedWorkoutsDialog) {
                    savedWorkoutsDialog.classList.add('hidden');
                }
                WorkoutsModule.createNewWorkout();
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = function() {
                console.log('Cancel button clicked (direct handler)');
                if (savedWorkoutsDialog) {
                    savedWorkoutsDialog.classList.add('hidden');
                }
            };
        }
    });
})();