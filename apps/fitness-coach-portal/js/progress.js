/**
 * Progress Module
 * Handles client progress tracking and visualization
 */
const ProgressModule = (() => {
    // DOM Elements
    const currentWeightInput = document.getElementById('current-weight');
    const weightUnitSelect = document.getElementById('weight-unit');
    const saveWeightBtn = document.getElementById('save-weight-btn');
    const weightChartCanvas = document.getElementById('weight-chart');
    const workoutHistory = document.getElementById('workout-history');
    
    // State variables
    let weightChartInstance = null;
    let weightData = [];
    let workoutData = [];
  
    /**
     * Initializes weight tracking UI elements
     */
    const initWeightTracking = () => {
      // Set default unit based on user profile
      const userData = AuthModule.getUserData();
      if (userData && userData.weightUnit) {
        weightUnitSelect.value = userData.weightUnit;
      }
      
      // Load current weight
      loadCurrentWeight();
      
      // Add event listeners
      saveWeightBtn.addEventListener('click', saveWeight);
    };
  
    /**
     * Loads current weight from user profile
     */
    const loadCurrentWeight = () => {
      const userData = AuthModule.getUserData();
      
      if (userData && userData.weight) {
        currentWeightInput.value = userData.weight;
      }
    };
  
    /**
     * Saves weight to Firebase
     */
    const saveWeight = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const weightValue = parseFloat(currentWeightInput.value);
        const unit = weightUnitSelect.value;
        
        if (isNaN(weightValue) || weightValue <= 0) {
          Utils.showNotification('Please enter a valid weight.', 'error');
          return;
        }
        
        const today = Utils.formatDateForInput(new Date());
        
        // Save to logs
        await database.ref(`clients/${userId}/logs/${today}/weight`).set({
          value: weightValue,
          unit: unit,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Update profile as well
        await database.ref(`clients/${userId}/profile`).update({
          weight: weightValue,
          weightUnit: unit
        });
        
        // Show success message
        Utils.showNotification('Weight saved successfully!', 'success');
        
        // Reload weight data
        loadWeightData();
        
      } catch (error) {
        console.error('Error saving weight:', error);
        Utils.showNotification('Error saving weight. Please try again.', 'error');
      }
    };
  
    /**
     * Loads weight data for chart
     */
    const loadWeightData = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        
        // Get weight logs
        const logsRef = database.ref(`clients/${userId}/logs`);
        const snapshot = await logsRef.once('value');
        const logs = snapshot.val() || {};
        
        // Extract weight data
        const weightEntries = [];
        
        Object.entries(logs).forEach(([date, log]) => {
          if (log.weight) {
            weightEntries.push({
              date,
              ...log.weight
            });
          }
        });
        
        // Sort by date (oldest first for chart)
        weightEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Store weight data
        weightData = weightEntries;
        
        // Update chart
        updateWeightChart();
        
      } catch (error) {
        console.error('Error loading weight data:', error);
      }
    };
  
    /**
     * Updates the weight chart
     */
    const updateWeightChart = () => {
      if (!weightChartCanvas) return;
      
      // Get last 30 entries or fewer
      const chartData = weightData.slice(-30);
      
      // Prepare data for chart
      const labels = chartData.map(entry => {
        const date = new Date(entry.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
      
      const values = chartData.map(entry => entry.value);
      
      // Calculate min and max for y-axis
      let min = Math.min(...values);
      let max = Math.max(...values);
      
      // Add buffer to min and max (10% of range)
      const range = max - min;
      min = Math.max(0, min - range * 0.1);
      max = max + range * 0.1;
      
      // Destroy existing chart if it exists
      if (weightChartInstance) {
        weightChartInstance.destroy();
      }
      
      // Create new chart
      weightChartInstance = new Chart(weightChartCanvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Weight',
            data: values,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.2,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: min,
              max: max,
              title: {
                display: true,
                text: weightUnitSelect.value
              }
            }
          }
        }
      });
    };
  
    /**
     * Loads workout history
     */
    const loadWorkoutHistory = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        
        // Get workout logs
        const logsRef = database.ref(`clients/${userId}/logs`);
        const snapshot = await logsRef.once('value');
        const logs = snapshot.val() || {};
        
        // Extract workout data
        const workoutEntries = [];
        
        Object.entries(logs).forEach(([date, log]) => {
          if (log.workout) {
            workoutEntries.push({
              date,
              ...log.workout
            });
          }
        });
        
        // Sort by date (newest first for display)
        workoutEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Store workout data
        workoutData = workoutEntries;
        
        // Update workout history
        updateWorkoutHistory();
        
      } catch (error) {
        console.error('Error loading workout history:', error);
        
        if (workoutHistory) {
          workoutHistory.innerHTML = '<p>Error loading workout history.</p>';
        }
      }
    };
  
    /**
     * Updates the workout history list
     */
    const updateWorkoutHistory = () => {
      if (!workoutHistory) return;
      
      if (workoutData.length === 0) {
        workoutHistory.innerHTML = '<p>No workout history yet.</p>';
        return;
      }
      
      let html = '';
      
      // Show last 10 workouts
      const recentWorkouts = workoutData.slice(0, 10);
      
      recentWorkouts.forEach(workout => {
        const date = new Date(workout.date);
        const formattedDate = Utils.formatDate(date);
        const exerciseCount = workout.exercises ? workout.exercises.length : 0;
        
        html += `
          <div class="workout-history-item">
            <div class="workout-date">${formattedDate}</div>
            <div class="workout-summary">
              <span class="exercise-count">${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        `;
        
        // Add exercise details
        if (workout.exercises && workout.exercises.length > 0) {
          html += '<div class="workout-exercises">';
          
          workout.exercises.forEach(exercise => {
            const setCount = exercise.sets ? exercise.sets.length : 0;
            
            html += `
              <div class="workout-exercise-item">
                <div class="exercise-name">${exercise.name}</div>
                <div class="exercise-sets">${setCount} set${setCount !== 1 ? 's' : ''}</div>
              </div>
            `;
          });
          
          html += '</div>';
        }
      });
      
      workoutHistory.innerHTML = html;
    };
  
    /**
     * Initialize Progress Module
     */
    const init = () => {
      initWeightTracking();
      loadWeightData();
      loadWorkoutHistory();
    };
  
    /**
     * Public methods and properties
     */
    return {
      init,
      loadWeightData,
      loadWorkoutHistory
    };
  })();