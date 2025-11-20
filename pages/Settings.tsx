import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, User, Save } from 'lucide-react';

export default function Settings() {
  const { user, allUsers, updateUser } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', password: '' });

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-slate-500">Access Restricted</div>;
  }

  const startEdit = (u: any) => {
    setEditingId(u.id);
    setFormData({ name: u.name, password: u.password || '' });
  };

  const saveUser = (id: string) => {
    updateUser(id, { name: formData.name, password: formData.password });
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5" />
            User Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage access credentials for staff.</p>
        </div>
        
        <div className="divide-y divide-slate-100">
           {allUsers.map(u => (
             <div key={u.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  
                  {editingId === u.id ? (
                    <div className="space-y-2">
                       <input 
                         type="text" 
                         value={formData.name} 
                         onChange={e => setFormData({...formData, name: e.target.value})}
                         className="block w-full p-1 border rounded text-sm" 
                       />
                       <input 
                         type="text" 
                         value={formData.password} 
                         onChange={e => setFormData({...formData, password: e.target.value})}
                         className="block w-full p-1 border rounded text-sm" 
                         placeholder="New Password"
                       />
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="text-sm text-slate-500 capitalize">{u.role}</p>
                      <p className="text-xs text-slate-400 mt-1">Password: {u.password ? '••••' : 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div>
                   {editingId === u.id ? (
                     <button 
                       onClick={() => saveUser(u.id)}
                       className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                     >
                       <Save className="w-4 h-4" /> Save
                     </button>
                   ) : (
                     <button 
                       onClick={() => startEdit(u)}
                       className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                     >
                       Edit
                     </button>
                   )}
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}