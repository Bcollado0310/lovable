import { render } from '@testing-library/react';
import { expect, test, vi, beforeEach, describe } from 'vitest';
import { InvestorsTab } from '@/components/developer/offering-details/InvestorsTab';
import { UpdatesTab } from '@/components/developer/offering-details/UpdatesTab';
import { DocumentsTab } from '@/components/developer/offering-details/DocumentsTab';
import { DeveloperAuthProvider } from '@/contexts/DeveloperAuthContext';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn()
    }
  }
}));

const mockDeveloperContext = {
  user: { id: 'dev-user-123' },
  session: { access_token: 'mock-token' },
  loading: false,
  organization: { id: 'org-123', name: 'Test Org' },
  userRole: 'developer' as const,
  signOut: vi.fn(),
  hasPermission: vi.fn((permission: string) => {
    // Developers have no write permissions
    return permission === 'read';
  })
};

const mockAdminContext = {
  user: { id: 'admin-user-123' },
  session: { access_token: 'mock-token' },
  loading: false,
  organization: { id: 'org-123', name: 'Test Org' },
  userRole: 'admin' as const,
  signOut: vi.fn(),
  hasPermission: vi.fn(() => true) // Admins have all permissions
};

// Mock DeveloperAuthContext with ability to switch contexts
let currentContext: any = mockDeveloperContext;
vi.mock('@/contexts/DeveloperAuthContext', () => ({
  useDeveloperAuth: () => currentContext,
  DeveloperAuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DeveloperAuthProvider>
    {children}
  </DeveloperAuthProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  currentContext = mockDeveloperContext;
  
  // Mock API responses
  const mockSupabase = require('@/integrations/supabase/client').supabase;
  mockSupabase.functions.invoke.mockResolvedValue({
    data: {
      investors: [],
      updates: [],
      documents: [],
      summary: { total_investors: 0, total_invested: 0, average_investment: 0 }
    },
    error: null
  });
});

describe('Developer UI Element Restrictions', () => {
  test('Send Update button should not render for developers in InvestorsTab', () => {
    const { queryByRole, queryByTestId } = render(
      <TestWrapper>
        <InvestorsTab offeringId="test-offering" />
      </TestWrapper>
    );

    expect(queryByRole('button', { name: /send update/i })).toBeNull();
    expect(queryByTestId('send-update-button')).toBeNull();
  });

  test('Contact button should not render for developers in InvestorsTab', () => {
    const { queryByRole, queryByTestId } = render(
      <TestWrapper>
        <InvestorsTab offeringId="test-offering" />
      </TestWrapper>
    );

    expect(queryByRole('button', { name: /contact/i })).toBeNull();
    expect(queryByTestId('contact-investor-button')).toBeNull();
  });

  test('Create Update button should not render for developers in UpdatesTab', () => {
    const { queryByRole, queryByTestId } = render(
      <TestWrapper>
        <UpdatesTab offeringId="test-offering" />
      </TestWrapper>
    );

    expect(queryByRole('button', { name: /create update/i })).toBeNull();
    expect(queryByTestId('create-update-button')).toBeNull();
  });

  test('Edit/Delete buttons should not render for developers in UpdatesTab', () => {
    const { queryByRole, queryByTestId } = render(
      <TestWrapper>
        <UpdatesTab offeringId="test-offering" />
      </TestWrapper>
    );

    expect(queryByRole('button', { name: /edit/i })).toBeNull();
    expect(queryByRole('button', { name: /delete/i })).toBeNull();
    expect(queryByTestId('edit-update-button')).toBeNull();
    expect(queryByTestId('delete-update-button')).toBeNull();
  });

  test('Upload Document button should not render for developers in DocumentsTab', () => {
    const { queryByRole, queryByTestId } = render(
      <TestWrapper>
        <DocumentsTab offering={{ id: "test-offering" } as any} />
      </TestWrapper>
    );

    expect(queryByRole('button', { name: /upload/i })).toBeNull();
    expect(queryByTestId('upload-document-button')).toBeNull();
  });

  test('Admin buttons should render for admin users', () => {
    currentContext = { ...mockAdminContext };
    
    const { queryByRole } = render(
      <TestWrapper>
        <UpdatesTab offeringId="test-offering" />
      </TestWrapper>
    );

    // Admin should see create update button
    expect(queryByRole('button', { name: /create update/i })).not.toBeNull();
  });

  test('Message/Email investor buttons should not render for developers', () => {
    const { queryByRole, queryByTestId } = render(
      <TestWrapper>
        <InvestorsTab offeringId="test-offering" />
      </TestWrapper>
    );

    expect(queryByRole('button', { name: /message/i })).toBeNull();
    expect(queryByRole('button', { name: /email/i })).toBeNull();
    expect(queryByTestId('message-investor-button')).toBeNull();
    expect(queryByTestId('email-investor-button')).toBeNull();
  });

  test('Data access notice should be visible for developers', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <InvestorsTab offeringId="test-offering" />
      </TestWrapper>
    );

    expect(getByTestId('data-access-notice')).toBeInTheDocument();
    expect(getByTestId('data-access-notice')).toHaveTextContent(/data shown is anonymized/i);
  });

  test('Export button should show sanitized data warning for developers', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <InvestorsTab offeringId="test-offering" />
      </TestWrapper>
    );

    const exportButton = getByTestId('export-button');
    expect(exportButton).toBeInTheDocument();
    
    // Should have tooltip or aria-label indicating sanitized export
    expect(exportButton).toHaveAttribute('aria-label', expect.stringMatching(/anonymized|sanitized/i));
  });

  test('Sensitive document categories should not be visible to developers', () => {
    const mockSupabase = require('@/integrations/supabase/client').supabase;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        documents: [
          { id: '1', type: 'kyc', title: 'KYC Document' },
          { id: '2', type: 'investor_agreement', title: 'Investor Agreement' },
          { id: '3', type: 'legal', title: 'Legal Document' },
          { id: '4', type: 'public', title: 'Public Document' }
        ]
      },
      error: null
    });

    const { queryByText } = render(
      <TestWrapper>
        <DocumentsTab offering={{ id: "test-offering" } as any} />
      </TestWrapper>
    );

    // Sensitive documents should not be displayed
    expect(queryByText('KYC Document')).toBeNull();
    expect(queryByText('Investor Agreement')).toBeNull();
    expect(queryByText('Legal Document')).toBeNull();
    
    // Public documents should be displayed
    expect(queryByText('Public Document')).not.toBeNull();
  });
});

describe('PII Exclusion in UI Components', () => {
  test('Investor cards should not display email addresses', () => {
    const mockSupabase = require('@/integrations/supabase/client').supabase;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        investors: [
          {
            id: 'inv-1',
            alias: 'Investor Alpha',
            investor_type: 'Individual',
            status: 'Active'
          }
        ]
      },
      error: null
    });

    const { container } = render(
      <TestWrapper>
        <InvestorsTab offeringId="test-offering" />
      </TestWrapper>
    );

    // Should not contain any email patterns
    expect(container.textContent).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  });

  test('Update content should not display phone numbers', () => {
    const mockSupabase = require('@/integrations/supabase/client').supabase;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        updates: [
          {
            id: 'update-1',
            title: 'Project Update',
            content: 'Contact our office for more information.',
            status: 'published'
          }
        ]
      },
      error: null
    });

    const { container } = render(
      <TestWrapper>
        <UpdatesTab offeringId="test-offering" />
      </TestWrapper>
    );

    // Should not contain any phone number patterns
    expect(container.textContent).not.toMatch(/\b\d{3}-\d{3}-\d{4}\b/);
    expect(container.textContent).not.toMatch(/\(\d{3}\)\s?\d{3}-\d{4}/);
  });

  test('Document metadata should not display uploader PII', () => {
    const mockSupabase = require('@/integrations/supabase/client').supabase;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: {
        documents: [
          {
            id: 'doc-1',
            title: 'Public Document',
            type: 'public',
            uploaded_by: 'Staff Member',
            file_name: 'document-abc123.pdf'
          }
        ]
      },
      error: null
    });

    const { container } = render(
      <TestWrapper>
        <DocumentsTab offering={{ id: "test-offering" } as any} />
      </TestWrapper>
    );

    // Should show generic uploader info, not PII
    expect(container.textContent).toMatch(/Staff Member/);
    expect(container.textContent).not.toMatch(/@/);
    
    // File names should be sanitized
    expect(container.textContent).not.toMatch(/john.*doe/i);
  });
});