import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ClipboardList } from 'lucide-react';

export default function DashboardTasks() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Oxanium']">Task Management</h1>
          <p className="text-gray-400 mt-1">Create, assign, and review tasks</p>
        </div>
        <div className="bg-[#1c1c1c] border border-gray-800 rounded-lg p-12 text-center">
          <ClipboardList size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Task management coming soon</p>
          <p className="text-gray-500 text-sm mt-1">Assign → Submit → Lead Review → Approved</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
