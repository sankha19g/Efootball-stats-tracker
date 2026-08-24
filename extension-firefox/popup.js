document.addEventListener('DOMContentLoaded', async () => {
    const statusIndicator = document.getElementById('status-indicator');
    const loginForm = document.getElementById('login-form');
    const userProfile = document.getElementById('user-profile');
    const inputEmail = document.getElementById('input-email');
    const inputPassword = document.getElementById('input-password');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const btnTestConn = document.getElementById('btn-test-conn');
    const userEmailSpan = document.getElementById('user-email');
    const selectTarget = document.getElementById('select-target');
    const authErrorMsg = document.getElementById('auth-error-msg');
    const diagFirestore = document.getElementById('diag-firestore');
    const diagServer = document.getElementById('diag-server');
    const diagLastPlayer = document.getElementById('diag-last-player');

    function showError(msg) {
        authErrorMsg.textContent = msg;
        authErrorMsg.classList.remove('hidden');
    }

    function hideError() {
        authErrorMsg.textContent = '';
        authErrorMsg.classList.add('hidden');
    }

    // Check saved state
    chrome.storage.local.get(['user', 'targetDestination', 'lastScrapedPlayer', 'idToken'], (data) => {
        if (data.targetDestination) {
            selectTarget.value = data.targetDestination;
        }
        if (data.lastScrapedPlayer) {
            diagLastPlayer.textContent = `${data.lastScrapedPlayer.name} (${data.lastScrapedPlayer.rating} OVR)`;
        }
        if (data.user && data.idToken) {
            showLoggedIn(data.user);
            diagFirestore.textContent = 'Authenticated ✅';
            diagFirestore.className = 'diag-val text-green';
        } else {
            showLoggedOut();
            diagFirestore.textContent = 'Not Authenticated ❌';
            diagFirestore.className = 'diag-val text-red';
        }
    });

    function showLoggedIn(user) {
        loginForm.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userEmailSpan.textContent = user.email || 'Active User';
        statusIndicator.textContent = 'Logged In';
        statusIndicator.className = 'status-badge status-online';
        hideError();
    }

    function showLoggedOut() {
        loginForm.classList.remove('hidden');
        userProfile.classList.add('hidden');
        statusIndicator.textContent = 'Not Logged In';
        statusIndicator.className = 'status-badge status-offline';
    }

    // Sign in handler
    btnLogin.addEventListener('click', async () => {
        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        hideError();

        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        btnLogin.textContent = 'Signing in...';
        btnLogin.disabled = true;

        chrome.runtime.sendMessage({
            action: 'FIREBASE_LOGIN',
            email: email,
            password: password
        }, (response) => {
            btnLogin.textContent = 'Sign In with Account';
            btnLogin.disabled = false;

            if (response && response.success && response.user) {
                showLoggedIn(response.user);
                diagFirestore.textContent = 'Authenticated ✅';
                diagFirestore.className = 'diag-val text-green';
            } else {
                let err = response?.error || 'Login failed';
                if (err.includes('INVALID_LOGIN_CREDENTIALS') || err.includes('INVALID_PASSWORD')) {
                    err = 'Incorrect email or password. Please check and try again.';
                } else if (err.includes('EMAIL_NOT_FOUND')) {
                    err = 'No account found with this email.';
                } else if (err.includes('TOO_MANY_ATTEMPTS')) {
                    err = 'Too many failed login attempts. Please try again later.';
                }
                showError(err);
                diagFirestore.textContent = 'Auth Failed ❌';
                diagFirestore.className = 'diag-val text-red';
            }
        });
    });

    // Destination target change
    selectTarget.addEventListener('change', () => {
        chrome.storage.local.set({ targetDestination: selectTarget.value });
    });

    // Test Connection Button
    btnTestConn.addEventListener('click', () => {
        btnTestConn.textContent = 'Testing...';
        btnTestConn.disabled = true;

        chrome.runtime.sendMessage({
            action: 'TEST_CONNECTION'
        }, (res) => {
            btnTestConn.textContent = 'Test Connection';
            btnTestConn.disabled = false;
            if (res && res.success) {
                alert('✅ Firestore Cloud DB connection successful! Ready to import players.');
                diagFirestore.textContent = 'Connected ✅';
                diagFirestore.className = 'diag-val text-green';
            } else {
                alert('❌ Connection check failed: ' + (res?.error || 'Please log in again.'));
            }
        });
    });

    // Logout
    btnLogout.addEventListener('click', () => {
        chrome.storage.local.remove(['user', 'idToken', 'refreshToken'], () => {
            showLoggedOut();
            diagFirestore.textContent = 'Not Authenticated ❌';
            diagFirestore.className = 'diag-val text-red';
        });
    });
});
