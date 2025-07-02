/**
 * SJA Foundation Investment Management Platform
 * Client Dashboard JavaScript
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            window.location.href = '/';
            return;
        }

        // Set current date
        const currentDate = document.getElementById('current-date');
        if (currentDate) {
            currentDate.textContent = new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Load user data
        await loadUserData();

        // Load page data based on current page
        const currentPage = window.location.pathname.split('/').pop().split('.')[0];
        switch (currentPage) {
            case 'client-dashboard':
                await loadDashboardData();
                break;
            case 'investments':
                await loadInvestmentData();
                break;
            case 'wallet':
                await loadWalletData();
                break;
            case 'kyc':
                await loadKycData();
                break;
            case 'nominees':
                await loadNomineesData();
                break;
        }

        // Add event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing dashboard');
    }
});

// Load user data
async function loadUserData() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { data: profile, error: profileError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        // Update user info in sidebar
        document.getElementById('user-name').textContent = profile.name || user.email;
        if (profile.photo_url) {
            document.getElementById('user-avatar').src = profile.photo_url;
        }

        // Update user level
        const { data: referralCount } = await supabaseClient
            .from('referrals')
            .select('id', { count: 'exact' })
            .eq('referrer_id', user.id);

        const level = Math.min(Math.floor((referralCount || 0) / 10) + 1, 11);
        document.getElementById('user-level').textContent = `Level ${level}`;

        // Update sidebar badges
        await updateSidebarBadges();

    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Update sidebar badges with real-time data
async function updateSidebarBadges() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        // Update wallet badge
        const { data: wallet } = await supabaseClient
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        if (wallet && document.getElementById('wallet-badge')) {
            document.getElementById('wallet-badge').textContent = `₹${formatCurrency(wallet.balance)}`;
        }

        // Update referral badge
        const { data: referrals } = await supabaseClient
            .from('referrals')
            .select('id', { count: 'exact' })
            .eq('referrer_id', user.id)
            .eq('level', 1);

        if (document.getElementById('referral-badge')) {
            document.getElementById('referral-badge').textContent = referrals || 0;
        }

        // Update KYC badge
        const { data: kyc } = await supabaseClient
            .from('kyc_docs')
            .select('status')
            .eq('user_id', user.id)
            .single();

        const kycBadge = document.getElementById('kyc-badge');
        if (kycBadge) {
            const status = kyc ? kyc.status : 'pending';
            const statusText = {
                'approved': 'Verified',
                'pending': 'Pending',
                'rejected': 'Rejected',
                'not_submitted': 'Required'
            }[status] || 'Required';
            
            kycBadge.textContent = statusText;
            kycBadge.className = `nav-badge ${getKycBadgeClass(status)}`;
        }

        // Update notification badge
        const { data: notifications } = await supabaseClient
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('read_status', false);

        if (document.getElementById('notification-count')) {
            const count = notifications || 0;
            document.getElementById('notification-count').textContent = count;
            document.getElementById('notification-count').style.display = count > 0 ? 'inline' : 'none';
        }

    } catch (error) {
        console.error('Error updating sidebar badges:', error);
    }
}

// Get KYC badge class based on status
function getKycBadgeClass(status) {
    const classes = {
        'approved': 'bg-success',
        'pending': 'bg-warning',
        'rejected': 'bg-danger',
        'not_submitted': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
}

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadWalletBalance(),
            loadInvestmentSummary(),
            loadReferralSummary(),
            loadKycStatus(),
            loadRecentActivities(),
            updateCharts()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load wallet balance
async function loadWalletBalance() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { data: wallet, error } = await supabaseClient
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) throw error;

        // Update wallet balance on dashboard
        document.getElementById('wallet-balance').textContent = `₹${formatCurrency(wallet.balance)}`;
        if (document.getElementById('wallet-balance-display')) {
            document.getElementById('wallet-balance-display').textContent = `₹${formatCurrency(wallet.balance)}`;
            document.getElementById('wallet-last-updated').textContent = `Last updated: ${formatDate(wallet.last_updated)}`;
        }

    } catch (error) {
        console.error('Error loading wallet balance:', error);
    }
}

// Load investment summary
async function loadInvestmentSummary() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { data: investments, error } = await supabaseClient
            .from('investments')
            .select('*')
            .eq('user_id', user.id);

        if (error) throw error;

        const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const activeInvestments = investments.filter(inv => inv.status === 'active').length;
        const totalReturns = investments.reduce((sum, inv) => {
            if (inv.status === 'active') {
                const monthlyInterest = (inv.amount * inv.interest_rate) / (12 * 100);
                const months = Math.floor((new Date() - new Date(inv.start_date)) / (30 * 24 * 60 * 60 * 1000));
                return sum + (monthlyInterest * months);
            }
            return sum;
        }, 0);

        // Update investment stats
        document.getElementById('total-investment').textContent = `₹${formatCurrency(totalInvested)}`;
        if (document.getElementById('total-invested')) {
            document.getElementById('total-invested').textContent = `₹${formatCurrency(totalInvested)}`;
            document.getElementById('active-investments').textContent = activeInvestments;
            document.getElementById('total-returns').textContent = `₹${formatCurrency(totalReturns)}`;
        }

    } catch (error) {
        console.error('Error loading investment summary:', error);
    }
}

// Load referral summary
async function loadReferralSummary() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        // Get direct referrals
        const { data: directReferrals, error: directError } = await supabaseClient
            .from('referrals')
            .select(`
                referred_id,
                referred:referred_id (
                    name,
                    email,
                    created_at
                )
            `)
            .eq('referrer_id', user.id)
            .eq('level', 1);

        if (directError) throw directError;

        // Get referral earnings
        const { data: earnings, error: earningsError } = await supabaseClient
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'referral_commission');

        if (earningsError) throw earningsError;

        const totalEarnings = earnings.reduce((sum, tx) => sum + tx.amount, 0);

        // Update referral stats
        document.getElementById('referral-count').textContent = `${directReferrals.length} Referrals`;
        document.getElementById('referral-earnings').textContent = `₹${formatCurrency(totalEarnings)}`;

        // Update referral table if on referrals page
        if (document.getElementById('referral-table-body')) {
            document.getElementById('referral-table-body').innerHTML = directReferrals.map(ref => `
                <tr>
                    <td>${ref.referred.name || 'Anonymous'}</td>
                    <td>${ref.referred.email}</td>
                    <td>${formatDate(ref.referred.created_at)}</td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading referral summary:', error);
    }
}

// Load KYC status
async function loadKycStatus() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { data: kyc, error } = await supabaseClient
            .from('kyc_docs')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        const status = kyc ? kyc.status : 'not_submitted';
        const statusText = status.replace('_', ' ').toUpperCase();
        const statusClass = {
            'approved': 'bg-success',
            'pending': 'bg-warning',
            'rejected': 'bg-danger',
            'not_submitted': 'bg-secondary'
        }[status];

        // Update KYC status on dashboard
        document.getElementById('kyc-status').textContent = statusText;
        
        // Update KYC badge if on KYC page
        const kycBadge = document.getElementById('kyc-status-badge');
        if (kycBadge) {
            kycBadge.className = `badge ${statusClass}`;
            kycBadge.textContent = statusText;
        }

        // Disable KYC form if already submitted
        if (kyc && status !== 'rejected') {
            const kycForm = document.getElementById('kyc-form');
            if (kycForm) {
                const formElements = kycForm.elements;
                for (let i = 0; i < formElements.length; i++) {
                    formElements[i].disabled = true;
                }
                document.getElementById('submit-kyc').style.display = 'none';
            }
        }

        // Update document previews
        if (kyc) {
            if (kyc.id_proof_url) {
                document.getElementById('id-proof-preview').src = kyc.id_proof_url;
                document.getElementById('id-proof-preview').style.display = 'block';
            }
            if (kyc.address_proof_url) {
                document.getElementById('address-proof-preview').src = kyc.address_proof_url;
                document.getElementById('address-proof-preview').style.display = 'block';
            }
        }

    } catch (error) {
        console.error('Error loading KYC status:', error);
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { data: activities, error } = await supabaseClient
            .from('activities')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const activitiesTable = document.getElementById('activities-table');
        if (activitiesTable) {
            activitiesTable.querySelector('tbody').innerHTML = activities.map(activity => `
                <tr>
                    <td>${formatDate(activity.created_at)}</td>
                    <td>${activity.type}</td>
                    <td>${activity.description}</td>
                    <td>${activity.amount ? `₹${formatCurrency(activity.amount)}` : '-'}</td>
                    <td>
                        <span class="badge bg-${getStatusColor(activity.status)}">
                            ${activity.status.toUpperCase()}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

// Update charts
async function updateCharts() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        // Get investment data
        const { data: investments, error: investError } = await supabaseClient
            .from('investments')
            .select('*')
            .eq('user_id', user.id);

        if (investError) throw investError;

        // Get referral levels
        const { data: referralLevels, error: refError } = await supabaseClient
            .from('referrals')
            .select('level')
            .eq('referrer_id', user.id);

        if (refError) throw refError;

        // Safely update charts only if data exists
        if (investments && investments.length > 0) {
            // Investment distribution chart
            const investmentTypes = {};
            investments.forEach(inv => {
                investmentTypes[inv.type] = (investmentTypes[inv.type] || 0) + inv.amount;
            });

            const investmentChart = new Chart(
                document.getElementById('investment-distribution'),
                {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(investmentTypes),
                        datasets: [{
                            data: Object.values(investmentTypes),
                            backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
                        }]
                    }
                }
            );
        }

        if (referralLevels && referralLevels.length > 0) {
            // Referral levels chart
            const levelCounts = {};
            referralLevels.forEach(ref => {
                levelCounts[`Level ${ref.level}`] = (levelCounts[`Level ${ref.level}`] || 0) + 1;
            });

            const referralChart = new Chart(
                document.getElementById('referral-distribution'),
                {
                    type: 'bar',
                    data: {
                        labels: Object.keys(levelCounts),
                        datasets: [{
                            label: 'Referrals',
                            data: Object.values(levelCounts),
                            backgroundColor: '#4e73df'
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                }
            );
        }

    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    try {
        // Add sidebar toggle button to the DOM
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle';
        toggleButton.innerHTML = '<i class="bi bi-list"></i>';
        toggleButton.setAttribute('aria-label', 'Toggle Sidebar');
        document.body.appendChild(toggleButton);

        // Add sidebar overlay to the DOM
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);

        // Sidebar toggle functionality
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        function toggleSidebar() {
            const isMobile = window.innerWidth <= 992;
            
            if (isMobile) {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
                
                // Update aria attributes
                const isOpen = sidebar.classList.contains('active');
                sidebar.setAttribute('aria-hidden', !isOpen);
                overlay.setAttribute('aria-hidden', !isOpen);
            } else {
                sidebar.classList.toggle('sidebar-collapsed');
                mainContent.classList.toggle('main-content-expanded');
                
                // Update toggle button icon
                const icon = toggleButton.querySelector('i');
                if (sidebar.classList.contains('sidebar-collapsed')) {
                    icon.className = 'bi bi-arrow-right';
                } else {
                    icon.className = 'bi bi-list';
                }
            }
        }

        // Toggle button click handler
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });

        // Overlay click handler (mobile only)
        overlay.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                sidebar.setAttribute('aria-hidden', 'true');
                overlay.setAttribute('aria-hidden', 'true');
            }
        });

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const isMobile = window.innerWidth <= 992;
                
                if (!isMobile) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                    sidebar.setAttribute('aria-hidden', 'false');
                    overlay.setAttribute('aria-hidden', 'true');
                }
            }, 250);
        });

        // Close sidebar when clicking outside (mobile only)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && 
                !sidebar.contains(e.target) && 
                !toggleButton.contains(e.target) && 
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                sidebar.setAttribute('aria-hidden', 'true');
                overlay.setAttribute('aria-hidden', 'true');
            }
        });

        // Keyboard navigation for accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                sidebar.setAttribute('aria-hidden', 'true');
                overlay.setAttribute('aria-hidden', 'true');
            }
        });

        // Setup other event listeners
        setupFormSubmissions();
        setupThemeToggle();
        setupNotifications();
        
        // Auto-refresh badges every 30 seconds
        setInterval(updateSidebarBadges, 30000);
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Setup form submissions
function setupFormSubmissions() {
    // KYC form
    const kycForm = document.getElementById('kyc-form');
    if (kycForm) {
        kycForm.addEventListener('submit', submitKyc);
    }

    // Investment form
    const investmentForm = document.getElementById('investment-form');
    if (investmentForm) {
        investmentForm.addEventListener('submit', submitInvestment);
    }

    // Deposit form
    const depositForm = document.getElementById('deposit-form');
    if (depositForm) {
        depositForm.addEventListener('submit', submitDeposit);
    }

    // Withdrawal form
    const withdrawForm = document.getElementById('withdraw-form');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', submitWithdrawal);
    }

    // Nominee form
    const nomineeForm = document.getElementById('nominee-form');
    if (nomineeForm) {
        nomineeForm.addEventListener('submit', submitNominee);
    }

    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }
}

// Form submission handlers
async function submitKyc(e) {
    e.preventDefault();
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        // Upload ID proof documents
        const idProofFront = document.getElementById('id-proof-front').files[0];
        const idProofBack = document.getElementById('id-proof-back').files[0];
        const addressProof = document.getElementById('address-proof-file').files[0];

        const uploads = await Promise.all([
            uploadDocument(idProofFront, 'id_proof_front'),
            uploadDocument(idProofBack, 'id_proof_back'),
            uploadDocument(addressProof, 'address_proof')
        ]);

        // Create KYC record
        const { error: kycError } = await supabaseClient
            .from('kyc_docs')
            .upsert({
                user_id: user.id,
                id_proof_type: document.getElementById('id-proof-type').value,
                id_number: document.getElementById('id-number').value,
                id_proof_front_url: uploads[0],
                id_proof_back_url: uploads[1],
                address_proof_type: document.getElementById('address-proof-type').value,
                address_proof_url: uploads[2],
                address_line1: document.getElementById('address-line1').value,
                address_line2: document.getElementById('address-line2').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                pincode: document.getElementById('pincode').value,
                status: 'pending'
            });

        if (kycError) throw kycError;

        alert('KYC documents submitted successfully!');
        window.location.reload();

    } catch (error) {
        console.error('Error submitting KYC:', error);
        alert('Error submitting KYC documents');
    }
}

async function submitInvestment(e) {
    e.preventDefault();
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        const amount = parseFloat(document.getElementById('investment-amount').value);
        const type = document.getElementById('investment-type').value;
        const duration = parseInt(document.getElementById('investment-duration').value);

        if (amount < 1000) {
            alert('Minimum investment amount is ₹1,000');
            return;
        }

        // Check wallet balance
        const { data: wallet, error: walletError } = await supabaseClient
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        if (walletError) throw walletError;

        if (wallet.balance < amount) {
            alert('Insufficient wallet balance');
            return;
        }

        // Create investment
        const { error: investError } = await supabaseClient
            .from('investments')
            .insert([{
                user_id: user.id,
                type,
                amount,
                duration,
                interest_rate: 12,
                start_date: new Date().toISOString(),
                maturity_date: new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            }]);

        if (investError) throw investError;

        // Update wallet balance
        const { error: updateError } = await supabaseClient
            .from('wallets')
            .update({ balance: wallet.balance - amount })
            .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Create transaction record
        const { error: transError } = await supabaseClient
            .from('transactions')
            .insert([{
                user_id: user.id,
                type: 'investment',
                amount,
                status: 'completed'
            }]);

        if (transError) throw transError;

        alert('Investment created successfully!');
        window.location.reload();

    } catch (error) {
        console.error('Error creating investment:', error);
        alert('Error creating investment');
    }
}

async function submitDeposit(e) {
    e.preventDefault();
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const method = document.getElementById('deposit-method').value;

        if (amount < 1000) {
            alert('Minimum deposit amount is ₹1,000');
            return;
        }

        // Create transaction record
        const { error: transError } = await supabaseClient
            .from('transactions')
            .insert([{
                user_id: user.id,
                type: 'deposit',
                amount,
                payment_method: method,
                status: 'pending'
            }]);

        if (transError) throw transError;

        alert('Deposit request submitted successfully!');
        window.location.reload();

    } catch (error) {
        console.error('Error submitting deposit:', error);
        alert('Error submitting deposit request');
    }
}

async function submitWithdrawal(e) {
    e.preventDefault();
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const type = document.getElementById('withdraw-type').value;
        const reason = document.getElementById('emergency-reason').value;
        const bankName = document.getElementById('bank-name').value;
        const accountNumber = document.getElementById('account-number').value;
        const ifscCode = document.getElementById('ifsc-code').value;

        // Check wallet balance
        const { data: wallet, error: walletError } = await supabaseClient
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        if (walletError) throw walletError;

        if (wallet.balance < amount) {
            alert('Insufficient wallet balance');
            return;
        }

        // Create withdrawal request
        const { error: withdrawError } = await supabaseClient
            .from('transactions')
            .insert([{
                user_id: user.id,
                type: 'withdrawal',
                amount,
                withdrawal_type: type,
                emergency_reason: reason,
                bank_name: bankName,
                account_number: accountNumber,
                ifsc_code: ifscCode,
                status: 'pending'
            }]);

        if (withdrawError) throw withdrawError;

        alert('Withdrawal request submitted successfully!');
        window.location.reload();

    } catch (error) {
        console.error('Error submitting withdrawal:', error);
        alert('Error submitting withdrawal request');
    }
}

async function submitNominee(e) {
    e.preventDefault();
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const formData = new FormData(e.target);
        
        // Upload nominee photo if provided
        let photoUrl = null;
        const photoFile = formData.get('photo');
        if (photoFile.size > 0) {
            photoUrl = await uploadDocument(photoFile, 'nominee-photo');
        }

        const nomineeData = {
            user_id: user.id,
            name: formData.get('name'),
            dob: formData.get('dob'),
            relation: formData.get('relation'),
            blood_group: formData.get('blood_group'),
            phone: formData.get('phone'),
            photo: photoUrl
        };

        const { error } = await supabaseClient
            .from('nominees')
            .insert(nomineeData);

        if (error) throw error;

        alert('Nominee added successfully!');
        window.location.reload();

    } catch (error) {
        console.error('Error submitting nominee:', error);
        alert('Failed to add nominee. Please try again.');
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function getStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'completed':
        case 'approved':
            return 'success';
        case 'pending':
            return 'warning';
        case 'rejected':
        case 'failed':
            return 'danger';
        default:
            return 'secondary';
    }
}

async function uploadDocument(file, type) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const fileName = `${user.id}/${type}_${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;

        const { data, error } = await supabaseClient.storage
            .from('kyc_documents')
            .upload(fileName, file);

        if (error) throw error;

        const { publicURL } = supabaseClient.storage
            .from('kyc_documents')
            .getPublicUrl(fileName);

        return publicURL;

    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
}

async function logout() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = '/';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out');
    }
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update toggle button icon
            const icon = themeToggle.querySelector('i');
            icon.className = newTheme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
        });
    }
}

function setupNotifications() {
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', async () => {
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                const { data: notifications, error } = await supabaseClient
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('read_status', false)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Update notification badge
                const badge = notificationBell.querySelector('.notification-badge');
                if (badge) {
                    badge.textContent = notifications.length;
                    badge.style.display = notifications.length > 0 ? 'block' : 'none';
                }

            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        });
    }
} 