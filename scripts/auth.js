async function loginUser(username, password) {
    const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            username,
            password,
        }),
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token); // Store the token
        updateUIBasedOnLogin();
        return data.access_token;
    } else {
        throw new Error('Failed to log in.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginElement = document.getElementById('login');
    const usernameInput = document.getElementById('login_username');
    const passwordInput = document.getElementById('login_password');

    const performLogin = async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            await loginUser(username, password);
            console.log('Login successful');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    if (loginElement) {
        loginElement.addEventListener('click', async (event) => {
            event.preventDefault();
            await performLogin();
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keypress', async (event) => {
            if (event.keyCode === 13) { // 13 is the Enter key
                event.preventDefault();
                await performLogin();
            }
        });
    }

    updateUIBasedOnLogin(); // Update the UI on page load

});

document.addEventListener('DOMContentLoaded', () => {
    const logoutElement = document.getElementById('logout');
    if (logoutElement) {
        logoutElement.addEventListener('click', (event) => {
            event.preventDefault();
            logout();
            console.log('Logged out successfully');
            // Perform any additional actions needed after logout
            // e.g., updating the UI or redirecting the user
        });
    }

    // Rest of your code...
});

function logout() {
    localStorage.removeItem('token');
    updateUIBasedOnLogin();
    // Optionally, redirect to the login page or update the UI accordingly
    // For example: window.location.href = '/login.html';
    // Or update UI elements to reflect the logged-out state
}

function isLoggedIn() {
    return !!localStorage.getItem('token');
}


function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch (error) {
        return null;
    }
}

function getCurrentUsername() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const decoded = parseJwt(token);
    return decoded ? decoded.sub : null; // 'sub' is typically the username or user ID in JWT
}

function updateUIBasedOnLogin() {
    const loginElements = document.querySelectorAll('#login, #login_username, #login_password');
    const logoutElement = document.getElementById('logout');
    const usernameElement = document.getElementById('username');

    // Check if a style element for admin rules already exists
    let styleElement = document.getElementById('admin-style');
    if (!styleElement) {
        // Create it if it doesn't exist
        styleElement = document.createElement('style');
        styleElement.id = 'admin-style';
        document.head.appendChild(styleElement);
    } else {
        // Clear existing rules if it does exist
        while (styleElement.sheet.cssRules.length) {
            styleElement.sheet.deleteRule(0);
        }
    }

    if (isLoggedIn()) {
        console.log("Current user", getCurrentUsername())
        loginElements.forEach(element => element.style.display = 'none');
        logoutElement.style.display = 'block';
        usernameElement.style.display = 'block';
        usernameElement.textContent = getCurrentUsername(); // Update with the current username

        if (isAdmin()) {
            console.log('User is an admin');
            styleElement.sheet.insertRule('.adminOnly { display: block !important; }', 0);
        } else {
            console.log('User is not admin');
            styleElement.sheet.insertRule('.adminOnly { display: none !important; }', 0);
        }
    } else {
        loginElements.forEach(element => element.style.display = 'block');
        logoutElement.style.display = 'none';
        usernameElement.style.display = 'none';
        styleElement.sheet.insertRule('.adminOnly { display: none !important; }', 0);
    }
}


function isAdmin() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const decoded = parseJwt(token);
    return decoded ? decoded.is_admin : false;  // Check the is_admin field in the token
}