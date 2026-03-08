import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Calendar } from 'lucide-react';

export default function DashboardEvents() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Oxanium']">Event Management</h1>
          <p className="text-gray-400 mt-1">Create, review, and manage events</p>
        </div>
        <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
          <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Event management coming soon</p>
          <p className="text-gray-500 text-sm mt-1">Draft → Lead Approval → President Approval → Published</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
