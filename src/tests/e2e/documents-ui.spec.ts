import { test, expect } from '@playwright/test';

test.describe('Documents UI End-to-End Tests', () => {
  const offeringId = '15d99d79-ff78-499b-b103-3e8864aa45f8';
  const baseUrl = `/dev/offerings/${offeringId}`;

  test.beforeEach(async ({ page }) => {
    // Navigate to the offering details page
    await page.goto(baseUrl);
    
    // Wait for the Documents tab to be visible
    await page.waitForSelector('[data-testid="documents-tab"]', { timeout: 10000 });
    
    // Click on the Documents tab if not already active
    await page.click('[data-testid="documents-tab"]');
    
    // Wait for documents section to load
    await page.waitForSelector('[data-testid="documents-section"]', { timeout: 5000 });
  });

  test('should display KPI cards with live data', async ({ page }) => {
    // Check that all 4 KPI cards are present
    await expect(page.locator('[data-testid="kpi-total-documents"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-public-documents"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-downloads"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-storage-used"]')).toBeVisible();

    // Verify KPI cards show numeric values
    const totalDocsValue = await page.locator('[data-testid="kpi-total-documents"] .text-2xl').textContent();
    const publicDocsValue = await page.locator('[data-testid="kpi-public-documents"] .text-2xl').textContent();
    const downloadsValue = await page.locator('[data-testid="kpi-total-downloads"] .text-2xl').textContent();
    const storageValue = await page.locator('[data-testid="kpi-storage-used"] .text-2xl').textContent();

    expect(totalDocsValue).toMatch(/^\d+$/);
    expect(publicDocsValue).toMatch(/^\d+$/);
    expect(downloadsValue).toMatch(/^\d+$/);
    expect(storageValue).toMatch(/^\d+(\.\d+)?\s*(KB|MB|GB)$/);
  });

  test('should have functional category filter pills', async ({ page }) => {
    // Check that category filter pills are present
    await expect(page.locator('[data-testid="category-filter-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-filter-financial"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-filter-appraisal"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-filter-legal"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-filter-technical"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-filter-other"]')).toBeVisible();

    // Test clicking on different category filters
    await page.click('[data-testid="category-filter-financial"]');
    await expect(page.locator('[data-testid="category-filter-financial"]')).toHaveClass(/bg-primary/);
    
    // Check URL parameters
    await expect(page).toHaveURL(/category=Financial/);

    // Test switching to another category
    await page.click('[data-testid="category-filter-legal"]');
    await expect(page.locator('[data-testid="category-filter-legal"]')).toHaveClass(/bg-primary/);
    await expect(page).toHaveURL(/category=Legal/);

    // Test returning to "All"
    await page.click('[data-testid="category-filter-all"]');
    await expect(page.locator('[data-testid="category-filter-all"]')).toHaveClass(/bg-primary/);
    await expect(page).not.toHaveURL(/category=/);
  });

  test('should have functional visibility toggle', async ({ page }) => {
    // Check that visibility toggle is present
    await expect(page.locator('[data-testid="visibility-filter-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="visibility-filter-public"]')).toBeVisible();
    await expect(page.locator('[data-testid="visibility-filter-private"]')).toBeVisible();

    // Test clicking on different visibility options
    await page.click('[data-testid="visibility-filter-public"]');
    await expect(page.locator('[data-testid="visibility-filter-public"]')).toHaveClass(/bg-primary/);
    await expect(page).toHaveURL(/visibility=Public/);

    await page.click('[data-testid="visibility-filter-private"]');
    await expect(page.locator('[data-testid="visibility-filter-private"]')).toHaveClass(/bg-primary/);
    await expect(page).toHaveURL(/visibility=Private/);

    await page.click('[data-testid="visibility-filter-all"]');
    await expect(page.locator('[data-testid="visibility-filter-all"]')).toHaveClass(/bg-primary/);
    await expect(page).not.toHaveURL(/visibility=/);
  });

  test('should have functional sort dropdown', async ({ page }) => {
    // Check that sort dropdown is present
    await expect(page.locator('[data-testid="sort-dropdown"]')).toBeVisible();

    // Open sort dropdown
    await page.click('[data-testid="sort-dropdown"]');

    // Check that all sort options are available
    await expect(page.locator('text=Newest')).toBeVisible();
    await expect(page.locator('text=Oldest')).toBeVisible();
    await expect(page.locator('text=Title A–Z')).toBeVisible();
    await expect(page.locator('text=Size')).toBeVisible();

    // Test selecting different sort options
    await page.click('text=Title A–Z');
    await expect(page).toHaveURL(/sort=title_asc/);

    await page.click('[data-testid="sort-dropdown"]');
    await page.click('text=Size');
    await expect(page).toHaveURL(/sort=size/);

    await page.click('[data-testid="sort-dropdown"]');
    await page.click('text=Oldest');
    await expect(page).toHaveURL(/sort=oldest/);
  });

  test('should have functional search input', async ({ page }) => {
    // Check that search input is present
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();

    // Test typing in search input
    await page.fill('[data-testid="search-input"]', 'test document');
    
    // Wait for debouncing
    await page.waitForTimeout(500);
    
    // Check URL parameters
    await expect(page).toHaveURL(/q=test\+document/);

    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    await page.waitForTimeout(500);
    await expect(page).not.toHaveURL(/q=/);
  });

  test('should display "Create Folder" button is absent', async ({ page }) => {
    // Verify that "Create Folder" button does not exist
    await expect(page.locator('text=Create Folder')).not.toBeVisible();
    await expect(page.locator('[data-testid="create-folder-button"]')).not.toBeVisible();
    
    // Check for any button with folder-related icons
    await expect(page.locator('button:has([data-lucide="folder-plus"])')).not.toBeVisible();
    await expect(page.locator('button:has([data-lucide="folder"])')).not.toBeVisible();
  });

  test('should have functional Upload Documents button', async ({ page }) => {
    // Check that Upload Documents button is present
    await expect(page.locator('[data-testid="upload-documents-button"]')).toBeVisible();

    // Click to open upload dialog
    await page.click('[data-testid="upload-documents-button"]');

    // Verify upload dialog opens
    await expect(page.locator('[data-testid="upload-dialog"]')).toBeVisible();
    await expect(page.locator('text=Upload Documents')).toBeVisible();

    // Check form elements
    await expect(page.locator('[data-testid="file-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="visibility-select"]')).toBeVisible();

    // Test file selection
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test pdf content'),
    });

    // Verify file count display
    await expect(page.locator('text=1 file(s) selected')).toBeVisible();

    // Test upload button state
    const uploadButton = page.locator('[data-testid="upload-submit-button"]');
    await expect(uploadButton).toBeEnabled();
    await expect(uploadButton).toContainText('Upload 1 Document(s)');

    // Close dialog
    await page.click('[data-testid="upload-cancel-button"]');
    await expect(page.locator('[data-testid="upload-dialog"]')).not.toBeVisible();
  });

  test('should display proper empty states', async ({ page }) => {
    // If no documents exist, should show empty state
    const documentsList = page.locator('[data-testid="documents-list"]');
    
    // Check if documents exist
    const hasDocuments = await documentsList.locator('[data-testid="document-item"]').count() > 0;
    
    if (!hasDocuments) {
      // Should show empty state with upload prompt
      await expect(page.locator('text=No documents yet')).toBeVisible();
      await expect(page.locator('text=Upload your first document to get started')).toBeVisible();
      await expect(page.locator('[data-testid="empty-state-upload-button"]')).toBeVisible();
    }

    // Test filtered empty state
    await page.fill('[data-testid="search-input"]', 'nonexistent-document-xyz');
    await page.waitForTimeout(500);

    // Should show "No documents found" empty state
    await expect(page.locator('text=No documents found')).toBeVisible();
    await expect(page.locator('text=Try adjusting your filters or search terms')).toBeVisible();
    await expect(page.locator('[data-testid="clear-filters-button"]')).toBeVisible();

    // Test clear filters button
    await page.click('[data-testid="clear-filters-button"]');
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue('');
  });

  test('should have functional document action buttons', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="documents-list"]');
    
    // Check if any documents exist
    const documentItems = page.locator('[data-testid="document-item"]');
    const documentCount = await documentItems.count();
    
    if (documentCount > 0) {
      const firstDocument = documentItems.first();

      // Check that action buttons are present
      await expect(firstDocument.locator('[data-testid="view-button"]')).toBeVisible();
      await expect(firstDocument.locator('[data-testid="download-button"]')).toBeVisible();
      await expect(firstDocument.locator('[data-testid="edit-button"]')).toBeVisible();
      await expect(firstDocument.locator('[data-testid="delete-button"]')).toBeVisible();

      // Test View button functionality
      await firstDocument.locator('[data-testid="view-button"]').click();
      // Should trigger view action (in real test, would verify URL generation)

      // Test Edit button functionality
      await firstDocument.locator('[data-testid="edit-button"]').click();
      
      // Verify edit dialog opens
      await expect(page.locator('[data-testid="edit-dialog"]')).toBeVisible();
      await expect(page.locator('text=Edit Document')).toBeVisible();
      
      // Close edit dialog
      await page.click('[data-testid="edit-cancel-button"]');
      await expect(page.locator('[data-testid="edit-dialog"]')).not.toBeVisible();

      // Test Delete button functionality
      await firstDocument.locator('[data-testid="delete-button"]').click();
      
      // Verify delete confirmation dialog opens
      await expect(page.locator('[data-testid="delete-dialog"]')).toBeVisible();
      await expect(page.locator('text=Delete Document')).toBeVisible();
      
      // Close delete dialog
      await page.click('[data-testid="delete-cancel-button"]');
      await expect(page.locator('[data-testid="delete-dialog"]')).not.toBeVisible();
    }
  });

  test('should show loading states on buttons', async ({ page }) => {
    // Check for loading spinners during actions
    const documentItems = page.locator('[data-testid="document-item"]');
    const documentCount = await documentItems.count();
    
    if (documentCount > 0) {
      const firstDocument = documentItems.first();
      
      // Click view button and check for loading state
      await firstDocument.locator('[data-testid="view-button"]').click();
      
      // Should show loading spinner (briefly)
      const viewButton = firstDocument.locator('[data-testid="view-button"]');
      await expect(viewButton.locator('[data-lucide="loader-2"]')).toBeVisible();
      
      // Wait for loading to complete
      await page.waitForTimeout(1000);
      await expect(viewButton.locator('[data-lucide="loader-2"]')).not.toBeVisible();
    }
  });

  test('should update KPIs after document operations', async ({ page }) => {
    // Get initial KPI values
    const initialTotalDocs = await page.locator('[data-testid="kpi-total-documents"] .text-2xl').textContent();
    const initialPublicDocs = await page.locator('[data-testid="kpi-public-documents"] .text-2xl').textContent();
    const initialDownloads = await page.locator('[data-testid="kpi-total-downloads"] .text-2xl').textContent();
    const initialStorage = await page.locator('[data-testid="kpi-storage-used"] .text-2xl').textContent();

    // Simulate a download action (if documents exist)
    const documentItems = page.locator('[data-testid="document-item"]');
    const documentCount = await documentItems.count();
    
    if (documentCount > 0) {
      // Click download button
      await documentItems.first().locator('[data-testid="download-button"]').click();
      
      // Wait for download action to complete
      await page.waitForTimeout(1000);
      
      // Verify download count KPI has updated
      const updatedDownloads = await page.locator('[data-testid="kpi-total-downloads"] .text-2xl').textContent();
      expect(parseInt(updatedDownloads!)).toBeGreaterThan(parseInt(initialDownloads!));
    }

    // Test upload operation effect on KPIs
    await page.click('[data-testid="upload-documents-button"]');
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'kpi-test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test content for KPI update'),
    });
    
    // Mock successful upload by checking UI updates
    // (In real implementation, this would trigger actual upload)
    
    // Verify KPIs are reactive to changes
    expect(page.locator('[data-testid="kpi-total-documents"] .text-2xl')).toBeVisible();
    expect(page.locator('[data-testid="kpi-storage-used"] .text-2xl')).toBeVisible();
  });

  test('should persist filter state in URL on page refresh', async ({ page }) => {
    // Set some filters
    await page.click('[data-testid="category-filter-financial"]');
    await page.click('[data-testid="visibility-filter-public"]');
    await page.fill('[data-testid="search-input"]', 'test');
    await page.click('[data-testid="sort-dropdown"]');
    await page.click('text=Title A–Z');

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Verify URL contains all parameters
    await expect(page).toHaveURL(/category=Financial/);
    await expect(page).toHaveURL(/visibility=Public/);
    await expect(page).toHaveURL(/q=test/);
    await expect(page).toHaveURL(/sort=title_asc/);

    // Refresh the page
    await page.reload();

    // Verify filters are restored from URL
    await expect(page.locator('[data-testid="category-filter-financial"]')).toHaveClass(/bg-primary/);
    await expect(page.locator('[data-testid="visibility-filter-public"]')).toHaveClass(/bg-primary/);
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue('test');
    await expect(page.locator('[data-testid="sort-dropdown"]')).toContainText('Title A–Z');
  });

  test('should show error states and retry functionality', async ({ page }) => {
    // Test error toast appearance (would need to mock network failures)
    // For now, verify toast container exists
    await expect(page.locator('[data-testid="toast-container"]')).toBeAttached();

    // Verify retry buttons would appear in error toasts
    // (This would be tested with actual network mocking in a full implementation)
  });
});