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
          const user = userCredential.user;
          
          console.log('Login successful:', user.uid);
      
          // 🚀 Fetch role and redirect
        //   const userData = await loadUserData(user.uid);
        //   const role = userData.role;
          
        //   if (role) {
        //     console.log('User role found:', role);
        //     redirectBasedOnRole(role);
        //   } else {
        //     showLoginMessage('User role not set. Please contact support.');
        //   }
      
        } catch (error) {
          console.group('Login Error');
          console.error('Full error object:', error);
          console.log('Error code:', error.code);
          console.log('Error message:', error.message);
          console.groupEnd();
          
          // Handle login errors
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
        const currentPath = window.location.pathname;
        if ((role === 'coach' && currentPath === '/coach-dashboard') || 
            (role === 'client' && currentPath === '/client-dashboard')) {
            console.log('User is already on the correct dashboard. No redirection needed.');
            return;
        }
    
        if (role === 'coach') {
            window.location.href = '/coach-dashboard';
        } else if (role === 'client') {
            window.location.href = '/client-dashboard';
        } else {
            redirectToLogin();
        }
    };
  
    /**
     * Redirects to login page
     */
    const redirectToLogin = () => {
      window.location.href = '/';
    };
  
    /**
     * Auth state change listener
     */
// In the auth.js file, modify the initAuthListener function:

const initAuthListener = () => {
    auth.onAuthStateChanged(async (user) => {
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) loadingOverlay.classList.remove('hidden');
  
      console.group('Auth State Change');
      console.log('User object:', user);
  
      if (user) {
        try {
          currentUser = user;
          
          // Load user data with retry
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              userData = await loadUserData(user.uid);
              if (userData && userData.role) {
                break; // Successfully got user data
              }
              retryCount++;
              console.log(`Retry ${retryCount}/${maxRetries} loading user data...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            } catch (e) {
              retryCount++;
              console.error(`Error loading user data (attempt ${retryCount}/${maxRetries}):`, e);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
          }
          
          userRole = userData?.role;
  
          console.log('Loaded User Data:', userData);
          console.log('User Role:', userRole);
  
          if (!userRole) {
            console.error('No role found for user');
            showLoginMessage('User role not configured. Please contact support.');
            
            // Try to create a default role
            try {
              console.log('Attempting to create default user role...');
              await database.ref(`users/${user.uid}`).update({
                role: 'coach', // Default to coach
                email: user.email,
                name: 'Coach'
              });
              
              // Reload page to pick up new role
              window.location.reload();
              return;
            } catch (roleError) {
              console.error('Error creating default role:', roleError);
              await auth.signOut();
              redirectToLogin();
              return;
            }
          }
  
          // Check if we're on the right page
          const currentPath = window.location.pathname;
          const isCoachPage = currentPath.includes('coach-dashboard');
          const isClientPage = currentPath.includes('client-dashboard');
          
          if ((userRole === 'coach' && !isCoachPage) || (userRole === 'client' && !isClientPage)) {
            console.log('User is on the wrong dashboard, redirecting...');
            redirectBasedOnRole(userRole);
          } else {
            console.log('User is on the correct dashboard, initializing...');
            
            // Initialize the appropriate module
            if (userRole === 'coach' && typeof CoachModule !== 'undefined') {
              CoachModule.init(userData);
            } else if (userRole === 'client' && typeof ClientModule !== 'undefined') {
              ClientModule.init(userData);
            }
            
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
          }
  
        } catch (error) {
          console.error('Error during auth state handling:', error);
          showLoginMessage('Authentication failed. Please try again.');
          await auth.signOut();
          redirectToLogin();
        } finally {
          if (loadingOverlay) loadingOverlay.classList.add('hidden');
          console.groupEnd();
        }
      } 
      
      else if (user === null) {
        // No user is signed in
        currentUser = null;
        userData = null;
        userRole = null;
  
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        console.warn('No authenticated user found');
  
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.endsWith('index.html') || currentPath.endsWith('/');
        if (!isLoginPage) {
          redirectToLogin();
        }
  
        console.groupEnd();
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