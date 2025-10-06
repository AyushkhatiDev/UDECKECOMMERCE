document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const typeButtons = document.querySelectorAll('.user-type-card');
    const errorMessage = document.getElementById('error-message');
    
    let selectedUserType = null;

    // --- User Type Selection Handler ---
    typeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Find the actual button element in case the span was clicked
            const target = e.currentTarget;
            const type = target.getAttribute('data-type');
            
            // Toggle 'selected' class
            typeButtons.forEach(btn => btn.classList.remove('selected'));
            target.classList.add('selected');
            
            selectedUserType = type;
            errorMessage.classList.add('hidden');
        });

        // Initialize default selection (Retailer)
        if (button.getAttribute('data-type') === 'retailer') {
            button.classList.add('selected');
            selectedUserType = 'retailer';
        }
    });

    // --- Login Submission Handler ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Clear any previous error messages
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!selectedUserType) {
            errorMessage.textContent = "Please select a user type first.";
            errorMessage.classList.remove('hidden');
            return;
        }
        
        // --- SIMULATED BACKEND LOGIC (Frontend Placeholder) ---
        // Replace this entire block with your actual backend authentication call
        
        // FOR DEMO: Simulate successful login for any user that enters 'test'/'password'
        const isSuccessful = (username === 'test' && password === 'password');
        
        if (isSuccessful) {
            // Set authentication state in session storage
            sessionStorage.setItem('mshop_authenticated', 'true');
            sessionStorage.setItem('mshop_user_type', selectedUserType);
            sessionStorage.setItem('mshop_login_time', new Date().toISOString());
            
            // Backend Team will handle routing based on the selectedUserType
            if (selectedUserType === 'retailer') {
                // REDIRECT TO THE MAIN RETAILER APPLICATION PAGE
                window.location.href = 'index.html#home'; 
            } else {
                errorMessage.textContent = `Success! Logged in as ${selectedUserType}. (Routing disabled for demo)`;
                errorMessage.classList.remove('hidden');
            }
        } else {
            errorMessage.textContent = "Authentication failed. Please check your credentials.";
            errorMessage.classList.remove('hidden');
        }
    });
});