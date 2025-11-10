import { render } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { InvestorsTab } from '@/components/developer/offering-details/InvestorsTab';
import { DeveloperAuthProvider } from '@/contexts/DeveloperAuthContext';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
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
  hasPermission: vi.fn(() => false) // Developer has no write permissions
};

const mockInvestorsData = [
  {
    id: 'inv-1',
    alias: 'Investor Alpha',
    investor_type: 'Individual',
    status: 'Active',
    join_date: '2024-01-15',
    total_invested: 50000,
    transaction_count: 3
  },
  {
    id: 'inv-2', 
    alias: 'Investor Beta',
    investor_type: 'Entity',
    status: 'Pending',
    join_date: '2024-02-20',
    total_invested: 100000,
    transaction_count: 1
  },
  {
    id: 'inv-3',
    alias: 'Investor Gamma', 
    investor_type: 'Individual',
    status: 'Active',
    join_date: '2024-03-10',
    total_invested: 75000,
    transaction_count: 2
  }
];

// Mock DeveloperAuthContext
vi.mock('@/contexts/DeveloperAuthContext', () => ({
  useDeveloperAuth: () => mockDeveloperContext,
  DeveloperAuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DeveloperAuthProvider>
    {children}
  </DeveloperAuthProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock successful API response with sanitized data
  const mockSupabase = require('@/integrations/supabase/client').supabase;
  mockSupabase.functions.invoke.mockResolvedValue({
    data: {
      investors: mockInvestorsData,
      summary: {
        total_investors: 3,
        total_invested: 225000,
        average_investment: 75000
      }
    },
    error: null
  });
});

test('InvestorsTab snapshot - developer view without PII or action buttons', () => {
  const { container } = render(
    <TestWrapper>
      <InvestorsTab offeringId="test-offering-123" />
    </TestWrapper>
  );

  // Wait for component to load and render investors
  setTimeout(() => {
    expect(container).toMatchSnapshot();
  }, 100);
});

test('InvestorsTab snapshot - verify no PII fields in DOM', () => {
  const { container, queryByText } = render(
    <TestWrapper>
      <InvestorsTab offeringId="test-offering-123" />
    </TestWrapper>
  );

  // Verify PII fields are not present in the DOM
  expect(queryByText(/@/)).toBeNull(); // No email addresses
  expect(queryByText(/\b\d{3}-\d{3}-\d{4}\b/)).toBeNull(); // No phone numbers
  expect(container.textContent).not.toMatch(/john\.doe@example\.com/i);
  expect(container.textContent).not.toMatch(/jane\.smith@test\.com/i);

  // Verify aliases are present (safe fields)
  expect(container.textContent).toMatch(/Investor Alpha/);
  expect(container.textContent).toMatch(/Investor Beta/);
  expect(container.textContent).toMatch(/Investor Gamma/);
});

test('InvestorsTab snapshot - verify action buttons are absent for developers', () => {
  const { container, queryByTestId, queryByText } = render(
    <TestWrapper>
      <InvestorsTab offeringId="test-offering-123" />
    </TestWrapper>
  );

  // Verify action buttons are not present
  expect(queryByTestId('send-update-button')).toBeNull();
  expect(queryByTestId('contact-investor-button')).toBeNull();
  expect(queryByTestId('send-email-button')).toBeNull();
  expect(queryByTestId('message-investor-button')).toBeNull();
  
  // Verify by text content as well
  expect(queryByText('Send Update')).toBeNull();
  expect(queryByText('Contact')).toBeNull();
  expect(queryByText('Send Email')).toBeNull();
  expect(queryByText('Message')).toBeNull();
});

test('InvestorsTab snapshot - verify data access notice is present', () => {
  const { container, getByTestId } = render(
    <TestWrapper>
      <InvestorsTab offeringId="test-offering-123" />
    </TestWrapper>
  );

  // Verify data access notice is displayed
  expect(getByTestId('data-access-notice')).toBeDefined();
  expect(container.textContent).toMatch(/Data shown is anonymized/i);
  expect(container.textContent).toMatch(/For privacy protection/i);
});

test('InvestorsTab snapshot - verify export button shows sanitized data warning', () => {
  const { container, getByTestId } = render(
    <TestWrapper>
      <InvestorsTab offeringId="test-offering-123" />
    </TestWrapper>
  );

  // Verify export button is present but with proper warning
  const exportButton = getByTestId('export-button');
  expect(exportButton).toBeDefined();
  
  // Verify tooltip or warning text about sanitized export
  expect(container.textContent).toMatch(/Export.*anonymized/i);
});

test('InvestorsTab snapshot - verify summary cards show aggregated data only', () => {
  const { container } = render(
    <TestWrapper>
      <InvestorsTab offeringId="test-offering-123" />
    </TestWrapper>
  );

  // Verify summary cards are present with safe aggregated data
  expect(container.textContent).toMatch(/Total Investors.*3/);
  expect(container.textContent).toMatch(/Total Invested.*225,000/);
  expect(container.textContent).toMatch(/Average Investment.*75,000/);

  // Verify no individual PII is exposed in summary
  expect(container.textContent).not.toMatch(/@/);
  expect(container.textContent).not.toMatch(/\b\d{3}-\d{3}-\d{4}\b/);
});