// Initialize Supabase client
const { supabase } = window;

// DOM Elements
const profileElements = {
    avatar: document.getElementById('profileAvatar'),
    name: document.getElementById('profileName'),
    email: document.getElementById('profileEmail'),
    personalInfoForm: document.getElementById('personalInfoForm'),
    passwordForm: document.getElementById('passwordForm'),
    preferencesForm: document.getElementById('preferencesForm'),
    enable2FA: document.getElementById('enable2FA'),
    themePreference: document.getElementById('themePreference')
};

// Form Elements
const formElements = {
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    address: document.getElementById('address'),
    currentPassword: document.getElementById('currentPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    investmentUpdates: document.getElementById('investmentUpdates'),
    walletUpdates: document.getElementById('walletUpdates'),
    kycUpdates: document.getElementById('kycUpdates')
};

// Load user profile data
async function loadProfileData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        // Load user metadata from auth
        profileElements.email.textContent = user.email;
        formElements.email.value = user.email;

        // Load profile data from profiles table
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        if (profile) {
            // Update form fields
            formElements.firstName.value = profile.first_name || '';
            formElements.lastName.value = profile.last_name || '';
            formElements.phone.value = profile.phone || '';
            formElements.address.value = profile.address || '';
            
            // Update profile display
            profileElements.name.textContent = `${profile.first_name} ${profile.last_name}`;
            
            // Load preferences
            formElements.investmentUpdates.checked = profile.notification_investment || false;
            formElements.walletUpdates.checked = profile.notification_wallet || false;
            formElements.kycUpdates.checked = profile.notification_kyc || false;
            profileElements.enable2FA.checked = profile.two_factor_enabled || false;
            profileElements.themePreference.value = profile.theme_preference || 'light';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Error loading profile data. Please try again.', 'danger');
    }
}

// Handle personal information form submission
profileElements.personalInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const updates = {
            id: user.id,
            first_name: formElements.firstName.value,
            last_name: formElements.lastName.value,
            phone: formElements.phone.value,
            address: formElements.address.value,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(updates);

        if (error) throw error;

        showAlert('Profile updated successfully!', 'success');
        loadProfileData(); // Reload profile data
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Error updating profile. Please try again.', 'danger');
    }
});

// Handle password change
profileElements.passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = formElements.newPassword.value;
    const confirmPassword = formElements.confirmPassword.value;

    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match!', 'danger');
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        showAlert('Password updated successfully!', 'success');
        formElements.currentPassword.value = '';
        formElements.newPassword.value = '';
        formElements.confirmPassword.value = '';
    } catch (error) {
        console.error('Error updating password:', error);
        showAlert('Error updating password. Please try again.', 'danger');
    }
});

// Handle preferences form submission
profileElements.preferencesForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const updates = {
            id: user.id,
            notification_investment: formElements.investmentUpdates.checked,
            notification_wallet: formElements.walletUpdates.checked,
            notification_kyc: formElements.kycUpdates.checked,
            theme_preference: profileElements.themePreference.value,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(updates);

        if (error) throw error;

        showAlert('Preferences updated successfully!', 'success');
        
        // Apply theme change if necessary
        applyTheme(profileElements.themePreference.value);
    } catch (error) {
        console.error('Error updating preferences:', error);
        showAlert('Error updating preferences. Please try again.', 'danger');
    }
});

// Handle 2FA toggle
profileElements.enable2FA.addEventListener('change', async (e) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const updates = {
            id: user.id,
            two_factor_enabled: e.target.checked,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(updates);

        if (error) throw error;

        showAlert(`Two-factor authentication ${e.target.checked ? 'enabled' : 'disabled'} successfully!`, 'success');
    } catch (error) {
        console.error('Error updating 2FA:', error);
        showAlert('Error updating two-factor authentication. Please try again.', 'danger');
        e.target.checked = !e.target.checked; // Revert the toggle
    }
});

// Apply theme
function applyTheme(theme) {
    const body = document.body;
    if (theme === 'dark') {
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showAlert('Error signing out. Please try again.', 'danger');
    }
}); 