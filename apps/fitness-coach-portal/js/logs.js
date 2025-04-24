/**
 * Logs Module
 * Handles client workout logging and cardio tracking
 */
const LogsModule = (() => {
    // DOM Elements - Cardio Logging
    const cardioType = document.getElementById('cardio-type');
    const cardioDuration = document.getElementById('cardio-duration');
    const cardioDistance = document.getElementById('cardio-distance');
    const cardioSteps = document.getElementById('cardio-steps');
    
    // State variables
    let currentUser = null;
  
    /**
     * Initializes cardio logging
     */
    const initCardioLogging = () => {
      const saveWorkoutLogBtn = document.getElementById('save-workout-log-btn');
      
      // Make sure the button exists
      if (!saveWorkoutLogBtn) return;
      
      // Add event listener to save cardio with workout
      saveWorkoutLogBtn.addEventListener('click', saveCardioLog);
    };
  
    /**
     * Saves cardio log to Firebase
     */
    const saveCardioLog = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const logDate = document.getElementById('log-date')?.value;
        
        if (!logDate) return;
        
        // Check if any cardio data is entered
        if (!cardioType.value && !cardioDuration.value && !cardioDistance.value && !cardioSteps.value) {
          // No cardio data entered, so don't save
          return;
        }
        
        // Build cardio data
        const cardioData = {
          type: cardioType.value || null,
          duration: cardioDuration.value ? parseInt(cardioDuration.value) : null,
          distance: cardioDistance.value ? parseFloat(cardioDistance.value) : null,
          steps: cardioSteps.value ? parseInt(cardioSteps.value) : null,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Save to Firebase
        await database.ref(`clients/${userId}/logs/${logDate}/cardio`).set(cardioData);
        
        // Reset form (will be handled by WorkoutsModule when it calls resetWorkoutLog)
        
      } catch (error) {
        console.error('Error saving cardio log:', error);
        Utils.showNotification('Error saving cardio data. Please try again.', 'error');
      }
    };
  
    /**
     * Resets the cardio log form
     */
    const resetCardioLog = () => {
      cardioType.value = '';
      cardioDuration.value = '';
      cardioDistance.value = '';
      cardioSteps.value = '';
    };
  
    /**
     * Initialize Logs Module
     */
    const init = () => {
      currentUser = AuthModule.getCurrentUser();
      
      // Initialize cardio logging
      initCardioLogging();
    };
  
    /**
     * Public methods and properties
     */
    return {
      init,
      resetCardioLog
    };
  })();