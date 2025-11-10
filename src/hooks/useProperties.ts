import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  property_type: string;
  property_status: string;
  total_value: number;
  target_funding: number;
  current_funding: number;
  minimum_investment: number;
  expected_annual_return: number;
  rental_yield?: number;
  risk_rating: number;
  images?: string[];
  funding_deadline?: string;
  completion_date?: string;
  created_at: string;
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockProperties: Property[] = [
        {
          id: '1',
          title: 'The Plaza Residences',
          description: 'Luxury high-rise with premium amenities in downtown financial district. Class A+ building with 95% occupancy and strong tenant base.',
          address: '425 Park Avenue',
          city: 'New York',
          country: 'United States',
          property_type: 'Multifamily',
          property_status: 'funding',
          total_value: 125000000,
          target_funding: 35000000,
          current_funding: 28500000,
          minimum_investment: 50000,
          expected_annual_return: 14.5,
          rental_yield: 6.2,
          risk_rating: 4,
          images: [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
          ],
          funding_deadline: '2025-03-15',
          completion_date: '2025-06-01',
          created_at: '2024-12-01T10:00:00Z'
        },
        {
          id: '2',
          title: 'Sunset Industrial Complex',
          description: 'Modern warehouse facility with last-mile delivery positioning. Recently renovated with green energy systems and flexible tenant spaces.',
          address: '1200 Commerce Boulevard',
          city: 'Los Angeles',
          country: 'United States',
          property_type: 'Industrial',
          property_status: 'funded',
          total_value: 45000000,
          target_funding: 15000000,
          current_funding: 15000000,
          minimum_investment: 25000,
          expected_annual_return: 12.8,
          rental_yield: 7.5,
          risk_rating: 3,
          images: [
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
            'https://images.unsplash.com/photo-1565515636369-2b4a7416c999?w=800'
          ],
          funding_deadline: '2024-11-30',
          completion_date: '2024-12-15',
          created_at: '2024-10-15T14:30:00Z'
        },
        {
          id: '3',
          title: 'Heritage Office Tower',
          description: 'Prime CBD office space with Fortune 500 tenants. Recently upgraded with smart building technology and LEED Gold certification.',
          address: '800 Main Street',
          city: 'Chicago',
          country: 'United States',
          property_type: 'Office',
          property_status: 'funding',
          total_value: 85000000,
          target_funding: 25000000,
          current_funding: 12300000,
          minimum_investment: 100000,
          expected_annual_return: 11.2,
          rental_yield: 5.8,
          risk_rating: 2,
          images: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
            'https://images.unsplash.com/photo-1565515636369-2b4a7416c999?w=800',
            'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800'
          ],
          funding_deadline: '2025-04-01',
          completion_date: '2025-07-15',
          created_at: '2024-11-20T09:15:00Z'
        },
        {
          id: '4',
          title: 'Marina Bay Retail Plaza',
          description: 'High-traffic retail center anchored by major grocery chain. Stable cash flows with diverse tenant mix and expansion potential.',
          address: '2500 Ocean Drive',
          city: 'Miami',
          country: 'United States',
          property_type: 'Retail',
          property_status: 'funding',
          total_value: 32000000,
          target_funding: 12000000,
          current_funding: 8900000,
          minimum_investment: 15000,
          expected_annual_return: 13.7,
          rental_yield: 8.1,
          risk_rating: 5,
          images: [
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
            'https://images.unsplash.com/photo-1570126618953-d437176e8c79?w=800'
          ],
          funding_deadline: '2025-02-28',
          completion_date: '2025-05-01',
          created_at: '2024-11-10T16:45:00Z'
        },
        {
          id: '5',
          title: 'Austin Tech Campus',
          description: 'Purpose-built technology campus in rapidly growing market. Pre-leased to established tech companies with long-term agreements.',
          address: '5000 Innovation Parkway',
          city: 'Austin',
          country: 'United States',
          property_type: 'Office',
          property_status: 'development',
          total_value: 95000000,
          target_funding: 40000000,
          current_funding: 5200000,
          minimum_investment: 75000,
          expected_annual_return: 16.3,
          rental_yield: 4.9,
          risk_rating: 6,
          images: [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'
          ],
          funding_deadline: '2025-06-30',
          completion_date: '2026-12-31',
          created_at: '2024-12-05T11:20:00Z'
        },
        {
          id: '6',
          title: 'Phoenix Logistics Hub',
          description: 'Strategic distribution center serving Southwest markets. Located near major transportation corridors with rail access.',
          address: '7500 Interstate Boulevard',
          city: 'Phoenix',
          country: 'United States',
          property_type: 'Industrial',
          property_status: 'funding',
          total_value: 28000000,
          target_funding: 8500000,
          current_funding: 6100000,
          minimum_investment: 20000,
          expected_annual_return: 12.1,
          rental_yield: 7.8,
          risk_rating: 3,
          images: [
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
          ],
          funding_deadline: '2025-03-31',
          completion_date: '2025-08-15',
          created_at: '2024-11-25T13:10:00Z'
        },
        {
          id: '7',
          title: 'Garden District Apartments',
          description: 'Historic renovation project transforming vintage building into luxury residences. Prime location with strong rental demand.',
          address: '1850 Magazine Street',
          city: 'New Orleans',
          country: 'United States',
          property_type: 'Multifamily',
          property_status: 'development',
          total_value: 18000000,
          target_funding: 7200000,
          current_funding: 2800000,
          minimum_investment: 30000,
          expected_annual_return: 15.2,
          rental_yield: 6.9,
          risk_rating: 7,
          images: [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
          ],
          funding_deadline: '2025-05-15',
          completion_date: '2026-03-30',
          created_at: '2024-11-30T08:30:00Z'
        },
        {
          id: '8',
          title: 'Seattle Waterfront Hotel',
          description: 'Boutique hotel development in prime waterfront location. Strong tourism fundamentals and corporate travel demand.',
          address: '99 Alaskan Way',
          city: 'Seattle',
          country: 'United States',
          property_type: 'Hospitality',
          property_status: 'funding',
          total_value: 75000000,
          target_funding: 30000000,
          current_funding: 18600000,
          minimum_investment: 100000,
          expected_annual_return: 13.9,
          rental_yield: 5.5,
          risk_rating: 8,
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800'
          ],
          funding_deadline: '2025-04-15',
          completion_date: '2026-06-01',
          created_at: '2024-12-03T15:45:00Z'
        },
        {
          id: '9',
          title: 'Denver Mountain View',
          description: 'Mixed-use development combining retail, office, and residential. Located in fast-growing suburban market with mountain views.',
          address: '3200 Cherry Creek Drive',
          city: 'Denver',
          country: 'United States',
          property_type: 'Mixed-Use',
          property_status: 'development',
          total_value: 140000000,
          target_funding: 55000000,
          current_funding: 8900000,
          minimum_investment: 125000,
          expected_annual_return: 17.1,
          rental_yield: 4.2,
          risk_rating: 9,
          images: [
            'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
          ],
          funding_deadline: '2025-08-31',
          completion_date: '2027-12-31',
          created_at: '2024-12-07T12:00:00Z'
        },
        {
          id: '10',
          title: 'Boston Medical Plaza',
          description: 'Medical office building serving growing healthcare market. Stable tenant base with long-term leases and expansion opportunities.',
          address: '450 Longwood Avenue',
          city: 'Boston',
          country: 'United States',
          property_type: 'Healthcare',
          property_status: 'funding',
          total_value: 52000000,
          target_funding: 18000000,
          current_funding: 14200000,
          minimum_investment: 40000,
          expected_annual_return: 10.8,
          rental_yield: 6.7,
          risk_rating: 2,
          images: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
          ],
          funding_deadline: '2025-02-15',
          completion_date: '2025-06-30',
          created_at: '2024-11-18T10:15:00Z'
        }
      ];

      setProperties(mockProperties);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const refreshProperties = () => {
    fetchProperties();
  };

  return {
    properties,
    loading,
    error,
    refreshProperties
  };
}