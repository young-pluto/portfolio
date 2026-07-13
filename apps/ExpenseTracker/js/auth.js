// auth.js — email/password auth on the shared Firebase project.
// Same mechanism as the Workout Tracker; gates the app on auth state.
window.Auth = (() => {
  const $ = (id) => document.getElementById(id);
  const authContainer = $('auth-container');
  const app = $('app');
  const loginForm = $('login-form');
  const signupForm = $('signup-form');
  const errBox = $('auth-error');

  let currentUser = null;
  let starting = false;

  const showError = (msg) => {
    errBox.textContent = msg;
    errBox.hidden = false;
  };
  const clearError = () => { errBox.hidden = true; errBox.textContent = ''; };

  const friendly = (code, fallback) => ({
    'auth/invalid-email': 'That email doesn’t look right.',
    'auth/user-not-found': 'No account with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'That email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Try again shortly.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }[code] || fallback);

  const showSignup = () => { loginForm.classList.add('hidden'); signupForm.classList.remove('hidden'); clearError(); };
  const showLogin = () => { signupForm.classList.add('hidden'); loginForm.classList.remove('hidden'); clearError(); };

  const handleLogin = async (e) => {
    e && e.preventDefault();
    clearError();
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    if (!email || !password) return showError('Enter your email and password.');
    try {
      await auth.signInWithEmailAndPassword(email, password);
      $('login-password').value = '';
    } catch (err) {
      showError(friendly(err.code, err.message));
    }
  };

  const handleSignup = async (e) => {
    e && e.preventDefault();
    clearError();
    const name = $('signup-name').value.trim();
    const email = $('signup-email').value.trim();
    const password = $('signup-password').value;
    if (!name || !email || !password) return showError('Please fill in all fields.');
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await database.ref(`users/${cred.user.uid}/profile`).set({
        name,
        email: cred.user.email,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      });
      $('signup-password').value = '';
    } catch (err) {
      showError(friendly(err.code, err.message));
    }
  };

  const handleLogout = async () => {
    try { await auth.signOut(); } catch (err) { console.error(err); }
  };

  const initListener = () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
        if (starting) return;
        starting = true;
        try {
          await Store.init(user.uid);
          authContainer.classList.add('hidden');
          app.classList.remove('hidden');
          window.App.start(user);
        } catch (err) {
          console.error('Startup failed', err);
          showError('Could not load your data. Please retry.');
        } finally {
          starting = false;
        }
      } else {
        currentUser = null;
        Store.detach();
        window.App && window.App.stop && window.App.stop();
        app.classList.add('hidden');
        authContainer.classList.remove('hidden');
        showLogin();
      }
    });
  };

  const init = () => {
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    $('show-signup').addEventListener('click', showSignup);
    $('show-login').addEventListener('click', showLogin);
    initListener();
  };

  return { init, logout: handleLogout, getUser: () => currentUser };
})();
