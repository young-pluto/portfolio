/**
 * Utilities Module
 * Common functions used across the application
 */
const Utils = (() => {
    /**
     * Formats a date as YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    const formatDateForInput = (date) => {
      const d = date || new Date();
      return d.toISOString().split('T')[0];
    };
  
    /**
     * Formats a date as a human-readable string
     * @param {string|number|Date} date - Date to format
     * @param {boolean} includeTime - Whether to include time
     * @returns {string} Formatted date string
     */
    const formatDate = (date, includeTime = false) => {
      if (!date) return 'N/A';
      
      const d = date instanceof Date ? date : new Date(date);
      
      if (isNaN(d.getTime())) return 'Invalid Date';
      
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      };
      
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      
      return d.toLocaleDateString('en-US', options);
    };
  
    /**
     * Creates a relative time string (e.g., "2 hours ago")
     * @param {string|number|Date} date - Date to format
     * @returns {string} Relative time string
     */
    const timeAgo = (date) => {
      if (!date) return 'N/A';
      
      const d = date instanceof Date ? date : new Date(date);
      
      if (isNaN(d.getTime())) return 'Invalid Date';
      
      const now = new Date();
      const diffMs = now - d;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
      if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
      if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
      
      return formatDate(d);
    };
  
    /**
     * Calculates number of days between two dates
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {number} Number of days
     */
    const daysBetween = (date1, date2) => {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d2 - d1);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
  
    /**
     * Gets first day of the week (Sunday) for a given date
     * @param {Date} date - Date object
     * @returns {Date} First day of the week
     */
    const getFirstDayOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay(); // 0 = Sunday
      return new Date(d.setDate(d.getDate() - day));
    };
  
    /**
     * Debounces a function call
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} Debounced function
     */
    const debounce = (func, wait = 300) => {
      let timeout;
      
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };
  
    /**
     * Checks if a value is empty
     * @param {*} value - Value to check
     * @returns {boolean} Whether value is empty
     */
    const isEmpty = (value) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.trim() === '';
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      
      return false;
    };
  
    /**
     * Safely parses JSON without throwing errors
     * @param {string} str - JSON string to parse
     * @param {*} fallback - Fallback value if parsing fails
     * @returns {*} Parsed JSON or fallback
     */
    const safeJsonParse = (str, fallback = {}) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        return fallback;
      }
    };
  
    /**
     * Truncates a string to a maximum length
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated string
     */
    const truncateString = (str, maxLength = 50) => {
      if (!str || str.length <= maxLength) return str;
      return str.slice(0, maxLength - 3) + '...';
    };
  
    /**
     * Generates a random ID
     * @param {number} length - Length of ID
     * @returns {string} Random ID
     */
    const generateId = (length = 10) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
  
    /**
     * Shows a notification message
     * @param {string} message - Message to show
     * @param {string} type - Type of notification (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    const showNotification = (message, type = 'info', duration = 3000) => {
      // Check if notification container exists
      let container = document.querySelector('.notification-container');
      
      // Create container if it doesn't exist
      if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
          .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .notification {
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            margin-bottom: 10px;
            animation: slideIn 0.3s ease, fadeOut 0.5s ease forwards;
            animation-delay: 0s, ${(duration - 500) / 1000}s;
            position: relative;
            min-width: 250px;
            max-width: 350px;
          }
          .notification.success { background-color: #10b981; }
          .notification.error { background-color: #ef4444; }
          .notification.warning { background-color: #f59e0b; }
          .notification.info { background-color: #3b82f6; }
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
      
      // Create notification
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      
      // Add to container
      container.appendChild(notification);
      
      // Remove after duration
      setTimeout(() => {
        notification.remove();
      }, duration);
    };
  
    /**
     * Converts weight between units
     * @param {number} weight - Weight value
     * @param {string} from - From unit ('kg' or 'lbs')
     * @param {string} to - To unit ('kg' or 'lbs')
     * @returns {number} Converted weight
     */
    const convertWeight = (weight, from, to) => {
      if (from === to) return weight;
      if (from === 'kg' && to === 'lbs') return weight * 2.20462;
      if (from === 'lbs' && to === 'kg') return weight / 2.20462;
      return weight; // Default: no conversion
    };
  
    /**
     * Calculates BMI
     * @param {number} weight - Weight in kg
     * @param {number} height - Height in cm
     * @returns {number} BMI value
     */
    const calculateBMI = (weight, height) => {
      if (!weight || !height) return 0;
      
      // Convert height from cm to m
      const heightInM = height / 100;
      
      // BMI formula: weight (kg) / (height (m) * height (m))
      return weight / (heightInM * heightInM);
    };
  
    /**
     * Gets BMI category
     * @param {number} bmi - BMI value
     * @returns {string} BMI category
     */
    const getBmiCategory = (bmi) => {
      if (bmi < 18.5) return 'Underweight';
      if (bmi < 25) return 'Healthy';
      if (bmi < 30) return 'Overweight';
      return 'Obese';
    };
  
    /**
     * Creates a chart using Chart.js
     * @param {string} canvasId - Canvas element ID
     * @param {string} type - Chart type
     * @param {Object} data - Chart data
     * @param {Object} options - Chart options
     * @returns {Chart} Chart instance
     */
    const createChart = (canvasId, type, data, options = {}) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return null;
      
      return new Chart(canvas, {
        type,
        data,
        options
      });
    };
  
    /**
     * Public methods and properties
     */
    return {
      formatDateForInput,
      formatDate,
      timeAgo,
      daysBetween,
      getFirstDayOfWeek,
      debounce,
      isEmpty,
      safeJsonParse,
      truncateString,
      generateId,
      showNotification,
      convertWeight,
      calculateBMI,
      getBmiCategory,
      createChart
    };
  })();