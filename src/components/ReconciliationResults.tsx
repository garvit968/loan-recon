import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReconciliationResult {
  firm: string;
  total_lent: string | number;  // Changed to string to handle INR format as well
  total_paid: string | number;  // Changed to string to handle INR format as well
  net_balance: string | number;  // Changed to string to handle INR format as well
  status: 'Balanced' | 'Overpaid' | 'Underpaid';
}

interface ReconciliationResultsProps {
  results: ReconciliationResult[];
}

const parseCurrency = (currencyString: string | number) => {
  // If the input is already a number, just return it
  if (typeof currencyString === 'number') {
    return currencyString;
  }
  // If it's a string like "₹100.00" or "100.00 INR", remove INR and non-numeric characters
  const numberString = currencyString.replace(/[^\d.-]/g, ''); // Remove non-numeric characters (except dot and minus)
  return parseFloat(numberString) || 0;  // Parse to number and default to 0 if invalid
};

export const ReconciliationResults: React.FC<ReconciliationResultsProps> = ({ results }) => {
  const [sortBy, setSortBy] = useState<'firm' | 'net_balance'>('firm');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortOrder === 'asc' 
      ? (parseCurrency(aValue) as number) - (parseCurrency(bValue) as number)
      : (parseCurrency(bValue) as number) - (parseCurrency(aValue) as number);
  });

  const handleSort = (column: 'firm' | 'net_balance') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Balanced':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Balanced</Badge>;
      case 'Overpaid':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Overpaid</Badge>;
      case 'Underpaid':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Underpaid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Overpaid':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'Underpaid':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-green-600" />;
    }
  };

  const exportToCSV = () => {
    const headers = ['Firm', 'Total Lent', 'Total Paid', 'Net Balance', 'Status'];
    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        result.firm,
        parseCurrency(result.total_lent),
        parseCurrency(result.total_paid),
        parseCurrency(result.net_balance),
        result.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-gray-900">
          Reconciliation Results
        </CardTitle>
        <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('firm')}
                >
                  Firm {sortBy === 'firm' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">Total Lent</TableHead>
                <TableHead className="text-right">Total Paid</TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('net_balance')}
                >
                  Net Balance {sortBy === 'net_balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResults.map((result, index) => (
                <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{result.firm}</TableCell>
                  <TableCell className="text-right font-mono">
                    ₹{parseCurrency(result.total_lent).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ₹{parseCurrency(result.total_paid).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${
                    parseCurrency(result.net_balance) > 0 ? 'text-blue-600' : 
                    parseCurrency(result.net_balance) < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ₹{parseCurrency(result.net_balance).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(result.status)}
                      {getStatusBadge(result.status)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
