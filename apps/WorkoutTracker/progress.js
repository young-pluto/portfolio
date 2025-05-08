// Progress Module
const ProgressModule = (() => {
    // DOM Elements
    const exerciseProgressSection = document.getElementById('exercise-progress-section');
    const backToExerciseBtn = document.getElementById('back-to-exercise-btn');
    const progressExerciseName = document.getElementById('progress-exercise-name');
    const progressExerciseCategory = document.getElementById('progress-exercise-category');
    const progressExerciseDescription = document.getElementById('progress-exercise-description');
    const weightProgressionChart = document.getElementById('weight-progression-chart');
    const volumeProgressionChart = document.getElementById('volume-progression-chart');
    const bodyWeightRatioChart = document.getElementById('body-weight-ratio-chart');
    const exerciseHistoryBody = document.getElementById('exercise-history-body');

    // Chart instances
    let weightChartInstance = null;
    let volumeChartInstance = null;
    let ratioChartInstance = null;

    // Show exercise progress
    const showExerciseProgress = (exerciseId) => {
        // Get exercise data
        const exercise = ExercisesModule.getExerciseById(exerciseId);
        if (!exercise) return;

        // Update exercise info
        progressExerciseName.textContent = exercise.name;
        progressExerciseCategory.textContent = capitalizeFirstLetter(exercise.category);
        progressExerciseDescription.textContent = exercise.description || 'No description available';

        // Load exercise history data
        loadExerciseHistoryData(exerciseId);

        // Show progress section
        document.getElementById('exercises-section').classList.add('hidden');
        document.getElementById('new-workout-section').classList.add('hidden');
        document.getElementById('workout-history-section').classList.add('hidden');
        exerciseProgressSection.classList.remove('hidden');
    };

    // Load exercise history data from workouts
    const loadExerciseHistoryData = (exerciseId) => {
        const user = AuthModule.getCurrentUser();
        const workoutsRef = database.ref(`users/${user.uid}/workouts`);

        workoutsRef.orderByChild('timestamp').once('value', (snapshot) => {
            // Process workout data
            const workouts = [];
            snapshot.forEach((childSnapshot) => {
                const workout = childSnapshot.val();
                workout.id = childSnapshot.key;
                
                // Skip workouts that don't have this exercise
                if (!workout.exercises || !workout.exercises[exerciseId]) return;
                
                workouts.push(workout);
            });

            // Sort workouts by date (oldest first for proper timeline)
            workouts.sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
            });

            // Extract exercise data from workouts
            const exerciseData = extractExerciseData(workouts, exerciseId);
            
            // Render data
            renderHistoryTable(exerciseData);
            renderWeightProgressionChart(exerciseData);
            renderVolumeProgressionChart(exerciseData);
            renderBodyWeightRatioChart(exerciseData);
        });
    };

    // Extract exercise data from workouts
    const extractExerciseData = (workouts, exerciseId) => {
        const exerciseData = [];

        workouts.forEach(workout => {
            if (workout.exercises && workout.exercises[exerciseId] && workout.exercises[exerciseId].sets) {
                const date = workout.date;
                const bodyWeight = workout.bodyWeight || null;
                const exerciseSets = workout.exercises[exerciseId].sets;
                
                // Process each set
                Object.keys(exerciseSets).forEach(setKey => {
                    const set = exerciseSets[setKey];
                    const setNumber = setKey.replace('set', '');
                    
                    // Only include sets with weight and reps
                    if (set.weight && set.reps) {
                        const weight = parseFloat(set.weight);
                        const reps = parseFloat(set.reps);
                        const volume = weight * reps;
                        const weightToBodyWeightRatio = bodyWeight ? weight / bodyWeight : null;
                        
                        exerciseData.push({
                            date,
                            formattedDate: formatDate(date),
                            bodyWeight,
                            setNumber,
                            weight,
                            reps,
                            volume,
                            weightToBodyWeightRatio,
                            remarks: set.remarks || ''
                        });
                    }
                });
            }
        });

        return exerciseData;
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Utility: Capitalize first letter
    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    // Render history table
    const renderHistoryTable = (exerciseData) => {
        exerciseHistoryBody.innerHTML = '';
        
        if (exerciseData.length === 0) {
            exerciseHistoryBody.innerHTML = '<tr><td colspan="7">No history data available yet.</td></tr>';
            return;
        }
        
        // Sort by date (newest first) for table display
        const sortedData = [...exerciseData].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        sortedData.forEach(data => {
            const row = document.createElement('tr');
            
            // Date
            const dateCell = document.createElement('td');
            dateCell.textContent = data.formattedDate;
            row.appendChild(dateCell);
            
            // Body weight
            const bodyWeightCell = document.createElement('td');
            bodyWeightCell.textContent = data.bodyWeight ? `${data.bodyWeight} kg` : '—';
            row.appendChild(bodyWeightCell);
            
            // Set number
            const setCell = document.createElement('td');
            setCell.textContent = data.setNumber;
            row.appendChild(setCell);
            
            // Weight
            const weightCell = document.createElement('td');
            weightCell.textContent = `${data.weight} kg`;
            row.appendChild(weightCell);
            
            // Reps
            const repsCell = document.createElement('td');
            repsCell.textContent = data.reps;
            row.appendChild(repsCell);
            
            // Volume
            const volumeCell = document.createElement('td');
            volumeCell.textContent = `${data.volume} kg`;
            row.appendChild(volumeCell);
            
            // Remarks
            const remarksCell = document.createElement('td');
            remarksCell.textContent = data.remarks;
            row.appendChild(remarksCell);
            
            exerciseHistoryBody.appendChild(row);
        });
    };

    // Render weight progression chart
    const renderWeightProgressionChart = (exerciseData) => {
        if (exerciseData.length === 0) {
            if (weightChartInstance) {
                weightChartInstance.destroy();
            }
            return;
        }
        
        // Group by date and find max weight for each date
        const groupedByDate = {};
        exerciseData.forEach(data => {
            if (!groupedByDate[data.date] || data.weight > groupedByDate[data.date]) {
                groupedByDate[data.date] = data.weight;
            }
        });
        
        const labels = Object.keys(groupedByDate).map(date => formatDate(date));
        const values = Object.values(groupedByDate);
        
        // Destroy previous chart instance if exists
        if (weightChartInstance) {
            weightChartInstance.destroy();
        }
        
        // Create new chart
        weightChartInstance = new Chart(weightProgressionChart, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Max Weight (kg)',
                    data: values,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#3b82f6',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value + ' kg';
                            }
                        }
                    }
                }
            }
        });
    };

    // Render volume progression chart
    const renderVolumeProgressionChart = (exerciseData) => {
        if (exerciseData.length === 0) {
            if (volumeChartInstance) {
                volumeChartInstance.destroy();
            }
            return;
        }
        
        // Group by date and calculate total volume for each date
        const groupedByDate = {};
        exerciseData.forEach(data => {
            if (!groupedByDate[data.date]) {
                groupedByDate[data.date] = 0;
            }
            groupedByDate[data.date] += data.volume;
        });
        
        const labels = Object.keys(groupedByDate).map(date => formatDate(date));
        const values = Object.values(groupedByDate);
        
        // Destroy previous chart instance if exists
        if (volumeChartInstance) {
            volumeChartInstance.destroy();
        }
        
        // Create new chart
        volumeChartInstance = new Chart(volumeProgressionChart, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Volume (kg × reps)',
                    data: values,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + ' kg';
                            }
                        }
                    }
                }
            }
        });
    };

    // Render body weight ratio chart
    const renderBodyWeightRatioChart = (exerciseData) => {
        // Filter out entries without bodyWeight
        const dataWithBodyWeight = exerciseData.filter(data => data.bodyWeight !== null);
        
        if (dataWithBodyWeight.length === 0) {
            if (ratioChartInstance) {
                ratioChartInstance.destroy();
            }
            return;
        }
        
        // Group by date and find max ratio for each date
        const groupedByDate = {};
        dataWithBodyWeight.forEach(data => {
            if (!groupedByDate[data.date] || data.weightToBodyWeightRatio > groupedByDate[data.date]) {
                groupedByDate[data.date] = data.weightToBodyWeightRatio;
            }
        });
        
        const labels = Object.keys(groupedByDate).map(date => formatDate(date));
        const values = Object.values(groupedByDate);
        
        // Destroy previous chart instance if exists
        if (ratioChartInstance) {
            ratioChartInstance.destroy();
        }
        
        // Create new chart
        ratioChartInstance = new Chart(bodyWeightRatioChart, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weight to Body Weight Ratio',
                    data: values,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#8b5cf6',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return `Ratio: ${value.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2) + 'x';
                            }
                        }
                    }
                }
            }
        });
    };

    // Add progress event listeners to exercises
    const addProgressEventListeners = () => {
        // Add event listeners to view progress buttons in exercise list
        document.querySelectorAll('.view-progress-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseItem = e.target.closest('.exercise-item') || e.target.closest('.workout-exercise');
                if (exerciseItem) {
                    const exerciseId = exerciseItem.dataset.id;
                    showExerciseProgress(exerciseId);
                }
            });
        });
    };

    // Initialize
    const init = () => {
        // Event listeners
        backToExerciseBtn.addEventListener('click', () => {
            exerciseProgressSection.classList.add('hidden');
            document.getElementById('exercises-section').classList.remove('hidden');
        });

        // This will be called when exercises are loaded
        addProgressEventListeners();

        // Create a MutationObserver to watch for added exercises
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // For each added node, check if it contains view-progress-btn elements
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            const progressBtns = node.querySelectorAll('.view-progress-btn');
                            if (progressBtns.length > 0) {
                                addProgressEventListeners();
                            }
                        }
                    });
                }
            });
        });

        // Start observing both exercise lists
        const exerciseList = document.getElementById('exercises-list');
        const currentWorkout = document.getElementById('current-workout');
        
        if (exerciseList) {
            observer.observe(exerciseList, { childList: true, subtree: true });
        }
        
        if (currentWorkout) {
            observer.observe(currentWorkout, { childList: true, subtree: true });
        }
    };

    // Public methods and properties
    return {
        init,
        showExerciseProgress,
        addProgressEventListeners
    };
})();