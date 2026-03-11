import { useState, useEffect } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface IdCardVerifyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  idCardUrl: string;
  onApproved: () => void;
}

export default function IdCardVerifyModal({
  open,
  onOpenChange,
  userId,
  userName,
  idCardUrl,
  onApproved,
}: IdCardVerifyModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (open && idCardUrl) {
      setLoadingImage(true);
      supabase.storage
        .from('id-cards')
        .createSignedUrl(idCardUrl, 300)
        .then(({ data }) => {
          setImageUrl(data?.signedUrl ?? null);
          setLoadingImage(false);
        });
    } else {
      setImageUrl(null);
    }
  }, [open, idCardUrl]);

  const handleApprove = async () => {
    setApproving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        id_card_verified: true,
        id_card_verified_at: new Date().toISOString(),
      })
      .eq('id', userId);

    setApproving(false);
    if (!error) {
      onApproved();
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#1c1c1c] border border-gray-700 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <AlertDialog.Title className="text-lg font-bold text-white font-['Oxanium']">
            ID Card — {userName}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-gray-400 text-sm mt-1">
            Review the uploaded ID card and approve or reject.
          </AlertDialog.Description>

          <div className="mt-4 min-h-[200px] flex items-center justify-center bg-black/40 rounded-lg border border-gray-800">
            {loadingImage ? (
              <Loader2 className="animate-spin text-gray-500" size={32} />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="ID Card"
                className="max-w-full max-h-[400px] object-contain rounded"
              />
            ) : (
              <p className="text-gray-500 text-sm">Unable to load image</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors">
                Reject
              </button>
            </AlertDialog.Cancel>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {approving ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
