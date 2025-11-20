import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench, ShieldCheck, UserCircle, Lock } from 'lucide-react';

export default function Login() {
  const { allUsers, login } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUserSelect = (id: string) => {
    setSelectedUserId(id);
    setPassword('');
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(async () => {
      const success = await login(selectedUserId, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Incorrect password');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl mb-4">
          <Wrench className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">AutoTrack Pro</h1>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          Sales & Inventory Management System
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
        <div className="p-8">
          {!selectedUserId ? (
            <>
              <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">Select Account</h2>
              <div className="space-y-4">
                {allUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className="w-full group relative flex items-center p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all duration-200 text-left"
                  >
                    <div className={`
                      p-3 rounded-lg mr-4 transition-colors
                      ${user.role === 'admin' 
                        ? 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600' 
                        : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'}
                    `}>
                      {user.role === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <UserCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500 capitalize">{user.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
               <div className="text-center">
                 <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
                 <p className="text-slate-500 text-sm mt-1">
                    {allUsers.find(u => u.id === selectedUserId)?.name}
                 </p>
               </div>

               <div>
                 <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter password"
                    />
                 </div>
                 {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
               </div>

               <div className="flex gap-3">
                 <button 
                   type="button"
                   onClick={() => setSelectedUserId(null)}
                   className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                 >
                   Back
                 </button>
                 <button 
                   type="submit"
                   disabled={loading}
                   className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                 >
                   {loading ? 'Verifying...' : 'Login'}
                 </button>
               </div>
            </form>
          )}
        </div>
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Default Admin Password: 1234
          </p>
        </div>
      </div>
    </div>
  );
}