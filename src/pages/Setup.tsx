import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Setup() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/setup' } } });
      return;
    }
    checkAdminExists();
  }, [user, authLoading]);

  const checkAdminExists = async () => {
    setChecking(true);
    try {
      // GET request to check without claiming
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/claim-admin`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      setAdminExists(data.adminExists === true);
    } catch {
      setAdminExists(false);
    }
    setChecking(false);
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke('claim-admin', {
        method: 'POST',
        body: {},
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Failed to claim admin');
        if (data?.error?.includes('already exists')) {
          setAdminExists(true);
        }
      } else {
        setClaimed(true);
        toast.success('You are now Super Admin!');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || 'Unexpected error');
    }
    setClaiming(false);
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full bg-[#1c1c1c] border border-gray-800 rounded-2xl p-8 text-center space-y-6">
        <Shield size={56} className="mx-auto text-purple-500" />
        <h1 className="text-2xl font-bold text-white font-['Oxanium']">System Setup</h1>

        {claimed ? (
          <div className="space-y-3">
            <CheckCircle size={40} className="mx-auto text-green-500" />
            <p className="text-green-400">Super Admin claimed! Redirecting to dashboard...</p>
          </div>
        ) : adminExists ? (
          <div className="space-y-3">
            <XCircle size={40} className="mx-auto text-yellow-500" />
            <p className="text-gray-300">A Super Admin already exists.</p>
            <p className="text-gray-500 text-sm">Contact the current Super Admin to get your role assigned, or ask them to transfer the admin role to you via the dashboard.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-300">No Super Admin has been set up yet.</p>
            <p className="text-gray-500 text-sm">
              As the first person here, you can claim the Super Admin role. This gives you full control over the system.
            </p>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {claiming ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Claim Super Admin
                </>
              )}
            </button>
          </div>
        )}

        <p className="text-gray-600 text-xs">Logged in as {user?.email}</p>
      </div>
    </div>
  );
}
