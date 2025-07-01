-- SJA Foundation Investment Management Platform
-- Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'client',
    referrer_id UUID REFERENCES users(id),
    level INT NOT NULL DEFAULT 1,
    photo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- KYC Documents Table
CREATE TABLE kyc_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    aadhaar VARCHAR(255),
    pan VARCHAR(255),
    passport VARCHAR(255),
    signature VARCHAR(255),
    address_proof VARCHAR(255),
    passbook VARCHAR(255),
    profile_photo VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE kyc_docs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kyc_docs
CREATE POLICY "Users can view their own KYC docs" ON kyc_docs
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own KYC docs" ON kyc_docs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own KYC docs" ON kyc_docs
    FOR UPDATE USING (
        auth.uid() = user_id AND 
        status = 'pending'
    );
    
CREATE POLICY "Admins can view all KYC docs" ON kyc_docs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can update all KYC docs" ON kyc_docs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Investments Table
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INT NOT NULL, -- in months
    interest_rate DECIMAL(5, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    maturity_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investments
CREATE POLICY "Users can view their own investments" ON investments
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own investments" ON investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Admins can view all investments" ON investments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can update all investments" ON investments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Wallets Table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Admins can view all wallets" ON wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can update all wallets" ON wallets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- deposit, withdraw, investment, commission
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, rejected
    payment_method VARCHAR(50),
    reference VARCHAR(255),
    proof_url VARCHAR(255),
    withdrawal_type VARCHAR(20), -- regular, emergency
    emergency_reason TEXT,
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    admin_notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can update all transactions" ON transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Nominees Table
CREATE TABLE nominees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    relation VARCHAR(50) NOT NULL,
    blood_group VARCHAR(10),
    phone VARCHAR(20) NOT NULL,
    photo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nominees
CREATE POLICY "Users can view their own nominees" ON nominees
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own nominees" ON nominees
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own nominees" ON nominees
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Admins can view all nominees" ON nominees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Referrals Table
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_id UUID NOT NULL REFERENCES users(id),
    level INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id)
);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id);
    
CREATE POLICY "Admins can view all referrals" ON referrals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can insert referrals" ON referrals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can update referrals" ON referrals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Earnings Table
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    source VARCHAR(50) NOT NULL, -- investment_interest, referral_commission
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50), -- level1, level2, etc. for referrals
    source_id UUID, -- investment_id or referral_id
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for earnings
CREATE POLICY "Users can view their own earnings" ON earnings
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Admins can view all earnings" ON earnings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can insert earnings" ON earnings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- transaction, kyc, referral, system
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
    
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Admins can view all notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
CREATE POLICY "Admins can update notifications" ON notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create a function to handle new user registrations
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO users (id, name, email, phone, role)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'client'
    );
    
    -- Create wallet for the user
    INSERT INTO wallets (user_id, balance)
    VALUES (NEW.id, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a function to handle referrals
CREATE OR REPLACE FUNCTION process_referral(
    referrer_id UUID,
    referred_id UUID
)
RETURNS VOID AS $$
DECLARE
    current_level INT := 1;
    current_referrer UUID := referrer_id;
    next_referrer UUID;
BEGIN
    -- Insert direct referral
    INSERT INTO referrals (referrer_id, referred_id, level)
    VALUES (current_referrer, referred_id, current_level);
    
    -- Process up to 10 levels of referrals
    WHILE current_level < 10 AND current_referrer IS NOT NULL LOOP
        -- Get the referrer's referrer
        SELECT r.referrer_id INTO next_referrer
        FROM users r
        WHERE r.id = current_referrer;
        
        -- If there's a next level referrer, add the relationship
        IF next_referrer IS NOT NULL THEN
            current_level := current_level + 1;
            current_referrer := next_referrer;
            
            -- Insert the next level referral
            INSERT INTO referrals (referrer_id, referred_id, level)
            VALUES (current_referrer, referred_id, current_level);
        ELSE
            -- No more referrers in the chain
            EXIT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to calculate investment maturity
CREATE OR REPLACE FUNCTION calculate_investment_maturity()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate maturity date based on start date and duration
    NEW.maturity_date := NEW.start_date + (NEW.duration * INTERVAL '1 month');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate maturity date on investment creation
CREATE TRIGGER on_investment_created
BEFORE INSERT ON investments
FOR EACH ROW EXECUTE FUNCTION calculate_investment_maturity(); 