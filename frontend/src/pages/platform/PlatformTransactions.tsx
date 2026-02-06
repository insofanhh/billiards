import { useState, useEffect } from 'react';
import { platformClient } from '../../api/platformClient';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns';

export function PlatformTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showNotification } = useNotification();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [page, search, statusFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await platformClient.get('/platform/transactions', {
        params: {
          page,
          search,
          status: statusFilter
        }
      });
      setTransactions(res.data.data);
      setTotalPages(res.data.last_page);
      setTotal(res.data.total);
    } catch (error) {
      console.error(error);
      showNotification('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">Paid</span>;
      case 'pending':
        return <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs">Pending</span>;
      case 'failed':
        return <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs">Failed</span>;
      default:
        return <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Transaction History</h1>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
        {/* Filters */}
        <div className="p-6 pb-0">
            <div className="flex gap-4 mb-6">
            <input 
                type="text" 
                placeholder="Search by transaction code or store name..." 
                className="flex-1 bg-gray-700 border-gray-600 rounded-lg p-2 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select 
                className="bg-gray-700 border-gray-600 rounded-lg p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
            </select>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
              <tr>
                <th className="px-6 py-4">Transaction Code</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4">Paid At</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">Loading...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">No transactions found</td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{txn.transaction_code}</td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-white">{txn.store?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{txn.store?.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-400">
                        {Number(txn.amount).toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4 text-center">{txn.months} Month(s)</td>
                    <td className="px-6 py-4">{getStatusBadge(txn.status)}</td>
                    <td className="px-6 py-4 text-sm">
                        {format(new Date(txn.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                        {txn.paid_at ? format(new Date(txn.paid_at), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs truncate" title={txn.content || txn.description}>
                        {txn.content || txn.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between bg-gray-700/30 border-t border-gray-700">
            <p className="text-xs text-gray-400">Showing {transactions.length} of {total} transactions</p>
            <div className="flex gap-1">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-2 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="flex items-center px-3 text-sm font-medium text-gray-400">
                    Page {page} of {totalPages}
                </span>
                <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="p-2 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
