import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Percent, Calculator, Edit } from 'lucide-react';
import { DeveloperOffering, formatCurrency, formatPercentage } from '@/utils/developerHelpers';
import { useDeveloperAuth } from '@/contexts/DeveloperAuthContext';
interface PricingTabProps {
  offering: DeveloperOffering;
}
export function PricingTab({
  offering
}: PricingTabProps) {
  const {
    hasPermission
  } = useDeveloperAuth();

  // Mock pricing tiers - in real app this would come from API
  const pricingTiers = [{
    id: '1',
    name: 'Standard',
    minAmount: 1000,
    maxAmount: 24999,
    feePercent: 2.5,
    isActive: true
  }, {
    id: '2',
    name: 'Premium',
    minAmount: 25000,
    maxAmount: 99999,
    feePercent: 2.0,
    isActive: true
  }, {
    id: '3',
    name: 'VIP',
    minAmount: 100000,
    maxAmount: null,
    feePercent: 1.5,
    isActive: true
  }];
  const fees = {
    platformFee: 2.5,
    processingFee: 0.3,
    wireTransferFee: 25
  };
  return <div className="space-y-6">
      {/* Current Pricing Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(offering.target_amount)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minimum Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(offering.minimum_investment)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Return</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {offering.expected_annual_return ? formatPercentage(offering.expected_annual_return) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fee</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(fees.platformFee)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pricing Configuration</CardTitle>
              <CardDescription>
                Set the funding goal and investment parameters
              </CardDescription>
            </div>
            {hasPermission('write')}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target">Target Amount</Label>
              <Input id="target" value={formatCurrency(offering.target_amount)} disabled={!hasPermission('write')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimum">Minimum Investment</Label>
              <Input id="minimum" value={formatCurrency(offering.minimum_investment)} disabled={!hasPermission('write')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return">Expected Annual Return (%)</Label>
              <Input id="return" value={offering.expected_annual_return || ''} disabled={!hasPermission('write')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Funding Deadline</Label>
              <Input id="deadline" type="date" value={offering.funding_deadline?.split('T')[0] || ''} disabled={!hasPermission('write')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Tiers</CardTitle>
          <CardDescription>
            Different fee structures based on investment amount
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pricingTiers.map(tier => <div key={tier.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{tier.name}</h4>
                    <Badge variant={tier.isActive ? 'default' : 'secondary'}>
                      {tier.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(tier.minAmount)} - {tier.maxAmount ? formatCurrency(tier.maxAmount) : 'No limit'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPercentage(tier.feePercent)} fee</p>
                  {hasPermission('write') && <Button variant="outline" size="sm" className="mt-1">
                      Edit
                    </Button>}
                </div>
              </div>)}
          </div>
          {hasPermission('write') && <Button variant="outline" className="w-full mt-4">
              Add New Tier
            </Button>}
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Structure</CardTitle>
          <CardDescription>
            Breakdown of all fees applied to investments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Platform Fee</h4>
                <p className="text-sm text-muted-foreground">
                  Percentage of investment amount
                </p>
              </div>
              <p className="font-semibold">{formatPercentage(fees.platformFee)}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Processing Fee</h4>
                <p className="text-sm text-muted-foreground">
                  Payment processing charges
                </p>
              </div>
              <p className="font-semibold">{formatPercentage(fees.processingFee)}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Wire Transfer Fee</h4>
                <p className="text-sm text-muted-foreground">
                  For bank wire transfers
                </p>
              </div>
              <p className="font-semibold">{formatCurrency(fees.wireTransferFee)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Calculator</CardTitle>
          <CardDescription>
            Preview how fees are calculated for different investment amounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[5000, 25000, 100000].map(amount => {
              const tier = pricingTiers.find(t => amount >= t.minAmount && (t.maxAmount === null || amount <= t.maxAmount));
              const platformFee = amount * (tier?.feePercent || 0) / 100;
              const processingFee = amount * fees.processingFee / 100;
              const totalFees = platformFee + processingFee;
              const netAmount = amount - totalFees;
              return <div key={amount} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{formatCurrency(amount)} Investment</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Investment Amount:</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Platform Fee:</span>
                        <span>-{formatCurrency(platformFee)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Processing Fee:</span>
                        <span>-{formatCurrency(processingFee)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Amount to Project:</span>
                        <span>{formatCurrency(netAmount)}</span>
                      </div>
                    </div>
                  </div>;
            })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}