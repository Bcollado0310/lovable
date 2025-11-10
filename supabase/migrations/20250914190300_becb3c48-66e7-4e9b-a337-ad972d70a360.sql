-- Insert sample properties
INSERT INTO public.properties (
    title, description, address, city, country, property_type, property_status,
    total_value, target_funding, current_funding, minimum_investment,
    expected_annual_return, rental_yield, risk_rating, images,
    funding_deadline, completion_date
) VALUES 
(
    'Luxury Downtown Condo',
    'Prime downtown condominium with city views and modern amenities. Located in the heart of the financial district with easy access to transit.',
    '123 Financial Street',
    'New York',
    'United States',
    'residential',
    'funding',
    2500000.00,
    2000000.00,
    1200000.00,
    10000.00,
    8.50,
    4.2,
    3,
    ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500'],
    '2024-12-31 23:59:59+00',
    '2025-06-30 23:59:59+00'
),
(
    'Modern Office Complex',
    'State-of-the-art office building with sustainable features and premium location in the business district.',
    '456 Business Ave',
    'San Francisco',
    'United States',
    'commercial',
    'available',
    5000000.00,
    4000000.00,
    500000.00,
    25000.00,
    12.0,
    6.8,
    4,
    ARRAY['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500'],
    '2024-11-30 23:59:59+00',
    '2025-08-15 23:59:59+00'
),
(
    'Residential Apartment Complex',
    'Multi-unit residential complex in growing suburban area with excellent schools and amenities.',
    '789 Suburban Lane',
    'Austin',
    'United States',
    'residential',
    'fully_funded',
    3200000.00,
    3200000.00,
    3200000.00,
    5000.00,
    7.8,
    5.5,
    2,
    ARRAY['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500'],
    '2024-09-15 23:59:59+00',
    '2025-03-30 23:59:59+00'
),
(
    'Industrial Warehouse',
    'Large distribution center with modern logistics capabilities and strategic location near major highways.',
    '321 Logistics Drive',
    'Chicago',
    'United States',
    'industrial',
    'available',
    8000000.00,
    6000000.00,
    800000.00,
    50000.00,
    9.2,
    7.1,
    5,
    ARRAY['https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=500'],
    '2025-01-31 23:59:59+00',
    '2025-09-30 23:59:59+00'
);

-- Get the admin user ID (assuming the first admin user)
DO $$
DECLARE
    admin_user_id UUID;
    property_ids UUID[];
BEGIN
    -- Get admin user ID
    SELECT user_id INTO admin_user_id 
    FROM public.user_roles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- Get property IDs
    SELECT ARRAY(SELECT id FROM public.properties ORDER BY created_at LIMIT 4) INTO property_ids;
    
    -- Only proceed if we have an admin user
    IF admin_user_id IS NOT NULL AND array_length(property_ids, 1) >= 4 THEN
        -- Insert sample investments for the admin user
        INSERT INTO public.investments (
            user_id, property_id, amount_invested, shares_owned, 
            investment_status, current_value, total_returns
        ) VALUES 
        (
            admin_user_id, property_ids[1], 50000.00, 0.02, 
            'active', 55000.00, 5000.00
        ),
        (
            admin_user_id, property_ids[2], 100000.00, 0.025, 
            'active', 108000.00, 8000.00
        ),
        (
            admin_user_id, property_ids[3], 25000.00, 0.0078125, 
            'active', 27500.00, 2500.00
        );
        
        -- Insert sample transactions
        INSERT INTO public.transactions (
            user_id, property_id, transaction_type, amount, description, processed_at
        ) VALUES 
        (
            admin_user_id, property_ids[1], 'investment', 50000.00, 
            'Initial investment in Luxury Downtown Condo', NOW()
        ),
        (
            admin_user_id, property_ids[2], 'investment', 100000.00, 
            'Initial investment in Modern Office Complex', NOW()
        ),
        (
            admin_user_id, property_ids[3], 'investment', 25000.00, 
            'Initial investment in Residential Apartment Complex', NOW()
        ),
        (
            admin_user_id, property_ids[1], 'dividend', 2100.00, 
            'Q3 2024 dividend payment', NOW()
        ),
        (
            admin_user_id, property_ids[2], 'dividend', 3200.00, 
            'Q3 2024 dividend payment', NOW()
        ),
        (
            admin_user_id, property_ids[3], 'dividend', 1100.00, 
            'Q3 2024 dividend payment', NOW()
        );
        
        -- Insert/update portfolio summary
        INSERT INTO public.portfolios (
            user_id, total_invested, current_value, total_returns, 
            monthly_income, properties_count
        ) VALUES (
            admin_user_id, 175000.00, 190500.00, 15500.00, 
            2200.00, 3
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            total_invested = EXCLUDED.total_invested,
            current_value = EXCLUDED.current_value,
            total_returns = EXCLUDED.total_returns,
            monthly_income = EXCLUDED.monthly_income,
            properties_count = EXCLUDED.properties_count,
            last_calculated = NOW();
    END IF;
END $$;