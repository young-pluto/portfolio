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

    // Current user state
    let currentUser = null;

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
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user node in database
            await database.ref(`users/${user.uid}`).set({
                email: user.email,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            alert('Account created successfully! You are now logged in.');
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

    // Auth state change listener
    const initAuthListener = () => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                currentUser = user;
                authContainer.classList.add('hidden');
                appContainer.classList.remove('hidden');
                
                // Initialize app modules
                ExercisesModule.init();
                WorkoutsModule.init();
                AppModule.init();
            } else {
                // User is signed out
                currentUser = null;
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
        getCurrentUser: () => currentUser
    };
})();

// Initialize Auth Module
document.addEventListener('DOMContentLoaded', AuthModule.init);