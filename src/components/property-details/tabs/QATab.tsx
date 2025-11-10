import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Search, 
  User, 
  Calendar, 
  CheckCircle,
  Clock,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QATabProps {
  property: any;
}

export function QATab({ property }: QATabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const qaItems = [
    {
      id: '1',
      question: 'What is the expected timeline for the capital improvement program?',
      answer: 'The capital improvement program is planned to be completed over 18-24 months in three phases. Phase 1 (20 units) is already complete, Phase 2 (32 units) will begin in March 2024, and Phase 3 (32 units) is scheduled for Q4 2024.',
      askedBy: 'Sarah M.',
      answeredBy: 'Premium Real Estate Team',
      askedDate: '2024-01-18T14:30:00Z',
      answeredDate: '2024-01-19T09:15:00Z',
      status: 'answered',
      category: 'Operations',
      helpful: 23
    },
    {
      id: '2',
      question: 'How are distributions calculated and when are they paid?',
      answer: 'Distributions are calculated quarterly based on available cash flow after operating expenses and debt service. Payments are made within 45 days of quarter end. The current target is 7.5% annual yield, paid as approximately 1.875% per quarter.',
      askedBy: 'Michael T.',
      answeredBy: 'Premium Real Estate Team',
      askedDate: '2024-01-15T10:20:00Z',
      answeredDate: '2024-01-16T16:45:00Z',
      status: 'answered',
      category: 'Distributions',
      helpful: 18
    },
    {
      id: '3',
      question: 'What happens if the property sells before the planned hold period?',
      answer: 'If we receive an attractive offer that meets our return targets ahead of schedule, we may consider an early sale. All major decisions require investor approval. In such cases, investors would receive their share of sale proceeds according to the distribution waterfall outlined in the operating agreement.',
      askedBy: 'Jennifer L.',
      answeredBy: 'Premium Real Estate Team',
      askedDate: '2024-01-12T16:00:00Z',
      answeredDate: '2024-01-13T11:30:00Z',
      status: 'answered',
      category: 'Exit Strategy',
      helpful: 15
    },
    {
      id: '4',
      question: 'Are there any additional fees beyond those disclosed in the PPM?',
      answer: 'No, all fees are fully disclosed in the Private Placement Memorandum. The only fees are: 1.5% acquisition fee, 1.0% annual asset management fee, and 1.0% disposition fee. There are no hidden fees or additional charges to investors.',
      askedBy: 'Robert K.',
      answeredBy: 'Premium Real Estate Team',
      askedDate: '2024-01-10T13:45:00Z',
      answeredDate: '2024-01-11T08:20:00Z',
      status: 'answered',
      category: 'Fees',
      helpful: 21
    },
    {
      id: '5',
      question: 'What is the sponsor\'s track record with similar properties?',
      answer: 'Premium Real Estate has completed 12 similar multifamily value-add projects over the past 8 years, with an average IRR of 16.8% and equity multiple of 1.9x. Our team has never had a losing investment and has consistently met or exceeded projected returns.',
      askedBy: 'Lisa W.',
      answeredBy: 'Premium Real Estate Team',
      askedDate: '2024-01-08T11:15:00Z',
      answeredDate: '2024-01-09T14:00:00Z',
      status: 'answered',
      category: 'Sponsor',
      helpful: 31
    },
    {
      id: '6',
      question: 'Can I visit the property before investing?',
      answer: '',
      askedBy: 'David R.',
      answeredBy: '',
      askedDate: '2024-01-22T09:30:00Z',
      answeredDate: null,
      status: 'pending',
      category: 'Due Diligence',
      helpful: 0
    }
  ];

  const categories = ['All', 'Operations', 'Distributions', 'Exit Strategy', 'Fees', 'Sponsor', 'Due Diligence'];

  const filteredQA = qaItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitQuestion = () => {
    if (newQuestion.trim()) {
      // Handle question submission
      console.log('Submitting question:', newQuestion);
      setNewQuestion('');
      setShowQuestionModal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'answered':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Answered</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Ask Question */}
      <Card className="glass-card border-glass-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions and answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-glass-border"
              />
            </div>
            <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Ask a Question
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-glass-border">
                <DialogHeader>
                  <DialogTitle>Ask a Question</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="question" className="block text-sm font-medium mb-2">
                      Your Question
                    </label>
                    <Textarea
                      id="question"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Type your question here..."
                      className="glass border-glass-border min-h-[100px]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Questions will be reviewed and answered by the sponsor team within 2-3 business days.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitQuestion}
                      disabled={!newQuestion.trim()}
                      className="flex-1 bg-gradient-primary"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Question
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowQuestionModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
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

      {/* Q&A List */}
      <div className="space-y-4">
        {filteredQA.map((item) => (
          <Card key={item.id} className="glass-card border-glass-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Question */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-medium text-lg leading-relaxed">{item.question}</h3>
                    <div className="flex gap-2 shrink-0">
                      {getStatusBadge(item.status)}
                      <Badge variant="outline" className="glass border-glass-border">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Asked by {item.askedBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.askedDate), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {/* Answer */}
                {item.status === 'answered' ? (
                  <>
                    <Separator className="bg-glass-border" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="font-medium text-green-400">Answer from {item.answeredBy}</span>
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed pl-6">
                        {item.answer}
                      </p>
                      
                      <div className="flex items-center justify-between pl-6">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Answered {formatDistanceToNow(new Date(item.answeredDate!), { addSuffix: true })}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            {item.helpful} found this helpful
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass border-glass-border"
                        >
                          Helpful
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600 pl-6">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Awaiting sponsor response</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Q&A Summary */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>Q&A Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{qaItems.length}</div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {qaItems.filter(q => q.status === 'answered').length}
              </div>
              <div className="text-sm text-muted-foreground">Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {qaItems.filter(q => q.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">2-3</div>
              <div className="text-sm text-muted-foreground">Response Time (Days)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}