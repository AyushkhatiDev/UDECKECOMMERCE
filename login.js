document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const typeButtons = document.querySelectorAll('.user-type-card');
    const errorMessage = document.getElementById('error-message');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    let selectedUserType = null;

    // --- User Type Selection Handler ---
    typeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const type = target.getAttribute('data-type');
            
            // Toggle 'selected' class
            typeButtons.forEach(btn => btn.classList.remove('selected'));
            target.classList.add('selected');
            
            selectedUserType = type;
            errorMessage.classList.add('hidden');
        });
    });
    // Ensure a default selection exists (Retailer)
    const defaultCard = document.querySelector('.user-type-card[data-type="retailer"]');
    if (defaultCard) {
        defaultCard.classList.add('selected');
        selectedUserType = 'retailer';
    }

    // --- Simplified Login Handler (No Database) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear any previous error messages
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Resolve selected type from DOM to be resilient to state issues
        const selectedCard = document.querySelector('.user-type-card.selected');
        selectedUserType = selectedCard ? selectedCard.getAttribute('data-type') : selectedUserType;
        if (!selectedUserType) {
            errorMessage.textContent = "Please select a user type first.";
            errorMessage.classList.remove('hidden');
            return;
        }
        
        // Validate input fields
        if (!username || !password) {
            errorMessage.textContent = "Please enter both username and password.";
            errorMessage.classList.remove('hidden');
            return;
        }
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;
        
        try {
            // Simulate login delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simple validation - accept any non-empty credentials
            if (username.length >= 3 && password.length >= 3) {
                // Store authentication data in sessionStorage
                sessionStorage.setItem('mshop_authenticated', 'true');
                sessionStorage.setItem('user_id', 'demo_user_' + Date.now()); // Generate demo user ID
                sessionStorage.setItem('mshop_username', username);
                sessionStorage.setItem('mshop_user_type', selectedUserType === 'retailer' ? 'customer' : selectedUserType);
                sessionStorage.setItem('mshop_login_time', new Date().toISOString());
                
                // Redirect to main application
                window.location.href = 'index.html#home';
            } else {
                // Show error for too short credentials
                errorMessage.textContent = "Username and password must be at least 3 characters long.";
                errorMessage.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = "An error occurred. Please try again.";
            errorMessage.classList.remove('hidden');
        } finally {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });

    // --- Error Handling and Password Toggle ---
    const hideError = () => {
        if (errorMessage) errorMessage.classList.add('hidden');
    };
    if (usernameInput) usernameInput.addEventListener('input', hideError);
    if (passwordInput) passwordInput.addEventListener('input', hideError);

    function togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('.password-toggle');
        if (!passwordInput || !toggleIcon) return;
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁️';
        }
    }
    window.togglePassword = togglePassword;
});