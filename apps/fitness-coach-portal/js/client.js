/**
 * Client Dashboard Module
 * Handles client dashboard functionality
 */
const ClientModule = (() => {
    // DOM Elements - Tabs
    const tabButtons = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.dashboard-section');
    
    // State variables
    let currentUser = null;
    let userData = null;
  
    /**
     * Initializes tab navigation
     */
    const initTabNavigation = () => {
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const tabId = button.id;
          const sectionId = tabId.replace('-tab', '-section');
          
          // Remove active class from all tabs and sections
          tabButtons.forEach(tab => tab.classList.remove('active'));
          sections.forEach(section => section.classList.remove('active'));
          
          // Add active class to clicked tab and corresponding section
          button.classList.add('active');
          document.getElementById(sectionId)?.classList.add('active');
        });
      });
    };
  
    /**
     * Loads and displays the client profile
     */
    const loadProfile = () => {
      const profileSection = document.getElementById('profile-section');
      if (!profileSection || !userData) return;
      
      // Set profile values
      document.getElementById('profile-name')?.textContent = userData.name || 'Not set';
      document.getElementById('profile-email')?.textContent = userData.email || 'Not set';
      document.getElementById('profile-age')?.textContent = userData.age ? `${userData.age} years` : 'Not set';
      document.getElementById('profile-weight')?.textContent = userData.weight ? `${userData.weight} ${userData.weightUnit || 'kg'}` : 'Not set';
      document.getElementById('profile-height')?.textContent = userData.height ? `${userData.height} cm` : 'Not set';
      document.getElementById('profile-goals')?.textContent = userData.goals || 'No goals set';
      document.getElementById('profile-notes')?.textContent = userData.notes || 'No notes';
    };
  
    /**
     * Loads today's workout preview on dashboard
     */
    const loadTodayWorkoutPreview = async () => {
      const previewContainer = document.getElementById('today-workout-preview');
      if (!previewContainer) return;
      
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const workoutPlansRef = database.ref(`clients/${userId}/workoutPlan`);
        const snapshot = await workoutPlansRef.once('value');
        const workoutPlan = snapshot.val();
        
        if (!workoutPlan) {
          previewContainer.innerHTML = '<p>No workout plan assigned yet.</p>';
          return;
        }
        
        // Determine which day of the plan to show
        const date = new Date();
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Map day of week to workout day
        // Assuming: day1 = Monday, day7 = Sunday
        const workoutDayMapping = {
          1: 'day1', // Monday
          2: 'day2', // Tuesday
          3: 'day3', // Wednesday
          4: 'day4', // Thursday
          5: 'day5', // Friday
          6: 'day6', // Saturday
          0: 'day7'  // Sunday
        };
        
        const workoutDayKey = workoutDayMapping[dayOfWeek];
        const workoutDay = workoutPlan[workoutDayKey];
        
        if (!workoutDay || !workoutDay.exercises || workoutDay.exercises.length === 0) {
          previewContainer.innerHTML = `<p>No workout scheduled for today (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}).</p>`;
          return;
        }
        
        // Create preview
        const dayName = workoutDay.name || `Day ${workoutDayKey.replace('day', '')}`;
        
        let html = `
          <h4>${dayName}</h4>
          <div class="workout-preview-exercises">
        `;
        
        // Show up to 3 exercises in preview
        const exercisesToShow = workoutDay.exercises.slice(0, 3);
        
        exercisesToShow.forEach(exercise => {
          html += `
            <div class="preview-exercise">
              <div class="exercise-name">${exercise.name}</div>
              <div class="exercise-sets-reps">${exercise.sets} sets × ${exercise.reps}</div>
            </div>
          `;
        });
        
        // If there are more than 3 exercises, show a count of remaining
        if (workoutDay.exercises.length > 3) {
          const remainingCount = workoutDay.exercises.length - 3;
          html += `<div class="more-exercises">+${remainingCount} more exercise${remainingCount > 1 ? 's' : ''}</div>`;
        }
        
        html += '</div>';
        
        previewContainer.innerHTML = html;
        
        // Add click handler to view workout button
        document.getElementById('view-workout-btn')?.addEventListener('click', () => {
          // Switch to workouts tab
          document.getElementById('workouts-tab')?.click();
        });
        
      } catch (error) {
        console.error("Error loading today's workout preview:", error);
        previewContainer.innerHTML = '<p>Error loading workout data.</p>';
      }
    };
  
    /**
     * Loads nutrition preview on dashboard
     */
    const loadNutritionPreview = async () => {
      const previewContainer = document.getElementById('today-nutrition-preview');
      if (!previewContainer) return;
      
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const dietPlanRef = database.ref(`clients/${userId}/dietPlan`);
        const snapshot = await dietPlanRef.once('value');
        const dietPlan = snapshot.val();
        
        if (!dietPlan || !dietPlan.meals || dietPlan.meals.length === 0) {
          previewContainer.innerHTML = '<p>No nutrition plan assigned yet.</p>';
          return;
        }
        
        // Create preview
        let html = '<div class="nutrition-preview-meals">';
        
        // Show up to 2 meals in preview
        const mealsToShow = dietPlan.meals.slice(0, 2);
        
        mealsToShow.forEach(meal => {
          html += `
            <div class="preview-meal">
              <div class="meal-name">${meal.name}</div>
              <div class="meal-macros">
                <span class="macro protein">P: ${meal.protein || 0}g</span>
                <span class="macro carbs">C: ${meal.carbs || 0}g</span>
                <span class="macro fat">F: ${meal.fat || 0}g</span>
              </div>
            </div>
          `;
        });
        
        // If there are more than 2 meals, show a count of remaining
        if (dietPlan.meals.length > 2) {
          const remainingCount = dietPlan.meals.length - 2;
          html += `<div class="more-meals">+${remainingCount} more meal${remainingCount > 1 ? 's' : ''}</div>`;
        }
        
        html += '</div>';
        
        previewContainer.innerHTML = html;
        
        // Add click handler to view nutrition button
        document.getElementById('view-nutrition-btn')?.addEventListener('click', () => {
          // Switch to diet tab
          document.getElementById('diet-tab')?.click();
        });
        
      } catch (error) {
        console.error("Error loading nutrition preview:", error);
        previewContainer.innerHTML = '<p>Error loading nutrition data.</p>';
      }
    };
  
    /**
     * Sets up quick mood input on dashboard
     */
    const setupQuickMoodInput = () => {
      const moodEmojis = document.querySelectorAll('.mood-quick-input .mood-emoji');
      
      moodEmojis.forEach(emoji => {
        emoji.addEventListener('click', async () => {
          const moodValue = parseInt(emoji.dataset.value);
          await saveMoodData(moodValue);
          
          // Highlight selected emoji
          moodEmojis.forEach(e => e.classList.remove('selected'));
          emoji.classList.add('selected');
          
          // Show notification
          Utils.showNotification('Mood saved!', 'success');
          
          // Update mood section if visible
          if (document.getElementById('mood-section')?.classList.contains('active')) {
            MoodModule.loadMoodData();
          }
        });
      });
    };
  
    /**
     * Saves mood data to Firebase
     */
    const saveMoodData = async (moodValue) => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const today = new Date();
        const dateKey = Utils.formatDateForInput(today);
        
        await database.ref(`clients/${userId}/logs/${dateKey}/mood`).update({
          value: moodValue,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        return true;
      } catch (error) {
        console.error('Error saving mood data:', error);
        return false;
      }
    };
  
    /**
     * Loads recent activity on dashboard
     */
    const loadRecentActivity = async () => {
      const activityList = document.getElementById('recent-activity-list');
      if (!activityList) return;
      
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const logsRef = database.ref(`clients/${userId}/logs`);
        
        // Fetch the last 5 log entries
        const snapshot = await logsRef.orderByChild('timestamp').limitToLast(5).once('value');
        const logs = snapshot.val();
        
        if (!logs) {
          activityList.innerHTML = '<p>No recent activity.</p>';
          return;
        }
        
        let html = '';
        
        // Sort logs by timestamp (newest first)
        const sortedLogs = Object.entries(logs)
          .map(([date, log]) => ({ date, ...log }))
          .sort((a, b) => {
            // Use the most recent timestamp from any log type
            const getNewestTimestamp = (log) => {
              return Math.max(
                log.workout?.timestamp || 0,
                log.mood?.timestamp || 0,
                log.cardio?.timestamp || 0,
                log.weight?.timestamp || 0
              );
            };
            return getNewestTimestamp(b) - getNewestTimestamp(a);
          })
          .slice(0, 5);
        
        sortedLogs.forEach(log => {
          // Workout log
          if (log.workout) {
            const timestamp = log.workout.timestamp;
            const timeAgo = Utils.timeAgo(timestamp);
            html += `
              <div class="activity-item">
                <div class="activity-icon">
                  <i class="fas fa-dumbbell"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-title">Logged a workout</div>
                  <div class="activity-details">
                    ${log.workout.exercises ? `${log.workout.exercises.length} exercises` : 'Workout details'}
                  </div>
                  <div class="activity-time">${timeAgo}</div>
                </div>
              </div>
            `;
          }
          
          // Mood log
          if (log.mood) {
            const timestamp = log.mood.timestamp;
            const timeAgo = Utils.timeAgo(timestamp);
            const moodIcons = ['😞', '😕', '😐', '🙂', '😄'];
            const moodIcon = moodIcons[log.mood.value - 1] || '😐';
            
            html += `
              <div class="activity-item">
                <div class="activity-icon">
                  <i class="fas fa-smile"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-title">Tracked mood</div>
                  <div class="activity-details">
                    Feeling ${moodIcon} (${log.mood.value}/5)
                  </div>
                  <div class="activity-time">${timeAgo}</div>
                </div>
              </div>
            `;
          }
          
          // Cardio log
          if (log.cardio) {
            const timestamp = log.cardio.timestamp;
            const timeAgo = Utils.timeAgo(timestamp);
            
            html += `
              <div class="activity-item">
                <div class="activity-icon">
                  <i class="fas fa-running"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-title">Logged cardio</div>
                  <div class="activity-details">
                    ${log.cardio.type ? log.cardio.type : 'Cardio'} - 
                    ${log.cardio.duration ? log.cardio.duration + ' mins' : ''}
                    ${log.cardio.steps ? log.cardio.steps + ' steps' : ''}
                  </div>
                  <div class="activity-time">${timeAgo}</div>
                </div>
              </div>
            `;
          }
          
          // Weight log
          if (log.weight) {
            const timestamp = log.weight.timestamp;
            const timeAgo = Utils.timeAgo(timestamp);
            
            html += `
              <div class="activity-item">
                <div class="activity-icon">
                  <i class="fas fa-weight"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-title">Updated weight</div>
                  <div class="activity-details">
                    ${log.weight.value} ${log.weight.unit || 'kg'}
                  </div>
                  <div class="activity-time">${timeAgo}</div>
                </div>
              </div>
            `;
          }
        });
        
        if (html === '') {
          activityList.innerHTML = '<p>No recent activity.</p>';
        } else {
          activityList.innerHTML = html;
        }
        
      } catch (error) {
        console.error('Error loading recent activity:', error);
        activityList.innerHTML = '<p>Error loading activity data.</p>';
      }
    };
  
    /**
     * Initialize Client Module
     */
   /**
 * Update the init function in client.js
 */
const init = (userProfileData) => {
    // Store user data
    currentUser = AuthModule.getCurrentUser();
    userData = userProfileData;
    
    console.log("ClientModule initializing with user data:", userData);
    
    // Set client name in header and welcome message
    const userNameElement = document.getElementById('user-name');
    const welcomeNameElement = document.getElementById('welcome-name');
    
    if (userNameElement && userData) {
      userNameElement.textContent = userData.name || 'Client';
    }
    
    if (welcomeNameElement && userData) {
      welcomeNameElement.textContent = userData.name || 'Client';
    }
    
    // Initialize tab navigation
    initTabNavigation();
    
    // Initialize current date display
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
      const now = new Date();
      currentDateElement.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Load profile data
    loadProfile();
    
    // Initialize other modules with proper error handling
    try {
      // Set up dashboard components
      loadTodayWorkoutPreview().catch(err => console.error("Error loading workout preview:", err));
      loadNutritionPreview().catch(err => console.error("Error loading nutrition preview:", err));
      setupQuickMoodInput();
      loadRecentActivity().catch(err => console.error("Error loading recent activity:", err));
      
      // Initialize workouts module
      if (typeof WorkoutsModule !== 'undefined') {
        WorkoutsModule.init();
      } else {
        console.warn("WorkoutsModule not available - some functionality will be limited");
      }
      
      // Initialize diet module
      if (typeof DietModule !== 'undefined') {
        DietModule.init();
      } else {
        console.warn("DietModule not available - some functionality will be limited");
      }
      
      // Initialize progress module
      if (typeof ProgressModule !== 'undefined') {
        ProgressModule.init();
      } else {
        console.warn("ProgressModule not available - some functionality will be limited");
      }
      
      // Initialize mood module
      if (typeof MoodModule !== 'undefined') {
        MoodModule.init();
      } else {
        console.warn("MoodModule not available - some functionality will be limited");
      }
      
      // Initialize logs module
      if (typeof LogsModule !== 'undefined') {
        LogsModule.init();
      } else {
        console.warn("LogsModule not available - some functionality will be limited");
      }
      
    } catch (error) {
      console.error("Error initializing client modules:", error);
      Utils.showNotification("There was an error loading some features. Please try refreshing the page.", "error");
    }
  };
  
    /**
     * Public methods and properties
     */
    return {
      init
    };
  })();