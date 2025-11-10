import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Shield, 
  DollarSign, 
  Users, 
  Building, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface TermsTabProps {
  property: any;
}

export function TermsTab({ property }: TermsTabProps) {
  const offeringTerms = {
    type: 'Regulation D, Rule 506(c)',
    classification: 'Private Placement',
    totalOffering: 8500000,
    minInvestment: 50000,
    maxInvestment: 1000000,
    investorLimit: 99,
    accreditationRequired: true,
    fundingDeadline: '2024-03-15',
    escrowAgent: 'First National Trust Company',
    closingFrequency: 'Monthly'
  };

  const eligibilityRequirements = [
    {
      category: 'Accredited Investor',
      requirements: [
        'Individual income >$200K (or $300K joint) in each of last 2 years',
        'Net worth >$1M (excluding primary residence)',
        'Investment advisor in good standing',
        'Certain institutional investors'
      ]
    },
    {
      category: 'Qualified Purchaser',
      requirements: [
        'Individual with >$5M in investments',
        'Family company with >$5M in investments',
        'Certain trusts and institutional investors'
      ]
    }
  ];

  const transferRestrictions = [
    'Securities are restricted and may not be sold or transferred without registration or exemption',
    'No public market exists for these securities',
    'Transfer restrictions may limit liquidity',
    'Transfers subject to sponsor approval and compliance with securities laws',
    'Right of first refusal in favor of the company'
  ];

  const kycBanking = [
    {
      step: 'Identity Verification',
      description: 'Government-issued photo ID and address verification',
      status: 'Required'
    },
    {
      step: 'Accreditation Verification',
      description: 'Income/net worth documentation or third-party verification',
      status: 'Required'
    },
    {
      step: 'Banking Information',
      description: 'Voided check or bank statement for ACH setup',
      status: 'Required'
    },
    {
      step: 'Tax Documentation',
      description: 'W-9 form for US investors, W-8BEN for foreign investors',
      status: 'Required'
    },
    {
      step: 'Source of Funds',
      description: 'Documentation of investment source (if >$100K)',
      status: 'Conditional'
    }
  ];

  const feeStructure = [
    {
      fee: 'Acquisition Fee',
      rate: '1.5%',
      basis: 'Purchase Price',
      amount: 357000,
      description: 'One-time fee paid to sponsor at closing'
    },
    {
      fee: 'Asset Management Fee',
      rate: '1.0%',
      basis: 'Annual NOI',
      amount: 25515,
      description: 'Quarterly fee for ongoing property management'
    },
    {
      fee: 'Disposition Fee',
      rate: '1.0%',
      basis: 'Gross Sale Price',
      amount: 340000,
      description: 'Fee paid upon property sale or refinancing'
    }
  ];

  const riskFactors = [
    'Real estate investments are speculative and involve substantial risk of loss',
    'No guarantee of return of capital or achievement of target returns',
    'Illiquid investment with no ready market for resale',
    'Interest rate fluctuations may affect property values and financing',
    'Local market conditions may adversely affect property performance',
    'Concentration risk in single property and geographic area',
    'Sponsor and management risks related to experience and execution',
    'Regulatory and tax law changes may impact investment returns'
  ];

  const stateNotices = [
    {
      state: 'California',
      notice: 'This investment has not been approved by the California Commissioner of Corporations. This investment may be sold in California only to "qualified institutional buyers" as defined in California Corporations Code Section 25105.'
    },
    {
      state: 'New York',
      notice: 'This investment is not registered in New York and may only be offered to qualified investors as defined under New York securities law.'
    }
  ];

  const distributionMethods = [
    {
      method: 'ACH Transfer',
      description: 'Direct deposit to investor bank account',
      fee: 'No fee',
      timing: '1-3 business days'
    },
    {
      method: 'Wire Transfer',
      description: 'Bank wire transfer for international or large distributions',
      fee: '$25 per wire',
      timing: 'Same day'
    },
    {
      method: 'Check',
      description: 'Physical check mailed to registered address',
      fee: '$5 per check',
      timing: '5-7 business days'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Offering Overview */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Offering Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offering Type</span>
                <Badge variant="outline" className="glass border-glass-border">
                  {offeringTerms.type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classification</span>
                <span className="font-medium">{offeringTerms.classification}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Offering</span>
                <span className="font-medium text-primary">
                  ${offeringTerms.totalOffering.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investor Limit</span>
                <span className="font-medium">{offeringTerms.investorLimit} maximum</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Investment</span>
                <span className="font-medium text-primary">
                  ${offeringTerms.minInvestment.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maximum Investment</span>
                <span className="font-medium">
                  ${offeringTerms.maxInvestment.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Funding Deadline</span>
                <span className="font-medium">{new Date(offeringTerms.fundingDeadline).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Closing Frequency</span>
                <span className="font-medium">{offeringTerms.closingFrequency}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-glass-border" />

          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-blue-400">Escrow Protection</span>
            </div>
            <p className="text-sm text-muted-foreground">
              All investor funds are held in escrow by {offeringTerms.escrowAgent} until 
              the minimum funding threshold is met. Funds will be returned if the offering is not successful.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Investor Eligibility */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Investor Eligibility Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {eligibilityRequirements.map((category, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                {category.category}
              </h3>
              <div className="space-y-2 ml-6">
                {category.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <span className="text-sm">{req}</span>
                  </div>
                ))}
              </div>
              {index < eligibilityRequirements.length - 1 && (
                <Separator className="bg-glass-border mt-4" />
              )}
            </div>
          ))}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This offering is limited to accredited investors only. 
              Investors must verify their accredited status before investing. 
              Non-accredited investors are not eligible to participate.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* KYC/Banking Process */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            KYC & Banking Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kycBanking.map((step, index) => (
              <div key={index} className="flex items-start gap-4 p-4 glass rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-medium shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{step.step}</h3>
                    <Badge 
                      variant={step.status === 'Required' ? 'default' : 'outline'} 
                      className="glass border-glass-border"
                    >
                      {step.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Restrictions */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Transfer Restrictions & Liquidity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transferRestrictions.map((restriction, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                <span className="text-sm">{restriction}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribution Methods */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Distribution Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {distributionMethods.map((method, index) => (
              <div key={index} className="p-4 glass rounded-lg">
                <h3 className="font-medium mb-2">{method.method}</h3>
                <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fee:</span>
                  <span>{method.fee}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Timing:</span>
                  <span>{method.timing}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fee Summary */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Fee Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-2">Fee Type</th>
                  <th className="text-center py-2">Rate</th>
                  <th className="text-center py-2">Basis</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-left py-2 pl-4">Description</th>
                </tr>
              </thead>
              <tbody>
                {feeStructure.map((fee, index) => (
                  <tr key={index} className="border-b border-glass-border/50">
                    <td className="py-3 font-medium">{fee.fee}</td>
                    <td className="text-center py-3">{fee.rate}</td>
                    <td className="text-center py-3">{fee.basis}</td>
                    <td className="text-right py-3 font-medium text-primary">
                      ${fee.amount.toLocaleString()}
                    </td>
                    <td className="py-3 pl-4 text-sm text-muted-foreground">
                      {fee.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      <Card className="glass-card border-glass-border border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Risk Factors & Disclaimers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskFactors.map((risk, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <span className="text-sm">{risk}</span>
              </div>
            ))}
          </div>
          
          <Separator className="bg-glass-border my-6" />
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>This is not an offer to sell securities.</strong> Any offering will be made solely 
              through the Private Placement Memorandum. Past performance is not indicative of future results. 
              Please read all offering documents carefully before investing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* State Notices */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle>State-Specific Notices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stateNotices.map((notice, index) => (
            <div key={index} className="p-4 bg-muted/20 rounded-lg border border-muted/50">
              <h3 className="font-medium mb-2">{notice.state}</h3>
              <p className="text-sm text-muted-foreground">{notice.notice}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}