/**
 * Coach Module
 * Handles coach dashboard functionality
 */
const CoachModule = (() => {
    // DOM Elements - Tabs
    const tabButtons = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.dashboard-section');
    
    // DOM Elements - Clients
    const clientsList = document.getElementById('clients-list');
    const clientDetails = document.getElementById('client-details');
    const clientSearch = document.getElementById('client-search');
    const addClientBtn = document.getElementById('add-client-btn');
    const addClientQuickBtn = document.getElementById('add-client-quick');
    
    // DOM Elements - Client Form
    const clientFormModal = document.getElementById('client-form-modal');
    const clientForm = document.getElementById('client-form');
    const clientFormTitle = document.getElementById('client-form-title');
    const clientNameInput = document.getElementById('client-name');
    const clientEmailInput = document.getElementById('client-email');
    const clientPasswordInput = document.getElementById('client-password');
    const clientAgeInput = document.getElementById('client-age');
    const clientWeightInput = document.getElementById('client-weight');
    const clientHeightInput = document.getElementById('client-height');
    const clientGenderInput = document.getElementById('client-gender');
    const clientGoalsInput = document.getElementById('client-goals');
    const clientNotesInput = document.getElementById('client-notes');
    const saveClientBtn = document.getElementById('save-client-btn');
    const cancelClientBtn = document.getElementById('cancel-client-btn');
    
    // DOM Elements - Dashboard Stats
    const totalClientsElement = document.getElementById('total-clients');
    const activePlansElement = document.getElementById('active-plans');
    const workoutsLoggedElement = document.getElementById('workouts-logged');
    const recentClientActivity = document.getElementById('recent-client-activity');
    
    // DOM Elements - Plans
    const createWorkoutPlanBtn = document.getElementById('create-workout-plan-btn');
    const createDietPlanBtn = document.getElementById('create-diet-plan-btn');
    
    // State variables
    let currentUser = null;
    let userData = null;
    let clients = [];
    let selectedClientId = null;
    let editingClientId = null;
  
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
            
            // Load specific section data if needed
            if (tabId === 'plans-tab') {
              loadWorkoutPlans();
              loadDietPlans();
            }
          });
      });
    };
  
    /**
     * Initializes client management
     */
    const initClientManagement = () => {
      // Load clients
      loadClients();
      
      // Add event listeners
      if (clientSearch) {
        clientSearch.addEventListener('input', filterClients);
      }
      
      if (addClientBtn) {
        addClientBtn.addEventListener('click', showAddClientForm);
      }
      
      if (addClientQuickBtn) {
        addClientQuickBtn.addEventListener('click', showAddClientForm);
      }
      
      if (clientForm) {
        clientForm.addEventListener('submit', saveClient);
      }
      
      if (cancelClientBtn) {
        cancelClientBtn.addEventListener('click', closeClientForm);
      }
      
      // Close modals when clicking outside
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
          e.target.classList.remove('active');
        }
      });
      
      // Close modal when clicking close button
      document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
          document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
          });
        });
      });
      // Add plan tab event listeners
document.querySelectorAll('.plan-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Set active tab
      document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Show active content
      document.querySelectorAll('.plan-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId)?.classList.add('active');
      
      // Load plans if needed
      if (tabId === 'workout-plans') {
        loadWorkoutPlans();
      } else if (tabId === 'diet-plans') {
        loadDietPlans();
      }
    });
  });
    };
  
    /**
     * Loads all clients for the coach
     */
    const loadClients = async () => {
      try {
        const coachId = AuthModule.getCurrentUser().uid;
        
        // Get list of clients
        const clientsRef = database.ref('clients');
        const snapshot = await clientsRef.once('value');
        const clientsData = snapshot.val();
        
        if (!clientsData) {
          if (clientsList) {
            clientsList.innerHTML = '<p class="empty-message">No clients yet. Add your first client to get started.</p>';
          }
          updateDashboardStats(0, 0, 0);
          return;
        }
        
        // Filter clients for this coach
        clients = [];
        Object.keys(clientsData).forEach(clientId => {
          const client = clientsData[clientId];
          if (client.profile && client.profile.coachId === coachId) {
            clients.push({
              id: clientId,
              ...client.profile
            });
          }
        });
        
        // Sort clients by name
        clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        // Render client list
        renderClientsList();
        
        // Update dashboard stats
        updateStats();
        
      } catch (error) {
        console.error('Error loading clients:', error);
        if (clientsList) {
          clientsList.innerHTML = '<p class="error-message">Error loading clients. Please try again.</p>';
        }
      }
    };
  
    /**
     * Renders the clients list
     */
    const renderClientsList = (filteredClients = null) => {
      if (!clientsList) return;
      
      // Clear existing content
      clientsList.innerHTML = '';
      
      const clientsToRender = filteredClients || clients;
      
      if (clientsToRender.length === 0) {
        clientsList.innerHTML = '<p class="empty-message">No clients found. Add your first client to get started.</p>';
        return;
      }
      
      // Create client cards
      clientsToRender.forEach(client => {
        // Get template
        const template = document.getElementById('client-card-template');
        if (!template) return;
        
        const clientCard = document.importNode(template.content, true).querySelector('.client-card');
        
        // Set client data
        clientCard.dataset.id = client.id;
        clientCard.querySelector('.client-name').textContent = client.name || 'Unnamed Client';
        clientCard.querySelector('.client-email').textContent = client.email || '';
        
        // Add active class if this is the selected client
        if (client.id === selectedClientId) {
          clientCard.classList.add('active');
        }
        
        // Add click handler
        clientCard.addEventListener('click', () => {
          selectClient(client.id);
        });
        
        // Append to list
        clientsList.appendChild(clientCard);
      });
    };
  
    /**
     * Filters clients based on search input
     */
    const filterClients = (e) => {
      const searchTerm = e.target.value.toLowerCase();
      
      if (!searchTerm) {
        renderClientsList();
        return;
      }
      
      const filteredClients = clients.filter(client => {
        return (
          (client.name && client.name.toLowerCase().includes(searchTerm)) ||
          (client.email && client.email.toLowerCase().includes(searchTerm))
        );
      });
      
      renderClientsList(filteredClients);
    };
  
    /**
     * Selects a client and displays their details
     */
    const selectClient = async (clientId) => {
      try {
        selectedClientId = clientId;
        
        // Update UI to show selected client
        document.querySelectorAll('.client-card').forEach(card => {
          card.classList.remove('active');
          if (card.dataset.id === clientId) {
            card.classList.add('active');
          }
        });
        
        // Fetch fresh client data
        const clientRef = database.ref(`clients/${clientId}`);
        const snapshot = await clientRef.once('value');
        const clientData = snapshot.val();
        
        if (!clientData) {
          clientDetails.innerHTML = '<div class="error-message">Client data not found.</div>';
          return;
        }
        
        // Render client details
        renderClientDetails(clientId, clientData);
        
      } catch (error) {
        console.error('Error selecting client:', error);
        clientDetails.innerHTML = '<div class="error-message">Error loading client details. Please try again.</div>';
      }
    };
  
    /**
     * Renders the client details view
     */
    const renderClientDetails = (clientId, clientData) => {
      if (!clientDetails) return;
      
      // Get template
      const template = document.getElementById('client-detail-template');
      if (!template) return;
      
      const detailContent = document.importNode(template.content, true).querySelector('.client-detail-content');
      
      // Set client name
      detailContent.querySelector('.client-name').textContent = clientData.profile.name || 'Unnamed Client';
      
      // Fill profile tab
      detailContent.querySelector('.client-email').textContent = clientData.profile.email || 'No email';
      detailContent.querySelector('.client-age').textContent = clientData.profile.age ? `${clientData.profile.age} years` : 'Not set';
      detailContent.querySelector('.client-weight').textContent = clientData.profile.weight ? `${clientData.profile.weight} ${clientData.profile.weightUnit || 'kg'}` : 'Not set';
      detailContent.querySelector('.client-height').textContent = clientData.profile.height ? `${clientData.profile.height} cm` : 'Not set';
      detailContent.querySelector('.client-goals').textContent = clientData.profile.goals || 'No goals set';
      detailContent.querySelector('.client-notes').textContent = clientData.profile.notes || 'No notes';
      
      // Set up client tabs
      const clientTabs = detailContent.querySelectorAll('.client-tab');
      const tabContents = detailContent.querySelectorAll('.tab-content');
      
      clientTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const tabName = tab.dataset.tab;
          
          // Set active tab
          clientTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Show active content
          tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabName}-tab-content`) {
              content.classList.add('active');
            }
          });
          
          // Load specific tab content
          if (tabName === 'workouts') {
            loadClientWorkouts(clientId, detailContent);
          } else if (tabName === 'nutrition') {
            loadClientDiet(clientId, detailContent);
          } else if (tabName === 'progress') {
            loadClientProgress(clientId, detailContent);
          } else if (tabName === 'logs') {
            loadClientLogs(clientId, detailContent);
          }
        });
      });
      
      // Set up edit profile button
      detailContent.querySelector('.edit-client-btn').addEventListener('click', () => {
        editClient(clientId);
      });
      
      // Clear and add to client details
      clientDetails.innerHTML = '';
      clientDetails.appendChild(detailContent);
      
      // Load workouts tab data (initial tab)
      loadClientWorkouts(clientId, detailContent);
    };
  
    /**
     * Loads workouts for a client
     */
    const loadClientWorkouts = async (clientId, detailContent) => {
      try {
        const workoutPlanContainer = detailContent.querySelector('.current-workout-plan');
        if (!workoutPlanContainer) return;
        
        workoutPlanContainer.innerHTML = '<div class="loading">Loading workout plan...</div>';
        
        // Fetch workout plan
        const workoutPlanRef = database.ref(`clients/${clientId}/workoutPlan`);
        const snapshot = await workoutPlanRef.once('value');
        const workoutPlan = snapshot.val();
        
        if (!workoutPlan) {
          workoutPlanContainer.innerHTML = '<div class="empty-message">No workout plan assigned yet.</div>';
          return;
        }
        
        // Render workout plan summary
        let html = '<div class="workout-plan-summary">';
        
        // Count total days and exercises
        let totalDays = 0;
        let totalExercises = 0;
        
        for (let i = 1; i <= 7; i++) {
          const dayKey = `day${i}`;
          if (workoutPlan[dayKey] && workoutPlan[dayKey].exercises && workoutPlan[dayKey].exercises.length > 0) {
            totalDays++;
            totalExercises += workoutPlan[dayKey].exercises.length;
          }
        }
        
        html += `
          <h4>${workoutPlan.name || 'Current Workout Plan'}</h4>
          <div class="plan-stats">
            <div class="plan-stat">
              <span class="stat-value">${totalDays}</span>
              <span class="stat-label">Days per week</span>
            </div>
            <div class="plan-stat">
              <span class="stat-value">${totalExercises}</span>
              <span class="stat-label">Total exercises</span>
            </div>
          </div>
        `;
        
        // Add days preview
        html += '<div class="days-preview">';
        
        for (let i = 1; i <= 7; i++) {
          const dayKey = `day${i}`;
          const day = workoutPlan[dayKey];
          
          if (day && day.exercises && day.exercises.length > 0) {
            const dayName = day.name || `Day ${i}`;
            const exerciseCount = day.exercises.length;
            
            html += `
              <div class="day-preview">
                <div class="day-name">${dayName}</div>
                <div class="exercise-count">${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}</div>
              </div>
            `;
          }
        }
        
        html += '</div>'; // Close days-preview
        html += '</div>'; // Close workout-plan-summary
        
        workoutPlanContainer.innerHTML = html;
        
        // Setup assign workout button
        const assignWorkoutBtn = detailContent.querySelector('.assign-workout-btn');
        if (assignWorkoutBtn) {
          assignWorkoutBtn.addEventListener('click', () => {
            showAssignPlanModal(clientId, 'workout');
          });
        }
        
      } catch (error) {
        console.error('Error loading client workouts:', error);
        const workoutPlanContainer = detailContent.querySelector('.current-workout-plan');
        if (workoutPlanContainer) {
          workoutPlanContainer.innerHTML = '<div class="error-message">Error loading workout plan.</div>';
        }
      }
    };
  
    /**
     * Loads diet for a client
     */
    const loadClientDiet = async (clientId, detailContent) => {
      try {
        const dietPlanContainer = detailContent.querySelector('.current-diet-plan');
        if (!dietPlanContainer) return;
        
        dietPlanContainer.innerHTML = '<div class="loading">Loading diet plan...</div>';
        
        // Fetch diet plan
        const dietPlanRef = database.ref(`clients/${clientId}/dietPlan`);
        const snapshot = await dietPlanRef.once('value');
        const dietPlan = snapshot.val();
        
        if (!dietPlan || !dietPlan.meals || dietPlan.meals.length === 0) {
          dietPlanContainer.innerHTML = '<div class="empty-message">No diet plan assigned yet.</div>';
          return;
        }
        
        // Render diet plan summary
        let html = '<div class="diet-plan-summary">';
        
        // Plan name
        html += `<h4>${dietPlan.name || 'Current Diet Plan'}</h4>`;
        
        // Calculate total macros
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalCalories = 0;
        
        dietPlan.meals.forEach(meal => {
          if (meal.foods && meal.foods.length > 0) {
            meal.foods.forEach(food => {
              totalProtein += food.protein || 0;
              totalCarbs += food.carbs || 0;
              totalFat += food.fat || 0;
              totalCalories += food.calories || 0;
            });
          }
        });
        
        // Add macros summary
        html += `
          <div class="plan-macros">
            <div class="macro-item">
              <span class="macro-value">${totalProtein}g</span>
              <span class="macro-label">Protein</span>
            </div>
            <div class="macro-item">
              <span class="macro-value">${totalCarbs}g</span>
              <span class="macro-label">Carbs</span>
            </div>
            <div class="macro-item">
              <span class="macro-value">${totalFat}g</span>
              <span class="macro-label">Fat</span>
            </div>
            <div class="macro-item">
              <span class="macro-value">${totalCalories}</span>
              <span class="macro-label">Calories</span>
            </div>
          </div>
        `;
        
        // Add meals preview
        html += '<div class="meals-preview">';
        
        dietPlan.meals.forEach((meal, index) => {
          const mealName = meal.name || `Meal ${index + 1}`;
          const foodCount = meal.foods ? meal.foods.length : 0;
          
          html += `
            <div class="meal-preview">
              <div class="meal-name">${mealName}</div>
              <div class="food-count">${foodCount} food item${foodCount !== 1 ? 's' : ''}</div>
            </div>
          `;
        });
        
        html += '</div>'; // Close meals-preview
        html += '</div>'; // Close diet-plan-summary
        
        dietPlanContainer.innerHTML = html;
        
        // Setup assign diet button
        const assignDietBtn = detailContent.querySelector('.assign-diet-btn');
        if (assignDietBtn) {
          assignDietBtn.addEventListener('click', () => {
            showAssignPlanModal(clientId, 'diet');
          });
        }
        
      } catch (error) {
        console.error('Error loading client diet:', error);
        const dietPlanContainer = detailContent.querySelector('.current-diet-plan');
        if (dietPlanContainer) {
          dietPlanContainer.innerHTML = '<div class="error-message">Error loading diet plan.</div>';
        }
      }
    };
  
    /**
     * Loads progress data for a client
     */
    const loadClientProgress = async (clientId, detailContent) => {
      try {
        // Get chart containers
        const weightChartCanvas = detailContent.querySelector('.weight-chart');
        const volumeChartCanvas = detailContent.querySelector('.volume-chart');
        const moodChartCanvas = detailContent.querySelector('.mood-chart');
        
        if (!weightChartCanvas || !volumeChartCanvas || !moodChartCanvas) return;
        
        // Fetch client logs
        const logsRef = database.ref(`clients/${clientId}/logs`);
        const snapshot = await logsRef.once('value');
        const logs = snapshot.val() || {};
        
        // Process logs for charts
        const weightData = [];
        const workoutVolume = [];
        const moodData = [];
        const energyData = [];
        
        Object.entries(logs).forEach(([date, log]) => {
          // Weight data
          if (log.weight) {
            weightData.push({
              date,
              value: log.weight.value
            });
          }
          
          // Workout volume data
          if (log.workout && log.workout.exercises) {
            // Calculate total volume (sets * reps * weight)
            let dailyVolume = 0;
            
            log.workout.exercises.forEach(exercise => {
              if (exercise.sets) {
                exercise.sets.forEach(set => {
                  dailyVolume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
                });
              }
            });
            
            workoutVolume.push({
              date,
              value: Math.round(dailyVolume)
            });
          }
          
          // Mood and energy data
          if (log.mood) {
            moodData.push({
              date,
              value: log.mood.value
            });
            
            if (log.mood.energy) {
              energyData.push({
                date,
                value: log.mood.energy
              });
            }
          }
        });
        
        // Sort data by date
        weightData.sort((a, b) => new Date(a.date) - new Date(b.date));
        workoutVolume.sort((a, b) => new Date(a.date) - new Date(b.date));
        moodData.sort((a, b) => new Date(a.date) - new Date(b.date));
        energyData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Create charts
        createWeightChart(weightChartCanvas, weightData);
        createVolumeChart(volumeChartCanvas, workoutVolume);
        createMoodChart(moodChartCanvas, moodData, energyData);
        
      } catch (error) {
        console.error('Error loading client progress:', error);
        const chartContainers = detailContent.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
          container.innerHTML = '<div class="error-message">Error loading progress data.</div>';
        });
      }
    };
  
    /**
     * Creates a weight chart
     */
    const createWeightChart = (canvas, data) => {
      if (!canvas || !data || data.length === 0) {
        canvas.parentElement.innerHTML = '<div class="empty-message">No weight data available.</div>';
        return;
      }
      
      // Format data for Chart.js
      const labels = data.map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
      
      const values = data.map(item => item.value);
      
      // Calculate min and max for y-axis
      let min = Math.min(...values);
      let max = Math.max(...values);
      
      // Add some padding
      const range = max - min;
      min = Math.max(0, min - range * 0.1);
      max = max + range * 0.1;
      
      // Create chart
      new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Weight',
            data: values,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: min,
              max: max
            }
          }
        }
      });
    };
  
    /**
     * Creates a workout volume chart
     */
    const createVolumeChart = (canvas, data) => {
      if (!canvas || !data || data.length === 0) {
        canvas.parentElement.innerHTML = '<div class="empty-message">No workout volume data available.</div>';
        return;
      }
      
      // Format data for Chart.js
      const labels = data.map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
      
      const values = data.map(item => item.value);
      
      // Create chart
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Volume (weight × reps)',
            data: values,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    };
  
    /**
     * Creates a mood and energy chart
     */
    const createMoodChart = (canvas, moodData, energyData) => {
      if (!canvas || (!moodData || moodData.length === 0) && (!energyData || energyData.length === 0)) {
        canvas.parentElement.innerHTML = '<div class="empty-message">No mood or energy data available.</div>';
        return;
      }
      
      // Get unique dates from both datasets
      const allDates = [...new Set([
        ...moodData.map(item => item.date),
        ...energyData.map(item => item.date)
      ])];
      
      allDates.sort((a, b) => new Date(a) - new Date(b));
      
      // Format labels
      const labels = allDates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      });
      
      // Format data
      const moodValues = allDates.map(date => {
        const found = moodData.find(item => item.date === date);
        return found ? found.value : null;
      });
      
      const energyValues = allDates.map(date => {
        const found = energyData.find(item => item.date === date);
        return found ? found.value : null;
      });
      
      // Create chart
      new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Mood',
              data: moodValues,
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              tension: 0.3,
              fill: true,
              spanGaps: true
            },
            {
              label: 'Energy',
              data: energyValues,
              borderColor: '#f97316',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              tension: 0.3,
              fill: true,
              spanGaps: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 1,
              max: 5,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    };
  
    /**
     * Loads logs for a client
     */
    const loadClientLogs = async (clientId, detailContent) => {
      try {
        const logsList = detailContent.querySelector('.logs-list');
        if (!logsList) return;
        
        logsList.innerHTML = '<div class="loading">Loading client logs...</div>';
        
        // Get filter values
        const typeFilter = document.getElementById('logs-filter-type')?.value || 'all';
        const dateFilter = document.getElementById('logs-filter-date')?.value || 'week';
        
        // Fetch client logs
        const logsRef = database.ref(`clients/${clientId}/logs`);
        const snapshot = await logsRef.once('value');
        const logs = snapshot.val();
        
        if (!logs) {
          logsList.innerHTML = '<div class="empty-message">No activity logs yet.</div>';
          return;
        }
        
        // Filter logs by date
        const filteredLogs = filterLogsByDate(logs, dateFilter);
        
        // Filter logs by type
        const typeFilteredLogs = filterLogsByType(filteredLogs, typeFilter);
        
        // Sort logs by date (newest first)
        const sortedLogs = Object.entries(typeFilteredLogs)
          .map(([date, log]) => ({ date, ...log }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedLogs.length === 0) {
          logsList.innerHTML = '<div class="empty-message">No logs match the selected filters.</div>';
          return;
        }
        
        // Render logs
        let html = '';
        
        sortedLogs.forEach(log => {
          const date = new Date(log.date);
          const formattedDate = Utils.formatDate(date);
          
          // Workout log
          if (log.workout && (typeFilter === 'all' || typeFilter === 'workout')) {
            const exerciseCount = log.workout.exercises ? log.workout.exercises.length : 0;
            
            html += `
              <div class="log-item workout-log">
                <div class="log-header">
                  <div class="log-icon">
                    <i class="fas fa-dumbbell"></i>
                  </div>
                  <div class="log-info">
                    <div class="log-title">Workout</div>
                    <div class="log-date">${formattedDate}</div>
                  </div>
                </div>
                <div class="log-content">
                  <div class="log-detail">${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}</div>
            `;
            
            // Add exercise details
            if (log.workout.exercises && log.workout.exercises.length > 0) {
              html += '<div class="log-exercises">';
              
              log.workout.exercises.forEach(exercise => {
                const setCount = exercise.sets ? exercise.sets.length : 0;
                
                html += `
                  <div class="log-exercise">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-sets">${setCount} set${setCount !== 1 ? 's' : ''}</div>
                  </div>
                `;
              });
              
              html += '</div>';
            }
            
            html += '</div></div>'; // Close log-content and log-item
          }
          
          // Cardio log
          if (log.cardio && (typeFilter === 'all' || typeFilter === 'cardio')) {
            html += `
              <div class="log-item cardio-log">
                <div class="log-header">
                  <div class="log-icon">
                    <i class="fas fa-running"></i>
                  </div>
                  <div class="log-info">
                    <div class="log-title">Cardio</div>
                    <div class="log-date">${formattedDate}</div>
                  </div>
                </div>
                <div class="log-content">
                  <div class="log-detail">
                    ${log.cardio.type ? `<span>${log.cardio.type}</span>` : ''}
                    ${log.cardio.duration ? `<span>${log.cardio.duration} minutes</span>` : ''}
                    ${log.cardio.distance ? `<span>${log.cardio.distance} km/mi</span>` : ''}
                  ${log.cardio.steps ? `<span>${log.cardio.steps} steps</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }
        
        // Mood log
        if (log.mood && (typeFilter === 'all' || typeFilter === 'mood')) {
          const moodEmojis = ['😞', '😕', '😐', '🙂', '😄'];
          const moodEmoji = moodEmojis[log.mood.value - 1] || '😐';
          
          const energyDescriptions = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
          const energyDescription = log.mood.energy ? energyDescriptions[log.mood.energy - 1] : null;
          
          html += `
            <div class="log-item mood-log">
              <div class="log-header">
                <div class="log-icon">
                  <i class="fas fa-smile"></i>
                </div>
                <div class="log-info">
                  <div class="log-title">Mood</div>
                  <div class="log-date">${formattedDate}</div>
                </div>
              </div>
              <div class="log-content">
                <div class="log-detail">
                  <span>Mood: ${moodEmoji} (${log.mood.value}/5)</span>
                  ${energyDescription ? `<span>Energy: ${energyDescription}</span>` : ''}
                </div>
          `;
          
          // Add notes if present
          if (log.mood.notes) {
            html += `
              <div class="log-notes">
                "${log.mood.notes}"
              </div>
            `;
          }
          
          html += '</div></div>'; // Close log-content and log-item
        }
        
        // Weight log
        if (log.weight && (typeFilter === 'all' || typeFilter === 'weight')) {
          html += `
            <div class="log-item weight-log">
              <div class="log-header">
                <div class="log-icon">
                  <i class="fas fa-weight"></i>
                </div>
                <div class="log-info">
                  <div class="log-title">Weight</div>
                  <div class="log-date">${formattedDate}</div>
                </div>
              </div>
              <div class="log-content">
                <div class="log-detail">
                  ${log.weight.value} ${log.weight.unit || 'kg'}
                </div>
              </div>
            </div>
          `;
        }
      });
      
      logsList.innerHTML = html;
      
      // Add filter event listeners
      const typeFilterElement = document.getElementById('logs-filter-type');
      const dateFilterElement = document.getElementById('logs-filter-date');
      
      if (typeFilterElement) {
        typeFilterElement.addEventListener('change', () => {
          loadClientLogs(clientId, detailContent);
        });
      }
      
      if (dateFilterElement) {
        dateFilterElement.addEventListener('change', () => {
          loadClientLogs(clientId, detailContent);
        });
      }
      
    } catch (error) {
      console.error('Error loading client logs:', error);
      const logsList = detailContent.querySelector('.logs-list');
      if (logsList) {
        logsList.innerHTML = '<div class="error-message">Error loading client logs.</div>';
      }
    }
  };

  /**
   * Filters logs by date range
   */
  const filterLogsByDate = (logs, dateFilter) => {
    const now = new Date();
    const filteredLogs = {};
    
    Object.entries(logs).forEach(([date, log]) => {
      const logDate = new Date(date);
      
      // Filter based on selected range
      if (dateFilter === 'week' && Utils.daysBetween(logDate, now) <= 7) {
        filteredLogs[date] = log;
      } else if (dateFilter === 'month' && Utils.daysBetween(logDate, now) <= 30) {
        filteredLogs[date] = log;
      } else if (dateFilter === '3months' && Utils.daysBetween(logDate, now) <= 90) {
        filteredLogs[date] = log;
      } else if (dateFilter === 'all') {
        filteredLogs[date] = log;
      }
    });
    
    return filteredLogs;
  };

  /**
   * Filters logs by type
   */
  const filterLogsByType = (logs, typeFilter) => {
    if (typeFilter === 'all') return logs;
    
    const filteredLogs = {};
    
    Object.entries(logs).forEach(([date, log]) => {
      // Only include logs that have the specified type
      if (log[typeFilter]) {
        filteredLogs[date] = { [typeFilter]: log[typeFilter], date };
      }
    });
    
    return filteredLogs;
  };

  /**
   * Shows the add client form
   */
  const showAddClientForm = () => {
    if (!clientFormModal) return;
    
    // Reset form and set title
    clientForm.reset();
    clientFormTitle.textContent = 'Add New Client';
    editingClientId = null;
    
    // Show modal
    clientFormModal.classList.add('active');
  };

  /**
   * Shows the edit client form
   */
  const editClient = async (clientId) => {
    if (!clientFormModal) return;
    
    try {
      editingClientId = clientId;
      
      // Set form title
      clientFormTitle.textContent = 'Edit Client';
      
      // Get client data
      const clientRef = database.ref(`clients/${clientId}/profile`);
      const snapshot = await clientRef.once('value');
      const clientData = snapshot.val();
      
      if (!clientData) {
        Utils.showNotification('Client data not found.', 'error');
        return;
      }
      
      // Fill form
      clientNameInput.value = clientData.name || '';
      clientEmailInput.value = clientData.email || '';
      clientEmailInput.disabled = true; // Don't allow email edit
      clientPasswordInput.value = '';
      clientPasswordInput.disabled = true; // Don't allow password edit in edit mode
      
      clientAgeInput.value = clientData.age || '';
      clientWeightInput.value = clientData.weight || '';
      clientHeightInput.value = clientData.height || '';
      clientGenderInput.value = clientData.gender || '';
      clientGoalsInput.value = clientData.goals || '';
      clientNotesInput.value = clientData.notes || '';
      
      // Show modal
      clientFormModal.classList.add('active');
      
    } catch (error) {
      console.error('Error loading client for edit:', error);
      Utils.showNotification('Error loading client data.', 'error');
    }
  };

  /**
   * Closes the client form
   */
  const closeClientForm = () => {
    if (!clientFormModal) return;
    
    clientFormModal.classList.remove('active');
    editingClientId = null;
  };

  /**
   * Saves client data
   */
  const saveClient = async (e) => {
    e.preventDefault();
    
    try {
      const name = clientNameInput.value.trim();
      const email = clientEmailInput.value.trim();
      const password = clientPasswordInput.value;
      const age = clientAgeInput.value ? parseInt(clientAgeInput.value) : null;
      const weight = clientWeightInput.value ? parseFloat(clientWeightInput.value) : null;
      const height = clientHeightInput.value ? parseInt(clientHeightInput.value) : null;
      const gender = clientGenderInput.value;
      const goals = clientGoalsInput.value.trim();
      const notes = clientNotesInput.value.trim();
      
      if (!name || !email) {
        Utils.showNotification('Name and email are required.', 'error');
        return;
      }
      
      // Client profile data
      const profileData = {
        name,
        email,
        age,
        weight,
        height,
        gender,
        goals,
        notes,
        coachId: AuthModule.getCurrentUser().uid,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      };
      
      if (editingClientId) {
        // Update existing client
        await database.ref(`clients/${editingClientId}/profile`).update(profileData);
        Utils.showNotification('Client updated successfully!', 'success');
      } else {
        // Validate password for new client
        if (!password || password.length < 6) {
          Utils.showNotification('Password must be at least 6 characters.', 'error');
          return;
        }
        
        // Create new user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;
        
        // Add creation timestamp
        profileData.createdAt = firebase.database.ServerValue.TIMESTAMP;
        
        // Save client profile to database
        await database.ref(`clients/${userId}/profile`).set(profileData);
        
        // Add user role
        await database.ref(`users/${userId}`).set({
          role: 'client',
          email,
          name
        });
        
        Utils.showNotification('Client added successfully!', 'success');
      }
      
      // Close form and reload clients
      closeClientForm();
      loadClients();
      
    } catch (error) {
      console.error('Error saving client:', error);
      
      let errorMessage = 'Error saving client.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      }
      
      Utils.showNotification(errorMessage, 'error');
    }
  };

  /**
   * Shows the assign plan modal
   */
  /**
 * Shows the assign plan modal
 */
const showAssignPlanModal = async (clientId, planType) => {
    try {
      console.log(`Showing assign ${planType} plan modal for client ${clientId}`);
      
      // Get modal and elements
      const modal = document.getElementById('assign-plan-modal');
      const planSelect = document.getElementById('plan-select');
      const confirmBtn = document.getElementById('confirm-assign-btn');
      const cancelBtn = document.getElementById('cancel-assign-btn');
      
      if (!modal || !planSelect || !confirmBtn || !cancelBtn) {
        console.error('Modal elements not found:', { modal, planSelect, confirmBtn, cancelBtn });
        return;
      }
      
      // Set modal title
      const modalTitle = document.getElementById('assign-plan-title');
      if (modalTitle) {
        modalTitle.textContent = `Assign ${planType === 'workout' ? 'Workout' : 'Diet'} Plan`;
      }
      
      // Clear select options
      planSelect.innerHTML = '<option value="">Select a plan</option>';
      
      // Fetch plans from database
      const coachId = AuthModule.getCurrentUser().uid;
      console.log(`Fetching ${planType} plans for coach ${coachId}`);
      
      const plansRef = database.ref(`coaches/${coachId}/${planType}Plans`);
      const snapshot = await plansRef.once('value');
      const plans = snapshot.val();
      
      console.log(`Fetched plans:`, plans);
      
      if (!plans) {
        planSelect.innerHTML += `<option value="" disabled>No ${planType} plans available</option>`;
      } else {
        // Add plans to select
        Object.entries(plans).forEach(([planId, plan]) => {
          const option = document.createElement('option');
          option.value = planId;
          option.textContent = plan.name || `${planType === 'workout' ? 'Workout' : 'Diet'} Plan`;
          planSelect.appendChild(option);
        });
      }
      
      // Remove any existing event listeners
      const newConfirmBtn = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      
      const newCancelBtn = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      
      // Set up confirm button
      newConfirmBtn.addEventListener('click', async () => {
        const selectedPlanId = planSelect.value;
        
        if (!selectedPlanId) {
          Utils.showNotification('Please select a plan.', 'error');
          return;
        }
        
        try {
          console.log(`Assigning ${planType} plan ${selectedPlanId} to client ${clientId}`);
          
          // Get plan data
          const planRef = database.ref(`coaches/${coachId}/${planType}Plans/${selectedPlanId}`);
          const planSnapshot = await planRef.once('value');
          const planData = planSnapshot.val();
          
          if (!planData) {
            Utils.showNotification('Selected plan not found.', 'error');
            return;
          }
          
          // Assign plan to client
          await database.ref(`clients/${clientId}/${planType}Plan`).set(planData);
          
          Utils.showNotification(`${planType === 'workout' ? 'Workout' : 'Diet'} plan assigned successfully!`, 'success');
          
          // Close modal
          modal.classList.remove('active');
          
          // Reload client data
          if (planType === 'workout') {
            loadClientWorkouts(clientId, document.querySelector('.client-detail-content'));
          } else {
            loadClientDiet(clientId, document.querySelector('.client-detail-content'));
          }
          
        } catch (error) {
          console.error('Error assigning plan:', error);
          Utils.showNotification('Error assigning plan.', 'error');
        }
      });
      
      // Set up cancel button
      newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
      
      // Show modal
      modal.classList.add('active');
      
    } catch (error) {
      console.error('Error showing assign plan modal:', error);
      Utils.showNotification('Error loading plans.', 'error');
    }
  };

  /**
   * Updates dashboard stats
   */
  const updateStats = async () => {
    try {
      const coachId = AuthModule.getCurrentUser().uid;
      
      // Get client count
      const clientCount = clients.length;
      
      // Get active plans count (clients with workout or diet plans)
      let activePlansCount = 0;
      let workoutsThisWeek = 0;
      
      // Get all client data
      const clientsRef = database.ref('clients');
      const snapshot = await clientsRef.once('value');
      const clientsData = snapshot.val() || {};
      
      // Get week start date
      const today = new Date();
      const weekStartDate = Utils.getFirstDayOfWeek(today);
      
      // Calculate stats
      Object.values(clientsData).forEach(client => {
        // Check if client belongs to this coach
        if (client.profile && client.profile.coachId === coachId) {
          // Check if client has plans
          if (client.workoutPlan || client.dietPlan) {
            activePlansCount++;
          }
          
          // Count workouts this week
          if (client.logs) {
            Object.entries(client.logs).forEach(([date, log]) => {
              if (log.workout) {
                const logDate = new Date(date);
                if (logDate >= weekStartDate) {
                  workoutsThisWeek++;
                }
              }
            });
          }
        }
      });
      
      // Update UI
      updateDashboardStats(clientCount, activePlansCount, workoutsThisWeek);
      
      // Load recent activity
      loadRecentActivity();
      
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  /**
   * Updates dashboard stats UI
   */
  const updateDashboardStats = (clientCount, activePlansCount, workoutsCount) => {
    if (totalClientsElement) totalClientsElement.textContent = clientCount;
    if (activePlansElement) activePlansElement.textContent = activePlansCount;
    if (workoutsLoggedElement) workoutsLoggedElement.textContent = workoutsCount;
  };

  /**
   * Loads recent client activity for dashboard
   */
  const loadRecentActivity = async () => {
    if (!recentClientActivity) return;
    
    try {
      const coachId = AuthModule.getCurrentUser().uid;
      
      // Show loading state
      recentClientActivity.innerHTML = '<div class="loading">Loading recent activity...</div>';
      
      // Get all clients for this coach
      const clientIds = clients.map(client => client.id);
      
      if (clientIds.length === 0) {
        recentClientActivity.innerHTML = '<div class="empty-message">No clients yet. Add your first client to get started.</div>';
        return;
      }
      
      // Get recent activity from all clients
      const allActivities = [];
      
      // Fetch last 10 activities for each client
      for (const clientId of clientIds) {
        const clientRef = database.ref(`clients/${clientId}`);
        const clientSnapshot = await clientRef.once('value');
        const clientData = clientSnapshot.val();
        
        if (clientData && clientData.logs) {
          Object.entries(clientData.logs).forEach(([date, log]) => {
            // Workout activity
            if (log.workout) {
              allActivities.push({
                clientId,
                clientName: clientData.profile?.name || 'Client',
                type: 'workout',
                date,
                timestamp: log.workout.timestamp || Date.parse(date),
                data: log.workout
              });
            }
            
            // Mood activity
            if (log.mood) {
              allActivities.push({
                clientId,
                clientName: clientData.profile?.name || 'Client',
                type: 'mood',
                date,
                timestamp: log.mood.timestamp || Date.parse(date),
                data: log.mood
              });
            }
            
            // Cardio activity
            if (log.cardio) {
              allActivities.push({
                clientId,
                clientName: clientData.profile?.name || 'Client',
                type: 'cardio',
                date,
                timestamp: log.cardio.timestamp || Date.parse(date),
                data: log.cardio
              });
            }
            
            // Weight activity
            if (log.weight) {
              allActivities.push({
                clientId,
                clientName: clientData.profile?.name || 'Client',
                type: 'weight',
                date,
                timestamp: log.weight.timestamp || Date.parse(date),
                data: log.weight
              });
            }
          });
        }
      }
      
      // Sort by timestamp (newest first)
      allActivities.sort((a, b) => b.timestamp - a.timestamp);
      
      // Take only the most recent 10
      const recentActivities = allActivities.slice(0, 10);
      
      if (recentActivities.length === 0) {
        recentClientActivity.innerHTML = '<div class="empty-message">No client activity yet.</div>';
        return;
      }
      
      // Render activities
      let html = '';
      
      recentActivities.forEach(activity => {
        const timeAgo = Utils.timeAgo(activity.timestamp);
        
        html += `
          <div class="activity-item" data-client-id="${activity.clientId}">
            <div class="activity-icon">
        `;
        
        // Icon based on activity type
        if (activity.type === 'workout') {
          html += '<i class="fas fa-dumbbell"></i>';
        } else if (activity.type === 'mood') {
          html += '<i class="fas fa-smile"></i>';
        } else if (activity.type === 'cardio') {
          html += '<i class="fas fa-running"></i>';
        } else if (activity.type === 'weight') {
          html += '<i class="fas fa-weight"></i>';
        }
        
        html += '</div><div class="activity-content">';
        
        // Activity details based on type
        if (activity.type === 'workout') {
          const exerciseCount = activity.data.exercises ? activity.data.exercises.length : 0;
          html += `
            <div class="activity-title">${activity.clientName} logged a workout</div>
            <div class="activity-details">${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}</div>
          `;
        } else if (activity.type === 'mood') {
          const moodEmojis = ['😞', '😕', '😐', '🙂', '😄'];
          const moodEmoji = moodEmojis[activity.data.value - 1] || '😐';
          html += `
            <div class="activity-title">${activity.clientName} tracked mood</div>
            <div class="activity-details">Feeling ${moodEmoji} (${activity.data.value}/5)</div>
          `;
        } else if (activity.type === 'cardio') {
          html += `
            <div class="activity-title">${activity.clientName} logged cardio</div>
            <div class="activity-details">
              ${activity.data.type ? activity.data.type : 'Cardio'}
              ${activity.data.duration ? ' - ' + activity.data.duration + ' mins' : ''}
            </div>
          `;
        } else if (activity.type === 'weight') {
          html += `
            <div class="activity-title">${activity.clientName} updated weight</div>
            <div class="activity-details">${activity.data.value} ${activity.data.unit || 'kg'}</div>
          `;
        }
        
        html += `
            <div class="activity-time">${timeAgo}</div>
          </div>
        </div>
        `;
      });
      
      recentClientActivity.innerHTML = html;
      
      // Add click handler to view client
      recentClientActivity.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', () => {
          const clientId = item.dataset.clientId;
          
          // Switch to clients tab
          document.getElementById('clients-tab')?.click();
          
          // Select client
          selectClient(clientId);
        });
      });
      
    } catch (error) {
      console.error('Error loading recent activity:', error);
      recentClientActivity.innerHTML = '<div class="error-message">Error loading recent activity.</div>';
    }
  };
/**
 * Loads the workout plans list
 */
const loadWorkoutPlans = async () => {
    try {
      const workoutPlansList = document.getElementById('workout-plans-list');
      if (!workoutPlansList) return;
      
      workoutPlansList.innerHTML = '<div class="loading">Loading workout plans...</div>';
      
      const coachId = AuthModule.getCurrentUser().uid;
      const plansRef = database.ref(`coaches/${coachId}/workoutPlans`);
      const snapshot = await plansRef.once('value');
      const plans = snapshot.val();
      
      if (!plans) {
        workoutPlansList.innerHTML = '<div class="empty-message">No workout plans yet. Create your first plan to get started.</div>';
        return;
      }
      
      // Clear existing content
      workoutPlansList.innerHTML = '';
      
      // Create plan cards
      Object.entries(plans).forEach(([planId, plan]) => {
        // Get template
        const template = document.getElementById('plan-card-template');
        if (!template) return;
        
        const planCard = document.importNode(template.content, true).querySelector('.plan-card');
        
        // Set plan data
        planCard.dataset.id = planId;
        planCard.querySelector('.plan-name').textContent = plan.name || 'Unnamed Plan';
        planCard.querySelector('.plan-description').textContent = plan.description || '';
        
        // Add event listeners
        planCard.querySelector('.view-plan-btn')?.addEventListener('click', () => {
          viewPlan('workout', planId, plan);
        });
        
        planCard.querySelector('.edit-plan-btn')?.addEventListener('click', () => {
          editPlan('workout', planId, plan);
        });
        
        planCard.querySelector('.delete-plan-btn')?.addEventListener('click', () => {
          deletePlan('workout', planId);
        });
        
        // Append to list
        workoutPlansList.appendChild(planCard);
      });
      
    } catch (error) {
      console.error('Error loading workout plans:', error);
      const workoutPlansList = document.getElementById('workout-plans-list');
      if (workoutPlansList) {
        workoutPlansList.innerHTML = '<div class="error-message">Error loading workout plans.</div>';
      }
    }
  };
  
  /**
   * Loads the diet plans list
   */
  const loadDietPlans = async () => {
    try {
      const dietPlansList = document.getElementById('diet-plans-list');
      if (!dietPlansList) return;
      
      dietPlansList.innerHTML = '<div class="loading">Loading diet plans...</div>';
      
      const coachId = AuthModule.getCurrentUser().uid;
      const plansRef = database.ref(`coaches/${coachId}/dietPlans`);
      const snapshot = await plansRef.once('value');
      const plans = snapshot.val();
      
      if (!plans) {
        dietPlansList.innerHTML = '<div class="empty-message">No diet plans yet. Create your first plan to get started.</div>';
        return;
      }
      
      // Clear existing content
      dietPlansList.innerHTML = '';
      
      // Create plan cards
      Object.entries(plans).forEach(([planId, plan]) => {
        // Get template
        const template = document.getElementById('plan-card-template');
        if (!template) return;
        
        const planCard = document.importNode(template.content, true).querySelector('.plan-card');
        
        // Set plan data
        planCard.dataset.id = planId;
        planCard.querySelector('.plan-name').textContent = plan.name || 'Unnamed Plan';
        planCard.querySelector('.plan-description').textContent = plan.description || '';
        
        // Add event listeners
        planCard.querySelector('.view-plan-btn')?.addEventListener('click', () => {
          viewPlan('diet', planId, plan);
        });
        
        planCard.querySelector('.edit-plan-btn')?.addEventListener('click', () => {
          editPlan('diet', planId, plan);
        });
        
        planCard.querySelector('.delete-plan-btn')?.addEventListener('click', () => {
          deletePlan('diet', planId);
        });
        
        // Append to list
        dietPlansList.appendChild(planCard);
      });
      
    } catch (error) {
      console.error('Error loading diet plans:', error);
      const dietPlansList = document.getElementById('diet-plans-list');
      if (dietPlansList) {
        dietPlansList.innerHTML = '<div class="error-message">Error loading diet plans.</div>';
      }
    }
  };
  
  /**
   * Views a plan's details
   */
  const viewPlan = (planType, planId, planData) => {
    // For now, just show a notification
    Utils.showNotification(`Viewing ${planType} plan: ${planData.name}`, 'info');
  };
  
  /**
   * Edits a plan
   */
  const editPlan = (planType, planId, planData) => {
    // For now, just show a notification
    Utils.showNotification(`Editing ${planType} plan functionality coming soon`, 'info');
  };
  
  /**
   * Deletes a plan
   */
  const deletePlan = (planType, planId) => {
    if (confirm(`Are you sure you want to delete this ${planType} plan?`)) {
      const coachId = AuthModule.getCurrentUser().uid;
      
      database.ref(`coaches/${coachId}/${planType}Plans/${planId}`).remove()
        .then(() => {
          Utils.showNotification(`${planType.charAt(0).toUpperCase() + planType.slice(1)} plan deleted successfully!`, 'success');
          if (planType === 'workout') {
            loadWorkoutPlans();
          } else {
            loadDietPlans();
          }
        })
        .catch(error => {
          console.error(`Error deleting ${planType} plan:`, error);
          Utils.showNotification(`Error deleting ${planType} plan. Please try again.`, 'error');
        });
    }
  };
  /**
   * Initialize Coach Module
   */
 // Modify the init function in coach.js to handle module initialization better:

// At the end of the coach.js file, change the init function to this:
const init = (userProfileData) => {
    // Store user data
    currentUser = AuthModule.getCurrentUser();
    userData = userProfileData;
    
    // Set coach name in header
    const welcomeNameElement = document.getElementById('welcome-name');
    if (welcomeNameElement && userData) {
      welcomeNameElement.textContent = userData.name || 'Coach';
    }
    
    // Initialize tab navigation
    initTabNavigation();
    
    // Initialize client management
    initClientManagement();
    
    // Show "loading" content with a message to indicate initialization
    if (recentClientActivity) {
      recentClientActivity.innerHTML = '<p>Loading client activity data...</p>';
    }
    
    // Update dashboard stats with zeroes initially
    updateDashboardStats(0, 0, 0);
    
    // Initialize modules with proper error handling and fallbacks
    setTimeout(() => {
      try {
        // Initialize exercise library module
        if (typeof ExercisesModule !== 'undefined') {
          console.log('Initializing ExercisesModule');
          ExercisesModule.init();
        } else {
          console.warn('ExercisesModule not found - some functionality will be limited');
        }
        
        // Setup workout/diet plan creation buttons
        setupPlanButtons();
        
        // After modules are initialized, try to load clients
        loadClients().catch(err => {
          console.error('Error loading clients:', err);
          Utils.showNotification('Error loading client data. Some functions may be limited.', 'error');
        });
        
      } catch (error) {
        console.error('Error during module initialization:', error);
        Utils.showNotification('Some features may not be available due to initialization errors.', 'warning');
      }
    }, 500);
  };
  
  // Add this helper function to setup plan buttons
  function setupPlanButtons() {
    // Handle workout plan button
    if (createWorkoutPlanBtn) {
      createWorkoutPlanBtn.addEventListener('click', () => {
        if (typeof WorkoutsModule !== 'undefined' && WorkoutsModule.showCreateWorkoutPlanModal) {
          WorkoutsModule.showCreateWorkoutPlanModal();
        } else {
          Utils.showNotification('Workout plan creation is not available at this time.', 'warning');
        }
      });
    }
    
    // Handle diet plan button
    if (createDietPlanBtn) {
      createDietPlanBtn.addEventListener('click', () => {
        if (typeof DietModule !== 'undefined' && DietModule.showCreateDietPlanModal) {
          DietModule.showCreateDietPlanModal();
        } else {
          Utils.showNotification('Diet plan creation is not available at this time.', 'warning');
        }
      });
    }
    
    // Quick action buttons
    document.getElementById('create-plan-quick')?.addEventListener('click', () => {
      if (typeof WorkoutsModule !== 'undefined' && WorkoutsModule.showCreateWorkoutPlanModal) {
        WorkoutsModule.showCreateWorkoutPlanModal();
      } else {
        Utils.showNotification('Workout plan creation is not available at this time.', 'warning');
      }
    });
    
    document.getElementById('create-diet-quick')?.addEventListener('click', () => {
      if (typeof DietModule !== 'undefined' && DietModule.showCreateDietPlanModal) {
        DietModule.showCreateDietPlanModal();
      } else {
        Utils.showNotification('Diet plan creation is not available at this time.', 'warning');
      }
    });
  }
  /**
   * Public methods and properties
   */
  return {
    init,
    loadClients,
    selectClient
  };
})();