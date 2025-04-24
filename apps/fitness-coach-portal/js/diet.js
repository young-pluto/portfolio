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
     * Public methods and properties
     */
    return {
      init,
      loadDietPlan
    };
  })();