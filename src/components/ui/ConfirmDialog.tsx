import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const confirmColors =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-amber-600 hover:bg-amber-700 text-white';

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-xl border border-gray-800 bg-[#141414] p-6 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <AlertDialog.Title className="text-lg font-semibold text-white font-['Oxanium']">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-400 leading-relaxed">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg border border-gray-700 text-gray-300 hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                disabled={loading}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 ${confirmColors}`}
              >
                {loading ? 'Please wait…' : confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
