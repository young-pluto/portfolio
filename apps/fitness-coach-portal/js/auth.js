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
        console.group('Redirect Debugging');
        console.log('Current Role:', role);
        console.log('Current Path:', window.location.pathname);
        console.log('Current URL:', window.location.href);
        
        try {
          // Absolute path redirection
          if (role === 'coach') {
            console.log('Attempting to redirect to coach dashboard');
            
            // Multiple redirection strategies
            window.location.replace('coach-dashboard.html');
            
            // Fallback methods
            setTimeout(() => {
              window.location.href = 'coach-dashboard.html';
            }, 100);
            
            setTimeout(() => {
              window.open('coach-dashboard.html', '_self');
            }, 200);
          } else if (role === 'client') {
            console.log('Attempting to redirect to client dashboard');
            
            window.location.replace('client-dashboard.html');
            
            setTimeout(() => {
              window.location.href = 'client-dashboard.html';
            }, 100);
            
            setTimeout(() => {
              window.open('client-dashboard.html', '_self');
            }, 200);
          }
        } catch (error) {
          console.error('Redirection Error:', error);
        } finally {
          console.groupEnd();
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
// Modify initAuthListener to add more debugging
const initAuthListener = () => {
    auth.onAuthStateChanged(async (user) => {
      console.group('Auth State Change Detailed');
      console.log('User Object:', user);
      
      const loadingOverlay = document.getElementById('loading-overlay');
      
      if (user) {
        try {
          // Comprehensive user data loading
          const userRef = database.ref(`users/${user.uid}`);
          const snapshot = await userRef.once('value');
          userData = snapshot.val();
          
          console.log('Loaded User Data:', userData);
          
          // Fallback to coaches node if not found in users
          if (!userData) {
            const coachRef = database.ref(`coaches/${user.uid}`);
            const coachSnapshot = await coachRef.once('value');
            userData = coachSnapshot.val();
          }
          
          console.log('Final User Data:', userData);
          
          // Ensure role is extracted
          userRole = userData ? userData.role : null;
          
          console.log('Extracted User Role:', userRole);
          
          // Hide loading overlay explicitly
          if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
          }
          
          // Redirect with comprehensive checks
          if (userRole) {
            redirectBasedOnRole(userRole);
          } else {
            console.error('No role found for user');
            await auth.signOut();
          }
        } catch (error) {
          console.error('Comprehensive Auth Error:', error);
          
          // Ensure loading overlay is hidden
          if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
          }
          
          await auth.signOut();
        } finally {
          console.groupEnd();
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