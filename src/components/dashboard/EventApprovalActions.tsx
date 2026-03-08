import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Send, Loader2, Globe, Lock, ClipboardCheck } from 'lucide-react';

interface Approval {
  id: string;
  level: number;
  status: string;
}

interface EventApprovalActionsProps {
  eventId: string;
  eventStatus: string;
  eventCreatedBy: string;
  approval: Approval | null;
  onUpdated: () => void;
  onMarkAttendance?: () => void;
}

export default function EventApprovalActions({
  eventId,
  eventStatus,
  eventCreatedBy,
  approval,
  onUpdated,
  onMarkAttendance,
}: EventApprovalActionsProps) {
  const { user } = useAuth();
  const { hasMinRoleLevel, isTeamLead, isPresident } = useRole();
  const [loading, setLoading] = useState(false);

  const handleSubmitForReview = async () => {
    setLoading(true);
    // Update event status to PENDING_LEAD
    const { error } = await supabase
      .from('events')
      .update({ status: 'PENDING_LEAD' })
      .eq('id', eventId);

    if (error) {
      toast.error('Failed to submit for review');
    } else {
      toast.success('Event submitted for Team Lead review');
      onUpdated();
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    setLoading(true);

    if (eventStatus === 'PENDING_LEAD' && isTeamLead()) {
      // Team Lead approves → move to PENDING_PRESIDENT
      const [evtRes, aprRes] = await Promise.all([
        supabase.from('events').update({ status: 'PENDING_PRESIDENT' }).eq('id', eventId),
        approval
          ? supabase.from('approvals').update({
              status: 'APPROVED',
              reviewed_by: user!.id,
              reviewed_at: new Date().toISOString(),
            }).eq('id', approval.id)
          : Promise.resolve({ error: null }),
      ]);

      // Create president-level approval
      await supabase.from('approvals').insert({
        item_id: eventId,
        item_type: 'EVENT',
        level: 2,
        status: 'PENDING',
      });

      if (evtRes.error || aprRes.error) {
        toast.error('Failed to approve');
      } else {
        toast.success('Approved! Forwarded to President for final approval.');
        onUpdated();
      }
    } else if (eventStatus === 'PENDING_PRESIDENT' && isPresident()) {
      // President approves → APPROVED
      const [evtRes, aprRes] = await Promise.all([
        supabase.from('events').update({ status: 'APPROVED' }).eq('id', eventId),
        approval
          ? supabase.from('approvals').update({
              status: 'APPROVED',
              reviewed_by: user!.id,
              reviewed_at: new Date().toISOString(),
            }).eq('id', approval.id)
          : Promise.resolve({ error: null }),
      ]);

      if (evtRes.error || aprRes.error) {
        toast.error('Failed to approve');
      } else {
        toast.success('Event approved! It can now be published.');
        onUpdated();
      }
    }
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    const newStatus = eventStatus === 'PENDING_LEAD' ? 'DRAFT' : 'DRAFT';

    const [evtRes, aprRes] = await Promise.all([
      supabase.from('events').update({ status: newStatus }).eq('id', eventId),
      approval
        ? supabase.from('approvals').update({
            status: 'REJECTED',
            reviewed_by: user!.id,
            reviewed_at: new Date().toISOString(),
          }).eq('id', approval.id)
        : Promise.resolve({ error: null }),
    ]);

    if (evtRes.error || aprRes.error) {
      toast.error('Failed to reject');
    } else {
      toast.success('Event rejected and sent back to draft.');
      onUpdated();
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('events')
      .update({ status: 'PUBLISHED' })
      .eq('id', eventId);

    if (error) {
      toast.error('Failed to publish');
    } else {
      toast.success('Event is now live!');
      onUpdated();
    }
    setLoading(false);
  };

  const handleCloseEvent = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('events')
      .update({ status: 'CLOSED' })
      .eq('id', eventId);

    if (error) {
      toast.error('Failed to close event');
    } else {
      toast.success('Event closed successfully');
      onUpdated();
    }
    setLoading(false);
  };

  if (loading) {
    return <Loader2 size={16} className="animate-spin text-gray-400" />;
  }

  const isCreator = user?.id === eventCreatedBy;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Creator can submit DRAFT for review */}
      {eventStatus === 'DRAFT' && isCreator && (
        <button
          onClick={handleSubmitForReview}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-colors"
        >
          <Send size={13} />
          Submit for Review
        </button>
      )}

      {/* Team Lead can approve/reject PENDING_LEAD */}
      {eventStatus === 'PENDING_LEAD' && isTeamLead() && (
        <>
          <button
            onClick={handleApprove}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <CheckCircle size={13} />
            Approve
          </button>
          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <XCircle size={13} />
            Reject
          </button>
        </>
      )}

      {/* President can approve/reject PENDING_PRESIDENT */}
      {eventStatus === 'PENDING_PRESIDENT' && isPresident() && (
        <>
          <button
            onClick={handleApprove}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <CheckCircle size={13} />
            Final Approve
          </button>
          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <XCircle size={13} />
            Reject
          </button>
        </>
      )}

      {/* President+ can publish APPROVED events */}
      {eventStatus === 'APPROVED' && isPresident() && (
        <button
          onClick={handlePublish}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#9113ff]/20 text-[#9113ff] border border-[#9113ff]/30 rounded-lg hover:bg-[#9113ff]/30 transition-colors"
        >
          <Globe size={13} />
          Publish
        </button>
      )}

      {/* Team leads+ can close PUBLISHED events and mark attendance */}
      {eventStatus === 'PUBLISHED' && isTeamLead() && (
        <>
          {onMarkAttendance && (
            <button
              onClick={onMarkAttendance}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <ClipboardCheck size={13} />
              Mark Attendance
            </button>
          )}
          <button
            onClick={handleCloseEvent}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 transition-colors"
          >
            <Lock size={13} />
            Close Event
          </button>
        </>
      )}

      {/* Can still mark attendance on closed events */}
      {eventStatus === 'CLOSED' && isTeamLead() && onMarkAttendance && (
        <button
          onClick={onMarkAttendance}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
        >
          <ClipboardCheck size={13} />
          Mark Attendance
        </button>
      )}
    </div>
  );
}
