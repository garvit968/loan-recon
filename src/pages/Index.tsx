
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, DollarSign, TrendingUp, MessageSquare } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { ReconciliationResults } from '@/components/ReconciliationResults';
import { ChatBot } from '@/components/ChatBot';
import { reconcileLoans } from '@/utils/reconciliation';
import { toast } from '@/hooks/use-toast';

interface LendingRecord {
  firm: string;
  loan_amount: number;
}

interface SettlementRecord {
  firm: string;
  payment_amount: number;
}

interface ReconciliationResult {
  firm: string;
  total_lent: number;
  total_paid: number;
  net_balance: number;
  status: 'Balanced' | 'Overpaid' | 'Underpaid';
}

const Index = () => {
  const [lendingsData, setLendingsData] = useState<LendingRecord[]>([]);
  const [settlementsData, setSettlementsData] = useState<SettlementRecord[]>([]);
  const [reconciliationResults, setReconciliationResults] = useState<ReconciliationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);

  const handleLendingsUpload = (data: LendingRecord[]) => {
    setLendingsData(data);
    toast({
      title: "Lendings file uploaded",
      description: `Successfully loaded ${data.length} lending records`,
    });
  };

  const handleSettlementsUpload = (data: SettlementRecord[]) => {
    setSettlementsData(data);
    toast({
      title: "Settlements file uploaded", 
      description: `Successfully loaded ${data.length} settlement records`,
    });
  };

  const handleReconciliation = async () => {
    if (lendingsData.length === 0 || settlementsData.length === 0) {
      toast({
        title: "Missing files",
        description: "Please upload both lendings and settlements files",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const results = reconcileLoans(lendingsData, settlementsData);
      setReconciliationResults(results);
      toast({
        title: "Reconciliation complete",
        description: `Processed ${results.length} firms`,
      });
    } catch (error) {
      toast({
        title: "Reconciliation failed",
        description: "Error processing the reconciliation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalLent = reconciliationResults.reduce((sum, result) => sum + result.total_lent, 0);
  const totalPaid = reconciliationResults.reduce((sum, result) => sum + result.total_paid, 0);
  const balancedCount = reconciliationResults.filter(r => r.status === 'Balanced').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Loan Reconciliation System
          </h1>
          <p className="text-lg text-gray-600">
            Advanced financial reconciliation with AI assistance
          </p>
        </div>

        {/* Summary Cards */}
        {reconciliationResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lent</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{totalLent.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{totalPaid.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Difference</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{(totalPaid - totalLent).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balanced Firms</CardTitle>
                <Upload className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {balancedCount}/{reconciliationResults.length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* File Upload Section */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                File Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUploader
                title="Lendings File"
                description="Upload CSV with 'firm' and 'loan_amount' columns"
                onFileUpload={handleLendingsUpload}
                expectedColumns={['firm', 'loan_amount']}
                recordCount={lendingsData.length}
              />
              
              <FileUploader
                title="Settlements File"
                description="Upload CSV with 'firm' and 'payment_amount' columns"
                onFileUpload={handleSettlementsUpload}
                expectedColumns={['firm', 'payment_amount']}
                recordCount={settlementsData.length}
              />

              <Button 
                onClick={handleReconciliation}
                disabled={isProcessing || lendingsData.length === 0 || settlementsData.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                {isProcessing ? 'Processing...' : 'Run Reconciliation'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Get help with your reconciliation process from our AI-powered financial assistant.
                </p>
                <Button 
                  onClick={() => setShowChatBot(!showChatBot)}
                  variant="outline"
                  className="w-full border-green-200 text-green-700 hover:bg-green-50"
                >
                  {showChatBot ? 'Hide Assistant' : 'Open AI Assistant'}
                </Button>
                
                {showChatBot && (
                  <div className="mt-4">
                    <ChatBot reconciliationResults={reconciliationResults} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {reconciliationResults.length > 0 && (
          <ReconciliationResults results={reconciliationResults} />
        )}
      </div>
    </div>
  );
};

export default Index;
