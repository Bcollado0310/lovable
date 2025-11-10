import { useState } from 'react';
import { LayoutHeader } from "@/components/layout/LayoutHeader";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useTransactionFilters } from "@/hooks/useTransactionFilters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import TransactionFiltersBar from '@/components/transactions/TransactionFiltersBar';
import TransactionKPIs from '@/components/transactions/TransactionKPIs';
import CashFlowChart from '@/components/transactions/CashFlowChart';
import TransactionLedger from '@/components/transactions/TransactionLedger';
import StatementsPanel from '@/components/transactions/StatementsPanel';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';

export default function TransactionsPage() {
  const { transactions, loading, error, refreshData } = usePortfolioData();
  const { filterTransactions, groupTransactions, getDateRange } = useTransactionFilters();
  const [showStatementsPanel, setShowStatementsPanel] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-destructive">
            <AlertDescription>
              Error loading transactions: {error}
              <Button 
                onClick={refreshData} 
                className="ml-4"
                size="sm"
                variant="outline"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Filter and group transactions
  const filteredTransactions = filterTransactions(transactions);
  const groupedTransactions = groupTransactions(filteredTransactions);

  const handleExportCSV = () => {
    toast({
      title: "Exporting CSV",
      description: "Your transaction data will be downloaded shortly."
    });
    // Implementation would export filtered transactions to CSV
  };

  const handleExportXLSX = () => {
    toast({
      title: "Exporting Excel",
      description: "Your transaction data will be downloaded shortly."
    });
    // Implementation would export filtered transactions to XLSX
  };

  const handleGenerateStatement = () => {
    toast({
      title: "Generating Statement",
      description: "Your PDF statement will be ready in a moment."
    });
    // Implementation would generate PDF statement
  };

  const handleConnectBank = () => {
    toast({
      title: "Connect Bank Account",
      description: "Redirecting to secure bank connection..."
    });
    // Implementation would initiate bank connection flow
  };

  const handleExportSelected = (selectedTransactions: any[]) => {
    toast({
      title: `Exporting ${selectedTransactions.length} transactions`,
      description: "Selected transactions will be downloaded."
    });
    // Implementation would export only selected transactions
  };

  const handleDownloadTaxDoc = (docId: string) => {
    toast({
      title: "Downloading Tax Document",
      description: "Your tax document will be downloaded."
    });
    // Implementation would download the specific tax document
  };

  return (
    <div className="min-h-screen bg-background">
      <LayoutHeader title="Transactions" />
      
      {/* Fixed Filters Bar */}
      <TransactionFiltersBar
        onExportCSV={handleExportCSV}
        onExportXLSX={handleExportXLSX}
        onGenerateStatement={handleGenerateStatement}
        onConnectBank={handleConnectBank}
        isBankConnected={false}
      />

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* KPI Row */}
          <TransactionKPIs transactions={filteredTransactions} loading={loading} />

          {/* Cash Flow Chart */}
          <CashFlowChart 
            transactions={filteredTransactions} 
            dateRange={getDateRange}
            loading={loading}
          />

          {/* Transaction Ledger */}
          <TransactionLedger 
            transactions={groupedTransactions}
            loading={loading}
            onExportSelected={handleExportSelected}
          />
        </div>

        {/* Right Panel - Statements & Tax */}
        <div className="w-96 border-l bg-muted/20 p-6">
          <StatementsPanel
            onGenerateStatement={handleGenerateStatement}
            onDownloadTaxDoc={handleDownloadTaxDoc}
          />
        </div>
      </div>
    </div>
  );
}