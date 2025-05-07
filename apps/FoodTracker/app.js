// Main App Module
const AppModule = (() => {
    // DOM Elements
    const newEntryBtn = document.getElementById('new-entry-btn');
    const recentBtn = document.getElementById('recent-btn');
    const historyBtn = document.getElementById('history-btn');
    const trendsBtn = document.getElementById('trends-btn');
    const newEntrySection = document.getElementById('new-entry-section');
    const recentEntriesSection = document.getElementById('recent-entries-section');
    const historySection = document.getElementById('history-section');
    const trendsSection = document.getElementById('trends-section');

    // Show new entry section
    const showNewEntrySection = () => {
        newEntrySection.classList.remove('hidden');
        recentEntriesSection.classList.add('hidden');
        historySection.classList.add('hidden');
        trendsSection.classList.add('hidden');
        
        // Update active nav button
        updateActiveNavButton(newEntryBtn);
    };

    // Show recent entries section
    const showRecentEntriesSection = () => {
        newEntrySection.classList.add('hidden');
        recentEntriesSection.classList.remove('hidden');
        historySection.classList.add('hidden');
        trendsSection.classList.add('hidden');
        
        // Update active nav button
        updateActiveNavButton(recentBtn);
        
        // Load recent entries
        FoodEntryModule.loadRecentEntries();
    };

    // Show history section
    const showHistorySection = () => {
        newEntrySection.classList.add('hidden');
        recentEntriesSection.classList.add('hidden');
        historySection.classList.remove('hidden');
        trendsSection.classList.add('hidden');
        
        // Update active nav button
        updateActiveNavButton(historyBtn);
        
        // Load history
        FoodEntryModule.loadHistoryEntries();
    };

    // Show trends section
    const showTrendsSection = () => {
        newEntrySection.classList.add('hidden');
        recentEntriesSection.classList.add('hidden');
        historySection.classList.add('hidden');
        trendsSection.classList.remove('hidden');
        
        // Update active nav button
        updateActiveNavButton(trendsBtn);
        
        // Initialize trends
        TrendsModule.loadTrendsData();
    };

    // Update active nav button
    const updateActiveNavButton = (activeButton) => {
        // Remove active class from all nav buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Add active class to active button
        activeButton.classList.add('active');
    };

    // Initialize
    const init = () => {
        // Event listeners
        newEntryBtn.addEventListener('click', showNewEntrySection);
        recentBtn.addEventListener('click', showRecentEntriesSection);
        historyBtn.addEventListener('click', showHistorySection);
        trendsBtn.addEventListener('click', showTrendsSection);
    };

    // Public methods and properties
    return {
        init,
        initAfterAuth: () => {
            FoodEntryModule.init();
            TrendsModule.init();
            init();
            
            // Show new entry section by default
            showNewEntrySection();
        }
    };
})();