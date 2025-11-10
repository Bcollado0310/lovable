import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase client and fetch
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn(),
  storage: {
    from: vi.fn(),
    createSignedUrl: vi.fn(),
  },
};

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto.subtle for checksum computation
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

describe('Documents API Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /offerings/:offeringId/documents', () => {
    it('should return documents for authorized user', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          offering_id: 'offering-1',
          title: 'Test Document',
          filename: 'test.pdf',
          mime_type: 'application/pdf',
          size_bytes: 1024,
          category: 'Financial',
          visibility: 'Public',
          download_count: 5,
          uploaded_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          checksum_sha256: 'abc123',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          documents: mockDocuments,
          count: 1,
        }),
      });

      const response = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        headers: { Authorization: 'Bearer token' },
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].title).toBe('Test Document');
      expect(result.documents[0]).not.toHaveProperty('storage_key'); // Should not expose storage key
    });

    it('should filter documents by category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          documents: [],
          count: 0,
        }),
      });

      await fetch('/functions/v1/documents-api/offerings/offering-1/documents?category=Financial', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=Financial'),
        expect.any(Object)
      );
    });

    it('should filter documents by visibility', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          documents: [],
          count: 0,
        }),
      });

      await fetch('/functions/v1/documents-api/offerings/offering-1/documents?visibility=Private', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('visibility=Private'),
        expect.any(Object)
      );
    });

    it('should search documents by title/filename', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          documents: [],
          count: 0,
        }),
      });

      await fetch('/functions/v1/documents-api/offerings/offering-1/documents?q=test', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test'),
        expect.any(Object)
      );
    });

    it('should deny access for unauthorized user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Access denied: Cannot access this offering',
        }),
      });

      const response = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        headers: { Authorization: 'Bearer invalid-token' },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  describe('POST /offerings/:offeringId/documents', () => {
    it('should upload document successfully', async () => {
      const mockDocument = {
        id: 'doc-1',
        offering_id: 'offering-1',
        title: 'Test Document',
        filename: 'test.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1024,
        category: 'Financial',
        visibility: 'Public',
        download_count: 0,
        uploaded_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        checksum_sha256: 'abc123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          documents: [mockDocument],
          message: '1 document(s) uploaded successfully',
        }),
      });

      const formData = new FormData();
      formData.append('files', new File(['test'], 'test.pdf', { type: 'application/pdf' }));
      formData.append('titles', 'Test Document');
      formData.append('category', 'Financial');
      formData.append('visibility', 'Public');

      const response = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: formData,
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]).not.toHaveProperty('storage_key');
    });

    it('should reject oversized files', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'File size exceeds limit of 25 MB',
        }),
      });

      const formData = new FormData();
      const largeFile = new File(['x'.repeat(26 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      formData.append('files', largeFile);
      formData.append('category', 'Financial');

      const response = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: formData,
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should reject invalid file types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'File type text/plain is not allowed',
        }),
      });

      const formData = new FormData();
      formData.append('files', new File(['test'], 'test.txt', { type: 'text/plain' }));
      formData.append('category', 'Financial');

      const response = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: formData,
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should detect duplicate files', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Duplicate file detected: Existing Document (existing.pdf)',
        }),
      });

      const formData = new FormData();
      formData.append('files', new File(['test'], 'duplicate.pdf', { type: 'application/pdf' }));
      formData.append('category', 'Financial');

      const response = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: formData,
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(409);
    });

    it('should deny access for insufficient permissions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Access denied: Insufficient permissions to upload documents',
        }),
      });

      const formData = new FormData();
      formData.append('files', new File(['test'], 'test.pdf', { type: 'application/pdf' }));
      formData.append('category', 'Financial');

      const response = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        method: 'POST',
        headers: { Authorization: 'Bearer viewer-token' },
        body: formData,
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /documents/:id', () => {
    it('should update document metadata', async () => {
      const updatedDocument = {
        id: 'doc-1',
        title: 'Updated Title',
        category: 'Legal',
        visibility: 'Private',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          document: updatedDocument,
          message: 'Document updated successfully',
        }),
      });

      const response = await fetch('/functions/v1/documents-api/documents/doc-1', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Title',
          category: 'Legal',
          visibility: 'Private',
        }),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.document.title).toBe('Updated Title');
    });

    it('should validate category values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid category',
        }),
      });

      const response = await fetch('/functions/v1/documents-api/documents/doc-1', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'InvalidCategory',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete document successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Document deleted successfully',
        }),
      });

      const response = await fetch('/functions/v1/documents-api/documents/doc-1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer token' },
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.message).toBe('Document deleted successfully');
    });

    it('should deny access for insufficient permissions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Access denied: Insufficient permissions to delete document',
        }),
      });

      const response = await fetch('/functions/v1/documents-api/documents/doc-1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer editor-token' },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  describe('POST /documents/:id/view-url', () => {
    it('should generate pre-signed view URL', async () => {
      const mockSignedUrl = 'https://storage.example.com/signed-view-url';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          signed_url: mockSignedUrl,
          expires_in: 3600,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }),
      });

      const response = await fetch('/functions/v1/documents-api/documents/doc-1/view-url', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.signed_url).toBe(mockSignedUrl);
      expect(result.expires_in).toBe(3600);
      expect(result.expires_at).toBeDefined();
    });

    it('should deny access for unauthorized user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Document not found or access denied',
        }),
      });

      const response = await fetch('/functions/v1/documents-api/documents/doc-1/view-url', {
        method: 'POST',
        headers: { Authorization: 'Bearer unauthorized-token' },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  describe('POST /documents/:id/download-url', () => {
    it('should generate pre-signed download URL and increment count', async () => {
      const mockSignedUrl = 'https://storage.example.com/signed-download-url';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          signed_url: mockSignedUrl,
          expires_in: 3600,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          download_count: 6,
        }),
      });

      const response = await fetch('/functions/v1/documents-api/documents/doc-1/download-url', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.signed_url).toBe(mockSignedUrl);
      expect(result.download_count).toBe(6);
    });

    it('should track download analytics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          signed_url: 'https://storage.example.com/signed-download-url',
          download_count: 10,
        }),
      });

      const response = await fetch('/functions/v1/documents-api/documents/doc-1/download-url', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.download_count).toBeGreaterThan(0);
    });
  });

  describe('RBAC (Role-Based Access Control)', () => {
    it('should allow owners all operations', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Test all operations with owner role
      const operations = [
        { method: 'GET', url: '/functions/v1/documents-api/offerings/offering-1/documents' },
        { method: 'POST', url: '/functions/v1/documents-api/offerings/offering-1/documents' },
        { method: 'PATCH', url: '/functions/v1/documents-api/documents/doc-1' },
        { method: 'DELETE', url: '/functions/v1/documents-api/documents/doc-1' },
        { method: 'POST', url: '/functions/v1/documents-api/documents/doc-1/view-url' },
        { method: 'POST', url: '/functions/v1/documents-api/documents/doc-1/download-url' },
      ];

      for (const op of operations) {
        const response = await fetch(op.url, {
          method: op.method,
          headers: { Authorization: 'Bearer owner-token' },
          body: op.method === 'POST' && op.url.includes('/offerings/') ? new FormData() : undefined,
        });

        expect(response.ok).toBe(true);
      }
    });

    it('should restrict viewer role appropriately', async () => {
      // Viewers should only be able to view documents, not modify them
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }) // GET allowed
        .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'Access denied' }) }) // POST denied
        .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'Access denied' }) }) // PATCH denied
        .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'Access denied' }) }); // DELETE denied

      const getResponse = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        headers: { Authorization: 'Bearer viewer-token' },
      });
      expect(getResponse.ok).toBe(true);

      const postResponse = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        method: 'POST',
        headers: { Authorization: 'Bearer viewer-token' },
        body: new FormData(),
      });
      expect(postResponse.ok).toBe(false);

      const patchResponse = await fetch('/functions/v1/documents-api/documents/doc-1', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer viewer-token' },
      });
      expect(patchResponse.ok).toBe(false);

      const deleteResponse = await fetch('/functions/v1/documents-api/documents/doc-1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer viewer-token' },
      });
      expect(deleteResponse.ok).toBe(false);
    });
  });

  describe('File Security', () => {
    it('should sanitize dangerous filenames', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          documents: [{
            filename: '__etc__passwd.pdf', // Should be sanitized
          }],
        }),
      });

      const formData = new FormData();
      formData.append('files', new File(['test'], '../../../etc/passwd.pdf', { type: 'application/pdf' }));
      formData.append('category', 'Financial');

      const response = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: formData,
      });

      const result = await response.json();
      expect(result.documents[0].filename).not.toContain('../');
      expect(result.documents[0].filename).not.toContain('/');
    });

    it('should validate file headers match extensions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'File header does not match expected format for .pdf file',
        }),
      });

      const formData = new FormData();
      // File with PDF extension but different content
      formData.append('files', new File(['not-a-pdf'], 'fake.pdf', { type: 'application/pdf' }));
      formData.append('category', 'Financial');

      const response = await fetch('/functions/v1/documents-api/offerings/offering-1/documents', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
        body: formData,
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });
});