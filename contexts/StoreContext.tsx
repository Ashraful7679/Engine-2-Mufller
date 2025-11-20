
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Service, Transaction, CartItem, Customer, CashFlowEntry, CashFlowType } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SERVICES } from '../constants';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface TransactionDetails {
  customerName: string;
  customerPhone?: string;
  vehicleModel?: string;
  mechanicName?: string;
  cartItems: CartItem[];
  productDiscount: number;
  serviceDiscount: number;
}

interface StoreContextType {
  products: Product[];
  services: Service[];
  transactions: Transaction[];
  customers: Customer[];
  cashFlows: CashFlowEntry[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  createTransaction: (details: TransactionDetails) => Promise<void>;
  editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  canDeleteTransaction: (transaction: Transaction) => boolean;
  canEditTransaction: (transaction: Transaction) => boolean;
  addCashFlow: (entry: Omit<CashFlowEntry, 'id' | 'timestamp' | 'createdBy'>) => Promise<void>;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Initialize state
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlowEntry[]>([]);

  const fetchData = async () => {
    setLoading(true);
    
    // If DB is not configured, use mock data immediately
    if (!isSupabaseConfigured) {
      console.log("Loading Mock Data (Offline Mode)");
      setProducts(INITIAL_PRODUCTS);
      setServices(INITIAL_SERVICES);
      setTransactions([]);
      setCustomers([]);
      setCashFlows([]);
      setLoading(false);
      return;
    }

    try {
      console.log("Connecting to Supabase...");
      
      // 1. Products
      const { data: prodData, error: prodError } = await supabase.from('products').select('*');
      if (prodError) throw prodError;

      if (prodData && prodData.length > 0) {
        const mappedProds = prodData.map((p: any) => ({
            ...p,
            buyingPrice: Number(p.buying_price),
            sellingPrice: Number(p.selling_price),
            stock: Number(p.stock)
        }));
        setProducts(mappedProds);
      } else {
        console.log("Seeding Products...");
        // SEED PRODUCTS if table exists but is empty
        const seedProds = INITIAL_PRODUCTS.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            type: p.type,
            category: p.category,
            buying_price: p.buyingPrice,
            selling_price: p.sellingPrice,
            stock: p.stock
        }));
        const { error: seedErr } = await supabase.from('products').insert(seedProds);
        if (seedErr) console.error("Product Seed Error:", seedErr);
        else setProducts(INITIAL_PRODUCTS);
      }

      // 2. Services
      const { data: servData, error: servError } = await supabase.from('services').select('*');
      if (servError) throw servError;

      if (servData && servData.length > 0) {
         setServices(servData as Service[]);
      } else {
        console.log("Seeding Services...");
        // SEED SERVICES
        // Supabase might limit large inserts, but ~60 items is usually fine.
        const { error: seedErr } = await supabase.from('services').insert(INITIAL_SERVICES);
        if (seedErr) console.error("Service Seed Error:", seedErr);
        else setServices(INITIAL_SERVICES);
      }

      // 3. Customers
      const { data: custData } = await supabase.from('customers').select('*');
      if (custData) setCustomers(custData as Customer[]);

      // 4. Transactions
      const { data: txData } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });
      if (txData) {
          const mappedTx = txData.map((t: any) => ({
              id: t.id,
              timestamp: Number(t.timestamp),
              customerName: t.customer_name,
              customerPhone: t.customer_phone,
              vehicleModel: t.vehicle_model,
              mechanicName: t.mechanic_name,
              productTotal: Number(t.product_total),
              serviceTotal: Number(t.service_total),
              productDiscount: Number(t.product_discount),
              serviceDiscount: Number(t.service_discount),
              totalAmount: Number(t.total_amount),
              totalProfit: Number(t.total_profit),
              createdBy: t.created_by,
              createdByName: t.created_by_name,
              items: t.items // JSONB column maps directly to array
          }));
          setTransactions(mappedTx);
      }

      // 5. Cash Flow (Expenses & Withdrawals)
      const { data: cfData } = await supabase.from('cash_flow').select('*').order('timestamp', { ascending: false });
      if (cfData) {
        setCashFlows(cfData.map((c: any) => ({
          ...c,
          timestamp: Number(c.timestamp),
          amount: Number(c.amount)
        })));
      }

    } catch (error: any) {
      console.error("Error fetching data (using offline fallback):", error.message || JSON.stringify(error));
      // FALLBACK for offline/missing credentials/network error
      setProducts(INITIAL_PRODUCTS);
      setServices(INITIAL_SERVICES);
      setTransactions([]);
      setCustomers([]);
      setCashFlows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct = { ...productData, id: `p${Date.now()}` };
    setProducts(prev => [...prev, newProduct]);

    if (isSupabaseConfigured) {
      try {
        const dbPayload = {
            id: newProduct.id,
            name: newProduct.name,
            sku: newProduct.sku,
            type: 'product',
            category: newProduct.category,
            buying_price: newProduct.buyingPrice,
            selling_price: newProduct.sellingPrice,
            stock: newProduct.stock
        };
        const { error } = await supabase.from('products').insert(dbPayload);
        if (error) {
          console.error("DB Insert Failed", error);
          alert("Failed to save product to database. Check console.");
        }
      } catch (e) { console.error("DB Insert Exception", e); }
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      
      if (isSupabaseConfigured) {
        try {
          const dbUpdates: any = {};
          if (updates.name) dbUpdates.name = updates.name;
          if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
          if (updates.buyingPrice) dbUpdates.buying_price = updates.buyingPrice;
          if (updates.sellingPrice) dbUpdates.selling_price = updates.sellingPrice;
          if (updates.category) dbUpdates.category = updates.category;
          if (updates.sku) dbUpdates.sku = updates.sku;

          const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
          if (error) console.error("DB Update Failed", error);
        } catch (e) { console.error("DB Update Exception", e); }
      }
  };

  const addService = async (serviceData: Omit<Service, 'id'>) => {
    const newService = { ...serviceData, id: `s${Date.now()}` };
    setServices(prev => [...prev, newService]);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('services').insert(newService);
        if (error) {
           console.error("DB Insert Failed", error);
           alert("Failed to save service to database.");
        }
      } catch (e) { console.error("DB Insert Exception", e); }
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('services').update(updates).eq('id', id);
        if (error) console.error("DB Update Failed", error);
      } catch (e) { console.error("DB Update Exception", e); }
    }
  };

  const createTransaction = async (details: TransactionDetails) => {
    if (!user) return;

    const { customerName, customerPhone, vehicleModel, mechanicName, cartItems, productDiscount, serviceDiscount } = details;
    const timestamp = Date.now();
    const txId = `TX-${timestamp.toString().slice(-6)}`;

    // 1. Handle Customer - Local Optimistic
    const existingCustomer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
    if (!existingCustomer) {
       const newCust = { id: `c${Date.now()}`, name: customerName, phone: customerPhone };
       setCustomers(prev => [...prev, newCust]);
       if (isSupabaseConfigured) {
         supabase.from('customers').insert(newCust).then(({error}) => {
           if(error) console.error("Customer creation failed", error);
         });
       }
    } else if (customerPhone && existingCustomer.phone !== customerPhone) {
       setCustomers(prev => prev.map(c => c.id === existingCustomer.id ? {...c, phone: customerPhone} : c));
       if (isSupabaseConfigured) {
         supabase.from('customers').update({ phone: customerPhone }).eq('id', existingCustomer.id).then();
       }
    }

    let productTotal = 0;
    let serviceTotal = 0;
    let totalCost = 0;

    // 2. Process Items & Stock
    const processedItems = cartItems.map(item => {
      if (item.type === 'product') {
        productTotal += item.subtotal;
        const product = products.find(p => p.id === item.itemId);
        if (product) {
            totalCost += (product.buyingPrice * item.quantity);
            // Update local and DB stock
            const newStock = product.stock - item.quantity;
            updateProduct(product.id, { stock: newStock });
        }
      } else {
        serviceTotal += item.subtotal;
      }
      return item;
    });

    const finalTotal = (productTotal - productDiscount) + (serviceTotal - serviceDiscount);
    const totalProfit = finalTotal - totalCost;

    const newTransaction: Transaction = {
      id: txId,
      timestamp,
      customerName,
      customerPhone,
      vehicleModel,
      mechanicName,
      items: processedItems,
      productTotal,
      serviceTotal,
      productDiscount,
      serviceDiscount,
      totalAmount: finalTotal,
      totalProfit,
      createdBy: user.id,
      createdByName: user.name,
    };

    // Optimistic
    setTransactions(prev => [newTransaction, ...prev]);

    if (isSupabaseConfigured) {
      const dbTx = {
          id: txId,
          timestamp,
          customer_name: customerName,
          customer_phone: customerPhone,
          vehicle_model: vehicleModel,
          mechanic_name: mechanicName,
          product_total: productTotal,
          service_total: serviceTotal,
          product_discount: productDiscount,
          service_discount: serviceDiscount,
          total_amount: finalTotal,
          total_profit: totalProfit,
          created_by: user.id,
          created_by_name: user.name,
          items: processedItems
      };

      try {
        const { error } = await supabase.from('transactions').insert(dbTx);
        if (error) {
          console.error("Transaction DB Sync Failed", error);
          alert("Error: Transaction not saved to database! Check connection.");
        }
      } catch (e) {
        console.error("Transaction DB Exception", e);
      }
    }
  };

  // 12 Minutes Limit
  const TIME_LIMIT_MS = 12 * 60 * 1000; 

  const canDeleteTransaction = (transaction: Transaction): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const isWithinTimeLimit = (Date.now() - transaction.timestamp) < TIME_LIMIT_MS; 
    return isWithinTimeLimit;
  };
  
  const canEditTransaction = (transaction: Transaction): boolean => {
    return canDeleteTransaction(transaction);
  };

  const deleteTransaction = async (transactionId: string): Promise<boolean> => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || !canDeleteTransaction(tx)) return false;

    // Restore stock
    tx.items.forEach(item => {
        if (item.type === 'product') {
             const product = products.find(p => p.id === item.itemId);
             if (product) {
                 updateProduct(product.id, { stock: product.stock + item.quantity });
             }
        }
    });

    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
        if (error) console.error("DB Delete Failed", error);
      } catch (e) { console.error("DB Delete Exception", e); }
    }
    return true;
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (isSupabaseConfigured) {
      try {
        const dbUpdates: any = {};
        if (updates.customerName) dbUpdates.customer_name = updates.customerName;
        if (updates.customerPhone) dbUpdates.customer_phone = updates.customerPhone;
        if (updates.vehicleModel) dbUpdates.vehicle_model = updates.vehicleModel;
        if (updates.mechanicName) dbUpdates.mechanic_name = updates.mechanicName;
        if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
        if (updates.totalProfit !== undefined) dbUpdates.total_profit = updates.totalProfit;
        if (updates.productDiscount !== undefined) dbUpdates.product_discount = updates.productDiscount;
        if (updates.serviceDiscount !== undefined) dbUpdates.service_discount = updates.serviceDiscount;

        const { error } = await supabase.from('transactions').update(dbUpdates).eq('id', id);
        if (error) console.error("DB Transaction Update Failed", error);
      } catch (e) { console.error("DB Transaction Update Exception", e); }
    }
  };

  const addCashFlow = async (entry: Omit<CashFlowEntry, 'id' | 'timestamp' | 'createdBy'>) => {
    if (!user) return;
    const newEntry: CashFlowEntry = {
      ...entry,
      id: `cf${Date.now()}`,
      timestamp: Date.now(),
      createdBy: user.id
    };

    setCashFlows(prev => [newEntry, ...prev]);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('cash_flow').insert({
          id: newEntry.id,
          type: newEntry.type,
          category: newEntry.category,
          amount: newEntry.amount,
          description: newEntry.description,
          timestamp: newEntry.timestamp,
          created_by: newEntry.createdBy
        });

        if (error) {
            console.error("DB CashFlow Insert Failed", error);
            alert(`Error saving to database: ${error.message || 'Unknown error'}`);
        }
      } catch (e) { console.error("DB CashFlow Exception", e); }
    }
  };

  return (
    <StoreContext.Provider value={{
      products,
      services,
      transactions,
      customers,
      cashFlows,
      addProduct,
      updateProduct,
      addService,
      updateService,
      createTransaction,
      editTransaction,
      deleteTransaction,
      canDeleteTransaction,
      canEditTransaction,
      addCashFlow,
      loading
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
