// Mock user data (replace with backend authentication in production)
const users = [
    { userId: 'laltubib', password: 'biblaltu03', role: 'admin' },
    { userId: 'srimanta', password: 'srimanta3433', role: 'subadmin' },
    { userId: 'sumanera', password: 'srimantaera9089', role: 'admin' }
];

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Find user
    const user = users.find(u => u.userId === userId && u.password === password);

    if (user) {
        // Store user info in session
        sessionStorage.setItem('currentUser', JSON.stringify({
            userId: user.userId,
            role: user.role
        }));

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        errorMessage.textContent = 'Invalid User ID or Password';
    }

    return false;
}

// Check if user is authenticated
function checkAuth() {
    try {
        const currentUser = sessionStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = 'index.html';
            return null;
        }
        const user = JSON.parse(currentUser);
        if (!user.userId || !user.role) {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return null;
        }
        return user;
    } catch (error) {
        console.error('Authentication error:', error);
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return null;
    }
}

// Check if user has admin privileges
function isAdmin() {
    const user = checkAuth();
    return user && user.role === 'admin';
}

// Logout function
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}