import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useStats } from '@/hooks/queries';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Users, Calendar, ClipboardList, Shield, Ticket, Award, Loader2 } from 'lucide-react';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { getHighestRole, hasMinRoleLevel } = useRole();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useStats();

  const highestRole = getHighestRole();

  const statCards = [
    { title: 'My Registrations', value: stats?.myRegistrations ?? 0, icon: Ticket, color: 'text-cyan-400 bg-cyan-500/20', minLevel: 1 },
    { title: 'Certificates', value: stats?.certificates ?? 0, icon: Award, color: 'text-emerald-400 bg-emerald-500/20', minLevel: 1 },
    { title: 'Published Events', value: stats?.events ?? 0, icon: Calendar, color: 'text-green-400 bg-green-500/20', minLevel: 2 },
    { title: 'Teams', value: stats?.teams ?? 0, icon: Users, color: 'text-blue-400 bg-blue-500/20', minLevel: 3 },
    { title: 'Tasks', value: stats?.tasks ?? 0, icon: ClipboardList, color: 'text-amber-400 bg-amber-500/20', minLevel: 2 },
    { title: 'Users', value: stats?.users ?? 0, icon: Shield, color: 'text-purple-400 bg-purple-500/20', minLevel: 4 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Oxanium']">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Welcome back! You're logged in as{' '}
            <span className="text-[#9113ff]">{highestRole?.replace(/_/g, ' ') || 'Participant'}</span>
          </p>
        </div>

        {/* Stat cards */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards
              .filter((s) => hasMinRoleLevel(s.minLevel))
              .map((card) => (
                <div key={card.title} className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{card.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                      <card.icon size={24} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/dashboard/events')}
              className="px-4 py-2.5 bg-[#9113ff] hover:bg-[#7c0fd9] text-white rounded-lg transition-colors text-sm font-medium"
            >
              {hasMinRoleLevel(2) ? 'Manage Events' : 'My Events'}
            </button>
            {hasMinRoleLevel(3) && (
              <button
                onClick={() => navigate('/dashboard/teams')}
                className="px-4 py-2.5 bg-transparent border border-[#9113ff] text-[#9113ff] hover:bg-[#9113ff]/10 rounded-lg transition-colors text-sm font-medium"
              >
                Manage Teams
              </button>
            )}
            {hasMinRoleLevel(5) && (
              <button
                onClick={() => navigate('/dashboard/users')}
                className="px-4 py-2.5 bg-transparent border border-gray-600 text-gray-300 hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
              >
                Manage Users
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
