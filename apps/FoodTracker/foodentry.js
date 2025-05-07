// Food Entry Module with Body Weight Support
const FoodEntryModule = (() => {
    // DOM Elements
    const entryDate = document.getElementById('entry-date');
    const bodyWeight = document.getElementById('body-weight');
    const mealsContainer = document.getElementById('meals-container');
    const addMealBtn = document.getElementById('add-meal-btn');
    const saveEntryBtn = document.getElementById('save-entry-btn');
    const recentEntriesList = document.getElementById('recent-entries-list');
    const historyList = document.getElementById('history-list');

    // State
    let entries = [];
    let editingEntryId = null;

    // Firebase references
    const getEntriesRef = () => {
        const user = AuthModule.getCurrentUser();
        return database.ref(`users/${user.uid}/foodEntries`);
    };

    // Initialize entry date to today
    const initEntryDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        entryDate.value = `${yyyy}-${mm}-${dd}`;
    };

    // Add new meal to the UI
    const addMeal = () => {
        const template = document.getElementById('meal-template');
        const mealElement = document.importNode(template.content, true).querySelector('.meal-item');
        
        // Add event listeners
        setupMealEventListeners(mealElement);
        
        // Add to container
        mealsContainer.appendChild(mealElement);
        
        // Focus on the meal name input
        setTimeout(() => {
            mealElement.querySelector('.meal-name-input').focus();
        }, 100);
        
        return mealElement;
    };

    // Setup event listeners for meal element
    const setupMealEventListeners = (mealElement) => {
        // Delete meal button
        mealElement.querySelector('.delete-meal-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this meal?')) {
                mealElement.remove();
            }
        });
        
        // Add food item button
        mealElement.querySelector('.add-food-btn').addEventListener('click', () => {
            addFoodItem(mealElement);
        });
    };

    // Add new food item to a meal
    const addFoodItem = (mealElement) => {
        const foodItemsContainer = mealElement.querySelector('.food-items-container');
        const template = document.getElementById('food-item-template');
        const foodItemElement = document.importNode(template.content, true).querySelector('.food-item');
        
        // Add event listener for delete button
        foodItemElement.querySelector('.delete-food-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this food item?')) {
                foodItemElement.remove();
            }
        });
        
        // Add to container
        foodItemsContainer.appendChild(foodItemElement);
        
        // Focus on the food name input
        setTimeout(() => {
            foodItemElement.querySelector('.food-name-input').focus();
        }, 100);
        
        return foodItemElement;
    };

    // Save food entry to Firebase
    const saveEntry = () => {
        // Validate
        if (!entryDate.value) {
            alert('Please select a date for the entry');
            return;
        }
        
        const mealElements = mealsContainer.querySelectorAll('.meal-item');
        if (mealElements.length === 0) {
            alert('Please add at least one meal to your entry');
            return;
        }
        
        // Check if any meal has no name
        let hasEmptyMealName = false;
        mealElements.forEach(mealElement => {
            const mealName = mealElement.querySelector('.meal-name-input').value.trim();
            if (!mealName) {
                hasEmptyMealName = true;
            }
        });
        
        if (hasEmptyMealName) {
            alert('Please provide a name for each meal');
            return;
        }
        
        // Collect entry data
        const entryData = {
            date: entryDate.value,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            bodyWeight: bodyWeight.value ? parseFloat(bodyWeight.value) : null,
            meals: {}
        };
        
        // Process each meal and its food items
        mealElements.forEach((mealElement, mealIndex) => {
            const mealName = mealElement.querySelector('.meal-name-input').value.trim();
            const foodItems = [];
            
            // Get food items for this meal
            const foodItemElements = mealElement.querySelectorAll('.food-item');
            
            foodItemElements.forEach((foodItemElement, foodIndex) => {
                const foodName = foodItemElement.querySelector('.food-name-input').value.trim();
                const weight = foodItemElement.querySelector('.weight-input').value;
                const protein = foodItemElement.querySelector('.protein-input').value;
                const carbs = foodItemElement.querySelector('.carbs-input').value;
                const fat = foodItemElement.querySelector('.fat-input').value;
                
                // Only add food items with at least a name
                if (foodName) {
                    foodItems.push({
                        name: foodName,
                        weight: weight || 0,
                        protein: protein || 0,
                        carbs: carbs || 0,
                        fat: fat || 0
                    });
                }
            });
            
            // Add meal only if it has at least one food item
            if (foodItems.length > 0) {
                entryData.meals[`meal${mealIndex + 1}`] = {
                    name: mealName,
                    foodItems: foodItems
                };
            }
        });
        
        // Check if we have any meals with food items
        if (Object.keys(entryData.meals).length === 0) {
            alert('Please add at least one food item to your entry');
            return;
        }
        
        // Save to Firebase
        const entriesRef = getEntriesRef();
        
        if (editingEntryId) {
            // Update existing entry
            entriesRef.child(editingEntryId).update(entryData)
                .then(() => {
                    alert('Entry updated successfully!');
                    resetEntryForm();
                })
                .catch(error => {
                    alert(`Error updating entry: ${error.message}`);
                });
        } else {
            // Add new entry
            entriesRef.push(entryData)
                .then(() => {
                    alert('Entry saved successfully!');
                    resetEntryForm();
                })
                .catch(error => {
                    alert(`Error saving entry: ${error.message}`);
                });
        }
    };

    // Reset entry form
    const resetEntryForm = () => {
        // Clear meals container
        mealsContainer.innerHTML = '';
        
        // Reset editing state
        editingEntryId = null;
        
        // Reset weight
        bodyWeight.value = '';
        
        // Reset date to today
        initEntryDate();
        
        // Add one empty meal to start
        addMeal();
    };

    // Load entries from Firebase
    const loadEntries = () => {
        const entriesRef = getEntriesRef();
        
        entriesRef.on('value', (snapshot) => {
            entries = [];
            
            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach(key => {
                    const entry = {
                        id: key,
                        ...data[key]
                    };
                    entries.push(entry);
                });
                
                // Sort entries by date (newest first)
                entries.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
            }
        });
    };

    // Load recent entries (last 3 days)
    const loadRecentEntries = () => {
        recentEntriesList.innerHTML = '';
        
        if (entries.length === 0) {
            recentEntriesList.innerHTML = '<p>No entries yet. Start by adding your first meal!</p>';
            return;
        }
        
        // Get entries from the last 3 days
        const recentEntries = entries.slice(0, 3);
        
        if (recentEntries.length === 0) {
            recentEntriesList.innerHTML = '<p>No recent entries found.</p>';
            return;
        }
        
        // Render recent entries
        recentEntries.forEach(entry => {
            const entryElement = createEntryElement(entry);
            recentEntriesList.appendChild(entryElement);
        });
    };

    // Load history entries (all except the recent ones)
    const loadHistoryEntries = () => {
        historyList.innerHTML = '';
        
        if (entries.length <= 3) {
            historyList.innerHTML = '<p>No older entries yet. They will appear here after you have more than 3 days of entries.</p>';
            return;
        }
        
        // Get entries beyond the recent 3
        const historyEntries = entries.slice(3);
        
        // Render history entries
        historyEntries.forEach(entry => {
            const entryElement = createEntryElement(entry);
            historyList.appendChild(entryElement);
        });
    };

    // Create entry element
    const createEntryElement = (entry) => {
        const template = document.getElementById('entry-item-template');
        const entryElement = document.importNode(template.content, true).querySelector('.entry-item');
        
        entryElement.dataset.id = entry.id;
        
        // Format date
        const entryDateObj = new Date(entry.date);
        const formattedDate = entryDateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        entryElement.querySelector('.entry-date').textContent = formattedDate;
        
        // Add body weight if available
        const weightDisplay = entryElement.querySelector('.weight-display');
        if (entry.bodyWeight) {
            weightDisplay.innerHTML = `<i class="fas fa-weight"></i> Body Weight: <strong>${entry.bodyWeight} kg</strong>`;
        } else {
            weightDisplay.classList.add('hidden');
        }
        
        // Calculate totals
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let mealCount = 0;
        let foodItemCount = 0;
        
        const mealSummaryContainer = entryElement.querySelector('.meal-summary-container');
        
        if (entry.meals) {
            mealCount = Object.keys(entry.meals).length;
            
            // Add meal summaries
            Object.values(entry.meals).forEach(meal => {
                const mealSummary = document.createElement('div');
                mealSummary.className = 'meal-summary';
                
                let mealProtein = 0;
                let mealCarbs = 0;
                let mealFat = 0;
                
                if (meal.foodItems && meal.foodItems.length > 0) {
                    foodItemCount += meal.foodItems.length;
                    
                    meal.foodItems.forEach(food => {
                        mealProtein += parseFloat(food.protein) || 0;
                        mealCarbs += parseFloat(food.carbs) || 0;
                        mealFat += parseFloat(food.fat) || 0;
                    });
                    
                    // Add to totals
                    totalProtein += mealProtein;
                    totalCarbs += mealCarbs;
                    totalFat += mealFat;
                    
                    // Calculate calories
                    const mealCalories = (mealProtein * 4) + (mealCarbs * 4) + (mealFat * 9);
                    
                    mealSummary.innerHTML = `
                        <h4>${meal.name}</h4>
                        <p>${meal.foodItems.length} items | ${mealProtein.toFixed(1)}g protein | ${mealCarbs.toFixed(1)}g carbs | ${mealFat.toFixed(1)}g fat | ${mealCalories.toFixed(0)} calories</p>
                    `;
                    
                    mealSummaryContainer.appendChild(mealSummary);
                }
            });
        }
        
        // Calculate total calories
        const totalCalories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);
        
        // Set entry summary
        entryElement.querySelector('.entry-summary').innerHTML = `
            <div>Total: ${totalProtein.toFixed(1)}g protein | ${totalCarbs.toFixed(1)}g carbs | ${totalFat.toFixed(1)}g fat | ${totalCalories.toFixed(0)} calories</div>
            <div>${mealCount} meals, ${foodItemCount} food items</div>
        `;
        
        // Add event listeners
        entryElement.querySelector('.edit-entry-btn').addEventListener('click', () => {
            editEntry(entry.id);
        });
        
        entryElement.querySelector('.delete-entry-btn').addEventListener('click', () => {
            deleteEntry(entry.id);
        });
        
        return entryElement;
    };

    // Edit entry
    const editEntry = (entryId) => {
        const entry = entries.find(e => e.id === entryId);
        if (!entry) return;
        
        // Set editing state
        editingEntryId = entryId;
        
        // Clear existing meals
        mealsContainer.innerHTML = '';
        
        // Set date
        entryDate.value = entry.date;
        
        // Set body weight if available
        bodyWeight.value = entry.bodyWeight || '';
        
        // Recreate meals
        if (entry.meals) {
            Object.values(entry.meals).forEach(meal => {
                const mealElement = addMeal();
                mealElement.querySelector('.meal-name-input').value = meal.name;
                
                // Clear any default food items
                mealElement.querySelector('.food-items-container').innerHTML = '';
                
                // Add food items
                if (meal.foodItems && meal.foodItems.length > 0) {
                    meal.foodItems.forEach(food => {
                        const foodItemElement = addFoodItem(mealElement);
                        foodItemElement.querySelector('.food-name-input').value = food.name;
                        foodItemElement.querySelector('.weight-input').value = food.weight;
                        foodItemElement.querySelector('.protein-input').value = food.protein;
                        foodItemElement.querySelector('.carbs-input').value = food.carbs;
                        foodItemElement.querySelector('.fat-input').value = food.fat;
                    });
                }
            });
        }
        
        // Switch to new entry section
        document.getElementById('new-entry-btn').click();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Delete entry
    const deleteEntry = (entryId) => {
        if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            return;
        }
        
        const entriesRef = getEntriesRef();
        
        entriesRef.child(entryId).remove()
            .then(() => {
                alert('Entry deleted successfully');
            })
            .catch(error => {
                alert(`Error deleting entry: ${error.message}`);
            });
    };

    // Get all entries
    const getAllEntries = () => {
        return [...entries];
    };

    // Initialize
    const init = () => {
        // Set default date
        initEntryDate();
        
        // Event listeners
        addMealBtn.addEventListener('click', addMeal);
        saveEntryBtn.addEventListener('click', saveEntry);
        
        // Add first meal
        addMeal();
        
        // Load entries from Firebase
        loadEntries();
    };

    // Public methods and properties
    return {
        init,
        loadRecentEntries,
        loadHistoryEntries,
        getAllEntries
    };
})();