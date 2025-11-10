import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Shield, 
  AlertCircle,
  Calendar,
  Lock
} from 'lucide-react';

interface DocumentsTabProps {
  property: any;
}

export function DocumentsTab({ property }: DocumentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [isSearchOpen]);

  const documents = [
    {
      id: '1',
      title: 'Private Placement Memorandum (PPM)',
      type: 'Legal',
      size: '2.4 MB',
      uploadDate: '2024-01-15',
      status: 'current',
      requiresNda: false,
      downloadCount: 247,
      viewCount: 892,
      description: 'Complete offering document with investment terms and risk disclosures'
    },
    {
      id: '2',
      title: 'Operating Agreement',
      type: 'Legal',
      size: '1.8 MB',
      uploadDate: '2024-01-15',
      status: 'current',
      requiresNda: false,
      downloadCount: 156,
      viewCount: 534,
      description: 'LLC operating agreement governing the investment structure'
    },
    {
      id: '3',
      title: 'Subscription Documents',
      type: 'Legal',
      size: '0.9 MB',
      uploadDate: '2024-01-15',
      status: 'current',
      requiresNda: false,
      downloadCount: 89,
      viewCount: 312,
      description: 'Investment subscription and investor verification forms'
    },
    {
      id: '4',
      title: 'Property Appraisal',
      type: 'Valuation',
      size: '5.2 MB',
      uploadDate: '2024-01-10',
      status: 'current',
      requiresNda: true,
      downloadCount: 67,
      viewCount: 203,
      description: 'Third-party MAI appraisal report dated December 2023'
    },
    {
      id: '5',
      title: 'Environmental Assessment (Phase I)',
      type: 'Due Diligence',
      size: '3.1 MB',
      uploadDate: '2024-01-08',
      status: 'current',
      requiresNda: true,
      downloadCount: 45,
      viewCount: 128,
      description: 'Environmental site assessment with no adverse findings'
    },
    {
      id: '6',
      title: 'Market Study & Rent Analysis',
      type: 'Market Research',
      size: '4.7 MB',
      uploadDate: '2024-01-12',
      status: 'updated',
      requiresNda: true,
      downloadCount: 78,
      viewCount: 245,
      description: 'Comprehensive market analysis and competitive rent survey'
    },
    {
      id: '7',
      title: 'Current Rent Roll',
      type: 'Operations',
      size: '0.3 MB',
      uploadDate: '2024-01-20',
      status: 'new',
      requiresNda: true,
      downloadCount: 23,
      viewCount: 67,
      description: 'Unit-by-unit rent roll as of January 1, 2024'
    },
    {
      id: '8',
      title: 'Insurance Certificate',
      type: 'Insurance',
      size: '0.8 MB',
      uploadDate: '2024-01-18',
      status: 'new',
      requiresNda: false,
      downloadCount: 34,
      viewCount: 89,
      description: 'Property and liability insurance certificates'
    },
    {
      id: '9',
      title: 'Tax Documents Timeline',
      type: 'Tax',
      size: '0.2 MB',
      uploadDate: '2024-01-15',
      status: 'current',
      requiresNda: false,
      downloadCount: 156,
      viewCount: 445,
      description: 'Expected K-1 and 1099 distribution schedule'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">New</Badge>;
      case 'updated':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Updated</Badge>;
      default:
        return null;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'Legal':
        return <FileText className="h-5 w-5 text-blue-400" />;
      case 'Valuation':
        return <FileText className="h-5 w-5 text-green-400" />;
      case 'Due Diligence':
        return <FileText className="h-5 w-5 text-yellow-400" />;
      case 'Market Research':
        return <FileText className="h-5 w-5 text-purple-400" />;
      case 'Operations':
        return <FileText className="h-5 w-5 text-orange-400" />;
      case 'Insurance':
        return <FileText className="h-5 w-5 text-red-400" />;
      case 'Tax':
        return <FileText className="h-5 w-5 text-indigo-400" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDocumentAccess = (doc: any) => {
    if (doc.requiresNda && !ndaAccepted) {
      setShowNdaModal(true);
    } else {
      // Handle download/view
      console.log('Accessing document:', doc.title);
    }
  };

  const handleNdaAccept = () => {
    setNdaAccepted(true);
    setShowNdaModal(false);
  };

  const documentCategories = ['All', 'Legal', 'Valuation', 'Due Diligence', 'Market Research', 'Operations', 'Insurance', 'Tax'];

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card className="glass-card border-glass-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Search documents"
                  className="h-10 w-10 rounded-full border border-glass-border bg-background/70 text-muted-foreground transition-colors hover:bg-background/80 hover:text-primary"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="glass-card border-glass-border w-72 p-4"
              >
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Quick Search
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setIsSearchOpen(false);
                        }
                      }}
                      className="pl-9 glass border-glass-border focus-visible:ring-0"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-2">
              {documentCategories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  className="glass border-glass-border"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NDA Status */}
      {!ndaAccepted && (
        <Card className="glass-card border-glass-border border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-yellow-400" />
              <div className="flex-1">
                <div className="font-medium text-yellow-400">Some documents require NDA acceptance</div>
                <div className="text-sm text-muted-foreground">
                  Click on any restricted document to review and sign the NDA
                </div>
              </div>
              <Button 
                onClick={() => setShowNdaModal(true)}
                className="bg-gradient-primary"
                size="sm"
              >
                Review NDA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="glass-card border-glass-border hover:shadow-neon transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="shrink-0">
                    {getDocumentIcon(doc.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      {getStatusBadge(doc.status)}
                      {doc.requiresNda && (
                        <Badge variant="outline" className="glass border-glass-border">
                          <Shield className="h-3 w-3 mr-1" />
                          NDA Required
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {doc.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </div>
                      <span>{doc.size}</span>
                      <span>{doc.type}</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {doc.viewCount} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {doc.downloadCount} downloads
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass border-glass-border"
                    onClick={() => handleDocumentAccess(doc)}
                    disabled={doc.requiresNda && !ndaAccepted}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass border-glass-border"
                    onClick={() => handleDocumentAccess(doc)}
                    disabled={doc.requiresNda && !ndaAccepted}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Summary */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>Document Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{documents.length}</div>
              <div className="text-sm text-muted-foreground">Total Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {documents.filter(d => !d.requiresNda).length}
              </div>
              <div className="text-sm text-muted-foreground">Public Access</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {documents.filter(d => d.requiresNda).length}
              </div>
              <div className="text-sm text-muted-foreground">NDA Required</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {documents.filter(d => d.status === 'new').length}
              </div>
              <div className="text-sm text-muted-foreground">Recently Added</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NDA Modal */}
      <Dialog open={showNdaModal} onOpenChange={setShowNdaModal}>
        <DialogContent className="glass-card border-glass-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Non-Disclosure Agreement
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-semibold mb-2">Agreement Terms</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>By accepting this NDA, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Keep all proprietary information confidential</li>
                  <li>Use information solely for investment evaluation</li>
                  <li>Not disclose information to third parties</li>
                  <li>Return or destroy documents upon request</li>
                  <li>Acknowledge information is proprietary to the sponsor</li>
                </ul>
                <p className="mt-4">
                  This agreement remains in effect for 2 years from acceptance date.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="nda-terms" />
              <label htmlFor="nda-terms" className="text-sm">
                I have read and agree to the terms of the Non-Disclosure Agreement
              </label>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowNdaModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-primary"
              onClick={handleNdaAccept}
            >
              Accept & Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
