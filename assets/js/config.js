/**
 * SJA Foundation Investment Management Platform
 * Supabase Configuration
 */

// Default configuration with production values
const defaultConfig = {
    supabaseUrl: 'https://nyuvlamldgaeyeaiaepj.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55dXZsYW1sZGdhZXllYWlhZXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjEyMzAsImV4cCI6MjA2NjkzNzIzMH0.9wok8k7kwif_BVrG1Zt85kuLg1pz_zzbU9VLuNcrJaA'
};

// Store default config if not already stored
if (!localStorage.getItem('sjaConfig')) {
    localStorage.setItem('sjaConfig', JSON.stringify(defaultConfig));
}

// Get configuration from localStorage
let config = JSON.parse(localStorage.getItem('sjaConfig'));

// Initialize Supabase client
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
} catch (error) {
    console.error('Error initializing Supabase client:', error);
}

// Check if setup is needed - only if URL contains 'setup.html'
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('setup.html')) {
        const setupModal = document.getElementById('setup-modal');
        if (setupModal) {
            const modal = new bootstrap.Modal(setupModal);
            
            // Pre-fill the form with current values
            document.getElementById('supabase-url').value = config.supabaseUrl;
            document.getElementById('supabase-anon-key').value = config.supabaseAnonKey;
            
            // Save configuration when button is clicked
            document.getElementById('save-config-btn').addEventListener('click', function() {
                const newConfig = {
                    supabaseUrl: document.getElementById('supabase-url').value.trim(),
                    supabaseAnonKey: document.getElementById('supabase-anon-key').value.trim()
                };
                
                // Validate configuration
                if (!newConfig.supabaseUrl || !newConfig.supabaseAnonKey) {
                    alert('Please enter valid Supabase configuration');
                    return;
                }
                
                // Save configuration
                localStorage.setItem('sjaConfig', JSON.stringify(newConfig));
                
                // Redirect to index page
                window.location.href = '/';
            });
            
            modal.show();
        }
    }
});

// Export Supabase client for use in other scripts
window.supabaseClient = supabaseClient; 