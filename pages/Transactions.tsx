
import React, { useEffect, useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Transaction, Product } from '../types';
import { Trash2, Search, Clock, User, FileText, Phone, Wrench, Car, ChevronDown, ChevronUp, Edit2, AlertCircle } from 'lucide-react';

export default function Transactions() {
  const { transactions, deleteTransaction, canDeleteTransaction, canEditTransaction, editTransaction, products } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [, setTick] = useState(0);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState<{
    customerName: string;
    customerPhone: string;
    vehicleModel: string;
    mechanicName: string;
    productDiscount: string;
    serviceDiscount: string;
  }>({
    customerName: '', customerPhone: '', vehicleModel: '', mechanicName: '', productDiscount: '0', serviceDiscount: '0'
  });

  // Force re-render every minute to update "Locked" status
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to void this transaction? This will restore stock.')) {
      await deleteTransaction(id);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTxId(prev => prev === id ? null : id);
  };

  const openEditModal = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTx(tx);
    setEditFormData({
      customerName: tx.customerName,
      customerPhone: tx.customerPhone || '',
      vehicleModel: tx.vehicleModel || '',
      mechanicName: tx.mechanicName || '',
      productDiscount: tx.productDiscount.toString(),
      serviceDiscount: tx.serviceDiscount.toString()
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    // Recalculate Totals if discounts changed
    const pDisc = parseFloat(editFormData.productDiscount) || 0;
    const sDisc = parseFloat(editFormData.serviceDiscount) || 0;
    
    const newTotal = (editingTx.productTotal - pDisc) + (editingTx.serviceTotal - sDisc);
    
    // Recalculate Profit (Need cost)
    // We approximate cost by subtracting original profit from original total, then adding back new total? 
    // Better: re-sum costs from items.
    let totalCost = 0;
    editingTx.items.forEach(item => {
       if (item.type === 'product') {
         const product = products.find(p => p.id === item.itemId);
         // Note: If product price changed in inventory since sale, profit calc might drift. 
         // Ideally we store cost at time of sale. For now, we use current buy price or estimate.
         if (product) {
            totalCost += (product.buyingPrice * item.quantity);
         }
       }
    });
    const newProfit = newTotal - totalCost;

    await editTransaction(editingTx.id, {
      customerName: editFormData.customerName,
      customerPhone: editFormData.customerPhone,
      vehicleModel: editFormData.vehicleModel,
      mechanicName: editFormData.mechanicName,
      productDiscount: pDisc,
      serviceDiscount: sDisc,
      totalAmount: newTotal,
      totalProfit: newProfit
    });

    setIsEditModalOpen(false);
    setEditingTx(null);
  };

  const filteredTransactions = transactions.filter(t => 
    t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.createdByName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search ID, Customer, Staff..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold w-8"></th>
                <th className="px-6 py-4 font-semibold">ID / Date</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Summary</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isExpanded = expandedTxId === tx.id;
                const canModify = canEditTransaction(tx); // 12 min rule
                
                return (
                  <React.Fragment key={tx.id}>
                    <tr 
                      className={`cursor-pointer transition-colors group ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                      onClick={() => toggleExpand(tx.id)}
                    >
                      <td className="px-6 py-4">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-mono text-slate-500 text-xs mb-1">{tx.id}</span>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3" />
                          {formatDate(tx.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{tx.customerName}</p>
                        <p className="text-xs text-slate-500 mt-1">{tx.vehicleModel || 'No Vehicle Info'}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                         <div className="flex flex-col text-xs">
                           <span>{tx.items.filter(i => i.type === 'product').length} Products</span>
                           <span>{tx.items.filter(i => i.type === 'service').length} Services</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                          <p className="font-bold text-slate-900 text-lg">${tx.totalAmount.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {canModify ? (
                             <>
                               <button 
                                 onClick={(e) => openEditModal(tx, e)}
                                 className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                 title="Edit Transaction"
                               >
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={(e) => handleDelete(tx.id, e)}
                                 className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Void Transaction"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           ) : (
                             <span className="flex items-center gap-1 text-xs text-slate-400 italic select-none px-2 py-1 bg-slate-50 rounded border border-slate-100">
                               <Clock className="w-3 h-3" /> Locked
                             </span>
                           )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <td colSpan={6} className="px-6 py-4 cursor-default">
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Detailed Stats */}
                              <div className="space-y-2 bg-white p-4 rounded-lg border border-slate-200">
                                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Financial Breakdown</h4>
                                 <div className="flex justify-between text-sm">
                                   <span className="text-slate-600">Product Sales (Gross):</span>
                                   <span className="font-medium">${tx.productTotal.toFixed(2)}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                   <span className="text-slate-600">Product Discount:</span>
                                   <span className="text-red-500">-${tx.productDiscount.toFixed(2)}</span>
                                 </div>
                                 <div className="border-b border-dashed border-slate-200 my-1"></div>
                                 <div className="flex justify-between text-sm">
                                   <span className="text-slate-600">Service Income (Gross):</span>
                                   <span className="font-medium">${tx.serviceTotal.toFixed(2)}</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                   <span className="text-slate-600">Service Discount:</span>
                                   <span className="text-red-500">-${tx.serviceDiscount.toFixed(2)}</span>
                                 </div>
                                 <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-slate-900">
                                    <span>Net Total:</span>
                                    <span>${tx.totalAmount.toFixed(2)}</span>
                                 </div>
                              </div>

                              {/* Extra Info */}
                              <div className="space-y-3 text-sm">
                                 <div className="flex gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-500">Customer Phone:</span>
                                    <span className="text-slate-900">{tx.customerPhone || 'N/A'}</span>
                                 </div>
                                 <div className="flex gap-2">
                                    <Car className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-500">Vehicle:</span>
                                    <span className="text-slate-900">{tx.vehicleModel || 'N/A'}</span>
                                 </div>
                                 <div className="flex gap-2">
                                    <Wrench className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-500">Mechanic:</span>
                                    <span className="text-indigo-600 font-medium">{tx.mechanicName || 'N/A'}</span>
                                 </div>
                                 <div className="flex gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-500">Seller:</span>
                                    <span className="text-slate-900">{tx.createdByName}</span>
                                 </div>
                              </div>
                           </div>

                           {/* Item List */}
                           <div className="mt-4">
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Cart Items</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {tx.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded text-xs">
                                     <div>
                                       <span className="font-medium block">{item.name}</span>
                                       <span className="text-slate-500 capitalize">{item.type}</span>
                                     </div>
                                     <div className="text-right">
                                       <span className="block">{item.quantity} x ${item.unitPrice}</span>
                                       <span className="font-bold">${item.subtotal}</span>
                                     </div>
                                  </div>
                                ))}
                             </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-10 h-10 opacity-20" />
                        No transactions found.
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                <h3 className="font-bold text-slate-800">Edit Transaction</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
             </div>
             <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div className="bg-orange-50 p-3 rounded text-xs text-orange-800 flex gap-2 mb-2 border border-orange-100">
                   <AlertCircle className="w-4 h-4" />
                   <span>Modifying discounts will recalculate totals.</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name</label>
                    <input required className="w-full p-2 text-sm border rounded" value={editFormData.customerName} onChange={e => setEditFormData({...editFormData, customerName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Customer Phone</label>
                    <input className="w-full p-2 text-sm border rounded" value={editFormData.customerPhone} onChange={e => setEditFormData({...editFormData, customerPhone: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Model</label>
                    <input className="w-full p-2 text-sm border rounded" value={editFormData.vehicleModel} onChange={e => setEditFormData({...editFormData, vehicleModel: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mechanic</label>
                    <input className="w-full p-2 text-sm border rounded" value={editFormData.mechanicName} onChange={e => setEditFormData({...editFormData, mechanicName: e.target.value})} />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 mt-2">
                   <p className="text-xs font-bold text-indigo-600 mb-2 uppercase">Financial Corrections</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Product Discount ($)</label>
                        <input type="number" min="0" className="w-full p-2 text-sm border rounded" value={editFormData.productDiscount} onChange={e => setEditFormData({...editFormData, productDiscount: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Service Discount ($)</label>
                        <input type="number" min="0" className="w-full p-2 text-sm border rounded" value={editFormData.serviceDiscount} onChange={e => setEditFormData({...editFormData, serviceDiscount: e.target.value})} />
                      </div>
                   </div>
                </div>

                <button type="submit" className="w-full py-3 mt-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                   Update Transaction
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
