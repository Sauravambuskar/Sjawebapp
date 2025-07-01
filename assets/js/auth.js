/**
 * SJA Foundation Investment Management Platform
 * Authentication Module
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const signupBtn = document.getElementById('signup-btn');
    const backToLoginBtn = document.getElementById('back-to-login-btn');
    const forgotPasswordLink = document.getElementById('forgot-password');
    const backToLoginBtn2 = document.getElementById('back-to-login-btn2');
    const resetBtn = document.getElementById('reset-btn');
    
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const forgotError = document.getElementById('forgot-error');
    
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleRegPasswordBtn = document.getElementById('toggle-reg-password');
    
    // Password visibility toggle
    togglePasswordBtn.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
    
    toggleRegPasswordBtn.addEventListener('click', function() {
        const passwordInput = document.getElementById('reg-password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
    
    // Form navigation
    registerBtn.addEventListener('click', function() {
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
        forgotPasswordForm.classList.add('d-none');
    });
    
    backToLoginBtn.addEventListener('click', function() {
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
        forgotPasswordForm.classList.add('d-none');
    });
    
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('d-none');
        registerForm.classList.add('d-none');
        forgotPasswordForm.classList.remove('d-none');
    });
    
    backToLoginBtn2.addEventListener('click', function() {
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
        forgotPasswordForm.classList.add('d-none');
    });
    
    // Login functionality
    loginBtn.addEventListener('click', async function() {
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
        loginError.classList.add('d-none');
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error('Please enter both email and password');
            }
            
            // Sign in with Supabase
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // If remember me is checked, set longer session
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('rememberMe');
            }
            
            // Get user role from database
            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();
            
            if (userError) throw userError;
            
            // Store user role
            localStorage.setItem('userRole', userData.role);
            
            // Redirect based on role
            if (userData.role === 'admin') {
                window.location.href = 'pages/admin-dashboard.html';
            } else {
                window.location.href = 'pages/client-dashboard.html';
            }
            
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = error.message || 'Failed to login. Please try again.';
            loginError.classList.remove('d-none');
            
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
    
    // Registration functionality
    signupBtn.addEventListener('click', async function() {
        // Show loading state
        signupBtn.disabled = true;
        signupBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing up...';
        registerError.classList.add('d-none');
        
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const referrerId = document.getElementById('referrer-id').value;
        
        try {
            // Validate inputs
            if (!name || !email || !phone || !password) {
                throw new Error('Please fill all required fields');
            }
            
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            // Create user with Supabase Auth
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        phone
                    }
                }
            });
            
            if (error) throw error;
            
            try {
                // Create user record in users table
                const { error: userError } = await window.supabaseClient
                    .from('users')
                    .insert([
                        {
                            id: data.user.id,
                            name,
                            email,
                            phone,
                            role: 'client', // Default role
                            referrer_id: referrerId || null,
                            level: 1, // Default level
                            created_at: new Date().toISOString()
                        }
                    ]);
                
                if (userError) {
                    console.warn("Error creating user record:", userError);
                    // Continue anyway - the trigger in Supabase should handle this
                }
            } catch (insertError) {
                console.warn("Error creating user record:", insertError);
                // Continue anyway - the trigger in Supabase should handle this
            }
            
            try {
                // Create wallet for the user
                const { error: walletError } = await window.supabaseClient
                    .from('wallets')
                    .insert([
                        {
                            user_id: data.user.id,
                            balance: 0,
                            last_updated: new Date().toISOString()
                        }
                    ]);
                
                if (walletError) {
                    console.warn("Error creating wallet:", walletError);
                    // Continue anyway - the trigger in Supabase should handle this
                }
            } catch (walletError) {
                console.warn("Error creating wallet:", walletError);
                // Continue anyway
            }
            
            // Show success message and redirect to login
            alert('Registration successful! Please check your email to confirm your account.\n\nIMPORTANT: Before using the platform, make sure to run the SQL script in Supabase to create all required tables. See the Setup Guide for more details.');
            
            // Redirect to setup guide
            if (confirm('Would you like to view the setup guide now?')) {
                window.location.href = 'setup.html';
                return;
            }
            
            loginForm.classList.remove('d-none');
            registerForm.classList.add('d-none');
            
        } catch (error) {
            console.error('Registration error:', error);
            registerError.textContent = error.message || 'Failed to register. Please try again.';
            registerError.classList.remove('d-none');
            
            // Reset button state
            signupBtn.disabled = false;
            signupBtn.textContent = 'Sign Up';
        }
    });
    
    // Password reset functionality
    resetBtn.addEventListener('click', async function() {
        // Show loading state
        resetBtn.disabled = true;
        resetBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
        forgotError.classList.add('d-none');
        
        const email = document.getElementById('forgot-email').value;
        
        try {
            // Validate input
            if (!email) {
                throw new Error('Please enter your email');
            }
            
            // Send password reset email
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html'
            });
            
            if (error) throw error;
            
            // Show success message
            alert('Password reset link has been sent to your email.');
            loginForm.classList.remove('d-none');
            forgotPasswordForm.classList.add('d-none');
            
        } catch (error) {
            console.error('Password reset error:', error);
            forgotError.textContent = error.message || 'Failed to send reset link. Please try again.';
            forgotError.classList.remove('d-none');
            
            // Reset button state
            resetBtn.disabled = false;
            resetBtn.textContent = 'Reset Password';
        }
    });
    
    // Check if user is already logged in
    const checkSession = async () => {
        const { data, error } = await window.supabaseClient.auth.getSession();
        
        if (data && data.session) {
            // Get user role from database
            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('role')
                .eq('id', data.session.user.id)
                .single();
            
            if (!userError && userData) {
                // Redirect based on role
                if (userData.role === 'admin') {
                    window.location.href = 'pages/admin-dashboard.html';
                } else {
                    window.location.href = 'pages/client-dashboard.html';
                }
            }
        }
    };
    
    // Check session on page load
    checkSession();
}); 