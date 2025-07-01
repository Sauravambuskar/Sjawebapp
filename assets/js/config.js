/**
 * SJA Foundation Investment Management Platform
 * Supabase Configuration
 */

// Default configuration
const defaultConfig = {
    supabaseUrl: 'https://nyuvlamldgaeyeaiaepj.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55dXZsYW1sZGdhZXllYWlhZXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjEyMzAsImV4cCI6MjA2NjkzNzIzMH0.9wok8k7kwif_BVrG1Zt85kuLg1pz_zzbU9VLuNcrJaA'
};

// Get configuration from localStorage or use default
let config = JSON.parse(localStorage.getItem('sjaConfig')) || defaultConfig;

// Initialize Supabase client
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
} catch (error) {
    console.error('Error initializing Supabase client:', error);
}

// Check if setup is needed
document.addEventListener('DOMContentLoaded', function() {
    // Show setup modal if no config is found
    if (!localStorage.getItem('sjaConfig')) {
        const setupModal = new bootstrap.Modal(document.getElementById('setup-modal'));
        setupModal.show();
        
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
            
            // Reload page to apply new configuration
            window.location.reload();
        });
    }
});

// Export Supabase client for use in other scripts
window.supabaseClient = supabaseClient; 