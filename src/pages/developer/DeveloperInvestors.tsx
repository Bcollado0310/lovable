import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeveloperAuth } from "@/contexts/DeveloperAuthContext";
import { useDeveloperInvestors } from "@/hooks/useDeveloperData";
import { formatCurrency } from "@/utils/developerHelpers";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Mail, Phone, Building2, DollarSign, Send } from "lucide-react";
export default function DeveloperInvestors() {
  const {
    organization,
    hasPermission
  } = useDeveloperAuth();
  const {
    data: investors,
    loading,
    error
  } = useDeveloperInvestors(organization?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading investors: {error}</p>
          </CardContent>
        </Card>
      </div>;
  }
  const filteredInvestors = investors.filter(investor => `${investor.first_name} ${investor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || investor.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const summary = {
    totalInvestors: investors.length,
    totalInvested: investors.reduce((sum, inv) => sum + inv.total_invested, 0),
    averageInvestment: investors.length > 0 ? investors.reduce((sum, inv) => sum + inv.total_invested, 0) / investors.length : 0,
    activeInvestors: investors.filter(inv => inv.status === 'active').length
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investors</h1>
          <p className="text-muted-foreground">
            Manage your investor relationships
          </p>
        </div>
        {hasPermission('write')}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalInvestors}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalInvested)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageInvestment)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeInvestors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search investors by name or email..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Investors List */}
      <div className="grid gap-4">
        {filteredInvestors.map(investor => <Card key={investor.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {investor.first_name?.[0] ?? investor.last_name?.[0] ?? '?'}{investor.last_name?.[0] ?? ''}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{`${investor.first_name ?? ''} ${investor.last_name ?? ''}`.trim() || 'Investor'}</h3>
                      <Badge variant={getStatusColor(investor.status)}>
                        {investor.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{investor.investor_type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {investor.email}
                      </span>
                      {investor.phone && <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {investor.phone}
                        </span>}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-semibold text-lg">{formatCurrency(investor.total_invested)}</div>
                  <div className="text-sm text-muted-foreground">
                    Investments: {investor.investment_count}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Total Invested: {formatCurrency(investor.total_invested)}</div>
                    <div className="text-sm text-muted-foreground">
                      Status: {investor.status} • Type: {investor.investor_type}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    
                    {hasPermission('write')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>;
}