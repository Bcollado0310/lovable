import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { FileText, Upload, Download, Eye, Edit, Trash2, Filter, Search, AlertTriangle, Shield, ArrowUpDown, Loader2, RefreshCw, FolderOpen } from 'lucide-react';
import { DeveloperOffering, formatDate } from '@/utils/developerHelpers';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getApiHeaders } from '@/utils/apiConfig';
import { DocumentDropzone } from './DocumentDropzone';

const SUPABASE_URL = "https://wntvimopezffjtcwnobb.supabase.co";

// Development bypass token for API calls (legacy - use getApiHeaders instead)
const getDevHeaders = () => {
  return getApiHeaders(false); // Use the centralized header function
};

// Helper function to check if request should retry with dev bypass
const shouldRetryWithDevBypass = (error: any, hasDevHeaders: boolean): boolean => {
  if (!import.meta.env.DEV || hasDevHeaders) return false;
  
  const errorMessage = error?.message || '';
  return errorMessage.includes('Authentication required') || 
         errorMessage.includes('Invalid authentication') ||
         errorMessage.includes('401');
};

// Helper function to show dev bypass hint
const showDevBypassHint = () => {
  if (import.meta.env.DEV) {
    toast({
      title: "💡 Development Tip",
      description: "Authentication failed. Retrying with development bypass...",
      variant: "default",
      duration: 4000,
    });
  }
};

interface DocumentsTabProps {
  offering: DeveloperOffering;
}

type DocumentCategory = 'Financial' | 'Appraisal' | 'Legal' | 'Technical' | 'Other';
type DocumentVisibility = 'Public' | 'Private';
type SortOption = 'newest' | 'oldest' | 'title_asc' | 'size';

interface Document {
  id: string;
  offering_id: string;
  title: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  category: DocumentCategory;
  visibility: DocumentVisibility;
  storage_key: string;
  download_count: number;
  uploaded_by?: string;
  uploaded_at: string;
  updated_at: string;
  checksum_sha256?: string;
}

export function DocumentsTab({ offering }: DocumentsTabProps) {
  const { hasPermission } = useDeveloperAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for documents and filters
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get filter state from URL params
  const searchTerm = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedVisibility = searchParams.get('visibility') || 'All';
  const sortBy = (searchParams.get('sort') as SortOption) || 'newest';
  
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);

  // Form state for upload/edit
  const [documentForm, setDocumentForm] = useState({
    title: '',
    category: 'Financial' as DocumentCategory,
    visibility: 'Public' as DocumentVisibility,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [fileError, setFileError] = useState<string>('');
  
  // Loading states for individual actions
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Load documents from database
  useEffect(() => {
    loadDocuments();
  }, [offering.id, searchTerm, selectedCategory, selectedVisibility, sortBy]);
  
  // Error state for graceful handling
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDocuments = async (retryWithBypass = false) => {
    try {
      setLoading(true);
      setLoadError(null); // Clear previous errors
      
      // In dev mode, bypass authentication
      const isDev = import.meta.env.DEV;
      const devBypassToken = import.meta.env.VITE_DEV_BYPASS_TOKEN;
      const isDevBypass = isDev && devBypassToken;
      
      // Only require session if not in dev bypass mode
      const { data: { session } } = await supabase.auth.getSession();
      if (!isDevBypass && !session?.access_token && !retryWithBypass) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedVisibility !== 'All') params.append('visibility', selectedVisibility);
      if (searchTerm) params.append('q', searchTerm);

      const requestUrl = `${SUPABASE_URL}/functions/v1/documents-api/offerings/${offering.id}/documents?${params.toString()}`;
      
      // Build headers with dev bypass token (if in dev mode)
      const headers = getApiHeaders();
      
      // Add authorization only if we have a session and not using dev bypass
      if (session?.access_token && !isDevBypass) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      console.log('📄 [Documents API] Request mode:', isDevBypass ? 'DEV BYPASS' : 'AUTHENTICATED');
      
      console.log('📄 [Documents API] Loading documents:', {
        url: requestUrl,
        retry: retryWithBypass,
        filters: {
          category: selectedCategory,
          visibility: selectedVisibility,
          search: searchTerm,
          sort: sortBy
        }
      });

      const response = await fetch(requestUrl, { headers });

      const result = await response.json();

      console.log('📄 [Documents API] Response:', {
        status: response.status,
        statusText: response.statusText,
        url: requestUrl,
        responseBody: result
      });

      if (!response.ok) {
        const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      let docs = result.documents || [];
      
      // Apply client-side sorting
      docs = sortDocuments(docs, sortBy);

      setDocuments(docs);
      console.log('📄 [Documents API] Loaded documents:', docs.length);
    } catch (error) {
      console.error('📄 [Documents API] Error loading documents:', error);
      
      // Check if we should retry with dev bypass
      if (shouldRetryWithDevBypass(error, retryWithBypass)) {
        showDevBypassHint();
        return loadDocuments(true);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
      setLoadError(errorMessage);
      
      // Show toast for user feedback
      toast({
        title: "Error Loading Documents",
        description: errorMessage,
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => loadDocuments()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to sort documents
  const sortDocuments = (docs: Document[], sort: SortOption): Document[] => {
    return [...docs].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
        case 'oldest':
          return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
        case 'title_asc':
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        case 'size':
          return b.size_bytes - a.size_bytes;
        default:
          return 0;
      }
    });
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper function to update URL params
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'All') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    
    setSearchParams(newParams);
  };

  // Helper function to format storage size
  const formatStorageSize = (totalBytes: number): string => {
    const mb = totalBytes / (1024 * 1024);
    if (mb < 1) {
      const kb = totalBytes / 1024;
      return `${kb.toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  // Calculate KPI metrics
  const kpiMetrics = {
    totalDocuments: documents.length,
    publicDocuments: documents.filter(d => d.visibility === 'Public').length,
    totalDownloads: documents.reduce((sum, d) => sum + d.download_count, 0),
    storageUsed: documents.reduce((sum, d) => sum + d.size_bytes, 0)
  };

  // Helper function to set loading state for specific actions
  const setDocumentActionLoading = (docId: string, action: string, loading: boolean) => {
    setActionLoading(prev => ({
      ...prev,
      [`${docId}-${action}`]: loading
    }));
  };

  // Helper function to show error with retry
  const showErrorWithRetry = (title: string, description: string, retryFn?: () => void) => {
    toast({
      title,
      description,
      variant: "destructive",
      action: retryFn ? (
        <Button variant="outline" size="sm" onClick={retryFn}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      ) : undefined,
    });
  };

  // Document action handlers
  const handleView = async (doc: Document, retryWithBypass = false) => {
    const actionKey = `${doc.id}-view`;
    try {
      setDocumentActionLoading(doc.id, 'view', true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token && !retryWithBypass) {
        throw new Error('Authentication required');
      }

      const requestUrl = `${SUPABASE_URL}/functions/v1/documents-api/documents/${doc.id}/view-url`;
      
      // Build headers with auth and dev bypass
      const headers = getApiHeaders();
      
      // Add authorization if available
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      console.log('📄 [Documents API] Requesting view URL:', {
        url: requestUrl,
        retry: retryWithBypass,
        documentId: doc.id,
        documentTitle: doc.title
      });

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers
      });

      const result = await response.json();

      console.log('📄 [Documents API] View URL response:', {
        status: response.status,
        statusText: response.statusText,
        url: requestUrl,
        responseBody: result
      });

      if (!response.ok) {
        const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // For PDFs, try to open in an embedded viewer, otherwise open in new tab
      if (doc.mime_type === 'application/pdf') {
        // Try to use browser's PDF viewer
        window.open(result.signed_url, '_blank');
      } else {
        // For other file types, open in new tab
        window.open(result.signed_url, '_blank');
      }
      
    } catch (error) {
      console.error('📄 [Documents API] Error viewing document:', error);
      
      // Check if we should retry with dev bypass
      if (shouldRetryWithDevBypass(error, retryWithBypass)) {
        showDevBypassHint();
        return handleView(doc, true);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to open document';
      showErrorWithRetry(
        "View Failed",
        errorMessage,
        () => handleView(doc)
      );
    } finally {
      setDocumentActionLoading(doc.id, 'view', false);
    }
  };

  const handleDownload = async (doc: Document, retryWithBypass = false) => {
    try {
      setDocumentActionLoading(doc.id, 'download', true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token && !retryWithBypass) {
        throw new Error('Authentication required');
      }

      const requestUrl = `${SUPABASE_URL}/functions/v1/documents-api/documents/${doc.id}/download-url`;
      
      // Build headers with auth and dev bypass
      const headers = getApiHeaders();
      
      // Add authorization if available
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      console.log('📄 [Documents API] Requesting download URL:', {
        url: requestUrl,
        retry: retryWithBypass,
        documentId: doc.id,
        documentTitle: doc.title
      });

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers
      });

      const result = await response.json();

      console.log('📄 [Documents API] Download URL response:', {
        status: response.status,
        statusText: response.statusText,
        url: requestUrl,
        responseBody: result
      });

      if (!response.ok) {
        const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Navigate to the download URL
      window.location.href = result.signed_url;

      // Update local state with new download count
      setDocuments(prev => prev.map(d => 
        d.id === doc.id ? { ...d, download_count: result.download_count } : d
      ));
      
    } catch (error) {
      console.error('📄 [Documents API] Error downloading document:', error);
      
      // Check if we should retry with dev bypass
      if (shouldRetryWithDevBypass(error, retryWithBypass)) {
        showDevBypassHint();
        return handleDownload(doc, true);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to download document';
      showErrorWithRetry(
        "Download Failed", 
        errorMessage,
        () => handleDownload(doc)
      );
    } finally {
      setDocumentActionLoading(doc.id, 'download', false);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one file",
        variant: "destructive"
      });
      return;
    }

    // Validate file sizes and types (PDF only) - client-side
    const maxSize = 25 * 1024 * 1024; // 25 MB

    for (const file of selectedFiles) {
      // Check file size
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "PDF exceeds 25 MB limit.",
          variant: "destructive"
        });
        return;
      }

      // Check MIME type and file extension
      const isPdfMimeType = file.type === 'application/pdf';
      const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');

      if (!isPdfMimeType || !isPdfExtension) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF files are allowed.",
          variant: "destructive"
        });
        return;
      }

      // Check PDF magic header (%PDF-)
      const buffer = await file.slice(0, 5).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const header = new TextDecoder().decode(bytes);
      if (!header.startsWith('%PDF-')) {
        toast({
          title: "Invalid PDF File",
          description: "Only PDF files are allowed.",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setUploading(true);
      setUploadProgress({});

      // Get auth token or use dev bypass
      let authHeaders = getApiHeaders();
      const isDev = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_TOKEN;
      
      if (!isDev) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Authentication required');
        }
        authHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Upload each file using presigned URL flow
      const uploadedDocs = [];

      for (const file of selectedFiles) {
        const title = documentForm.title.trim() || file.name.replace(/\.[^/.]+$/, "");

        // Step 1: Request presigned URL
        console.log('📄 [Documents API] Requesting presigned URL for:', file.name);
        
        const presignUrl = `${SUPABASE_URL}/functions/v1/documents-api/offerings/${offering.id}/documents/presign`;
        const presignResponse = await fetch(presignUrl, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            category: documentForm.category,
            visibility: documentForm.visibility,
            title
          })
        });

        const presignResult = await presignResponse.json();

        if (!presignResponse.ok) {
          throw new Error(presignResult.error || `Failed to get upload URL: ${presignResponse.status}`);
        }

        // Step 2: Upload file directly to storage using presigned URL
        console.log('📄 [Documents API] Uploading to storage:', presignResult.path);
        
        const uploadResponse = await fetch(presignResult.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': 'application/pdf',
            'x-upsert': 'false'
          }
        });

        if (!uploadResponse.ok) {
          throw new Error(`Storage upload failed: ${uploadResponse.status}`);
        }

        // Step 3: Confirm upload and create document record
        console.log('📄 [Documents API] Confirming upload...');
        
        const confirmUrl = `${SUPABASE_URL}/functions/v1/documents-api/offerings/${offering.id}/documents/confirm`;
        const confirmResponse = await fetch(confirmUrl, {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: presignResult.path,
            title: presignResult.metadata.title,
            filename: presignResult.metadata.filename,
            category: presignResult.metadata.category,
            visibility: presignResult.metadata.visibility,
            mimeType: presignResult.metadata.mimeType,
            size: presignResult.metadata.size
          })
        });

        const confirmResult = await confirmResponse.json();

        if (!confirmResponse.ok) {
          const errorMsg = confirmResult.error || `Confirmation failed: ${confirmResponse.status}`;
          throw new Error(errorMsg);
        }

        uploadedDocs.push(confirmResult.document);
      }

      // Add new documents to state
      setDocuments(prev => [...uploadedDocs, ...prev]);
      setShowUploadDialog(false);
      setDocumentForm({
        title: '',
        category: 'Financial',
        visibility: 'Public',
      });
      setSelectedFiles([]);
      setFileError('');
      setUploadProgress({});
      
      toast({
        title: "Success",
        description: `${uploadedDocs.length} document(s) uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      showErrorWithRetry(
        "Upload Failed",
        error instanceof Error ? error.message : "Failed to upload document",
        () => handleUpload()
      );
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setDocumentForm({
      title: doc.title,
      category: doc.category,
      visibility: doc.visibility,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDocument || !documentForm.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a valid title",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const requestUrl = `${SUPABASE_URL}/functions/v1/documents-api/documents/${editingDocument.id}`;
      const requestBody = {
        title: documentForm.title,
        category: documentForm.category,
        visibility: documentForm.visibility
      };
      
      console.log('📄 [Documents API] Updating document:', {
        url: requestUrl,
        documentId: editingDocument.id,
        updates: requestBody
      });

      const headers = getApiHeaders();
      // Add authorization for authenticated request
      headers['Authorization'] = `Bearer ${session.access_token}`;
      
      const response = await fetch(requestUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      console.log('📄 [Documents API] Update response:', {
        status: response.status,
        statusText: response.statusText,
        url: requestUrl,
        responseBody: result
      });

      if (!response.ok) {
        const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      setDocuments(prev => prev.map(doc => 
        doc.id === editingDocument.id ? result.document : doc
      ));

      setShowEditDialog(false);
      setEditingDocument(null);
      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error) {
      console.error('Error updating document:', error);
      showErrorWithRetry(
        "Update Failed",
        error instanceof Error ? error.message : "Failed to update document",
        () => handleSaveEdit()
      );
    }
  };

  const handleDelete = (doc: Document) => {
    setDeletingDocument(doc);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async (retryWithBypass = false) => {
    if (!deletingDocument) return;

    try {
      // Store reference for potential rollback
      const docToDelete = deletingDocument;
      
      // Optimistically remove from UI
      setDocuments(prev => prev.filter(doc => doc.id !== docToDelete.id));
      setShowDeleteDialog(false);
      setDeletingDocument(null);

      // In dev mode, bypass authentication
      const isDev = import.meta.env.DEV;
      const devBypassToken = import.meta.env.VITE_DEV_BYPASS_TOKEN;
      const isDevBypass = isDev && devBypassToken;
      
      // Only require session if not in dev bypass mode
      const { data: { session } } = await supabase.auth.getSession();
      if (!isDevBypass && !session?.access_token && !retryWithBypass) {
        // Revert optimistic update
        setDocuments(prev => [docToDelete, ...prev]);
        throw new Error('Authentication required');
      }

      const requestUrl = `${SUPABASE_URL}/functions/v1/documents-api/documents/${docToDelete.id}`;
      
      console.log('📄 [Documents API] Request mode:', isDevBypass ? 'DEV BYPASS' : 'AUTHENTICATED');
      console.log('📄 [Documents API] Deleting document:', {
        url: requestUrl,
        retry: retryWithBypass,
        documentId: docToDelete.id,
        documentTitle: docToDelete.title
      });

      // Build headers with dev bypass token (if in dev mode)
      const headers = getApiHeaders();
      
      // Explicitly add dev bypass token in dev mode for DELETE
      if (isDev && devBypassToken) {
        headers['x-dev-bypass-token'] = devBypassToken;
      }
      
      // Add authorization only if we have a session and not using dev bypass
      if (session?.access_token && !isDevBypass) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(requestUrl, {
        method: 'DELETE',
        headers
      });

      console.log('📄 [Documents API] Delete response:', {
        status: response.status,
        statusText: response.statusText,
        url: requestUrl
      });

      // 204 No Content is success (idempotent delete)
      if (!response.ok && response.status !== 204) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to parse error response
        try {
          const result = await response.json();
          errorMessage = result.error || errorMessage;
        } catch {
          // Response body might be empty
        }
        
        // Revert optimistic update on failure
        setDocuments(prev => [docToDelete, ...prev]);
        
        // Show auth-specific error in dev
        if (response.status === 401 || response.status === 403) {
          if (isDev) {
            errorMessage = "Authentication failed (dev): dev bypass header missing";
          }
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error('📄 [Documents API] Error deleting document:', error);
      
      // Check if we should retry with dev bypass
      if (shouldRetryWithDevBypass(error, retryWithBypass)) {
        showDevBypassHint();
        return confirmDelete(true);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
      showErrorWithRetry(
        "Delete Failed",
        errorMessage,
        () => confirmDelete()
      );
    }
  };

  const getCategoryColor = (category: DocumentCategory) => {
    switch (category) {
      case 'Financial': return 'bg-green-100 text-green-800 border-green-200';
      case 'Appraisal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Legal': return 'bg-red-100 text-red-800 border-red-200';
      case 'Technical': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Other': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryStats = () => {
    const stats = {
      Financial: 0,
      Appraisal: 0,
      Legal: 0,
      Technical: 0,
      Other: 0
    };
    
    documents.forEach(doc => {
      stats[doc.category]++;
    });
    
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="space-y-6" data-testid="documents-section">
      {/* Header Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Document Management</h3>
              <p className="text-sm text-muted-foreground">
                Upload and manage documents for this offering
              </p>
            </div>
            {hasPermission('write') && (
              <Button onClick={() => setShowUploadDialog(true)} data-testid="upload-documents-button">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Sort Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => updateUrlParams({ q: e.target.value })}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            
            {/* Category Pills */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <div className="flex flex-wrap gap-2">
              {['All', 'Financial', 'Appraisal', 'Legal', 'Technical', 'Other'].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateUrlParams({ category: category === 'All' ? null : category })}
                  className="h-8"
                  data-testid={`category-filter-${category.toLowerCase()}`}
                >
                  {category}
                    {category !== 'All' && (
                      <Badge variant="secondary" className="ml-2 h-5">
                        {categoryStats[category as DocumentCategory]}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Visibility and Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Visibility Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Visibility</Label>
                <div className="flex gap-1 border rounded-md p-1">
                {['All', 'Public', 'Private'].map((visibility) => (
                  <Button
                    key={visibility}
                    variant={selectedVisibility === visibility ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => updateUrlParams({ visibility: visibility === 'All' ? null : visibility })}
                    className="h-7 px-3"
                    data-testid={`visibility-filter-${visibility.toLowerCase()}`}
                  >
                    {visibility}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sort</Label>
                <Select value={sortBy} onValueChange={(value: SortOption) => updateUrlParams({ sort: value })}>
                  <SelectTrigger className="w-40" data-testid="sort-dropdown">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="title_asc">Title A–Z</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document KPI Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="kpi-total-documents">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiMetrics.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              All documents in offering
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="kpi-public-documents">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Documents</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiMetrics.publicDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Visible to investors
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="kpi-total-downloads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiMetrics.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Across all documents
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="kpi-storage-used">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStorageSize(kpiMetrics.storageUsed)}</div>
            <p className="text-xs text-muted-foreground">
              Total file storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Documents {selectedCategory !== 'All' && `(${selectedCategory})`}
          </CardTitle>
          <CardDescription>
            {documents.length} documents {selectedCategory !== 'All' || selectedVisibility !== 'All' || searchTerm ? 'matching filters' : 'total'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            /* Error State */
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
                <div>
                  <h3 className="font-medium text-destructive">Error Loading Documents</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {loadError}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => loadDocuments()}
                  data-testid="retry-load-button"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <div className="text-muted-foreground">Loading documents...</div>
                </div>
              ) : searchTerm || selectedCategory !== 'All' || selectedVisibility !== 'All' ? (
                <div className="flex flex-col items-center gap-4">
                  <FolderOpen className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">No documents found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => updateUrlParams({ q: null, category: null, visibility: null })}
                    data-testid="clear-filters-button"
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">No documents yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload your first document to get started
                    </p>
                  </div>
                  {hasPermission('write') && (
                    <Button onClick={() => setShowUploadDialog(true)} data-testid="empty-state-upload-button">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4" data-testid="documents-list">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{doc.title}</h4>
                        <Badge className={getCategoryColor(doc.category)}>
                          {doc.category}
                        </Badge>
                        <Badge variant={doc.visibility === 'Public' ? 'default' : 'secondary'}>
                          {doc.visibility}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.filename}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.size_bytes)}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(doc.uploaded_at.split('T')[0])}</span>
                        <span>•</span>
                        <span>{doc.download_count} downloads</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleView(doc)}
                      disabled={actionLoading[`${doc.id}-view`]}
                      data-testid="view-button"
                    >
                      {actionLoading[`${doc.id}-view`] ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={actionLoading[`${doc.id}-download`]}
                      data-testid="download-button"
                    >
                      {actionLoading[`${doc.id}-download`] ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download
                    </Button>
                    {hasPermission('write') && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(doc)}
                          disabled={actionLoading[`${doc.id}-edit`]}
                          data-testid="edit-button"
                        >
                          {actionLoading[`${doc.id}-edit`] ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Edit className="w-4 h-4 mr-2" />
                          )}
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(doc)}
                          disabled={actionLoading[`${doc.id}-delete`]}
                          data-testid="delete-button"
                        >
                          {actionLoading[`${doc.id}-delete`] ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]" data-testid="upload-dialog">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload one or more PDF documents for this offering. Only PDF files are accepted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <DocumentDropzone
              selectedFiles={selectedFiles}
              onFilesChange={setSelectedFiles}
              error={fileError}
              onError={setFileError}
              maxFiles={10}
              maxSizeMB={25}
            />
            <div className="grid gap-2">
              <Label htmlFor="title">Document Title (optional)</Label>
              <Input
                id="title"
                value={documentForm.title}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Leave empty to use original filename"
                data-testid="title-input"
              />
              <div className="text-xs text-muted-foreground">
                If empty, will use original filename for each file
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={documentForm.category} 
                onValueChange={(value: DocumentCategory) => setDocumentForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger data-testid="category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Appraisal">Appraisal</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select 
                value={documentForm.visibility} 
                onValueChange={(value: DocumentVisibility) => setDocumentForm(prev => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger data-testid="visibility-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {uploading && Object.keys(uploadProgress).length > 0 && (
              <div className="grid gap-2">
                <Label>Upload Progress</Label>
                {Object.entries(uploadProgress).map(([filename, progress]) => (
                  <div key={filename} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{filename}</span>
                    <span>{progress}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUploadDialog(false);
                setFileError('');
                setSelectedFiles([]);
              }} 
              data-testid="upload-cancel-button"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || selectedFiles.length === 0 || !!fileError || !documentForm.category} 
              data-testid="upload-submit-button"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${selectedFiles.length} Document${selectedFiles.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]" data-testid="edit-dialog">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Document Title</Label>
              <Input
                id="edit-title"
                value={documentForm.title}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select 
                value={documentForm.category} 
                onValueChange={(value: DocumentCategory) => setDocumentForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Appraisal">Appraisal</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select 
                value={documentForm.visibility} 
                onValueChange={(value: DocumentVisibility) => setDocumentForm(prev => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="edit-cancel-button">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]" data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
            Are you sure you want to delete "{deletingDocument?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} data-testid="delete-cancel-button">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => confirmDelete()}>
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}