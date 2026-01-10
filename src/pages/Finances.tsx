// Finances Page - Team financial management

import { useState, useMemo } from 'react';
import { useGameStore } from '../store';
import { economyService } from '../services';
import type { Transaction, Loan } from '../types';
import type { LoanOption, SponsorshipOffer } from '../engine/team';

type FinanceTab = 'overview' | 'transactions' | 'sponsorships' | 'loans';

export function Finances() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showSponsorshipModal, setShowSponsorshipModal] = useState(false);

  const gameStarted = useGameStore((state) => state.gameStarted);
  const playerTeamId = useGameStore((state) => state.playerTeamId);
  const teams = useGameStore((state) => state.teams);
  const players = useGameStore((state) => state.players);

  const playerTeam = playerTeamId ? teams[playerTeamId] : null;

  // Get financial summary
  const summary = useMemo(() => {
    if (!playerTeamId) return null;
    try {
      return economyService.getFinancialSummary(playerTeamId);
    } catch {
      return null;
    }
  }, [playerTeamId, playerTeam?.finances]);

  // Get transactions
  const transactions = useMemo(() => {
    return economyService.getTransactionHistory(50, playerTeamId || undefined);
  }, [playerTeamId, playerTeam?.finances.pendingTransactions]);

  // Get active loans
  const loans = useMemo(() => {
    return economyService.getActiveLoans(playerTeamId || undefined);
  }, [playerTeamId, playerTeam?.finances.loans]);

  // Calculate roster costs
  const rosterCosts = useMemo(() => {
    if (!playerTeam) return { total: 0, players: [] };
    const allPlayerIds = [...playerTeam.playerIds, ...playerTeam.reservePlayerIds];
    const playerCosts = allPlayerIds.map((id) => {
      const player = players[id];
      return {
        id,
        name: player?.name || 'Unknown',
        salary: player?.contract?.salary || 0,
      };
    }).sort((a, b) => b.salary - a.salary);

    const total = playerCosts.reduce((sum, p) => sum + p.salary, 0);
    return { total, players: playerCosts };
  }, [playerTeam, players]);

  if (!gameStarted || !playerTeam) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-vct-gray">Start a game to view finances</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => economyService.formatCurrency(amount);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-vct-gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-vct-light">Finances</h1>
          <p className="text-vct-gray">{playerTeam.name} Financial Overview</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-vct-gray">Current Balance</p>
          <p className={`text-3xl font-bold ${playerTeam.finances.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(playerTeam.finances.balance)}
          </p>
        </div>
      </div>

      {/* Financial Health Status */}
      {summary && (
        <div className={`bg-vct-darker border ${summary.healthStatus === 'critical' ? 'border-red-500' : 'border-vct-gray/30'} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                summary.healthStatus === 'excellent' ? 'bg-green-400' :
                summary.healthStatus === 'good' ? 'bg-blue-400' :
                summary.healthStatus === 'fair' ? 'bg-yellow-400' :
                summary.healthStatus === 'poor' ? 'bg-orange-400' :
                'bg-red-400 animate-pulse'
              }`} />
              <span className={`font-medium ${getHealthColor(summary.healthStatus)}`}>
                Financial Health: {summary.healthStatus.charAt(0).toUpperCase() + summary.healthStatus.slice(1)}
              </span>
            </div>
            <span className={`text-lg font-medium ${summary.netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.netCashFlow >= 0 ? '+' : ''}{formatCurrency(summary.netCashFlow)}/month
            </span>
          </div>
          {summary.warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {summary.warnings.map((warning, i) => (
                <p key={i} className="text-sm text-yellow-400">⚠ {warning}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-vct-gray/30">
        {(['overview', 'transactions', 'sponsorships', 'loans'] as FinanceTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-vct-red border-b-2 border-vct-red'
                : 'text-vct-gray hover:text-vct-light'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'loans' && loans.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-vct-red/20 text-vct-red text-xs rounded">
                {loans.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && summary && (
          <OverviewTab
            summary={summary}
            team={playerTeam}
            rosterCosts={rosterCosts}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'sponsorships' && (
          <SponsorshipsTab
            team={playerTeam}
            formatCurrency={formatCurrency}
            onShowOffers={() => setShowSponsorshipModal(true)}
          />
        )}

        {activeTab === 'loans' && (
          <LoansTab
            loans={loans}
            formatCurrency={formatCurrency}
            onTakeLoan={() => setShowLoanModal(true)}
            teamId={playerTeamId!}
          />
        )}
      </div>

      {/* Loan Modal */}
      {showLoanModal && playerTeamId && (
        <LoanModal
          teamId={playerTeamId}
          onClose={() => setShowLoanModal(false)}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Sponsorship Modal */}
      {showSponsorshipModal && playerTeamId && (
        <SponsorshipModal
          teamId={playerTeamId}
          onClose={() => setShowSponsorshipModal(false)}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

// Overview Tab Component
interface OverviewTabProps {
  summary: ReturnType<typeof economyService.getFinancialSummary>;
  team: NonNullable<ReturnType<typeof useGameStore.getState>['teams'][string]>;
  rosterCosts: { total: number; players: { id: string; name: string; salary: number }[] };
  formatCurrency: (amount: number) => string;
}

function OverviewTab({ summary, team, rosterCosts, formatCurrency }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Breakdown */}
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-vct-light mb-4">Monthly Revenue</h3>
        <div className="space-y-3">
          <RevenueRow label="Sponsorships" value={team.finances.monthlyRevenue.sponsorships} formatCurrency={formatCurrency} />
          <RevenueRow label="Merchandise" value={team.finances.monthlyRevenue.merchandise} formatCurrency={formatCurrency} />
          <RevenueRow label="Fan Donations" value={team.finances.monthlyRevenue.fanDonations} formatCurrency={formatCurrency} />
          <RevenueRow label="Prize Winnings" value={team.finances.monthlyRevenue.prizeWinnings} formatCurrency={formatCurrency} />
          <div className="border-t border-vct-gray/30 pt-2 mt-2">
            <div className="flex justify-between text-green-400 font-semibold">
              <span>Total Revenue</span>
              <span>{formatCurrency(summary.monthlyRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-vct-light mb-4">Monthly Expenses</h3>
        <div className="space-y-3">
          <ExpenseRow label="Player Salaries" value={team.finances.monthlyExpenses.playerSalaries} formatCurrency={formatCurrency} />
          <ExpenseRow label="Coach Salaries" value={team.finances.monthlyExpenses.coachSalaries} formatCurrency={formatCurrency} />
          <ExpenseRow label="Facilities" value={team.finances.monthlyExpenses.facilities} formatCurrency={formatCurrency} />
          <ExpenseRow label="Travel" value={team.finances.monthlyExpenses.travel} formatCurrency={formatCurrency} />
          {summary.loanPayments > 0 && (
            <ExpenseRow label="Loan Payments" value={summary.loanPayments} formatCurrency={formatCurrency} />
          )}
          <div className="border-t border-vct-gray/30 pt-2 mt-2">
            <div className="flex justify-between text-red-400 font-semibold">
              <span>Total Expenses</span>
              <span>{formatCurrency(summary.monthlyExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projections */}
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-vct-light mb-4">Balance Projections</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-vct-gray">Current Balance</span>
            <span className={`font-medium ${team.finances.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(team.finances.balance)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-vct-gray">In 3 Months</span>
            <span className={`font-medium ${summary.projectedBalance3Months >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(summary.projectedBalance3Months)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-vct-gray">In 6 Months</span>
            <span className={`font-medium ${summary.projectedBalance6Months >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(summary.projectedBalance6Months)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Salaries */}
      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-vct-light mb-4">Roster Salaries</h3>
        <div className="space-y-2">
          {rosterCosts.players.slice(0, 5).map((player) => (
            <div key={player.id} className="flex justify-between items-center">
              <span className="text-vct-gray">{player.name}</span>
              <span className="text-vct-light">{formatCurrency(player.salary)}/yr</span>
            </div>
          ))}
          <div className="border-t border-vct-gray/30 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span className="text-vct-light">Total Roster Cost</span>
              <span className="text-vct-light">{formatCurrency(rosterCosts.total)}/yr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueRow({ label, value, formatCurrency }: { label: string; value: number; formatCurrency: (n: number) => string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-vct-gray">{label}</span>
      <span className="text-green-400">{formatCurrency(value)}</span>
    </div>
  );
}

function ExpenseRow({ label, value, formatCurrency }: { label: string; value: number; formatCurrency: (n: number) => string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-vct-gray">{label}</span>
      <span className="text-red-400">-{formatCurrency(value)}</span>
    </div>
  );
}

// Transactions Tab Component
interface TransactionsTabProps {
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
}

function TransactionsTab({ transactions, formatCurrency }: TransactionsTabProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-vct-gray">
        <p>No transactions yet</p>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'prize': return '🏆';
      case 'sponsorship_deal': return '📢';
      case 'signing_bonus': return '✍️';
      case 'transfer_fee': return '🔄';
      case 'loan_payment': return '🏦';
      default: return '💰';
    }
  };

  return (
    <div className="bg-vct-darker border border-vct-gray/30 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-vct-dark">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-vct-gray">Date</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-vct-gray">Description</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-vct-gray">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-vct-gray/20">
          {transactions.map((txn) => (
            <tr key={txn.id} className="hover:bg-vct-dark/50">
              <td className="px-4 py-3 text-sm text-vct-gray">
                {new Date(txn.date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span>{getTransactionIcon(txn.type)}</span>
                  <span className="text-vct-light">{txn.description}</span>
                </div>
              </td>
              <td className={`px-4 py-3 text-right font-medium ${txn.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Sponsorships Tab Component
interface SponsorshipsTabProps {
  team: NonNullable<ReturnType<typeof useGameStore.getState>['teams'][string]>;
  formatCurrency: (amount: number) => string;
  onShowOffers: () => void;
}

function SponsorshipsTab({ team, formatCurrency, onShowOffers }: SponsorshipsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-vct-light">Sponsorship Revenue</h3>
        <button
          onClick={onShowOffers}
          className="px-4 py-2 bg-vct-red text-white rounded-lg hover:bg-vct-red-dark transition-colors"
        >
          Find New Sponsors
        </button>
      </div>

      <div className="bg-vct-darker border border-vct-gray/30 rounded-lg p-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-400">
            {formatCurrency(team.finances.monthlyRevenue.sponsorships)}
          </p>
          <p className="text-vct-gray">Monthly Sponsorship Revenue</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xl font-semibold text-vct-light">{team.fanbase}</p>
            <p className="text-sm text-vct-gray">Fanbase Score</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-vct-light">
              {formatCurrency(team.organizationValue)}
            </p>
            <p className="text-sm text-vct-gray">Organization Value</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-vct-gray text-center">
          Increase your fanbase and win more matches to attract better sponsors!
        </p>
      </div>
    </div>
  );
}

// Loans Tab Component
interface LoansTabProps {
  loans: Loan[];
  formatCurrency: (amount: number) => string;
  onTakeLoan: () => void;
  teamId: string;
}

function LoansTab({ loans, formatCurrency, onTakeLoan, teamId }: LoansTabProps) {
  const handlePayOff = (loanId: string) => {
    const result = economyService.payOffLoan(loanId, teamId);
    if (!result.success) {
      alert(result.error || 'Failed to pay off loan');
    }
  };

  const totalDebt = economyService.getTotalDebt(teamId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-vct-light">Active Loans</h3>
          {totalDebt > 0 && (
            <p className="text-sm text-vct-gray">Total Debt: {formatCurrency(totalDebt)}</p>
          )}
        </div>
        <button
          onClick={onTakeLoan}
          className="px-4 py-2 bg-vct-red text-white rounded-lg hover:bg-vct-red-dark transition-colors"
        >
          Take Out Loan
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="bg-vct-darker border border-vct-gray/30 rounded-lg p-8 text-center">
          <p className="text-vct-gray">No active loans</p>
          <p className="text-sm text-vct-gray mt-2">
            Loans can help when you need cash for signings or to cover expenses
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const remainingBalance = loan.monthlyPayment * loan.remainingMonths;
            return (
              <div
                key={loan.id}
                className="bg-vct-darker border border-vct-gray/30 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-vct-light font-medium">
                      {formatCurrency(loan.principal)} Loan
                    </p>
                    <p className="text-sm text-vct-gray">
                      {(loan.interestRate * 100).toFixed(1)}% APR
                    </p>
                  </div>
                  <button
                    onClick={() => handlePayOff(loan.id)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Pay Off ({formatCurrency(remainingBalance)})
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-vct-gray">Monthly Payment</p>
                    <p className="text-red-400">{formatCurrency(loan.monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-vct-gray">Remaining</p>
                    <p className="text-vct-light">{loan.remainingMonths} months</p>
                  </div>
                  <div>
                    <p className="text-vct-gray">Balance Owed</p>
                    <p className="text-vct-light">{formatCurrency(remainingBalance)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Loan Modal Component
interface LoanModalProps {
  teamId: string;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

function LoanModal({ teamId, onClose, formatCurrency }: LoanModalProps) {
  const [selectedOption, setSelectedOption] = useState<LoanOption | null>(null);
  const loanOptions = economyService.getLoanOptions(teamId);

  const handleTakeLoan = () => {
    if (!selectedOption) return;

    const result = economyService.takeLoan(selectedOption, teamId);
    if (result.success) {
      onClose();
    } else {
      alert(result.error || 'Failed to take loan');
    }
  };

  // Group by principal amount
  const groupedOptions = loanOptions.reduce((acc, opt) => {
    const key = opt.principal;
    if (!acc[key]) acc[key] = [];
    acc[key].push(opt);
    return acc;
  }, {} as Record<number, LoanOption[]>);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-vct-dark border border-vct-gray/30 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-vct-light">Take Out a Loan</h2>
          <button onClick={onClose} className="text-vct-gray hover:text-vct-light">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedOptions).map(([principal, options]) => (
            <div key={principal} className="space-y-2">
              <h3 className="text-lg font-medium text-vct-light">
                {formatCurrency(parseInt(principal))} Loan
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedOption(opt)}
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedOption === opt
                        ? 'border-vct-red bg-vct-red/10'
                        : 'border-vct-gray/30 hover:border-vct-gray'
                    }`}
                  >
                    <p className="text-vct-light font-medium">{opt.termMonths} months</p>
                    <p className="text-sm text-vct-gray">
                      {formatCurrency(opt.monthlyPayment)}/mo
                    </p>
                    <p className="text-xs text-vct-gray mt-1">
                      {(opt.interestRate * 100).toFixed(1)}% APR
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedOption && (
          <div className="mt-6 p-4 bg-vct-darker rounded-lg">
            <h4 className="text-sm font-medium text-vct-gray mb-2">Loan Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-vct-gray text-sm">Principal</p>
                <p className="text-vct-light">{formatCurrency(selectedOption.principal)}</p>
              </div>
              <div>
                <p className="text-vct-gray text-sm">Monthly Payment</p>
                <p className="text-red-400">{formatCurrency(selectedOption.monthlyPayment)}</p>
              </div>
              <div>
                <p className="text-vct-gray text-sm">Total Interest</p>
                <p className="text-yellow-400">
                  {formatCurrency(selectedOption.monthlyPayment * selectedOption.termMonths - selectedOption.principal)}
                </p>
              </div>
              <div>
                <p className="text-vct-gray text-sm">Total Repayment</p>
                <p className="text-vct-light">
                  {formatCurrency(selectedOption.monthlyPayment * selectedOption.termMonths)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-vct-gray/30 text-vct-gray rounded-lg hover:bg-vct-gray/10"
          >
            Cancel
          </button>
          <button
            onClick={handleTakeLoan}
            disabled={!selectedOption}
            className="flex-1 px-4 py-2 bg-vct-red text-white rounded-lg hover:bg-vct-red-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Take Loan
          </button>
        </div>
      </div>
    </div>
  );
}

// Sponsorship Modal Component
interface SponsorshipModalProps {
  teamId: string;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

function SponsorshipModal({ teamId, onClose, formatCurrency }: SponsorshipModalProps) {
  const [offers, setOffers] = useState<SponsorshipOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate offers on mount
  useState(() => {
    setOffers(economyService.getSponsorshipOffers(teamId));
    setLoading(false);
  });

  const handleAccept = (offer: SponsorshipOffer) => {
    const result = economyService.acceptSponsorship(offer, teamId);
    if (result.success) {
      onClose();
    } else {
      alert(result.error || 'Failed to accept sponsorship');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-vct-dark border border-vct-gray/30 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-vct-light">Sponsorship Offers</h2>
          <button onClick={onClose} className="text-vct-gray hover:text-vct-light">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-vct-gray">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="text-center py-8 text-vct-gray">
            No sponsorship offers available at this time
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer, i) => (
              <div
                key={i}
                className="bg-vct-darker border border-vct-gray/30 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-medium text-vct-light">{offer.sponsorName}</p>
                    <p className="text-green-400 font-semibold">
                      {formatCurrency(offer.monthlyValue)}/month
                    </p>
                    <p className="text-sm text-vct-gray">
                      {offer.duration} month contract
                    </p>
                  </div>
                  <button
                    onClick={() => handleAccept(offer)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Accept
                  </button>
                </div>
                {Object.keys(offer.requirements).length > 0 && (
                  <div className="mt-3 text-sm text-vct-gray">
                    <p className="font-medium">Requirements:</p>
                    <ul className="list-disc list-inside">
                      {offer.requirements.minFanbase && (
                        <li>Minimum fanbase: {offer.requirements.minFanbase}</li>
                      )}
                      {offer.requirements.minWinRate && (
                        <li>Minimum win rate: {(offer.requirements.minWinRate * 100).toFixed(0)}%</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-vct-gray/30 text-vct-gray rounded-lg hover:bg-vct-gray/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
