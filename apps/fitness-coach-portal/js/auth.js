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
     * Displays login error messages
     */
    const showLoginMessage = (message, isError = true) => {
      if (loginMessage) {
        loginMessage.textContent = message;
        loginMessage.className = 'login-message';
        
        if (isError) {
          loginMessage.classList.add('error');
        }
        
        // Auto-clear message after 5 seconds
        setTimeout(() => {
          loginMessage.textContent = '';
          loginMessage.className = 'login-message';
        }, 5000);
      }
    };
  
    /**
     * Gets user role and data
     */
    const loadUserData = async (userId) => {
      try {
        // Check users node first
        const userRef = database.ref(`users/${userId}`);
        const userSnapshot = await userRef.once('value');
        let userData = userSnapshot.val();
        
        // If not found, check coaches node
        if (!userData) {
          const coachRef = database.ref(`coaches/${userId}`);
          const coachSnapshot = await coachRef.once('value');
          userData = coachSnapshot.val();
        }
        
        return userData || { role: 'unknown' };
      } catch (error) {
        console.error('Error loading user data:', error);
        return { role: 'unknown' };
      }
    };
  
    /**
     * Auth state change listener
     */
    const initAuthListener = () => {
      auth.onAuthStateChanged(async (user) => {
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (loadingOverlay) {
          loadingOverlay.classList.remove('hidden');
        }
        
        if (user) {
          try {
            // Load user data
            userData = await loadUserData(user.uid);
            currentUser = user;
            userRole = userData.role;
            
            // Redirect based on role
            if (userRole === 'coach') {
              window.location.href = 'coach-dashboard.html';
            } else if (userRole === 'client') {
              window.location.href = 'client-dashboard.html';
            } else {
              showLoginMessage('Invalid user role');
              await auth.signOut();
            }
          } catch (error) {
            console.error('Authentication error:', error);
            showLoginMessage('Authentication failed');
            await auth.signOut();
          } finally {
            if (loadingOverlay) {
              loadingOverlay.classList.add('hidden');
            }
          }
        } else {
          // User is signed out
          currentUser = null;
          userData = null;
          userRole = null;
          
          if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
          }
        }
      });
    };
  
    /**
     * Initialize Auth Module
     */
    const init = () => {
      // Prevent default form submission and attach login handler
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          handleLogin();
        });
      }
      
      if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
      }
      
      // Initialize auth state listener
      initAuthListener();
    };
  
    return {
      init
    };
  })();
  
  // Initialize Auth Module on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    AuthModule.init();
  });