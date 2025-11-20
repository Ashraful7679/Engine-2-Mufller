
import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { EXPENSE_CATEGORIES } from '../constants';
import { Wallet, ArrowDownCircle, ArrowUpCircle, History, Plus } from 'lucide-react';

type Tab = 'expense' | 'withdrawal';

export default function Expenses() {
  const { cashFlows, addCashFlow } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('expense');
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    await addCashFlow({
      type: activeTab,
      amount: parseFloat(amount),
      category: activeTab === 'expense' ? category : undefined,
      description
    });

    setAmount('');
    setCategory('');
    setDescription('');
  };

  const filteredFlows = cashFlows.filter(c => c.type === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
           <Wallet className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Expenses & Withdrawals</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
           <div className="p-1 bg-slate-100 m-4 rounded-lg flex gap-1">
              <button 
                onClick={() => setActiveTab('expense')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ArrowDownCircle className="w-4 h-4" /> Expense
              </button>
              <button 
                onClick={() => setActiveTab('withdrawal')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'withdrawal' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ArrowUpCircle className="w-4 h-4" /> Withdrawal
              </button>
           </div>

           <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount ($)</label>
                <input 
                  type="number" min="0" step="0.01" required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full p-3 text-lg border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>

              {activeTab === 'expense' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select 
                    required
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                 <textarea 
                   value={description}
                   onChange={e => setDescription(e.target.value)}
                   rows={3}
                   className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                   placeholder={activeTab === 'expense' ? "e.g., Shop Rent for March" : "e.g., Owner Withdrawal"}
                 />
              </div>

              <button 
                type="submit"
                className={`w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}
              >
                <Plus className="w-5 h-5" />
                Record {activeTab === 'expense' ? 'Expense' : 'Withdrawal'}
              </button>
           </form>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <div className="p-4 border-b border-slate-200 flex items-center gap-2">
             <History className="w-5 h-5 text-slate-400" />
             <h3 className="font-bold text-slate-800">Recent {activeTab === 'expense' ? 'Expenses' : 'Withdrawals'}</h3>
           </div>
           <div className="flex-1 overflow-auto p-0">
              {filteredFlows.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <p>No records found.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Amount</th>
                      {activeTab === 'expense' && <th className="px-6 py-3 font-semibold">Category</th>}
                      <th className="px-6 py-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredFlows.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50">
                         <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                           {new Date(item.timestamp).toLocaleDateString()} <span className="text-xs opacity-70">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </td>
                         <td className="px-6 py-3 font-bold text-slate-800">
                           ${item.amount.toFixed(2)}
                         </td>
                         {activeTab === 'expense' && (
                           <td className="px-6 py-3">
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                               {item.category}
                             </span>
                           </td>
                         )}
                         <td className="px-6 py-3 text-slate-600 truncate max-w-xs">
                           {item.description || '-'}
                         </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
