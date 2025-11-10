import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Investor Endpoints - PII Exclusion Contract Tests', () => {
  let mockDeveloperSession: any;
  let mockAdminSession: any;
  let testOfferingId: string;
  let testInvestorId: string;

  beforeAll(async () => {
    // Mock developer session
    mockDeveloperSession = {
      user: { id: 'dev-user-123' },
      access_token: 'mock-dev-token'
    };

    // Mock admin session  
    mockAdminSession = {
      user: { id: 'admin-user-123' },
      access_token: 'mock-admin-token'
    };

    testOfferingId = '15d99d79-ff78-499b-b103-3e8864aa45f8';
    testInvestorId = 'test-investor-123';
  });

  describe('Developer API - PII Exclusion Tests', () => {
    beforeEach(() => {
      // Set developer session
      supabase.auth.getSession = () => Promise.resolve({ data: { session: mockDeveloperSession }, error: null });
    });

    it('should exclude PII from investor list endpoint', async () => {
      const { data, error } = await supabase.functions.invoke('developer-api', {
        body: {
          endpoint: 'offering-investors',
          offeringId: testOfferingId
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data?.investors?.length > 0) {
        const investor = data.investors[0];
        
        // Assert PII fields are absent
        expect(investor).not.toHaveProperty('email');
        expect(investor).not.toHaveProperty('name');
        expect(investor).not.toHaveProperty('phone');
        expect(investor).not.toHaveProperty('address');
        expect(investor).not.toHaveProperty('full_name');
        expect(investor).not.toHaveProperty('first_name');
        expect(investor).not.toHaveProperty('last_name');
        expect(investor).not.toHaveProperty('ssn');
        expect(investor).not.toHaveProperty('tax_id');
        
        // Assert safe fields are present
        expect(investor).toHaveProperty('id');
        expect(investor).toHaveProperty('alias');
        expect(investor).toHaveProperty('investor_type');
        expect(investor).toHaveProperty('status');
      }
    });

    it('should exclude PII from investor details endpoint', async () => {
      const { data, error } = await supabase.functions.invoke('developer-api', {
        body: {
          endpoint: 'investor-details',
          investorId: testInvestorId,
          offeringId: testOfferingId
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data?.investor) {
        const investor = data.investor;
        
        // Assert PII fields are absent
        expect(investor).not.toHaveProperty('email');
        expect(investor).not.toHaveProperty('name');
        expect(investor).not.toHaveProperty('phone');
        expect(investor).not.toHaveProperty('address');
        
        // Assert transaction history excludes PII
        if (data.transactions?.length > 0) {
          const transaction = data.transactions[0];
          expect(transaction).not.toHaveProperty('bank_account');
          expect(transaction).not.toHaveProperty('routing_number');
          expect(transaction).not.toHaveProperty('account_number');
        }
      }
    });

    it('should exclude PII from export endpoint and return sanitized CSV', async () => {
      const { data, error } = await supabase.functions.invoke('developer-api', {
        body: {
          endpoint: 'export-investors',
          offeringId: testOfferingId
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data?.csvData) {
        const csvContent = data.csvData;
        
        // Assert CSV headers exclude PII
        expect(csvContent).not.toMatch(/email/i);
        expect(csvContent).not.toMatch(/name/i);
        expect(csvContent).not.toMatch(/phone/i);
        expect(csvContent).not.toMatch(/address/i);
        expect(csvContent).not.toMatch(/ssn/i);
        
        // Assert CSV contains safe headers
        expect(csvContent).toMatch(/alias/i);
        expect(csvContent).toMatch(/investor_type/i);
        expect(csvContent).toMatch(/status/i);
      }
    });

    it('should exclude PII from search endpoint', async () => {
      const { data, error } = await supabase.functions.invoke('developer-api', {
        body: {
          endpoint: 'search-offering-investors',
          offeringId: testOfferingId,
          searchTerm: 'test'
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data?.investors?.length > 0) {
        const investor = data.investors[0];
        
        // Assert PII fields are absent from search results
        expect(investor).not.toHaveProperty('email');
        expect(investor).not.toHaveProperty('name');
        expect(investor).not.toHaveProperty('phone');
      }
    });

    it('should exclude PII from updates endpoint', async () => {
      const { data, error } = await supabase.functions.invoke('secure-developer-api', {
        body: {
          endpoint: 'offering-updates',
          offeringId: testOfferingId
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data?.updates?.length > 0) {
        const update = data.updates[0];
        
        // Assert update content is sanitized
        expect(update.content).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/); // Email regex
        expect(update.content).not.toMatch(/\b\d{3}-\d{3}-\d{4}\b/); // Phone regex
        
        // Assert author info is anonymized
        if (update.author) {
          expect(update.author).not.toHaveProperty('email');
          expect(update.author).not.toHaveProperty('phone');
        }
      }
    });

    it('should exclude sensitive documents from documents endpoint', async () => {
      const { data, error } = await supabase.functions.invoke('secure-developer-api', {
        body: {
          endpoint: 'offering-documents',
          offeringId: testOfferingId
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data?.documents?.length > 0) {
        data.documents.forEach((doc: any) => {
          // Assert sensitive document types are excluded
          expect(doc.type).not.toBe('kyc');
          expect(doc.type).not.toBe('investor_agreement');
          expect(doc.type).not.toBe('legal');
          expect(doc.type).not.toBe('signature_page');
          
          // Assert uploader info is sanitized
          if (doc.uploaded_by) {
            expect(doc.uploaded_by).not.toHaveProperty('email');
            expect(doc.uploaded_by).not.toHaveProperty('name');
          }
        });
      }
    });
  });

  describe('Admin API - PII Inclusion Tests', () => {
    beforeEach(() => {
      // Set admin session
      supabase.auth.getSession = () => Promise.resolve({ data: { session: mockAdminSession }, error: null });
    });

    it('should include PII for admin users', async () => {
      const { data, error } = await supabase.functions.invoke('developer-api', {
        body: {
          endpoint: 'offering-investors',
          offeringId: testOfferingId
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      if (data?.investors?.length > 0) {
        const investor = data.investors[0];
        
        // Assert PII fields are present for admins
        expect(investor).toHaveProperty('email');
        expect(investor).toHaveProperty('name');
        expect(investor).toHaveProperty('phone');
      }
    });
  });

  describe('Role-based Access Control', () => {
    it('should reject developer access to admin-only endpoints', async () => {
      supabase.auth.getSession = () => Promise.resolve({ data: { session: mockDeveloperSession }, error: null });

      const { data, error } = await supabase.functions.invoke('developer-api', {
        body: {
          endpoint: 'pii-audit-logs',
          offeringId: testOfferingId
        }
      });

      expect(error).toBeDefined();
      expect(data?.error).toMatch(/insufficient permissions|unauthorized/i);
    });

    it('should allow admin access to all endpoints', async () => {
      supabase.auth.getSession = () => Promise.resolve({ data: { session: mockAdminSession }, error: null });

      const { data, error } = await supabase.functions.invoke('developer-api', {
        body: {
          endpoint: 'pii-audit-logs',
          offeringId: testOfferingId
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});