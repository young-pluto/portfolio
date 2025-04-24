const loadUserData = async (userId) => {
    try {
      console.group('User Data Loading');
      console.log('Searching for user with ID:', userId);
      
      // First, check the users node
      const userRef = database.ref(`users/${userId}`);
      const userSnapshot = await userRef.once('value');
      const userData = userSnapshot.val();
      
      if (userData) {
        console.log('User found in /users node:', userData);
        return userData;
      }
      
      // If not found in users, check coaches node
      const coachRef = database.ref(`coaches/${userId}`);
      const coachSnapshot = await coachRef.once('value');
      const coachData = coachSnapshot.val();
      
      if (coachData) {
        console.log('User found in /coaches node:', coachData);
        return coachData;
      }
      
      console.error('No user data found in either /users or /coaches nodes');
      return { role: 'unknown' };
    } catch (error) {
      console.error('Error loading user data:', error);
      return { role: 'unknown' };
    } finally {
      console.groupEnd();
    }
  };
  
  // Modify redirectBasedOnRole to be more explicit
  const redirectBasedOnRole = (role) => {
    console.group('Redirect Debug');
    console.log('Redirecting with role:', role);
    console.log('Current location:', window.location);
    
    try {
      // Explicit path handling
      const dashboardPath = role === 'coach' 
        ? '/coach-dashboard.html' 
        : (role === 'client' ? '/client-dashboard.html' : '/index.html');
      
      console.log('Target dashboard path:', dashboardPath);
      
      // Multiple redirect strategies
      window.location.replace(dashboardPath);
      
      setTimeout(() => {
        window.location.href = dashboardPath;
      }, 100);
      
      setTimeout(() => {
        window.open(dashboardPath, '_self');
      }, 200);
    } catch (error) {
      console.error('Redirection error:', error);
    } finally {
      console.groupEnd();
    }
  };