/**
 * SJA Foundation Investment Management Platform
 * Client Dashboard JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentUser = null;
    let userWallet = null;
    let userInvestments = [];
    let userReferrals = [];
    let userKyc = null;
    
    // Show loading spinner
    const showLoading = () => {
        document.getElementById('loading-spinner').classList.remove('d-none');
    };
    
    // Hide loading spinner
    const hideLoading = () => {
        document.getElementById('loading-spinner').classList.add('d-none');
    };
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        }).format(amount);
    };
    
    // Format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };
    
    // Check authentication
    const checkAuth = async () => {
        showLoading();
        
        try {
            const { data, error } = await window.supabaseClient.auth.getSession();
            
            if (error || !data.session) {
                // Redirect to login page if not authenticated
                window.location.href = '../index.html';
                return;
            }
            
            // Get user data
            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', data.session.user.id)
                .single();
            
            if (userError) throw userError;
            
            // Store user data
            currentUser = userData;
            
            // Check if user is admin
            if (userData.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
                return;
            }
            
            // Load user data
            await loadUserData();
            
            // Update UI with user data
            updateUI();
            
        } catch (error) {
            console.error('Authentication error:', error);
            alert('Authentication failed. Please login again.');
            window.location.href = '../index.html';
        } finally {
            hideLoading();
        }
    };
    
    // Load user data
    const loadUserData = async () => {
        try {
            // Load wallet data
            const { data: walletData, error: walletError } = await window.supabaseClient
                .from('wallets')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();
            
            if (walletError) throw walletError;
            userWallet = walletData;
            
            // Load investments data
            const { data: investmentsData, error: investmentsError } = await window.supabaseClient
                .from('investments')
                .select('*')
                .eq('user_id', currentUser.id);
            
            if (investmentsError) throw investmentsError;
            userInvestments = investmentsData;
            
            // Load referrals data
            const { data: referralsData, error: referralsError } = await window.supabaseClient
                .from('referrals')
                .select('*')
                .eq('referrer_id', currentUser.id);
            
            if (referralsError) throw referralsError;
            userReferrals = referralsData;
            
            // Load KYC data
            const { data: kycData, error: kycError } = await window.supabaseClient
                .from('kyc_docs')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();
            
            if (!kycError) {
                userKyc = kycData;
            }
            
            // Load recent activities
            await loadRecentActivities();
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };
    
    // Load recent activities
    const loadRecentActivities = async () => {
        try {
            // Get transactions
            const { data: transactionsData, error: transactionsError } = await window.supabaseClient
                .from('transactions')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (transactionsError) throw transactionsError;
            
            // Get notifications
            const { data: notificationsData, error: notificationsError } = await window.supabaseClient
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (notificationsError) throw notificationsError;
            
            // Combine and sort activities
            const activities = [
                ...transactionsData.map(t => ({
                    date: t.created_at,
                    type: t.type,
                    description: `${t.type.charAt(0).toUpperCase() + t.type.slice(1)} transaction`,
                    amount: t.amount,
                    status: t.status
                })),
                ...notificationsData.map(n => ({
                    date: n.created_at,
                    type: 'notification',
                    description: n.title,
                    amount: null,
                    status: n.read_status ? 'Read' : 'Unread'
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
            
            // Update activities table
            const activitiesBody = document.getElementById('activities-body');
            activitiesBody.innerHTML = '';
            
            if (activities.length === 0) {
                activitiesBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">No recent activities</td>
                    </tr>
                `;
                return;
            }
            
            activities.forEach(activity => {
                const row = document.createElement('tr');
                
                // Format status badge
                let statusBadge = '';
                if (activity.status === 'completed' || activity.status === 'Read') {
                    statusBadge = '<span class="badge bg-success">Completed</span>';
                } else if (activity.status === 'pending') {
                    statusBadge = '<span class="badge bg-warning text-dark">Pending</span>';
                } else if (activity.status === 'rejected') {
                    statusBadge = '<span class="badge bg-danger">Rejected</span>';
                } else if (activity.status === 'Unread') {
                    statusBadge = '<span class="badge bg-info">Unread</span>';
                }
                
                row.innerHTML = `
                    <td>${formatDate(activity.date)}</td>
                    <td>${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</td>
                    <td>${activity.description}</td>
                    <td>${activity.amount ? '₹' + formatCurrency(activity.amount) : '-'}</td>
                    <td>${statusBadge}</td>
                `;
                
                activitiesBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    };
    
    // Update UI with user data
    const updateUI = () => {
        // Update user info
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-level').textContent = `Level ${currentUser.level}`;
        
        if (currentUser.photo) {
            document.getElementById('user-avatar').src = currentUser.photo;
        }
        
        // Update wallet balance
        document.getElementById('wallet-balance').textContent = '₹' + formatCurrency(userWallet.balance);
        document.getElementById('wallet-balance-invest').textContent = formatCurrency(userWallet.balance);
        
        // Update total investment
        const totalInvestment = userInvestments.reduce((total, investment) => total + investment.amount, 0);
        document.getElementById('total-investment').textContent = '₹' + formatCurrency(totalInvestment);
        
        // Update referral count and earnings
        document.getElementById('referral-count').textContent = `${userReferrals.length} Referrals`;
        
        // Calculate referral earnings
        const referralEarnings = userReferrals.reduce((total, referral) => {
            // This is a placeholder, actual earnings would be calculated from the earnings table
            return total + 0;
        }, 0);
        document.getElementById('referral-earnings').textContent = '₹' + formatCurrency(referralEarnings);
        
        // Update KYC status
        const kycStatus = userKyc ? userKyc.status || 'Pending' : 'Not Submitted';
        document.getElementById('kyc-status').textContent = kycStatus;
        
        // Update referral link
        const referralLink = `${window.location.origin}?ref=${currentUser.id}`;
        document.getElementById('referral-link').value = referralLink;
        
        // Update social share links
        document.getElementById('share-whatsapp').href = `https://wa.me/?text=Join%20SJA%20Foundation%20Investment%20Platform%20using%20my%20referral%20link:%20${encodeURIComponent(referralLink)}`;
        document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        document.getElementById('share-twitter').href = `https://twitter.com/intent/tweet?text=Join%20SJA%20Foundation%20Investment%20Platform%20using%20my%20referral%20link:&url=${encodeURIComponent(referralLink)}`;
        document.getElementById('share-telegram').href = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Join%20SJA%20Foundation%20Investment%20Platform%20using%20my%20referral%20link:`;
        
        // Update current date
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = today.toLocaleDateString('en-IN', options);
        
        // Initialize charts
        initCharts();
        
        // Update ID card
        updateIdCard();
    };
    
    // Initialize charts
    const initCharts = () => {
        // Investment growth chart
        const investmentCtx = document.getElementById('investment-chart').getContext('2d');
        
        // Sample data - in real app, this would come from the database
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const investmentData = [0, 0, 0, 0, 0, 0];
        const interestData = [0, 0, 0, 0, 0, 0];
        
        // Fill in actual data if available
        userInvestments.forEach(investment => {
            const startDate = new Date(investment.start_date);
            const month = startDate.getMonth();
            if (month < months.length) {
                investmentData[month] += investment.amount;
                
                // Calculate interest (simplified)
                const interestAmount = investment.amount * (investment.interest_rate / 100);
                interestData[month] += interestAmount;
            }
        });
        
        new Chart(investmentCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Investment',
                        data: investmentData,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Interest',
                        data: interestData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    }
                }
            }
        });
        
        // Referral network chart
        const referralCtx = document.getElementById('referral-chart').getContext('2d');
        
        // Sample data - in real app, this would come from the database
        const referralLevels = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];
        const referralCounts = [0, 0, 0, 0, 0];
        
        // Fill in actual data if available
        userReferrals.forEach(referral => {
            const level = referral.level;
            if (level <= referralLevels.length) {
                referralCounts[level - 1]++;
            }
        });
        
        new Chart(referralCtx, {
            type: 'doughnut',
            data: {
                labels: referralLevels,
                datasets: [{
                    data: referralCounts,
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    };
    
    // Update ID card
    const updateIdCard = () => {
        document.getElementById('id-card-name').textContent = currentUser.name;
        document.getElementById('id-card-level').textContent = `Level ${currentUser.level} Member`;
        document.getElementById('id-card-member-id').textContent = `SJA${currentUser.id.slice(0, 5).toUpperCase()}`;
        
        const joinDate = new Date(currentUser.created_at);
        document.getElementById('id-card-joined').textContent = joinDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        
        if (currentUser.photo) {
            document.getElementById('id-card-photo').src = currentUser.photo;
        }
        
        // Generate QR code
        const qrCodeUrl = `${window.location.origin}/verify.html?id=${currentUser.id}`;
        QRCode.toDataURL(qrCodeUrl, { width: 100, margin: 0 }, function(err, url) {
            if (!err) {
                document.getElementById('id-card-qr').src = url;
            }
        });
    };
    
    // Handle page navigation
    const navLinks = document.querySelectorAll('[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get page id
            const pageId = this.getAttribute('data-page');
            
            // Hide all pages
            document.querySelectorAll('[id$="-page"]').forEach(page => {
                page.classList.add('d-none');
            });
            
            // Show selected page
            document.getElementById(`${pageId}-page`).classList.remove('d-none');
            
            // Update active link
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
            
            // Load page specific content
            loadPageContent(pageId);
        });
    });
    
    // Load page specific content
    const loadPageContent = (pageId) => {
        switch (pageId) {
            case 'investments':
                // Load investments page content
                break;
            case 'wallet':
                // Load wallet page content
                break;
            case 'referrals':
                // Load referrals page content
                break;
            case 'kyc':
                // Load KYC page content
                break;
            case 'nominees':
                // Load nominees page content
                break;
            case 'profile':
                // Load profile page content
                break;
        }
    };
    
    // Handle sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        
        sidebar.classList.toggle('sidebar-collapsed');
        mainContent.classList.toggle('main-content-expanded');
    });
    
    // Handle copy referral link
    document.getElementById('copy-referral-link').addEventListener('click', function() {
        const referralLink = document.getElementById('referral-link');
        referralLink.select();
        document.execCommand('copy');
        
        // Show copied tooltip
        this.innerHTML = '<i class="fas fa-check"></i> Copied';
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
    });
    
    // Handle view ID card
    document.getElementById('view-id-card-btn').addEventListener('click', function() {
        const idCardModal = new bootstrap.Modal(document.getElementById('idCardModal'));
        idCardModal.show();
    });
    
    // Handle download ID card
    document.getElementById('download-id-card').addEventListener('click', function() {
        // In a real app, this would generate a PDF of the ID card
        alert('ID Card download functionality will be implemented in the future.');
    });
    
    // Handle withdraw type change
    document.getElementById('withdraw-type').addEventListener('change', function() {
        const emergencyReasonContainer = document.getElementById('emergency-reason-container');
        
        if (this.value === 'emergency') {
            emergencyReasonContainer.classList.remove('d-none');
        } else {
            emergencyReasonContainer.classList.add('d-none');
        }
    });
    
    // Handle deposit submission
    document.getElementById('submit-deposit').addEventListener('click', async function() {
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const method = document.getElementById('deposit-method').value;
        const reference = document.getElementById('deposit-reference').value;
        const screenshot = document.getElementById('deposit-screenshot').files[0];
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (!reference) {
            alert('Please enter a transaction reference');
            return;
        }
        
        if (!screenshot) {
            alert('Please upload a payment screenshot');
            return;
        }
        
        try {
            showLoading();
            
            // Upload screenshot to Supabase Storage
            const fileName = `deposit_${currentUser.id}_${Date.now()}.${screenshot.name.split('.').pop()}`;
            const { data: fileData, error: fileError } = await window.supabaseClient.storage
                .from('payment_proofs')
                .upload(fileName, screenshot);
            
            if (fileError) throw fileError;
            
            // Get public URL
            const { data: publicUrlData } = window.supabaseClient.storage
                .from('payment_proofs')
                .getPublicUrl(fileName);
            
            // Create transaction record
            const { data, error } = await window.supabaseClient
                .from('transactions')
                .insert([
                    {
                        user_id: currentUser.id,
                        type: 'deposit',
                        amount,
                        status: 'pending',
                        payment_method: method,
                        reference,
                        proof_url: publicUrlData.publicUrl,
                        created_at: new Date().toISOString()
                    }
                ]);
            
            if (error) throw error;
            
            // Close modal and show success message
            const depositModal = bootstrap.Modal.getInstance(document.getElementById('depositModal'));
            depositModal.hide();
            
            alert('Deposit request submitted successfully. It will be processed within 24 hours.');
            
            // Reload activities
            await loadRecentActivities();
            
        } catch (error) {
            console.error('Deposit error:', error);
            alert('Failed to submit deposit. Please try again.');
        } finally {
            hideLoading();
        }
    });
    
    // Handle withdraw submission
    document.getElementById('submit-withdraw').addEventListener('click', async function() {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const type = document.getElementById('withdraw-type').value;
        const emergencyReason = document.getElementById('emergency-reason').value;
        const bankName = document.getElementById('bank-name').value;
        const accountNumber = document.getElementById('account-number').value;
        const ifscCode = document.getElementById('ifsc-code').value;
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (type === 'emergency' && !emergencyReason) {
            alert('Please provide a reason for emergency withdrawal');
            return;
        }
        
        if (!bankName || !accountNumber || !ifscCode) {
            alert('Please enter all bank details');
            return;
        }
        
        try {
            showLoading();
            
            // Check if amount exceeds wallet balance
            if (amount > userWallet.balance) {
                alert('Withdrawal amount exceeds wallet balance');
                hideLoading();
                return;
            }
            
            // Check if amount exceeds withdrawal limit for regular withdrawals
            if (type === 'regular') {
                const totalInvestment = userInvestments.reduce((total, investment) => total + investment.amount, 0);
                const withdrawalLimit = totalInvestment * 0.1; // 10% of total investment
                
                if (amount > withdrawalLimit) {
                    alert(`Regular withdrawal limit is 10% of your total investment (₹${formatCurrency(withdrawalLimit)})`);
                    hideLoading();
                    return;
                }
            }
            
            // Create transaction record
            const { data, error } = await window.supabaseClient
                .from('transactions')
                .insert([
                    {
                        user_id: currentUser.id,
                        type: 'withdraw',
                        amount,
                        status: 'pending',
                        withdrawal_type: type,
                        emergency_reason: type === 'emergency' ? emergencyReason : null,
                        bank_name: bankName,
                        account_number: accountNumber,
                        ifsc_code: ifscCode,
                        created_at: new Date().toISOString()
                    }
                ]);
            
            if (error) throw error;
            
            // Close modal and show success message
            const withdrawModal = bootstrap.Modal.getInstance(document.getElementById('withdrawModal'));
            withdrawModal.hide();
            
            alert('Withdrawal request submitted successfully. It will be processed within 24-48 hours.');
            
            // Reload activities
            await loadRecentActivities();
            
        } catch (error) {
            console.error('Withdrawal error:', error);
            alert('Failed to submit withdrawal. Please try again.');
        } finally {
            hideLoading();
        }
    });
    
    // Handle investment submission
    document.getElementById('submit-investment').addEventListener('click', async function() {
        const planSelect = document.getElementById('investment-plan');
        const planId = planSelect.value;
        const planText = planSelect.options[planSelect.selectedIndex].text;
        const amount = parseFloat(document.getElementById('investment-amount').value);
        const duration = parseInt(document.getElementById('investment-duration').value);
        
        if (!planId) {
            alert('Please select an investment plan');
            return;
        }
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        try {
            showLoading();
            
            // Check if amount exceeds wallet balance
            if (amount > userWallet.balance) {
                alert('Investment amount exceeds wallet balance');
                hideLoading();
                return;
            }
            
            // Calculate interest rate based on plan and duration
            // This is a placeholder, actual calculation would depend on the plan
            const interestRate = 12; // 12% per annum
            
            // Calculate start and end dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + duration);
            
            // Create investment record
            const { data: investmentData, error: investmentError } = await window.supabaseClient
                .from('investments')
                .insert([
                    {
                        user_id: currentUser.id,
                        type: planText,
                        amount,
                        start_date: startDate.toISOString(),
                        duration,
                        interest_rate: interestRate,
                        status: 'active',
                        maturity_date: endDate.toISOString()
                    }
                ]);
            
            if (investmentError) throw investmentError;
            
            // Update wallet balance
            const newBalance = userWallet.balance - amount;
            const { data: walletData, error: walletError } = await window.supabaseClient
                .from('wallets')
                .update({ balance: newBalance, last_updated: new Date().toISOString() })
                .eq('id', userWallet.id);
            
            if (walletError) throw walletError;
            
            // Update local wallet data
            userWallet.balance = newBalance;
            
            // Create transaction record
            const { data: transactionData, error: transactionError } = await window.supabaseClient
                .from('transactions')
                .insert([
                    {
                        user_id: currentUser.id,
                        type: 'investment',
                        amount,
                        status: 'completed',
                        created_at: new Date().toISOString()
                    }
                ]);
            
            if (transactionError) throw transactionError;
            
            // Close modal and show success message
            const investModal = bootstrap.Modal.getInstance(document.getElementById('investModal'));
            investModal.hide();
            
            alert('Investment created successfully!');
            
            // Reload user data and update UI
            await loadUserData();
            updateUI();
            
        } catch (error) {
            console.error('Investment error:', error);
            alert('Failed to create investment. Please try again.');
        } finally {
            hideLoading();
        }
    });
    
    // Handle logout
    document.getElementById('logout-btn').addEventListener('click', async function() {
        try {
            showLoading();
            
            const { error } = await window.supabaseClient.auth.signOut();
            
            if (error) throw error;
            
            // Clear local storage
            localStorage.removeItem('userRole');
            localStorage.removeItem('rememberMe');
            
            // Redirect to login page
            window.location.href = '../index.html';
            
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to logout. Please try again.');
            hideLoading();
        }
    });
    
    // Initialize
    checkAuth();
}); 