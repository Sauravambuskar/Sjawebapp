# SJA Foundation Investment Management Platform

A web-based investment management platform for SJA Foundation built with HTML, CSS, JavaScript, Bootstrap 5, and Supabase.

## Features

- **User Authentication**: Secure email/password authentication with role-based access
- **Dashboard**: Separate dashboards for clients and administrators
- **KYC Management**: Document upload and verification system
- **Investment Management**: Create and track investments with interest calculations
- **Wallet System**: Manage deposits and withdrawals
- **Multi-Level Referral System**: 11-level MLM structure with commission tracking
- **Real-time Notifications**: Alerts for transactions, KYC status, and more
- **Responsive Design**: Mobile-friendly interface with light/dark mode toggle

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Bootstrap 5
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Charts**: Chart.js
- **Tables**: DataTables
- **Icons**: Font Awesome

## Project Structure

```
sjacr/
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── client-dashboard.js
│   │   ├── admin-dashboard.js
│   │   ├── config.js
│   │   └── theme.js
│   └── img/
├── components/
├── pages/
│   ├── admin-dashboard.html
│   └── client-dashboard.html
├── auth/
├── index.html
└── README.md
```

## Supabase Database Schema

### Tables

1. **users**: id, name, email, phone, role, referrer_id, level, photo, created_at
2. **kyc_docs**: user_id, aadhaar, pan, passport, signature, address_proof, passbook, profile_photo
3. **investments**: id, user_id, type, amount, start_date, duration, interest_rate, status
4. **wallets**: id, user_id, balance, last_updated
5. **transactions**: id, user_id, type (deposit/withdraw), amount, status, created_at
6. **nominees**: user_id, name, dob, relation, blood_group, phone, photo
7. **referrals**: referrer_id, referred_id, level, created_at
8. **earnings**: user_id, source, amount, type, date
9. **notifications**: user_id, title, message, type, read_status, created_at, expires_at

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/sja-foundation-platform.git
cd sja-foundation-platform
```

### 2. Set up Supabase
1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the SQL commands from `supabase_schema.sql`
3. Create a storage bucket named `kyc_documents` with public access
4. Create a storage bucket named `payment_proofs` with public access

### 3. Configure the application
1. Update the Supabase configuration in `assets/js/config.js` with your project URL and anon key
2. The default configuration is already set with the provided keys

### 4. Install dependencies and run locally
```bash
npm install
npm start
```

### 5. Access the application
- Open your browser and navigate to `http://localhost:3000`
- Default admin credentials: admin@sjafoundation.com / password123 (change this in production)
- Default client credentials: client@sjafoundation.com / password123 (for testing only)

## User Roles

- **Client**: Regular users who can make investments, refer others, and manage their account
- **Admin**: Platform administrators who can manage users, approve KYC, handle transactions, etc.

## Multi-Level Referral System

The platform implements an 11-level MLM structure with the following commission rates:

- Level 1: ₹1L–₹20L — ₹250 (0.25%)
- Level 2: ₹30L — ₹370 (0.37%)
- ...
- Level 9: ₹1CR — ₹2000 (2%)
- Level 10+: Co-Director, Director, MD, CMD (admin-controlled)

## Investment Rules

- Lock-in period: 11 months
- Regular withdrawal: 10% of investment with 3% penalty
- Emergency withdrawal: Requires admin approval with justification

## License

Proprietary - All rights reserved

## Contact

For any inquiries, please contact SJA Foundation. #   S j a w e b a p p 
 
 