// Initialize Supabase client
const { supabase } = window;

// Network visualization
let network = null;
let networkData = {
    nodes: new vis.DataSet([]),
    edges: new vis.DataSet([])
};

// Commission rates for each level
const commissionRates = {
    1: 5, // 5% for level 1
    2: 3, // 3% for level 2
    3: 2, // 2% for level 3
    4: 1, // 1% for level 4
    5: 0.5, // 0.5% for level 5
    6: 0.5, // 0.5% for level 6
    7: 0.5, // 0.5% for level 7
    8: 0.5, // 0.5% for level 8
    9: 0.5, // 0.5% for level 9
    10: 0.5 // 0.5% for level 10
};

// Initialize referral page
async function initializePage() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        // Initialize network visualization
        initializeNetwork();
        
        // Load referral data
        await loadReferralData(user.id);
        
        // Setup referral link
        setupReferralLink(user.id);
        
        // Load commission structure
        loadCommissionStructure();
        
        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing page:', error);
        showAlert('Error loading referral data. Please try again.', 'danger');
    }
}

// Initialize network visualization
function initializeNetwork() {
    const container = document.getElementById('networkVisualization');
    const options = {
        nodes: {
            shape: 'circularImage',
            size: 30,
            font: {
                size: 14,
                color: '#333'
            },
            borderWidth: 2,
            shadow: true
        },
        edges: {
            width: 2,
            color: { color: '#2B6CB0', highlight: '#4299E1' },
            smooth: {
                type: 'continuous'
            }
        },
        physics: {
            stabilization: false,
            barnesHut: {
                gravitationalConstant: -2000,
                springConstant: 0.04,
                springLength: 95
            }
        },
        interaction: {
            dragNodes: true,
            dragView: true,
            zoomView: true
        }
    };

    network = new vis.Network(container, networkData, options);
}

// Load referral data
async function loadReferralData(userId) {
    try {
        // Load user's referral network
        const { data: referrals, error: referralError } = await supabase
            .from('referrals')
            .select(`
                id,
                referrer_id,
                referred_id,
                level,
                users!referred_id (
                    name,
                    photo,
                    created_at
                )
            `)
            .eq('referrer_id', userId);

        if (referralError) throw referralError;

        // Load earnings data
        const { data: earnings, error: earningsError } = await supabase
            .from('earnings')
            .select('amount')
            .eq('user_id', userId)
            .eq('source', 'referral_commission');

        if (earningsError) throw earningsError;

        // Update statistics
        updateStatistics(referrals, earnings);

        // Update network visualization
        await updateNetworkVisualization(userId, referrals);

        // Update referral history table
        updateReferralHistory(referrals);
    } catch (error) {
        console.error('Error loading referral data:', error);
        showAlert('Error loading referral data. Please try again.', 'danger');
    }
}

// Update statistics
function updateStatistics(referrals, earnings) {
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(ref => ref.users.created_at).length;
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const maxLevel = referrals.reduce((max, ref) => Math.max(max, ref.level), 0);

    document.getElementById('totalReferrals').textContent = totalReferrals;
    document.getElementById('activeReferrals').textContent = activeReferrals;
    document.getElementById('totalEarnings').textContent = `₹${totalEarnings.toFixed(2)}`;
    document.getElementById('networkLevel').textContent = maxLevel;
}

// Update network visualization
async function updateNetworkVisualization(userId, referrals) {
    try {
        // Get current user's data
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name, photo')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        // Clear existing data
        networkData.nodes.clear();
        networkData.edges.clear();

        // Add current user as root node
        networkData.nodes.add({
            id: userId,
            label: userData.name,
            image: userData.photo || '../assets/img/default-avatar.png',
            level: 0
        });

        // Add referred users and connections
        referrals.forEach(ref => {
            networkData.nodes.add({
                id: ref.referred_id,
                label: ref.users.name,
                image: ref.users.photo || '../assets/img/default-avatar.png',
                level: ref.level
            });

            networkData.edges.add({
                from: userId,
                to: ref.referred_id,
                label: `Level ${ref.level}`
            });
        });

        // Fit the network to view
        network.fit();
    } catch (error) {
        console.error('Error updating network visualization:', error);
        showAlert('Error updating network visualization.', 'danger');
    }
}

// Update referral history table
function updateReferralHistory(referrals) {
    const historyTable = document.getElementById('referralHistory');
    historyTable.innerHTML = '';

    referrals.forEach(ref => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ref.users.name}</td>
            <td>Level ${ref.level}</td>
            <td>${new Date(ref.users.created_at).toLocaleDateString()}</td>
            <td>-</td>
            <td>-</td>
            <td><span class="badge bg-success">Active</span></td>
        `;
        historyTable.appendChild(row);
    });

    if (referrals.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="text-center">No referrals yet</td>
        `;
        historyTable.appendChild(row);
    }
}

// Setup referral link
function setupReferralLink(userId) {
    const referralLink = `${window.location.origin}/register?ref=${userId}`;
    document.getElementById('referralLink').value = referralLink;
}

// Load commission structure
function loadCommissionStructure() {
    const commissionTable = document.getElementById('commissionTable');
    commissionTable.innerHTML = '';

    Object.entries(commissionRates).forEach(([level, rate]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Level ${level}</td>
            <td>${rate}%</td>
        `;
        commissionTable.appendChild(row);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Copy referral link
    document.getElementById('copyLink').addEventListener('click', () => {
        const referralLink = document.getElementById('referralLink');
        referralLink.select();
        document.execCommand('copy');
        showAlert('Referral link copied to clipboard!', 'success');
    });

    // Share on WhatsApp
    document.getElementById('shareWhatsApp').addEventListener('click', () => {
        const referralLink = document.getElementById('referralLink').value;
        const message = encodeURIComponent(`Join SJA Foundation using my referral link: ${referralLink}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    });

    // Share via Email
    document.getElementById('shareEmail').addEventListener('click', () => {
        const referralLink = document.getElementById('referralLink').value;
        const subject = encodeURIComponent('Join SJA Foundation');
        const body = encodeURIComponent(`Join SJA Foundation using my referral link: ${referralLink}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });

    // Network controls
    document.getElementById('zoomIn').addEventListener('click', () => {
        network.zoomIn();
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        network.zoomOut();
    });

    document.getElementById('resetView').addEventListener('click', () => {
        network.fit();
    });
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

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage); 