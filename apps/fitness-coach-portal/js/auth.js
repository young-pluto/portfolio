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
      
      try {
        console.log('Network status:', navigator.onLine);
        
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        
        if (!email || !password) {
          showLoginMessage('Please enter both email and password');
          return;
        }
        
        showLoginMessage('Signing in...', false);
        
        // Sign in with Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        console.log('Login successful:', userCredential.user.uid);
        
      } catch (error) {
        console.group('Login Error');
        console.error('Full error object:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        console.groupEnd();
        
        // Detailed error messaging
        let userMessage = 'An unexpected error occurred';
        
        switch (error.code) {
          case 'auth/network-request-failed':
            userMessage = 'Network error. Please check your connection.';
            break;
          case 'auth/too-many-requests':
            userMessage = 'Too many login attempts. Please try again later.';
            break;
          case 'auth/invalid-credential':
            userMessage = 'Invalid email or password';
            break;
          case 'auth/user-not-found':
            userMessage = 'No user found with this email';
            break;
          case 'auth/wrong-password':
            userMessage = 'Incorrect password';
            break;
          default:
            userMessage = error.message || 'Login failed';
        }
        
        showLoginMessage(userMessage);
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
        
        // Remove any existing timeout
        if (loginMessage.messageTimeout) {
          clearTimeout(loginMessage.messageTimeout);
        }
        
        if (isError) {
          loginMessage.classList.add('error');
        }
        
        // Auto-clear message after 5 seconds
        loginMessage.messageTimeout = setTimeout(() => {
          loginMessage.textContent = '';
          loginMessage.className = 'login-message';
        }, 5000);
      }
      
      console.log(isError ? 'Login Error:' : 'Login Message:', message);
    };
  
    /**
     * Gets user role and data
     */
    const loadUserData = async (userId) => {
      try {
        // Fetch user data from users node
        const userRef = database.ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();
        
        console.log('Loaded user data:', userData);
        
        if (!userData) {
          console.error('No user data found for UID:', userId);
          return { role: 'unknown' };
        }
        
        return userData;
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
      
      console.log('Redirecting based on role:', role);
      console.log('Current path:', currentPath);
      
      if (role === 'coach') {
        if (!currentPath.includes('coach-dashboard.html')) {
          window.location.href = 'coach-dashboard.html';
        }
      } else if (role === 'client') {
        if (!currentPath.includes('client-dashboard.html')) {
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
     * Auth state change listener
     */
    const initAuthListener = () => {
        auth.onAuthStateChanged(async (user) => {
          // Show loading overlay
          const loadingOverlay = document.getElementById('loading-overlay');
          if (loadingOverlay) loadingOverlay.classList.remove('hidden');
          
          console.group('Auth State Change');
          console.log('User object:', user);
          
          if (user) {
            try {
              // Load user data
              userData = await loadUserData(user.uid);
              currentUser = user;
              userRole = userData.role;
              
              console.log('Loaded User Data:', userData);
              console.log('User Role:', userRole);
              
              // Validate role
              if (!userRole) {
                console.error('No role found for user');
                showLoginMessage('User role not configured. Please contact support.');
                await auth.signOut();
                return;
              }
              
              // Hide loading overlay
              if (loadingOverlay) loadingOverlay.classList.add('hidden');
              
              // Redirect based on role
              redirectBasedOnRole(userRole);
              
            } catch (error) {
              console.error('Error in auth state change:', error);
              
              // Ensure loading overlay is hidden
              if (loadingOverlay) loadingOverlay.classList.add('hidden');
              
              // Show error message
              showLoginMessage('Authentication failed. Please try again.');
              
              // Sign out if there's an error
              await auth.signOut();
              redirectToLogin();
            } finally {
              console.groupEnd();
            }
          } else {
            // User is signed out
            currentUser = null;
            userData = null;
            userRole = null;
            
            // Hide loading overlay
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            
            console.groupEnd();
            
            // Redirect to login if not on login page
            const currentPath = window.location.pathname;
            if (!currentPath.endsWith('index.html') && !currentPath.endsWith('/')) {
              redirectToLogin();
            }
          }
        });
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