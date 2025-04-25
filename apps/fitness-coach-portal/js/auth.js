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
    let moduleInitialized = false;
    let authListenerInitialized = false;
    let lastRedirectTime = 0;
    const redirectDebounceMs = 1000; // 1 second

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
                showLoginMessage('User data not found. Please contact support.');
                return null;
            }
            
            return userData;
        } catch (error) {
            console.error('Error loading user data:', error);
            showLoginMessage('Error loading user data. Please try again.');
            return null;
        }
    };

    /**
     * Redirects user based on role
     */
    const redirectBasedOnRole = (role) => {
        const now = Date.now();
        if (now - lastRedirectTime < redirectDebounceMs) {
            console.log('Redirect debounced to prevent loop');
            return;
        }
        lastRedirectTime = now;

        const currentPath = window.location.pathname;
        const validPaths = {
            coach: ['/coach-dashboard'],
            client: ['/client-dashboard']
        };

        // Check if the current path is valid for the user's role
        if (validPaths[role] && validPaths[role].includes(currentPath)) {
            console.log('User is on a valid page for their role. No redirection needed.');
            return;
        }

        // Redirect to the default dashboard for the role
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
        const now = Date.now();
        if (now - lastRedirectTime < redirectDebounceMs) {
            console.log('Redirect debounced to prevent loop');
            return;
        }
        lastRedirectTime = now;
        window.location.href = '/';
    };

    /**
     * Auth state change listener
     */
    const initAuthListener = () => {
        if (authListenerInitialized) return;
        authListenerInitialized = true;

        auth.onAuthStateChanged(async (user) => {
            console.log('Auth state changed:', { user: user?.uid, currentPath: window.location.pathname });
            try {
                if (user) {
                    currentUser = user;
                    userData = await loadUserData(user.uid);
                    userRole = userData?.role;

                    if (userRole) {
                        redirectBasedOnRole(userRole);
                    } else {
                        showLoginMessage('User role not configured. Please contact support.');
                        redirectToLogin();
                    }
                } else {
                    redirectToLogin();
                }
            } catch (error) {
                console.error('Error in auth state listener:', error);
                showLoginMessage('Authentication error. Please try again.');
            }
        });
    };

    /**
     * Initialize Auth Module
     */
    const init = () => {
        if (moduleInitialized) return;
        moduleInitialized = true;

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