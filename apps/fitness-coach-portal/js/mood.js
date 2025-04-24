/**
 * Mood Module
 * Handles mood and energy tracking functionality
 */
const MoodModule = (() => {
    // DOM Elements
    const moodDate = document.getElementById('mood-date');
    const moodSlider = document.getElementById('mood-slider');
    const energySlider = document.getElementById('energy-slider');
    const moodNotes = document.getElementById('mood-notes-input');
    const saveMoodBtn = document.getElementById('save-mood-btn');
    const moodChart = document.getElementById('mood-chart');
    const moodHistory = document.getElementById('mood-history');
    const moodEmojiOptions = document.querySelectorAll('.mood-emoji-option');
    
    // State variables
    let moodChartInstance = null;
    let moodData = {};
  
    /**
     * Initializes mood tracking UI elements
     */
    const initMoodTracking = () => {
      // Set default date to today
      moodDate.value = Utils.formatDateForInput(new Date());
      
      // Connect slider to emoji selection
      moodSlider.addEventListener('input', updateMoodEmoji);
      
      // Connect emoji options to slider
      moodEmojiOptions.forEach(emoji => {
        emoji.addEventListener('click', () => {
          const value = parseInt(emoji.dataset.value);
          moodSlider.value = value;
          updateMoodEmoji();
        });
      });
      
      // Save mood handler
      saveMoodBtn.addEventListener('click', saveMoodData);
      
      // Load existing mood for today
      loadTodayMood();
    };
  
    /**
     * Updates the selected mood emoji based on slider value
     */
    const updateMoodEmoji = () => {
      const moodValue = parseInt(moodSlider.value);
      
      // Clear all active emoji
      moodEmojiOptions.forEach(emoji => {
        emoji.classList.remove('active');
      });
      
      // Set active emoji based on mood value
      const activeEmoji = document.querySelector(`.mood-emoji-option[data-value="${moodValue}"]`);
      if (activeEmoji) {
        activeEmoji.classList.add('active');
      }
    };
  
    /**
     * Loads today's mood data if it exists
     */
    const loadTodayMood = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const today = Utils.formatDateForInput(new Date());
        
        const moodRef = database.ref(`clients/${userId}/logs/${today}/mood`);
        const snapshot = await moodRef.once('value');
        const todayMood = snapshot.val();
        
        if (todayMood) {
          // Set form values
          moodSlider.value = todayMood.value || 3;
          energySlider.value = todayMood.energy || 3;
          moodNotes.value = todayMood.notes || '';
          
          // Update emoji
          updateMoodEmoji();
        }
      } catch (error) {
        console.error('Error loading today\'s mood:', error);
      }
    };
  
    /**
     * Saves mood data to Firebase
     */
    const saveMoodData = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const date = moodDate.value;
        
        if (!date) {
          Utils.showNotification('Please select a date.', 'error');
          return;
        }
        
        const moodValue = parseInt(moodSlider.value);
        const energyValue = parseInt(energySlider.value);
        const notes = moodNotes.value.trim();
        
        const moodData = {
          value: moodValue,
          energy: energyValue,
          notes: notes,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Save to Firebase
        await database.ref(`clients/${userId}/logs/${date}/mood`).set(moodData);
        
        // Show success message
        Utils.showNotification('Mood data saved successfully!', 'success');
        
        // Reload chart and history
        loadMoodData();
        
      } catch (error) {
        console.error('Error saving mood data:', error);
        Utils.showNotification('Error saving mood data. Please try again.', 'error');
      }
    };
  
    /**
     * Loads mood data for chart and history
     */
    const loadMoodData = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        
        // Get last 30 days of mood logs
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const logsRef = database.ref(`clients/${userId}/logs`);
        const snapshot = await logsRef.once('value');
        const logs = snapshot.val() || {};
        
        // Extract mood data
        const moodEntries = [];
        
        Object.entries(logs).forEach(([date, log]) => {
          if (log.mood) {
            moodEntries.push({
              date,
              ...log.mood
            });
          }
        });
        
        // Sort by date (oldest first for chart)
        moodEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Store mood data
        moodData = moodEntries;
        
        // Update chart and history
        updateMoodChart();
        updateMoodHistory();
        
      } catch (error) {
        console.error('Error loading mood data:', error);
        
        if (moodHistory) {
          moodHistory.innerHTML = '<p>Error loading mood history.</p>';
        }
      }
    };
  
    /**
     * Updates the mood chart
     */
    const updateMoodChart = () => {
      if (!moodChart) return;
      
      // Get last 30 entries or fewer
      const chartData = moodData.slice(-30);
      
      // Prepare data for chart
      const labels = chartData.map(entry => {
        const date = new Date(entry.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
      
      const moodValues = chartData.map(entry => entry.value);
      const energyValues = chartData.map(entry => entry.energy);
      
      // Destroy existing chart if it exists
      if (moodChartInstance) {
        moodChartInstance.destroy();
      }
      
      // Create new chart
      moodChartInstance = new Chart(moodChart, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Mood',
              data: moodValues,
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              tension: 0.2,
              fill: true
            },
            {
              label: 'Energy',
              data: energyValues,
              borderColor: '#f97316',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              tension: 0.2,
              fill: true
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
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw;
                  const datasetLabel = context.dataset.label;
                  
                  // Mood descriptions
                  if (datasetLabel === 'Mood') {
                    const moodDescriptions = ['Very Bad', 'Bad', 'Neutral', 'Good', 'Excellent'];
                    return `Mood: ${moodDescriptions[value - 1] || value}`;
                  }
                  
                  // Energy descriptions
                  if (datasetLabel === 'Energy') {
                    const energyDescriptions = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
                    return `Energy: ${energyDescriptions[value - 1] || value}`;
                  }
                  
                  return `${datasetLabel}: ${value}`;
                }
              }
            }
          }
        }
      });
    };
  
    /**
     * Updates the mood history list
     */
    const updateMoodHistory = () => {
      if (!moodHistory) return;
      
      // Sort by date (newest first for display)
      const sortedEntries = [...moodData].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (sortedEntries.length === 0) {
        moodHistory.innerHTML = '<p>No mood tracking history yet.</p>';
        return;
      }
      
      let html = '';
      
      sortedEntries.forEach(entry => {
        const date = new Date(entry.date);
        const formattedDate = Utils.formatDate(date);
        
        // Mood and energy emoji/text
        const moodEmojis = ['😞', '😕', '😐', '🙂', '😄'];
        const moodEmoji = moodEmojis[entry.value - 1] || '😐';
        
        const energyDescriptions = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
        const energyDescription = energyDescriptions[entry.energy - 1] || 'Medium';
        
        html += `
          <div class="mood-entry">
            <div class="mood-entry-date">
              ${formattedDate}
            </div>
            <div class="mood-entry-values">
              <div class="mood-value">
                <span>Mood: ${moodEmoji}</span>
              </div>
              <div class="energy-value">
                <span>Energy: ${energyDescription}</span>
              </div>
            </div>
          </div>
        `;
        
        // Add notes if present
        if (entry.notes) {
          html += `
            <div class="mood-entry-notes">
              "${entry.notes}"
            </div>
          `;
        }
      });
      
      moodHistory.innerHTML = html;
    };
  
    /**
     * Initialize Mood Module
     */
    const init = () => {
      initMoodTracking();
      loadMoodData();
    };
  
    /**
     * Public methods and properties
     */
    return {
      init,
      loadMoodData,
      saveMoodData
    };
  })();