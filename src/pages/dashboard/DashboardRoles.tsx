import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Shield } from 'lucide-react';

export default function DashboardRoles() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Oxanium']">Roles & Permissions</h1>
          <p className="text-gray-400 mt-1">View and configure role permissions</p>
        </div>
        <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
          <Shield size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Roles & permissions management coming soon</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
