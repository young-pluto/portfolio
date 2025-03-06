// Auth Module
const AuthModule = (() => {
    // DOM Elements
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeMessage = document.getElementById('welcome-message');

    // Current user state
    let currentUser = null;
    let userData = null;

    // Show signup form
    const showSignup = () => {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    };

    // Show login form
    const showLogin = () => {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    };

    // Handle signup
    const handleSignup = async () => {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (!name || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user node in database with name
            await database.ref(`users/${user.uid}`).set({
                name: name,
                email: user.email,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            alert('Account created successfully! You are now logged in.');
            document.getElementById('signup-name').value = '';
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // Handle login
    const handleLogin = async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await auth.signInWithEmailAndPassword(email, password);
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // Load user data
    const loadUserData = async (userId) => {
        try {
            const userRef = database.ref(`users/${userId}`);
            const snapshot = await userRef.once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    };

    // Update welcome message
    const updateWelcomeMessage = () => {
        if (userData && userData.name) {
            const greeting = getGreeting();
            welcomeMessage.innerHTML = `<h3>${greeting}, ${userData.name}!</h3><p>Excited to see you back. Ready for today's workout?</p>`;
            
            // Update workout history title
            const workoutHistoryTitle = document.getElementById('workout-history-title');
            if (workoutHistoryTitle) {
                workoutHistoryTitle.textContent = `${userData.name}'s Workout History`;
            }
        } else {
            welcomeMessage.innerHTML = '';
        }
    };

    // Get appropriate greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    // Auth state change listener
    const initAuthListener = () => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                currentUser = user;
                userData = await loadUserData(user.uid);
                
                // Update UI
                authContainer.classList.add('hidden');
                appContainer.classList.remove('hidden');
                updateWelcomeMessage();
                
                // Initialize app modules in the correct order
                AppModule.initAfterAuth();
            } else {
                // User is signed out
                currentUser = null;
                userData = null;
                appContainer.classList.add('hidden');
                authContainer.classList.remove('hidden');
                showLogin(); // Reset to login form
            }
        });
    };

    // Initialize Auth Module
    const init = () => {
        // Event listeners
        showSignupBtn.addEventListener('click', showSignup);
        showLoginBtn.addEventListener('click', showLogin);
        loginBtn.addEventListener('click', handleLogin);
        signupBtn.addEventListener('click', handleSignup);
        logoutBtn.addEventListener('click', handleLogout);

        // Initialize auth state listener
        initAuthListener();
    };

    // Public methods and properties
    return {
        init,
        getCurrentUser: () => currentUser,
        getUserData: () => userData
    };
})();

// Initialize Auth Module
document.addEventListener('DOMContentLoaded', () => {
    AuthModule.init();
    // Other modules will be initialized when user is authenticated
});