-- Create enum for property types
CREATE TYPE public.property_type AS ENUM ('residential', 'commercial', 'mixed_use', 'industrial');

-- Create enum for property status
CREATE TYPE public.property_status AS ENUM ('available', 'funding', 'fully_funded', 'completed');

-- Create enum for investment status
CREATE TYPE public.investment_status AS ENUM ('active', 'completed', 'cancelled');

-- Create enum for transaction types
CREATE TYPE public.transaction_type AS ENUM ('investment', 'dividend', 'capital_gain', 'fee', 'withdrawal');

-- Properties table
CREATE TABLE public.properties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    property_type property_type NOT NULL DEFAULT 'residential',
    property_status property_status NOT NULL DEFAULT 'available',
    total_value DECIMAL(15,2) NOT NULL,
    target_funding DECIMAL(15,2) NOT NULL,
    current_funding DECIMAL(15,2) NOT NULL DEFAULT 0,
    minimum_investment DECIMAL(15,2) NOT NULL DEFAULT 1000,
    expected_annual_return DECIMAL(5,2) NOT NULL,
    rental_yield DECIMAL(5,2),
    risk_rating INTEGER CHECK (risk_rating >= 1 AND risk_rating <= 10),
    images TEXT[],
    documents TEXT[],
    funding_deadline TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Investments table
CREATE TABLE public.investments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    amount_invested DECIMAL(15,2) NOT NULL,
    shares_owned DECIMAL(10,6) NOT NULL,
    investment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    investment_status investment_status NOT NULL DEFAULT 'active',
    current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_returns DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portfolios table (aggregated data for performance)
CREATE TABLE public.portfolios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    total_invested DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_returns DECIMAL(15,2) NOT NULL DEFAULT 0,
    monthly_income DECIMAL(15,2) NOT NULL DEFAULT 0,
    properties_count INTEGER NOT NULL DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Properties policies (viewable by all authenticated users for browsing)
CREATE POLICY "Properties are viewable by authenticated users" 
ON public.properties 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can manage properties" 
ON public.properties 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Investments policies (users can only see their own)
CREATE POLICY "Users can view their own investments" 
ON public.investments 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create investments" 
ON public.investments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments" 
ON public.investments 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Transactions policies
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Portfolios policies
CREATE POLICY "Users can view their own portfolio" 
ON public.portfolios 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create/update their portfolio" 
ON public.portfolios 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all portfolios" 
ON public.portfolios 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create update triggers
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_investments_updated_at
    BEFORE UPDATE ON public.investments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Add indexes for performance
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_investments_property_id ON public.investments(property_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_investment_id ON public.transactions(investment_id);
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);