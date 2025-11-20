
import React, { useState, useRef } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Product, Service, CartItem, CatalogItem, Customer } from '../types';
import { SERVICE_CATEGORIES } from '../constants';
import { Search, Plus, Trash2, ShoppingCart, User, Phone, Wrench, Check, Box, ChevronDown, ChevronRight, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type CatalogTab = 'products' | 'services';

export default function POS() {
  const { products, services, customers, createTransaction, loading } = useStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<CatalogTab>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Accordion state for services
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Customer & Staff State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  
  // Discounts
  const [productDiscount, setProductDiscount] = useState<number>(0);
  const [serviceDiscount, setServiceDiscount] = useState<number>(0);

  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Manual Service Pricing Modal
  const [servicePriceModal, setServicePriceModal] = useState<{service: Service, price: string} | null>(null);

  // Filter items based on search
  // If search is active, we ignore tabs and show all matches flat
  const isSearching = searchTerm.length > 0;
  const allItems: CatalogItem[] = [...products, ...services];
  
  const searchResults = allItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.type === 'product' && (item as Product).sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.type === 'service' && (item as Service).category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleCategory = (category: string) => {
    setExpandedCategory(prev => prev === category ? null : category);
  };

  const handleAddItemClick = (item: CatalogItem) => {
    if (item.type === 'service') {
      setServicePriceModal({ service: item as Service, price: '' });
    } else {
      addToCart(item as Product, (item as Product).sellingPrice);
    }
  };

  const confirmServicePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicePriceModal) return;
    const price = parseFloat(servicePriceModal.price);
    if (isNaN(price) || price < 0) return;

    addToCart(servicePriceModal.service, price);
    setServicePriceModal(null);
  };

  const addToCart = (item: CatalogItem, price: number) => {
    if (item.type === 'product' && (item as Product).stock <= 0) {
      alert("Item out of stock!");
      return;
    }

    const existing = cart.find(i => i.itemId === item.id && i.unitPrice === price); 
    
    if (existing) {
       if (item.type === 'product' && existing.quantity >= (item as Product).stock) {
        alert("Not enough stock available.");
        return;
      }
      updateQuantity(item.id, existing.quantity + 1);
    } else {
      setCart([...cart, {
        itemId: item.id,
        name: item.name,
        type: item.type,
        quantity: 1,
        unitPrice: price,
        subtotal: price
      }]);
    }
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    
    const itemInStore = products.find(p => p.id === itemId);
    if (itemInStore && newQty > itemInStore.stock) {
        alert("Exceeds available stock.");
        return;
    }

    setCart(cart.map(item => {
      if (item.itemId === itemId) {
        return {
          ...item,
          quantity: newQty,
          subtotal: item.unitPrice * newQty
        };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(i => i.itemId !== itemId));
  };

  const handleCustomerSelect = (cust: Customer) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone || '');
    setShowCustomerSuggestions(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerName.toLowerCase()) && customerName.length > 0
  );

  const hasServices = cart.some(i => i.type === 'service');

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      alert("Customer Name is mandatory.");
      return;
    }
    if (hasServices && !mechanicName.trim()) {
      alert("Mechanic Name is required for service jobs.");
      return;
    }

    await createTransaction({
      customerName,
      customerPhone,
      vehicleModel,
      mechanicName,
      cartItems: cart,
      productDiscount,
      serviceDiscount
    });

    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setVehicleModel('');
      setMechanicName('');
      setProductDiscount(0);
      setServiceDiscount(0);
      navigate('/transactions');
    }, 1500);
  };

  const cartProductTotal = cart.filter(i => i.type === 'product').reduce((sum, i) => sum + i.subtotal, 0);
  const cartServiceTotal = cart.filter(i => i.type === 'service').reduce((sum, i) => sum + i.subtotal, 0);
  
  const finalTotal = (cartProductTotal - productDiscount) + (cartServiceTotal - serviceDiscount);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading data...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 relative">
      {/* Left: Catalog */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Scan SKU, search item..."
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          {!isSearching && (
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Box className="w-4 h-4" /> Products
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'services' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Wrench className="w-4 h-4" /> Services
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
            {isSearching ? (
               // Search Results (Flat List)
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {searchResults.map(item => (
                    <ItemCard key={item.id} item={item} onClick={() => handleAddItemClick(item)} />
                 ))}
                 {searchResults.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">No results found</div>}
               </div>
            ) : activeTab === 'products' ? (
               // Product Grid
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products.map(item => (
                    <ItemCard key={item.id} item={item} onClick={() => handleAddItemClick(item)} />
                  ))}
                  {products.length === 0 && <div className="col-span-full text-center text-slate-400">No products available</div>}
               </div>
            ) : (
               // Service Accordion
               <div className="space-y-3">
                 {SERVICE_CATEGORIES.map(category => {
                   const categoryServices = services.filter(s => s.category === category);
                   const isExpanded = expandedCategory === category;
                   
                   if (categoryServices.length === 0) return null;

                   return (
                     <div key={category} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <button 
                          onClick={() => toggleCategory(category)}
                          className={`w-full flex items-center justify-between p-4 transition-colors ${isExpanded ? 'bg-indigo-50 border-b border-indigo-100' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                              <Wrench className="w-4 h-4" />
                            </span>
                            <span className="font-semibold text-slate-800">{category}</span>
                          </div>
                          {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        </button>
                        
                        {isExpanded && (
                          <div className="divide-y divide-slate-50">
                            {categoryServices.map(service => (
                              <button
                                key={service.id}
                                onClick={() => handleAddItemClick(service)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left group"
                              >
                                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{service.name}</span>
                                <div className="p-1 rounded-full bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                  <Plus className="w-4 h-4" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                     </div>
                   );
                 })}
               </div>
            )}
        </div>
      </div>

      {/* Right: Cart & Customer */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Customer Details */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
           <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3 h-3 text-slate-500" />
                <label className="text-xs font-bold text-slate-700">Customer Name *</label>
              </div>
              <input 
                type="text" 
                value={customerName}
                onChange={e => {
                  setCustomerName(e.target.value);
                  setShowCustomerSuggestions(true);
                }}
                onFocus={() => setShowCustomerSuggestions(true)}
                className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
              />
              {showCustomerSuggestions && filteredCustomers.length > 0 && (
                <div className="absolute z-10 left-0 right-0 bg-white border border-slate-200 shadow-lg rounded-b-lg mt-1 max-h-40 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleCustomerSelect(c)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between"
                    >
                      <span>{c.name}</span>
                      <span className="text-slate-400 text-xs">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              {showCustomerSuggestions && (
                  <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setShowCustomerSuggestions(false)} 
                    style={{pointerEvents: 'auto', background: 'transparent'}}
                  />
              )}
           </div>

           <div className="grid grid-cols-2 gap-2">
             <div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <label className="text-xs font-bold text-slate-700">Phone</label>
                </div>
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                  placeholder="Optional"
                />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className="w-3 h-3 text-slate-500" />
                  <label className="text-xs font-bold text-slate-700">Mechanic</label>
                </div>
                <input 
                  type="text" 
                  value={mechanicName}
                  onChange={e => setMechanicName(e.target.value)}
                  className={`w-full p-2 text-sm border rounded-lg ${hasServices && !mechanicName ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                  placeholder={hasServices ? "Required *" : "Optional"}
                />
             </div>
           </div>

           {/* Vehicle Details Input */}
           <div>
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-3 h-3 text-slate-500" />
                <label className="text-xs font-bold text-slate-700">Vehicle Name & Model</label>
              </div>
              <input 
                type="text" 
                value={vehicleModel}
                onChange={e => setVehicleModel(e.target.value)}
                className="w-full p-2 text-sm border border-slate-300 rounded-lg"
                placeholder="e.g., Toyota Corolla 2020"
              />
           </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingCart className="w-8 h-8 opacity-20" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.itemId}-${idx}`} className="flex flex-col p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-sm text-slate-900 line-clamp-1">{item.name}</span>
                    <span className="text-xs text-slate-500 capitalize">{item.type}</span>
                  </div>
                  <button onClick={() => removeFromCart(item.itemId)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.itemId, item.quantity - 1)} className="w-6 h-6 bg-white border rounded flex items-center justify-center text-slate-600 hover:bg-slate-100">-</button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.itemId, item.quantity + 1)} className="w-6 h-6 bg-white border rounded flex items-center justify-center text-slate-600 hover:bg-slate-100">+</button>
                  </div>
                  <div className="text-right">
                     <p className="text-xs text-slate-500">{item.quantity} x ${item.unitPrice}</p>
                     <p className="font-bold text-sm">${item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="flex justify-between items-center mb-1.5 border-b border-slate-100 pb-1">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Products</span>
                  <span className="text-xs font-bold text-slate-700">${cartProductTotal.toFixed(2)}</span>
                </div>
                <div className="relative">
                   <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">Disc $</span>
                   <input 
                    type="number" min="0" 
                    value={productDiscount} 
                    onChange={e => setProductDiscount(Number(e.target.value))}
                    className="w-full pl-12 pr-2 py-1.5 text-sm border border-slate-200 bg-slate-50 rounded text-right font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="bg-white p-2 rounded border border-slate-200">
                 <div className="flex justify-between items-center mb-1.5 border-b border-slate-100 pb-1">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Services</span>
                  <span className="text-xs font-bold text-slate-700">${cartServiceTotal.toFixed(2)}</span>
                </div>
                <div className="relative">
                   <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">Disc $</span>
                   <input 
                    type="number" min="0" 
                    value={serviceDiscount} 
                    onChange={e => setServiceDiscount(Number(e.target.value))}
                    className="w-full pl-12 pr-2 py-1.5 text-sm border border-slate-200 bg-slate-50 rounded text-right font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
           </div>

           <div className="pt-2 space-y-1">
             <div className="flex justify-between text-xs text-emerald-600">
               <span>Total Discount:</span>
               <span>-${(productDiscount + serviceDiscount).toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center pt-2 border-t border-slate-200">
               <span className="font-bold text-slate-800">Grand Total</span>
               <span className="text-2xl font-bold text-indigo-600">${finalTotal.toFixed(2)}</span>
             </div>
           </div>

           <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutSuccess}
            className={`
              w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all
              ${checkoutSuccess ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'}
              ${cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {checkoutSuccess ? (
              <>
                <Check className="w-5 h-5" /> Sale Completed
              </>
            ) : (
              <>
                Confirm Payment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Manual Service Price Modal */}
      {servicePriceModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-slate-900 mb-1">{servicePriceModal.service.name}</h3>
            <p className="text-xs text-slate-500 mb-4">{servicePriceModal.service.category}</p>
            
            <form onSubmit={confirmServicePrice}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Enter Service Charge ($)</label>
              <input 
                autoFocus
                type="number" 
                min="0" 
                step="0.01"
                required
                className="w-full p-3 text-lg border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                value={servicePriceModal.price}
                onChange={e => setServicePriceModal({...servicePriceModal, price: e.target.value})}
              />
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setServicePriceModal(null)} 
                  className="flex-1 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Component for Items
const ItemCard = ({ item, onClick }: { item: CatalogItem, onClick: () => void }) => {
  const isProduct = item.type === 'product';
  const isOutOfStock = isProduct && (item as Product).stock === 0;

  return (
    <button
      onClick={onClick}
      disabled={isOutOfStock}
      className={`flex items-center justify-between p-4 rounded-lg border text-left transition-all
        ${isOutOfStock 
          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' 
          : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md'}
      `}
    >
      <div className="min-w-0 flex-1 mr-2">
        <h4 className="font-medium text-slate-900 truncate">{item.name}</h4>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
          <span className={`capitalize px-1.5 py-0.5 rounded truncate ${isProduct ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
            {isProduct ? 'Product' : (item as Service).category}
          </span>
          {isProduct && (
            <span>Stock: {(item as Product).stock}</span>
          )}
        </div>
      </div>
      <div className="text-right">
        {isProduct ? (
           <span className="block font-bold text-slate-900">${(item as Product).sellingPrice}</span>
        ) : (
           <span className="block font-bold text-slate-400 text-xs">Price?</span>
        )}
        <div className="mt-2 p-1 bg-slate-100 rounded-full inline-block hover:bg-indigo-600 hover:text-white transition-colors">
          <Plus className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};
