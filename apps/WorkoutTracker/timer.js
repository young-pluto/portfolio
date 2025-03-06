// Timer Module
const TimerModule = (() => {
    // DOM Elements
    const workoutTimer = document.getElementById('workout-timer');
    const timerDisplay = document.getElementById('timer-display');
    const pauseTimerBtn = document.getElementById('pause-timer-btn');
    const resetTimerBtn = document.getElementById('reset-timer-btn');
    
    // Timer state
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval = null;
    let isRunning = false;
    let pausedTime = 0;
    
    // Start timer
    const startTimer = () => {
        if (!isRunning) {
            isRunning = true;
            workoutTimer.classList.remove('hidden');
            
            // If timer was paused, use the pausedTime as reference
            if (pausedTime > 0) {
                startTime = Date.now() - pausedTime;
            } else {
                startTime = Date.now();
            }
            
            // Update display every 1 second
            timerInterval = setInterval(updateDisplay, 1000);
            
            // Update pause button text
            pauseTimerBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        }
    };
    
    // Pause timer
    const pauseTimer = () => {
        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false;
            pausedTime = Date.now() - startTime;
            pauseTimerBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        } else {
            // Resume if paused
            startTimer();
        }
    };
    
    // Reset timer
    const resetTimer = () => {
        clearInterval(timerInterval);
        isRunning = false;
        pausedTime = 0;
        timerDisplay.textContent = '00:00:00';
        pauseTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    };
    
    // Update timer display
    const updateDisplay = () => {
        const currentTime = Date.now();
        elapsedTime = currentTime - startTime;
        
        // Convert milliseconds to hours, minutes, seconds
        const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
        
        // Format display with leading zeros
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        
        timerDisplay.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    };
    
    // Toggle timer visibility
    const showTimer = () => {
        workoutTimer.classList.remove('hidden');
    };
    
    const hideTimer = () => {
        workoutTimer.classList.add('hidden');
        resetTimer();
    };
    
    // Initialize
    const init = () => {
        // Event listeners
        pauseTimerBtn.addEventListener('click', pauseTimer);
        resetTimerBtn.addEventListener('click', resetTimer);
    };
    
    // Public methods and properties
    return {
        init,
        startTimer,
        pauseTimer,
        resetTimer,
        showTimer,
        hideTimer
    };
})();

// Initialize Timer Module
document.addEventListener('DOMContentLoaded', () => {
    TimerModule.init();
});