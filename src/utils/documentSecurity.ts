import React from 'react';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';

// Document sensitivity classification
export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'Public' | 'Private';
  downloads: number;
  // PII risk assessment
  containsPII: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
  redactedPreview?: string; // Path to redacted version
  allowedRoles: ('admin' | 'developer' | 'viewer' | 'manager' | 'owner' | 'editor')[];
}

// Define which document types typically contain PII
const PII_DOCUMENT_TYPES = [
  'Legal', // May contain signature pages, contact info
  'Investor Agreement', // Contains personal details
  'Subscription', // Contains investor personal info
  'KYC', // Know Your Customer documents
  'AML', // Anti-Money Laundering documents
  'Identity', // ID verification
  'Financial Statement', // Personal financial info
  'Tax', // Personal tax information
  'Compliance' // May contain personal details
];

// Analytics events that are safe for developers (no PII)
export const developerAnalytics = {
  documentViewed: (docType: string, docId: string) => {
    console.log('Dev Analytics: document_viewed', { 
      document_type: docType,
      document_id: docId.slice(0, 8) + '***', // Truncated ID
      timestamp: Date.now(),
      user_role: 'developer'
    });
  },
  
  documentDownloaded: (docType: string, docId: string) => {
    console.log('Dev Analytics: document_downloaded', { 
      document_type: docType,
      document_id: docId.slice(0, 8) + '***',
      timestamp: Date.now(),
      user_role: 'developer'
    });
  },

  mediaViewed: (mediaType: 'image' | 'video', mediaId: string) => {
    console.log('Dev Analytics: media_viewed', {
      media_type: mediaType,
      media_id: mediaId.slice(0, 8) + '***',
      timestamp: Date.now(),
      user_role: 'developer'
    });
  },

  tabChanged: (fromTab: string, toTab: string) => {
    console.log('Dev Analytics: tab_changed', {
      from_tab: fromTab,
      to_tab: toTab,
      timestamp: Date.now(),
      user_role: 'developer'
    });
  }
};

// Admin analytics (can include more detailed info)
export const adminAnalytics = {
  documentViewed: (docType: string, docId: string, docName: string, userId?: string) => {
    console.log('Admin Analytics: document_viewed', { 
      document_type: docType,
      document_id: docId,
      document_name: docName,
      user_id: userId,
      timestamp: Date.now(),
      user_role: 'admin'
    });
  },
  
  documentDownloaded: (docType: string, docId: string, docName: string, userId?: string) => {
    console.log('Admin Analytics: document_downloaded', { 
      document_type: docType,
      document_id: docId,
      document_name: docName,
      user_id: userId,
      timestamp: Date.now(),
      user_role: 'admin'
    });
  }
};

// Document filtering based on user role
export function filterDocumentsForRole(
  documents: DocumentMetadata[], 
  userRole: 'admin' | 'developer' | 'viewer' | 'manager' | 'owner' | 'editor'
): DocumentMetadata[] {
  return documents.filter(doc => {
    // Always allow documents explicitly marked for the role
    if (doc.allowedRoles.includes(userRole)) {
      return true;
    }

    // For developers and similar roles, hide high-sensitivity documents
    if (['developer', 'editor', 'viewer'].includes(userRole)) {
      if (doc.sensitivityLevel === 'high' || doc.containsPII) {
        return false;
      }
      
      // Hide certain document types that typically contain PII
      if (PII_DOCUMENT_TYPES.includes(doc.type)) {
        return false;
      }
    }

    // Default to showing if not explicitly restricted
    return true;
  });
}

// Generate safe document metadata for developers
export function sanitizeDocumentForDeveloper(doc: DocumentMetadata): DocumentMetadata {
  return {
    ...doc,
    // Sanitize uploader info for developers
    uploadedBy: doc.uploadedBy.includes('Admin') ? 'Admin' : 'Team Member',
    // Hide exact download counts for sensitive docs
    downloads: doc.containsPII ? 0 : doc.downloads,
    // Provide generic filename if needed
    name: doc.containsPII ? 
      `${doc.type}_Document_${doc.id.slice(0, 6)}.pdf` : 
      doc.name
  };
}

// Check if a document is safe to preview for developers
export function canPreviewDocument(doc: DocumentMetadata, userRole: 'admin' | 'developer' | 'manager' | 'owner' | 'editor' | 'viewer'): boolean {
  if (userRole === 'admin' || userRole === 'manager' || userRole === 'owner') {
    return true;
  }

  // Developers and similar roles can only preview non-PII documents
  return !doc.containsPII && 
         !PII_DOCUMENT_TYPES.includes(doc.type) && 
         doc.sensitivityLevel !== 'high';
}

// Get appropriate analytics function based on user role
export function getAnalyticsForRole(userRole: 'admin' | 'developer' | 'manager' | 'owner' | 'editor' | 'viewer') {
  return (userRole === 'admin' || userRole === 'manager' || userRole === 'owner') ? adminAnalytics : developerAnalytics;
}

// Hook for role-aware document access
export function useDocumentAccess() {
  const { userRole } = useDeveloperAuth();
  
  const filterDocuments = (documents: DocumentMetadata[]) => 
    filterDocumentsForRole(documents, userRole || 'developer');
  
  const sanitizeDocument = (doc: DocumentMetadata) => 
    ['developer', 'editor', 'viewer'].includes(userRole || 'developer') ? sanitizeDocumentForDeveloper(doc) : doc;
  
  const canPreview = (doc: DocumentMetadata) => 
    canPreviewDocument(doc, userRole || 'developer');
  
  const analytics = getAnalyticsForRole(userRole || 'developer');
  
  return {
    filterDocuments,
    sanitizeDocument,
    canPreview,
    analytics,
    userRole: userRole || 'developer'
  };
}