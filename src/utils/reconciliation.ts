
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

export const reconcileLoans = (
  lendings: LendingRecord[], 
  settlements: SettlementRecord[]
): ReconciliationResult[] => {
  // Summarize lending by firm
  const lentSummary = new Map<string, number>();
  lendings.forEach(record => {
    const current = lentSummary.get(record.firm) || 0;
    lentSummary.set(record.firm, current + record.loan_amount);
  });

  // Summarize settlements by firm
  const paidSummary = new Map<string, number>();
  settlements.forEach(record => {
    const current = paidSummary.get(record.firm) || 0;
    paidSummary.set(record.firm, current + record.payment_amount);
  });

  // Get all unique firms
  const allFirms = new Set([...lentSummary.keys(), ...paidSummary.keys()]);

  // Generate reconciliation results
  const results: ReconciliationResult[] = [];
  
  allFirms.forEach(firm => {
    const totalLent = lentSummary.get(firm) || 0;
    const totalPaid = paidSummary.get(firm) || 0;
    const netBalance = totalPaid - totalLent;

    let status: 'Balanced' | 'Overpaid' | 'Underpaid';
    if (netBalance === 0) {
      status = 'Balanced';
    } else if (netBalance > 0) {
      status = 'Overpaid';
    } else {
      status = 'Underpaid';
    }

    results.push({
      firm,
      total_lent: totalLent,
      total_paid: totalPaid,
      net_balance: netBalance,
      status
    });
  });

  return results;
};
