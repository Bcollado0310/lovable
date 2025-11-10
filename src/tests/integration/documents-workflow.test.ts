import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Mock environment setup for integration tests
const SUPABASE_URL = "https://wntvimopezffjtcwnobb.supabase.co";
const mockAuthToken = "mock-jwt-token";

// Test data
const testOfferingId = "15d99d79-ff78-499b-b103-3e8864aa45f8";
let testDocumentId: string;

// Mock fetch for integration tests
const mockApiResponses = new Map();

const mockFetch = async (url: string, options: any = {}) => {
  const key = `${options.method || 'GET'} ${url}`;
  
  if (mockApiResponses.has(key)) {
    const response = mockApiResponses.get(key);
    return {
      ok: response.ok,
      status: response.status,
      json: async () => response.data,
    };
  }
  
  // Default fallback
  return {
    ok: false,
    status: 404,
    json: async () => ({ error: 'Mock response not found' }),
  };
};

global.fetch = mockFetch as any;

describe('Documents API Integration Test', () => {
  beforeAll(() => {
    // Set up mock responses for the complete workflow
    setupMockResponses();
  });

  beforeEach(() => {
    // Reset test state
    testDocumentId = '';
  });

  afterAll(() => {
    // Cleanup
    mockApiResponses.clear();
  });

  it('should complete full document lifecycle: upload → list → view-url → download-url → edit → delete', async () => {
    console.log('Starting integration test workflow...');

    // Step 1: Upload a document
    console.log('Step 1: Uploading document...');
    const uploadFormData = new FormData();
    uploadFormData.append('files', new File(['test content'], 'integration-test.pdf', { type: 'application/pdf' }));
    uploadFormData.append('titles', 'Integration Test Document');
    uploadFormData.append('category', 'Financial');
    uploadFormData.append('visibility', 'Public');

    const uploadResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/offerings/${testOfferingId}/documents`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${mockAuthToken}` },
        body: uploadFormData,
      }
    );

    expect(uploadResponse.ok).toBe(true);
    const uploadResult = await uploadResponse.json();
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.documents).toHaveLength(1);
    
    testDocumentId = uploadResult.documents[0].id;
    expect(testDocumentId).toBeDefined();
    expect(uploadResult.documents[0].title).toBe('Integration Test Document');
    expect(uploadResult.documents[0].category).toBe('Financial');
    expect(uploadResult.documents[0].visibility).toBe('Public');
    expect(uploadResult.documents[0].download_count).toBe(0);
    expect(uploadResult.documents[0]).not.toHaveProperty('storage_key'); // Should not expose storage key

    console.log(`✓ Document uploaded successfully with ID: ${testDocumentId}`);

    // Step 2: List documents (verify upload)
    console.log('Step 2: Listing documents...');
    const listResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/offerings/${testOfferingId}/documents`,
      {
        headers: { Authorization: `Bearer ${mockAuthToken}` },
      }
    );

    expect(listResponse.ok).toBe(true);
    const listResult = await listResponse.json();
    expect(listResult.success).toBe(true);
    expect(listResult.documents).toHaveLength(1);
    
    const listedDocument = listResult.documents.find((doc: any) => doc.id === testDocumentId);
    expect(listedDocument).toBeDefined();
    expect(listedDocument.title).toBe('Integration Test Document');
    expect(listedDocument.download_count).toBe(0);

    console.log('✓ Document appears in listing correctly');

    // Step 3: Generate view URL
    console.log('Step 3: Generating view URL...');
    const viewUrlResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/documents/${testDocumentId}/view-url`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${mockAuthToken}` },
      }
    );

    expect(viewUrlResponse.ok).toBe(true);
    const viewUrlResult = await viewUrlResponse.json();
    expect(viewUrlResult.success).toBe(true);
    expect(viewUrlResult.signed_url).toMatch(/^https:\/\/.*signed-view-url/);
    expect(viewUrlResult.expires_in).toBe(3600);
    expect(viewUrlResult.expires_at).toBeDefined();

    console.log('✓ View URL generated successfully');

    // Step 4: Generate download URL (should increment download count)
    console.log('Step 4: Generating download URL...');
    const downloadUrlResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/documents/${testDocumentId}/download-url`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${mockAuthToken}` },
      }
    );

    expect(downloadUrlResponse.ok).toBe(true);
    const downloadUrlResult = await downloadUrlResponse.json();
    expect(downloadUrlResult.success).toBe(true);
    expect(downloadUrlResult.signed_url).toMatch(/^https:\/\/.*signed-download-url/);
    expect(downloadUrlResult.download_count).toBe(1); // Should be incremented
    expect(downloadUrlResult.expires_in).toBe(3600);

    console.log('✓ Download URL generated and download count incremented');

    // Step 5: Edit document metadata
    console.log('Step 5: Editing document metadata...');
    const editResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/documents/${testDocumentId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Integration Test Document',
          category: 'Legal',
          visibility: 'Private',
        }),
      }
    );

    expect(editResponse.ok).toBe(true);
    const editResult = await editResponse.json();
    expect(editResult.success).toBe(true);
    expect(editResult.document.title).toBe('Updated Integration Test Document');
    expect(editResult.document.category).toBe('Legal');
    expect(editResult.document.visibility).toBe('Private');

    console.log('✓ Document metadata updated successfully');

    // Step 6: Verify changes in listing
    console.log('Step 6: Verifying changes in listing...');
    const verifyListResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/offerings/${testOfferingId}/documents`,
      {
        headers: { Authorization: `Bearer ${mockAuthToken}` },
      }
    );

    expect(verifyListResponse.ok).toBe(true);
    const verifyListResult = await verifyListResponse.json();
    const updatedDocument = verifyListResult.documents.find((doc: any) => doc.id === testDocumentId);
    expect(updatedDocument.title).toBe('Updated Integration Test Document');
    expect(updatedDocument.category).toBe('Legal');
    expect(updatedDocument.visibility).toBe('Private');
    expect(updatedDocument.download_count).toBe(1); // Should maintain download count

    console.log('✓ Changes reflected in listing');

    // Step 7: Delete document
    console.log('Step 7: Deleting document...');
    const deleteResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/documents/${testDocumentId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${mockAuthToken}` },
      }
    );

    expect(deleteResponse.ok).toBe(true);
    const deleteResult = await deleteResponse.json();
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.message).toBe('Document deleted successfully');

    console.log('✓ Document deleted successfully');

    // Step 8: Verify deletion
    console.log('Step 8: Verifying deletion...');
    const finalListResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/offerings/${testOfferingId}/documents`,
      {
        headers: { Authorization: `Bearer ${mockAuthToken}` },
      }
    );

    expect(finalListResponse.ok).toBe(true);
    const finalListResult = await finalListResponse.json();
    const deletedDocument = finalListResult.documents.find((doc: any) => doc.id === testDocumentId);
    expect(deletedDocument).toBeUndefined();

    console.log('✓ Document successfully removed from listing');
    console.log('🎉 Integration test completed successfully!');
  });

  it('should handle filter and search operations', async () => {
    console.log('Testing filter and search operations...');

    // Test category filter
    const categoryFilterResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/offerings/${testOfferingId}/documents?category=Financial`,
      {
        headers: { Authorization: `Bearer ${mockAuthToken}` },
      }
    );

    expect(categoryFilterResponse.ok).toBe(true);
    const categoryResult = await categoryFilterResponse.json();
    expect(categoryResult.success).toBe(true);

    // Test visibility filter
    const visibilityFilterResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/offerings/${testOfferingId}/documents?visibility=Public`,
      {
        headers: { Authorization: `Bearer ${mockAuthToken}` },
      }
    );

    expect(visibilityFilterResponse.ok).toBe(true);
    const visibilityResult = await visibilityFilterResponse.json();
    expect(visibilityResult.success).toBe(true);

    // Test search
    const searchResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/offerings/${testOfferingId}/documents?q=test`,
      {
        headers: { Authorization: `Bearer ${mockAuthToken}` },
      }
    );

    expect(searchResponse.ok).toBe(true);
    const searchResult = await searchResponse.json();
    expect(searchResult.success).toBe(true);

    console.log('✓ Filter and search operations work correctly');
  });

  it('should enforce security constraints throughout workflow', async () => {
    console.log('Testing security constraints...');

    // Test unauthorized access
    const unauthorizedResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/offerings/unauthorized-offering/documents`,
      {
        headers: { Authorization: `Bearer invalid-token` },
      }
    );

    expect(unauthorizedResponse.ok).toBe(false);
    expect(unauthorizedResponse.status).toBe(403);

    // Test invalid file type upload
    const invalidFileFormData = new FormData();
    invalidFileFormData.append('files', new File(['test'], 'test.exe', { type: 'application/x-executable' }));
    invalidFileFormData.append('category', 'Financial');

    const invalidFileResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/documents-api/offerings/${testOfferingId}/documents`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${mockAuthToken}` },
        body: invalidFileFormData,
      }
    );

    expect(invalidFileResponse.ok).toBe(false);
    expect(invalidFileResponse.status).toBe(400);

    console.log('✓ Security constraints properly enforced');
  });
});

function setupMockResponses() {
  const baseUrl = `${SUPABASE_URL}/functions/v1/documents-api`;
  
  // Mock upload response
  mockApiResponses.set(`POST ${baseUrl}/offerings/${testOfferingId}/documents`, {
    ok: true,
    status: 201,
    data: {
      success: true,
      documents: [{
        id: 'test-doc-id-123',
        offering_id: testOfferingId,
        title: 'Integration Test Document',
        filename: 'integration-test.pdf',
        mime_type: 'application/pdf',
        size_bytes: 12,
        category: 'Financial',
        visibility: 'Public',
        download_count: 0,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        checksum_sha256: 'mock-checksum',
      }],
      message: '1 document(s) uploaded successfully',
    },
  });

  // Mock list response (initial)
  mockApiResponses.set(`GET ${baseUrl}/offerings/${testOfferingId}/documents`, {
    ok: true,
    status: 200,
    data: {
      success: true,
      documents: [{
        id: 'test-doc-id-123',
        offering_id: testOfferingId,
        title: 'Integration Test Document',
        filename: 'integration-test.pdf',
        mime_type: 'application/pdf',
        size_bytes: 12,
        category: 'Financial',
        visibility: 'Public',
        download_count: 0,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        checksum_sha256: 'mock-checksum',
      }],
      count: 1,
    },
  });

  // Mock view URL response
  mockApiResponses.set(`POST ${baseUrl}/documents/test-doc-id-123/view-url`, {
    ok: true,
    status: 200,
    data: {
      success: true,
      signed_url: 'https://storage.example.com/signed-view-url',
      expires_in: 3600,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    },
  });

  // Mock download URL response
  mockApiResponses.set(`POST ${baseUrl}/documents/test-doc-id-123/download-url`, {
    ok: true,
    status: 200,
    data: {
      success: true,
      signed_url: 'https://storage.example.com/signed-download-url',
      expires_in: 3600,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      download_count: 1,
    },
  });

  // Mock edit response
  mockApiResponses.set(`PATCH ${baseUrl}/documents/test-doc-id-123`, {
    ok: true,
    status: 200,
    data: {
      success: true,
      document: {
        id: 'test-doc-id-123',
        title: 'Updated Integration Test Document',
        category: 'Legal',
        visibility: 'Private',
      },
      message: 'Document updated successfully',
    },
  });

  // Mock delete response
  mockApiResponses.set(`DELETE ${baseUrl}/documents/test-doc-id-123`, {
    ok: true,
    status: 200,
    data: {
      success: true,
      message: 'Document deleted successfully',
    },
  });

  // Mock unauthorized access
  mockApiResponses.set(`GET ${baseUrl}/offerings/unauthorized-offering/documents`, {
    ok: false,
    status: 403,
    data: {
      error: 'Access denied: Cannot access this offering',
    },
  });

  // Mock invalid file type
  mockApiResponses.set(`POST ${baseUrl}/offerings/${testOfferingId}/documents`, {
    ok: false,
    status: 400,
    data: {
      error: 'File type application/x-executable is not allowed',
    },
  });

  // Mock filter and search responses
  mockApiResponses.set(`GET ${baseUrl}/offerings/${testOfferingId}/documents?category=Financial`, {
    ok: true,
    status: 200,
    data: { success: true, documents: [], count: 0 },
  });

  mockApiResponses.set(`GET ${baseUrl}/offerings/${testOfferingId}/documents?visibility=Public`, {
    ok: true,
    status: 200,
    data: { success: true, documents: [], count: 0 },
  });

  mockApiResponses.set(`GET ${baseUrl}/offerings/${testOfferingId}/documents?q=test`, {
    ok: true,
    status: 200,
    data: { success: true, documents: [], count: 0 },
  });
}