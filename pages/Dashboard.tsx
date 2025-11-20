
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { generateBusinessInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Package, 
  Sparkles,
  ShoppingBag,
  Wrench,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, subtext, colorClass }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, products, cashFlows } = useStore();
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Calculate Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTransactions = transactions.filter(t => t.timestamp >= today.getTime());
  const mySalesToday = todayTransactions.filter(t => t.createdBy === user?.id);

  // Determine which dataset to analyze for Sales
  const dataToAnalyze = isAdmin ? transactions : mySalesToday;
  const timeLabel = isAdmin ? "All Time" : "Today";

  // 1. Revenue
  const totalRevenue = dataToAnalyze.reduce((sum, t) => sum + t.totalAmount, 0);
  const productRevenue = dataToAnalyze.reduce((sum, t) => sum + (t.productTotal - (t.productDiscount || 0)), 0);
  const serviceRevenue = dataToAnalyze.reduce((sum, t) => sum + (t.serviceTotal - (t.serviceDiscount || 0)), 0);

  // 2. Cash Flow (Admin sees all, Managers see none or limited - Assuming Admin Dashboard view for CashFlow)
  const totalExpenses = cashFlows.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.amount, 0);
  const totalWithdrawals = cashFlows.filter(c => c.type === 'withdrawal').reduce((sum, c) => sum + c.amount, 0);
  
  // Cash on Hand = (Total Revenue In) - (Total Expenses + Withdrawals Out)
  // Note: If managers only see their sales, Cash on Hand calculation is tricky. 
  // We will show "Shop Cash on Hand" based on ALL transactions if Admin.
  const allRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const cashOnHand = allRevenue - (totalExpenses + totalWithdrawals);

  // 3. Profit (Admin Only)
  const totalProfit = isAdmin 
    ? transactions.reduce((sum, t) => sum + t.totalProfit, 0)
    : 0; 

  const lowStockItems = products.filter(p => p.stock < 5);

  // Chart Data (Last 7 days)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0,0,0,0);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    
    const dayTx = transactions.filter(t => {
      const txDate = new Date(t.timestamp);
      txDate.setHours(0,0,0,0);
      return txDate.getTime() === d.getTime();
    });

    return {
      name: dayStr,
      sales: dayTx.reduce((acc, t) => acc + t.totalAmount, 0),
      profit: isAdmin ? dayTx.reduce((acc, t) => acc + t.totalProfit, 0) : 0,
    };
  }).reverse();

  const fetchInsights = async () => {
    setLoadingInsights(true);
    const result = await generateBusinessInsights(transactions, products);
    setInsights(result);
    setLoadingInsights(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name}</p>
        </div>
        {isAdmin && (
          <button 
            onClick={fetchInsights}
            disabled={loadingInsights}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            {loadingInsights ? 'Analyzing...' : 'Ask AI Advisor'}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Row 1: Sales & Cash */}
        <StatCard 
          title={isAdmin ? "Total Revenue" : "My Total Sales"}
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          colorClass="bg-emerald-100 text-emerald-600"
          subtext={`${timeLabel} combined`}
        />

        {isAdmin && (
          <StatCard 
            title="Cash on Hand"
            value={`$${cashOnHand.toFixed(2)}`}
            icon={Wallet}
            colorClass="bg-blue-100 text-blue-600"
            subtext="Revenue - (Exp + Withd)"
          />
        )}

        <StatCard 
          title="Product Sales"
          value={`$${productRevenue.toFixed(2)}`}
          icon={Package}
          colorClass="bg-indigo-100 text-indigo-600"
          subtext="Parts only"
        />

        <StatCard 
          title="Service Income"
          value={`$${serviceRevenue.toFixed(2)}`}
          icon={Wrench}
          colorClass="bg-purple-100 text-purple-600"
          subtext="Labor only"
        />
        
        {/* Row 2: Expenses & Profit (Admin Only mostly) */}
        {isAdmin && (
          <>
            <StatCard 
              title="Total Profit"
              value={`$${totalProfit.toFixed(2)}`}
              icon={TrendingUp}
              colorClass="bg-green-100 text-green-600"
              subtext="Net Income"
            />
            <StatCard 
              title="Total Expenses"
              value={`$${totalExpenses.toFixed(2)}`}
              icon={ArrowDownCircle}
              colorClass="bg-red-100 text-red-600"
              subtext="Shop operational costs"
            />
            <StatCard 
              title="Withdrawals"
              value={`$${totalWithdrawals.toFixed(2)}`}
              icon={ArrowUpCircle}
              colorClass="bg-orange-100 text-orange-600"
              subtext="Owner withdrawals"
            />
          </>
        )}

        <StatCard 
          title="Low Stock Alerts"
          value={lowStockItems.length}
          icon={AlertTriangle}
          colorClass={lowStockItems.length > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}
          subtext="Items below 5 units"
        />
      </div>

      {/* AI Insights Area */}
      {isAdmin && insights && (
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 mb-3 text-indigo-800 font-semibold">
             <Sparkles className="w-5 h-5" />
             <h2>AI Business Advisor</h2>
          </div>
          <div 
            className="prose prose-sm prose-indigo text-slate-700 max-w-none"
            dangerouslySetInnerHTML={{ __html: insights }}
          />
        </div>
      )}

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Sales Performance (Last 7 Days)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                {isAdmin && <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock / Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Low Stock Alert</h3>
          <div className="flex-1 overflow-y-auto max-h-80">
            {lowStockItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                 <Package className="w-12 h-12 mb-2 opacity-20" />
                 <p>Stock levels are healthy.</p>
               </div>
            ) : (
              <ul className="space-y-3">
                {lowStockItems.map(item => (
                  <li key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.stock} left
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
