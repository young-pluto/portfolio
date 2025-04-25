/**
 * Diet Module
 * Handles diet plan display and food logging
 */
const DietModule = (() => {
    // DOM Elements
    const mealPlan = document.getElementById('meal-plan');
    
    // Templates
    const mealPlanTemplate = document.getElementById('meal-plan-template');
    
    // State variables
    let currentDietPlan = null;
  
    /**
     * Loads the diet plan for the client
     */
    const loadDietPlan = async () => {
      try {
        const userId = AuthModule.getCurrentUser().uid;
        const dietPlanRef = database.ref(`clients/${userId}/dietPlan`);
        const snapshot = await dietPlanRef.once('value');
        currentDietPlan = snapshot.val();
        
        // Display diet plan
        renderDietPlan();
      } catch (error) {
        console.error('Error loading diet plan:', error);
        if (mealPlan) {
          mealPlan.innerHTML = '<p>Error loading diet plan. Please try again later.</p>';
        }
      }
    };
  
    /**
     * Renders the diet plan UI
     */
    const renderDietPlan = () => {
      if (!mealPlan) return;
      
      // Clear existing content
      mealPlan.innerHTML = '';
      
      if (!currentDietPlan || !currentDietPlan.meals || currentDietPlan.meals.length === 0) {
        mealPlan.innerHTML = `
          <div class="empty-state">
            <p>No diet plan has been assigned to you yet.</p>
            <p>Your coach will create and assign a meal plan soon.</p>
          </div>
        `;
        return;
      }
      
      // Create meals
      currentDietPlan.meals.forEach(meal => {
        // Create meal from template
        const template = mealPlanTemplate.content.cloneNode(true);
        const mealElement = template.querySelector('.meal');
        
        // Set meal name
        mealElement.querySelector('.meal-name').textContent = meal.name || 'Meal';
        
        // Set meal macros
        const macrosElement = mealElement.querySelector('.meal-macros');
        
        // Calculate total macros
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalCalories = 0;
        
        if (meal.foods && meal.foods.length > 0) {
          meal.foods.forEach(food => {
            totalProtein += food.protein || 0;
            totalCarbs += food.carbs || 0;
            totalFat += food.fat || 0;
            totalCalories += food.calories || 0;
          });
        }
        
        macrosElement.innerHTML = `
          <span class="macro protein">P: ${totalProtein}g</span>
          <span class="macro carbs">C: ${totalCarbs}g</span>
          <span class="macro fat">F: ${totalFat}g</span>
          <span class="macro calories">${totalCalories} kcal</span>
        `;
        
        // Add foods
        const foodsElement = mealElement.querySelector('.meal-foods');
        
        if (meal.foods && meal.foods.length > 0) {
          const foodsList = document.createElement('ul');
          foodsList.className = 'foods-list';
          
          meal.foods.forEach(food => {
            const foodItem = document.createElement('li');
            foodItem.className = 'food-item';
            
            const foodName = document.createElement('div');
            foodName.className = 'food-name';
            foodName.textContent = food.name;
            
            const foodQuantity = document.createElement('div');
            foodQuantity.className = 'food-quantity';
            foodQuantity.textContent = food.quantity || '';
            
            foodItem.appendChild(foodName);
            if (food.quantity) {
              foodItem.appendChild(foodQuantity);
            }
            
            foodsList.appendChild(foodItem);
          });
          
          foodsElement.appendChild(foodsList);
        } else {
          foodsElement.innerHTML = '<p>No foods specified for this meal.</p>';
        }
        
        // Add notes if present
        const notesElement = mealElement.querySelector('.meal-notes');
        
        if (meal.notes) {
          notesElement.textContent = meal.notes;
        } else {
          notesElement.classList.add('hidden');
        }
        
        // Add to meal plan
        mealPlan.appendChild(mealElement);
      });
    };
  
    /**
     * Initialize Diet Module
     */
    const init = () => {
      loadDietPlan();
    };
  
    /**
 * Create a new file called diet-plan.js with these functions
 * or add them to the DietModule in diet.js before the return statement
 */

/**
 * Shows the create diet plan modal
 */
const showCreateDietPlanModal = () => {
    const modal = document.getElementById('diet-plan-modal');
    if (!modal) {
      console.error('Diet plan modal not found in DOM');
      Utils.showNotification('Unable to create diet plan. Please try again later.', 'error');
      return;
    }
    
    // Reset form
    const form = document.getElementById('diet-plan-form');
    if (form) form.reset();
    
    // Set title
    const titleElement = document.getElementById('diet-plan-form-title');
    if (titleElement) titleElement.textContent = 'Create Diet Plan';
    
    // Clear existing meals
    const mealsList = document.getElementById('meals-list');
    if (mealsList) mealsList.innerHTML = '';
    
    // Add first meal
    addMeal();
    
    // Show modal
    modal.classList.add('active');
    
    // Add event listeners
    setupDietPlanEventListeners();
  };
  
  /**
   * Sets up event listeners for the diet plan form
   */
  const setupDietPlanEventListeners = () => {
    // Add meal button
    const addMealBtn = document.getElementById('add-meal-btn');
    if (addMealBtn) {
      addMealBtn.addEventListener('click', addMeal);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-diet-plan-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const modal = document.getElementById('diet-plan-modal');
        if (modal) modal.classList.remove('active');
      });
    }
    
    // Save button / form submission
    const form = document.getElementById('diet-plan-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        saveDietPlan();
      };
    }
  };
  
  /**
   * Adds a meal to the diet plan
   */
  const addMeal = () => {
    const mealsList = document.getElementById('meals-list');
    if (!mealsList) return;
    
    // Get meal template
    const template = document.getElementById('meal-template');
    if (!template) {
      console.error('Meal template not found');
      return;
    }
    
    // Clone template
    const mealElement = document.importNode(template.content, true).querySelector('.meal-item');
    
    // Set default meal name
    const mealCount = mealsList.querySelectorAll('.meal-item').length + 1;
    const mealNameInput = mealElement.querySelector('.meal-name-input');
    if (mealNameInput) {
      mealNameInput.value = `Meal ${mealCount}`;
    }
    
    // Add event handlers
    mealElement.querySelector('.remove-meal-btn').addEventListener('click', () => {
      mealElement.remove();
    });
    
    mealElement.querySelector('.add-food-btn').addEventListener('click', () => {
      addFoodToMeal(mealElement);
    });
    
    // Add at least one food
    addFoodToMeal(mealElement);
    
    // Add to container
    mealsList.appendChild(mealElement);
  };
  
  /**
   * Adds a food item to a meal
   */
  const addFoodToMeal = (mealElement) => {
    const foodsList = mealElement.querySelector('.foods-list');
    if (!foodsList) return;
    
    // Get food template
    const template = document.getElementById('food-item-template');
    if (!template) {
      console.error('Food item template not found');
      return;
    }
    
    // Clone template
    const foodElement = document.importNode(template.content, true).querySelector('.food-item');
    
    // Add event handlers
    foodElement.querySelector('.remove-food-btn').addEventListener('click', () => {
      foodElement.remove();
    });
    
    // Auto-calculate calories when macros change
    const proteinInput = foodElement.querySelector('.food-protein-input');
    const carbsInput = foodElement.querySelector('.food-carbs-input');
    const fatInput = foodElement.querySelector('.food-fat-input');
    const caloriesInput = foodElement.querySelector('.food-calories-input');
    
    const calculateCalories = () => {
      const protein = parseFloat(proteinInput.value) || 0;
      const carbs = parseFloat(carbsInput.value) || 0;
      const fat = parseFloat(fatInput.value) || 0;
      
      // Protein and carbs: 4 calories per gram, fat: 9 calories per gram
      const calories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
      caloriesInput.value = calories;
    };
    
    if (proteinInput && carbsInput && fatInput && caloriesInput) {
      proteinInput.addEventListener('input', calculateCalories);
      carbsInput.addEventListener('input', calculateCalories);
      fatInput.addEventListener('input', calculateCalories);
    }
    
    // Add to container
    foodsList.appendChild(foodElement);
  };
  
  /**
   * Saves the diet plan
   */
  const saveDietPlan = async () => {
    try {
      const coachId = AuthModule.getCurrentUser().uid;
      
      // Get plan name and description
      const planName = document.getElementById('diet-plan-name').value.trim();
      const planDescription = document.getElementById('diet-plan-description').value.trim();
      
      if (!planName) {
        Utils.showNotification('Please enter a plan name.', 'error');
        return;
      }
      
      // Build plan data
      const planData = {
        name: planName,
        description: planDescription,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        meals: []
      };
      
      // Get meals
      const mealElements = document.querySelectorAll('.meal-item');
      
      if (mealElements.length === 0) {
        Utils.showNotification('Please add at least one meal to your diet plan.', 'error');
        return;
      }
      
      mealElements.forEach(mealElement => {
        const mealName = mealElement.querySelector('.meal-name-input').value.trim();
        const mealNotes = mealElement.querySelector('.meal-notes-input').value.trim();
        const foodElements = mealElement.querySelectorAll('.food-item');
        
        const foods = [];
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalCalories = 0;
        
        foodElements.forEach(foodElement => {
          const foodName = foodElement.querySelector('.food-name-input').value.trim();
          const foodQuantity = foodElement.querySelector('.food-quantity-input').value.trim();
          const protein = parseFloat(foodElement.querySelector('.food-protein-input').value) || 0;
          const carbs = parseFloat(foodElement.querySelector('.food-carbs-input').value) || 0;
          const fat = parseFloat(foodElement.querySelector('.food-fat-input').value) || 0;
          const calories = parseFloat(foodElement.querySelector('.food-calories-input').value) || 0;
          
          if (foodName) {
            foods.push({
              name: foodName,
              quantity: foodQuantity,
              protein,
              carbs,
              fat,
              calories
            });
            
            totalProtein += protein;
            totalCarbs += carbs;
            totalFat += fat;
            totalCalories += calories;
          }
        });
        
        if (mealName && foods.length > 0) {
          planData.meals.push({
            name: mealName,
            notes: mealNotes,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat,
            calories: totalCalories,
            foods
          });
        }
      });
      
      if (planData.meals.length === 0) {
        Utils.showNotification('Please add at least one meal with food items.', 'error');
        return;
      }
      
      // Save to Firebase
      const newPlanRef = database.ref(`coaches/${coachId}/dietPlans`).push();
      await newPlanRef.set(planData);
      
      // Close modal
      const modal = document.getElementById('diet-plan-modal');
      if (modal) modal.classList.remove('active');
      
      Utils.showNotification('Diet plan created successfully!', 'success');
      
    } catch (error) {
      console.error('Error saving diet plan:', error);
      Utils.showNotification('Error saving diet plan. Please try again.', 'error');
    }
  };
  
  /**
   * Add these to the DietModule return statement to make them publicly available:
   * showCreateDietPlanModal,
   * saveDietPlan
   */

    /**
     * Public methods and properties
     */
    return {
      init,
      loadDietPlan,
      showCreateDietPlanModal,
      saveDietPlan
    };
  })();