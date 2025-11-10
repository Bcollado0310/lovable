import { test, expect, Page } from '@playwright/test';

test.describe('Developer PII Exclusion E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock developer authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('developer-auth', JSON.stringify({
        user: { id: 'dev-user-123', role: 'developer' },
        session: { access_token: 'mock-dev-token' },
        organization: { id: 'org-123', name: 'Test Org' }
      }));
    });

    await page.goto('/dev/offerings/15d99d79-ff78-499b-b103-3e8864aa45f8');
  });

  test('should not display PII in Investors tab', async () => {
    await page.click('[data-testid="investors-tab"]');
    await page.waitForSelector('[data-testid="investors-list"]');

    // Check that PII fields are not visible anywhere
    await expect(page.locator('text=@')).toHaveCount(0); // No email addresses
    await expect(page.locator('text=/\\b\\d{3}-\\d{3}-\\d{4}\\b/')).toHaveCount(0); // No phone numbers
    await expect(page.locator('text=/\\b[A-Z][a-z]+ [A-Z][a-z]+\\b/')).toHaveCount(0); // No full names

    // Verify aliases are shown instead
    await expect(page.locator('[data-testid="investor-alias"]')).toBeVisible();
    
    // Check that Send Update and Contact buttons are not visible
    await expect(page.locator('[data-testid="send-update-button"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="contact-investor-button"]')).toHaveCount(0);
  });

  test('should not display PII in Investor Details dialog', async () => {
    await page.click('[data-testid="investors-tab"]');
    await page.waitForSelector('[data-testid="investors-list"]');
    
    // Click on first investor to open details
    await page.click('[data-testid="investor-card"]:first-child');
    await page.waitForSelector('[data-testid="investor-details-dialog"]');

    // Verify PII is not displayed
    const dialogContent = page.locator('[data-testid="investor-details-dialog"]');
    await expect(dialogContent.locator('text=@')).toHaveCount(0); // No emails
    await expect(dialogContent.locator('text=/\\b\\d{3}-\\d{3}-\\d{4}\\b/')).toHaveCount(0); // No phones
    
    // Verify safe fields are shown
    await expect(dialogContent.locator('[data-testid="investor-alias"]')).toBeVisible();
    await expect(dialogContent.locator('[data-testid="investor-type"]')).toBeVisible();
    await expect(dialogContent.locator('[data-testid="investor-status"]')).toBeVisible();

    // Check transaction history excludes PII
    const transactionRows = dialogContent.locator('[data-testid="transaction-row"]');
    if (await transactionRows.count() > 0) {
      await expect(transactionRows.first().locator('text=/\\d{4}.*\\d{4}/')).toHaveCount(0); // No account numbers
    }
  });

  test('should not display PII in export functionality', async () => {
    await page.click('[data-testid="investors-tab"]');
    await page.waitForSelector('[data-testid="export-button"]');

    // Mock the download to capture CSV content
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-button"]');
    const download = await downloadPromise;

    // Read the downloaded CSV content
    const csvContent = await download.createReadStream();
    let csvData = '';
    csvContent.on('data', chunk => csvData += chunk);
    await new Promise(resolve => csvContent.on('end', resolve));

    // Verify CSV excludes PII headers
    expect(csvData).not.toMatch(/email/i);
    expect(csvData).not.toMatch(/name/i);
    expect(csvData).not.toMatch(/phone/i);
    expect(csvData).not.toMatch(/address/i);

    // Verify CSV includes safe headers
    expect(csvData).toMatch(/alias/i);
    expect(csvData).toMatch(/investor_type/i);
    expect(csvData).toMatch(/status/i);
  });

  test('should not display PII in Updates tab', async () => {
    await page.click('[data-testid="updates-tab"]');
    await page.waitForSelector('[data-testid="updates-list"]');

    // Check that updates content doesn't contain PII
    const updateCards = page.locator('[data-testid="update-card"]');
    const count = await updateCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = updateCards.nth(i);
      const content = await card.textContent();
      
      // Check for email patterns
      expect(content).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      // Check for phone patterns
      expect(content).not.toMatch(/\b\d{3}-\d{3}-\d{4}\b/);
      // Check for SSN patterns
      expect(content).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/);
    }

    // Verify Send Update button is not available for developers
    await expect(page.locator('[data-testid="send-update-button"]')).toHaveCount(0);
  });

  test('should not display sensitive documents in Documents tab', async () => {
    await page.click('[data-testid="documents-tab"]');
    await page.waitForSelector('[data-testid="documents-list"]');

    // Check that sensitive document types are not displayed
    await expect(page.locator('text=KYC')).toHaveCount(0);
    await expect(page.locator('text=Investor Agreement')).toHaveCount(0);
    await expect(page.locator('text=Legal')).toHaveCount(0);
    await expect(page.locator('text=Signature Page')).toHaveCount(0);

    // Verify document metadata is sanitized
    const documentCards = page.locator('[data-testid="document-card"]');
    const count = await documentCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = documentCards.nth(i);
      const uploader = card.locator('[data-testid="document-uploader"]');
      
      if (await uploader.count() > 0) {
        const uploaderText = await uploader.textContent();
        expect(uploaderText).not.toMatch(/@/); // No email addresses
        expect(uploaderText).toMatch(/User|Staff|Admin/); // Generic roles only
      }
    }
  });

  test('should display data access notice for developers', async () => {
    await page.click('[data-testid="investors-tab"]');
    
    // Verify data access notice is displayed
    await expect(page.locator('[data-testid="data-access-notice"]')).toBeVisible();
    await expect(page.locator('text=Data shown is anonymized')).toBeVisible();
  });

  test('should not display contact/communication options', async () => {
    // Check across all tabs that communication options are hidden
    const tabs = ['investors-tab', 'updates-tab', 'documents-tab'];
    
    for (const tab of tabs) {
      await page.click(`[data-testid="${tab}"]`);
      await page.waitForTimeout(1000); // Wait for tab content to load
      
      // Verify communication buttons are not present
      await expect(page.locator('[data-testid="send-email-button"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="send-sms-button"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="contact-investor-button"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="message-investor-button"]')).toHaveCount(0);
    }
  });

  test('should crawl all sections without exposing PII', async () => {
    const sections = [
      { tab: 'overview-tab', testId: 'overview-content' },
      { tab: 'investors-tab', testId: 'investors-list' },
      { tab: 'documents-tab', testId: 'documents-list' },
      { tab: 'updates-tab', testId: 'updates-list' },
      { tab: 'media-tab', testId: 'media-list' },
      { tab: 'pricing-tab', testId: 'pricing-content' },
      { tab: 'settings-tab', testId: 'settings-content' }
    ];

    for (const section of sections) {
      await page.click(`[data-testid="${section.tab}"]`);
      await page.waitForSelector(`[data-testid="${section.testId}"]`, { timeout: 5000 });
      
      // Get all text content from the section
      const sectionContent = await page.locator(`[data-testid="${section.testId}"]`).textContent();
      
      // Verify no PII patterns are present
      expect(sectionContent).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/); // Email
      expect(sectionContent).not.toMatch(/\b\d{3}-\d{3}-\d{4}\b/); // Phone
      expect(sectionContent).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/); // SSN
      expect(sectionContent).not.toMatch(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/); // Credit card
    }
  });
});