import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { Product, Service } from '../types';
import { SERVICE_CATEGORIES } from '../constants';
import { Plus, Search, Box, Wrench, BarChart2, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import { analyzeProductPricing } from '../services/geminiService';

type Tab = 'products' | 'services';

export default function Inventory() {
  const { user } = useAuth();
  const { products, services, addProduct, updateProduct, addService, updateService } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Accordion state for services
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Modal & Edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | Service | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{id: string, text: string} | null>(null);

  const isAdmin = user?.role === 'admin';

  const handleAnalysis = async (product: Product) => {
      setAnalysisResult({ id: product.id, text: 'Analyzing...' });
      const text = await analyzeProductPricing(product);
      setAnalysisResult({ id: product.id, text });
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', buyingPrice: 0, sellingPrice: 0, stock: 0
  });

  const openModal = (item?: Product | Service) => {
    if (item) {
      setEditingItem(item);
      if (item.type === 'product') {
        setFormData({
          name: item.name,
          sku: item.sku,
          category: item.category,
          buyingPrice: item.buyingPrice,
          sellingPrice: item.sellingPrice,
          stock: item.stock
        });
      } else {
        setFormData({
          name: item.name,
          sku: '',
          category: item.category,
          buyingPrice: 0,
          sellingPrice: 0,
          stock: 0
        });
      }
    } else {
      setEditingItem(null);
      setFormData({ name: '', sku: '', category: '', buyingPrice: 0, sellingPrice: 0, stock: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'products') {
      if (editingItem && editingItem.type === 'product') {
        updateProduct(editingItem.id, {
            name: formData.name,
            sku: formData.sku,
            category: formData.category,
            buyingPrice: Number(formData.buyingPrice),
            sellingPrice: Number(formData.sellingPrice),
            stock: Number(formData.stock)
        });
      } else {
        addProduct({
          name: formData.name,
          sku: formData.sku,
          category: formData.category || 'General',
          buyingPrice: Number(formData.buyingPrice),
          sellingPrice: Number(formData.sellingPrice),
          stock: Number(formData.stock),
          type: 'product'
        });
      }
    } else {
      // Services
      if (editingItem && editingItem.type === 'service') {
        updateService(editingItem.id, {
            name: formData.name,
            category: formData.category
        });
      } else {
        addService({
          name: formData.name,
          category: formData.category || 'General Services',
          type: 'service',
        });
      }
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', sku: '', category: '', buyingPrice: 0, sellingPrice: 0, stock: 0 });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(prev => prev === category ? null : category);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Inventory & Services</h1>
        {isAdmin && (
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New {activeTab === 'products' ? 'Product' : 'Service'}
          </button>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Box className="w-4 h-4" />
            Products
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'services' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Wrench className="w-4 h-4" />
            Services
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === 'products' ? "Search products..." : "Search services..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'products' ? (
        // PRODUCT TABLE
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Category / SKU</th>
                  {isAdmin && <th className="px-6 py-4 font-semibold">Buying Price</th>}
                  <th className="px-6 py-4 font-semibold">Selling Price</th>
                  <th className="px-6 py-4 font-semibold">Stock</th>
                  {isAdmin && <th className="px-6 py-4 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((item) => (
                  <React.Fragment key={item.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{item.name}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                       <span className="block font-mono text-xs text-slate-400">{item.sku}</span>
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 mt-1">{item.category}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-slate-500 font-mono">${item.buyingPrice.toFixed(2)}</td>
                    )}
                    <td className="px-6 py-4 font-semibold text-slate-900">${item.sellingPrice.toFixed(2)}</td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.stock < 5 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {item.stock} units
                      </span>
                    </td>
                     {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={() => openModal(item)}
                             className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                             title="Edit Product"
                           >
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                               onClick={() => handleAnalysis(item)}
                               className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md"
                               title="AI Price Analysis"
                           >
                               <BarChart2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                     )}
                  </tr>
                  {analysisResult?.id === item.id && (
                      <tr className="bg-indigo-50/50">
                          <td colSpan={10} className="px-6 py-3 text-xs text-indigo-800">
                              <strong className="block mb-1">AI Pricing Check:</strong>
                              {analysisResult.text}
                          </td>
                      </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // SERVICE ACCORDION
        <div className="space-y-3">
          {SERVICE_CATEGORIES.map((category) => {
            const categoryServices = services.filter(s => 
              s.category === category && 
              s.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            // If searching, expand relevant categories automatically, otherwise allow toggle
            // Note: If strict accordion required even in search, keep toggle logic. 
            // We will respect the "only one expanded" rule.
            const isExpanded = expandedCategory === category;
            const hasMatches = categoryServices.length > 0;

            if (searchTerm && !hasMatches) return null;

            return (
              <div key={category} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between p-4 transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Wrench className="w-5 h-5" />
                    </span>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900">{category}</h3>
                      <p className="text-xs text-slate-500">{categoryServices.length} services</p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100">
                     {categoryServices.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-sm">No services found in this category.</div>
                     ) : (
                       <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-3 font-semibold">Service Name</th>
                              {isAdmin && <th className="px-6 py-3 font-semibold w-24 text-right">Action</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {categoryServices.map(service => (
                              <tr key={service.id} className="hover:bg-slate-50/80">
                                <td className="px-6 py-3 font-medium text-slate-700">{service.name}</td>
                                {isAdmin && (
                                  <td className="px-6 py-3 text-right">
                                    <button 
                                      onClick={() => openModal(service)}
                                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                       </table>
                     )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">
                {editingItem ? 'Edit' : 'Add New'} {activeTab === 'products' ? 'Product' : 'Service'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Item Name</label>
                <input required className="w-full p-2 border rounded-lg text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              {activeTab === 'products' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">SKU</label>
                    <input required className="w-full p-2 border rounded-lg text-sm" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                    <input className="w-full p-2 border rounded-lg text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </div>
                </div>
              )}

              {activeTab === 'services' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    className="w-full p-2 border rounded-lg text-sm"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                     <option value="">Select Category</option>
                     {SERVICE_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                     ))}
                  </select>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Buying Price ($)</label>
                    <input type="number" required min="0" step="0.01" className="w-full p-2 border rounded-lg text-sm" value={formData.buyingPrice} onChange={e => setFormData({...formData, buyingPrice: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Selling Price ($)</label>
                    <input type="number" required min="0" step="0.01" className="w-full p-2 border rounded-lg text-sm" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current Stock</label>
                    <div className="flex items-center gap-2">
                       <input type="number" required min="0" className="w-full p-2 border rounded-lg text-sm bg-white" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                       <span className="text-xs text-slate-500 whitespace-nowrap">units</span>
                    </div>
                    {editingItem && <p className="text-[10px] text-slate-500 mt-1">Modify this value to add/remove stock.</p>}
                  </div>
              )}

              <div className="pt-4">
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}