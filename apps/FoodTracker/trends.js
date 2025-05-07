// Trends Module
const TrendsModule = (() => {
    // DOM Elements
    const weightChart = document.getElementById('weight-chart');
    const caloriesChart = document.getElementById('calories-chart');
    const macrosChart = document.getElementById('macros-chart');
    const nutritionDataBody = document.getElementById('nutrition-data-body');
    const exportDataBtn = document.getElementById('export-data-btn');

    // Chart instances
    let weightChartInstance = null;
    let caloriesChartInstance = null;
    let macrosChartInstance = null;

    // Data points
    let trendData = [];

    // Load and process data for trends
    const loadTrendsData = () => {
        const entries = FoodEntryModule.getAllEntries();
        
        if (!entries || entries.length === 0) {
            // No data available
            nutritionDataBody.innerHTML = '<tr><td colspan="6">No data available yet. Add some entries to see trends.</td></tr>';
            return;
        }
        
        // Format data for display
        trendData = entries.map(entry => {
            // Calculate total macros and calories for the day
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFat = 0;
            
            if (entry.meals) {
                Object.values(entry.meals).forEach(meal => {
                    if (meal.foodItems && meal.foodItems.length > 0) {
                        meal.foodItems.forEach(food => {
                            totalProtein += parseFloat(food.protein) || 0;
                            totalCarbs += parseFloat(food.carbs) || 0;
                            totalFat += parseFloat(food.fat) || 0;
                        });
                    }
                });
            }
            
            const totalCalories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);
            
            return {
                id: entry.id,
                date: entry.date,
                formattedDate: formatDate(entry.date),
                weight: entry.bodyWeight || null,
                protein: totalProtein,
                carbs: totalCarbs,
                fat: totalFat,
                calories: totalCalories
            };
        });
        
        // Sort data chronologically (oldest to newest)
        trendData.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        // Render data
        renderWeightChart();
        renderCaloriesChart();
        renderMacrosChart();
        renderDataTable();
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

    // Render weight trend chart
    const renderWeightChart = () => {
        // Filter out entries without weight data
        const weightData = trendData.filter(entry => entry.weight !== null);
        
        if (weightData.length === 0) {
            if (weightChartInstance) {
                weightChartInstance.destroy();
            }
            weightChart.parentElement.innerHTML = '<h3>Body Weight Trend</h3><p>No weight data available yet. Add body weight to your entries to see the trend.</p>';
            return;
        }
        
        const labels = weightData.map(entry => entry.formattedDate);
        const values = weightData.map(entry => entry.weight);
        
        // Destroy previous instance if exists
        if (weightChartInstance) {
            weightChartInstance.destroy();
        }
        
        // Create new chart
        weightChartInstance = new Chart(weightChart, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Body Weight (kg)',
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

    // Render calories trend chart
    const renderCaloriesChart = () => {
        if (trendData.length === 0) {
            if (caloriesChartInstance) {
                caloriesChartInstance.destroy();
            }
            caloriesChart.parentElement.innerHTML = '<h3>Daily Calorie Intake</h3><p>No data available yet. Add some entries to see the trend.</p>';
            return;
        }
        
        const labels = trendData.map(entry => entry.formattedDate);
        const values = trendData.map(entry => Math.round(entry.calories));
        
        // Destroy previous instance if exists
        if (caloriesChartInstance) {
            caloriesChartInstance.destroy();
        }
        
        // Create new chart
        caloriesChartInstance = new Chart(caloriesChart, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Calories',
                    data: values,
                    backgroundColor: 'rgba(249, 115, 22, 0.7)',
                    borderColor: '#f97316',
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
                                return value + ' kcal';
                            }
                        }
                    }
                }
            }
        });
    };

    // Render macros breakdown chart
    const renderMacrosChart = () => {
        if (trendData.length === 0) {
            if (macrosChartInstance) {
                macrosChartInstance.destroy();
            }
            macrosChart.parentElement.innerHTML = '<h3>Macronutrient Breakdown</h3><p>No data available yet. Add some entries to see macronutrient data.</p>';
            return;
        }
        
        // Calculate average macros
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        
        trendData.forEach(entry => {
            totalProtein += entry.protein;
            totalCarbs += entry.carbs;
            totalFat += entry.fat;
        });
        
        const avgProtein = totalProtein / trendData.length;
        const avgCarbs = totalCarbs / trendData.length;
        const avgFat = totalFat / trendData.length;
        
        // Calculate macro percentages
        const totalCals = (avgProtein * 4) + (avgCarbs * 4) + (avgFat * 9);
        const proteinPerc = Math.round((avgProtein * 4 / totalCals) * 100);
        const carbsPerc = Math.round((avgCarbs * 4 / totalCals) * 100);
        const fatPerc = Math.round((avgFat * 9 / totalCals) * 100);
        
        // Destroy previous instance if exists
        if (macrosChartInstance) {
            macrosChartInstance.destroy();
        }
        
        // Create new chart
        macrosChartInstance = new Chart(macrosChart, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [{
                    data: [proteinPerc, carbsPerc, fatPerc],
                    backgroundColor: [
                        'rgba(74, 222, 128, 0.7)',
                        'rgba(249, 115, 22, 0.7)',
                        'rgba(139, 92, 246, 0.7)'
                    ],
                    borderColor: [
                        '#4ade80',
                        '#f97316',
                        '#8b5cf6'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.raw + '%';
                            }
                        }
                    }
                }
            }
        });
    };

    // Render data table
    const renderDataTable = () => {
        nutritionDataBody.innerHTML = '';
        
        if (trendData.length === 0) {
            nutritionDataBody.innerHTML = '<tr><td colspan="6">No data available yet. Add some entries to see data.</td></tr>';
            return;
        }
        
        // Sort data by date (newest first) for table display
        const sortedData = [...trendData].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        sortedData.forEach(entry => {
            const row = document.createElement('tr');
            
            // Format date
            const dateCell = document.createElement('td');
            dateCell.textContent = entry.formattedDate;
            row.appendChild(dateCell);
            
            // Weight column
            const weightCell = document.createElement('td');
            weightCell.textContent = entry.weight ? `${entry.weight} kg` : '—';
            row.appendChild(weightCell);
            
            // Calories column
            const caloriesCell = document.createElement('td');
            caloriesCell.textContent = Math.round(entry.calories);
            row.appendChild(caloriesCell);
            
            // Protein column
            const proteinCell = document.createElement('td');
            proteinCell.textContent = entry.protein.toFixed(1);
            row.appendChild(proteinCell);
            
            // Carbs column
            const carbsCell = document.createElement('td');
            carbsCell.textContent = entry.carbs.toFixed(1);
            row.appendChild(carbsCell);
            
            // Fat column
            const fatCell = document.createElement('td');
            fatCell.textContent = entry.fat.toFixed(1);
            row.appendChild(fatCell);
            
            nutritionDataBody.appendChild(row);
        });
    };

    // Export data to CSV
    const exportDataToCSV = () => {
        if (trendData.length === 0) {
            alert('No data available to export.');
            return;
        }
        
        // Prepare CSV content
        let csvContent = 'Date,Weight (kg),Calories,Protein (g),Carbs (g),Fat (g)\n';
        
        // Sort data by date (newest first)
        const sortedData = [...trendData].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        sortedData.forEach(entry => {
            csvContent += `${entry.date},${entry.weight || ''},${Math.round(entry.calories)},${entry.protein.toFixed(1)},${entry.carbs.toFixed(1)},${entry.fat.toFixed(1)}\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'food_tracker_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Initialize
    const init = () => {
        // Event listener for export button
        exportDataBtn.addEventListener('click', exportDataToCSV);
    };

    // Public methods and properties
    return {
        init,
        loadTrendsData
    };
})();