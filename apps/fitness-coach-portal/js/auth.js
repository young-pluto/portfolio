/**
 * Authentication Module
 * Handles user authentication and authorization
 */
const AuthModule = (() => {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginMessage = document.getElementById('login-message');
    const logoutBtn = document.getElementById('logout-btn');
  
    // Current user state
    let currentUser = null;
    let userRole = null;
    let userData = null;
  
    /**
     * Handles user login
     */
    const handleLogin = async (e) => {
      if (e) e.preventDefault();
      
      if (!loginEmail || !loginPassword) return;
      
      const email = loginEmail.value.trim();
      const password = loginPassword.value;
      
      if (!email || !password) {
        showLoginMessage('Please enter both email and password');
        return;
      }
      
      showLoginMessage('Signing in...', false);
      
      try {
        // Sign in with Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);
        
        // Auth state change listener will handle redirecting
      } catch (error) {
        console.error('Login error:', error);
        showLoginMessage(getAuthErrorMessage(error));
      }
    };
  
    /**
     * Handles user logout
     */
    const handleLogout = async () => {
      try {
        await auth.signOut();
        redirectToLogin();
      } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
      }
    };
  
    /**
     * Displays login error messages
     */
    const showLoginMessage = (message, isError = true) => {
      if (loginMessage) {
        loginMessage.textContent = message;
        loginMessage.className = 'login-message';
        if (isError) {
          loginMessage.classList.add('error');
        }
      }
    };
  
    /**
     * Gets user role and data
     */
    const loadUserData = async (userId) => {
      try {
        // First check for user role
        const userRoleRef = database.ref(`users/${userId}/role`);
        const roleSnapshot = await userRoleRef.once('value');
        const role = roleSnapshot.val();
        
        // Based on role, fetch correct data
        if (role === 'coach') {
          const coachRef = database.ref(`users/${userId}`);
          const coachSnapshot = await coachRef.once('value');
          return { 
            role: 'coach',
            ...coachSnapshot.val()
          };
        } else if (role === 'client') {
          const clientRef = database.ref(`clients/${userId}/profile`);
          const clientSnapshot = await clientRef.once('value');
          return { 
            role: 'client',
            ...clientSnapshot.val()
          };
        }
        
        return { role: 'unknown' };
      } catch (error) {
        console.error('Error loading user data:', error);
        return { role: 'unknown' };
      }
    };
  
    /**
     * Redirects user based on role
     */
    const redirectBasedOnRole = (role) => {
      // Get current page
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.endsWith('index.html') || currentPath.endsWith('/');
      const isClientPage = currentPath.includes('client-dashboard.html');
      const isCoachPage = currentPath.includes('coach-dashboard.html');
      
      if (role === 'coach') {
        if (!isCoachPage) {
          window.location.href = 'coach-dashboard.html';
        }
      } else if (role === 'client') {
        if (!isClientPage) {
          window.location.href = 'client-dashboard.html';
        }
      } else {
        // Unknown role or not authorized
        if (!isLoginPage) {
          redirectToLogin();
        }
      }
    };
  
    /**
     * Redirects to login page
     */
    const redirectToLogin = () => {
      window.location.href = 'index.html';
    };
  
    /**
     * Maps Firebase auth errors to user-friendly messages
     */
    const getAuthErrorMessage = (error) => {
      const errorCode = error.code;
      
      switch (errorCode) {
        case 'auth/invalid-email':
          return 'Invalid email address format';
        case 'auth/user-disabled':
          return 'This account has been disabled';
        case 'auth/user-not-found':
          return 'Email or password is incorrect';
        case 'auth/wrong-password':
          return 'Email or password is incorrect';
        case 'auth/too-many-requests':
          return 'Too many unsuccessful login attempts. Please try again later.';
        default:
          return error.message || 'An error occurred during login';
      }
    };
  
    /**
     * Auth state change listener
     */
    const initAuthListener = () => {
      auth.onAuthStateChanged(async (user) => {
        // Show loading overlay
        document.getElementById('loading-overlay')?.classList.remove('hidden');
        
        if (user) {
          // User is signed in
          currentUser = user;
          
          // Load user data
          userData = await loadUserData(user.uid);
          userRole = userData.role;
          
          // Hide loading overlay
          document.getElementById('loading-overlay')?.classList.add('hidden');
          
          // Redirect based on role
          redirectBasedOnRole(userRole);
          
          // If on correct page according to role, initialize page
          const currentPath = window.location.pathname;
          if (userRole === 'coach' && currentPath.includes('coach-dashboard.html')) {
            initCoachDashboard();
          } else if (userRole === 'client' && currentPath.includes('client-dashboard.html')) {
            initClientDashboard();
          }
        } else {
          // User is signed out
          currentUser = null;
          userData = null;
          userRole = null;
          
          // Hide loading overlay
          document.getElementById('loading-overlay')?.classList.add('hidden');
          
          // If not on login page, redirect to login
          const currentPath = window.location.pathname;
          if (!currentPath.endsWith('index.html') && !currentPath.endsWith('/')) {
            redirectToLogin();
          }
        }
      });
    };
  
    /**
     * Initialize client dashboard
     */
    const initClientDashboard = () => {
      // Set user name in header
      const userNameElement = document.getElementById('user-name');
      const welcomeNameElement = document.getElementById('welcome-name');
      
      if (userNameElement) userNameElement.textContent = userData.name || 'Client';
      if (welcomeNameElement) welcomeNameElement.textContent = userData.name || 'Client';
      
      // Set current date
      const currentDateElement = document.getElementById('current-date');
      if (currentDateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = new Date().toLocaleDateString('en-US', options);
      }
      
      // Initialize client modules if they exist
      if (typeof ClientModule !== 'undefined') ClientModule.init(userData);
      if (typeof WorkoutsModule !== 'undefined') WorkoutsModule.init();
      if (typeof LogsModule !== 'undefined') LogsModule.init();
      if (typeof DietModule !== 'undefined') DietModule.init();
      if (typeof ProgressModule !== 'undefined') ProgressModule.init();
      if (typeof MoodModule !== 'undefined') MoodModule.init();
    };
  
    /**
     * Initialize coach dashboard
     */
    const initCoachDashboard = () => {
      // Set coach name in header
      const userNameElement = document.getElementById('user-name');
      const welcomeNameElement = document.getElementById('welcome-name');
      
      if (userNameElement) userNameElement.textContent = userData.name || 'Coach';
      if (welcomeNameElement) welcomeNameElement.textContent = userData.name || 'Coach';
      
      // Set current date
      const currentDateElement = document.getElementById('current-date');
      if (currentDateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = new Date().toLocaleDateString('en-US', options);
      }
      
      // Initialize coach modules if they exist
      if (typeof CoachModule !== 'undefined') CoachModule.init(userData);
      if (typeof ExercisesModule !== 'undefined') ExercisesModule.init();
    };
  
    /**
     * Initialize Auth Module
     */
    const init = () => {
      // Add event listeners
      if (loginForm) loginForm.addEventListener('submit', handleLogin);
      if (loginBtn) loginBtn.addEventListener('click', handleLogin);
      if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
      
      // Initialize auth state listener
      initAuthListener();
    };
  
    /**
     * Public methods and properties
     */
    return {
      init,
      getCurrentUser: () => currentUser,
      getUserData: () => userData,
      getUserRole: () => userRole
    };
  })();
  
  // Initialize Auth Module on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    AuthModule.init();
  });