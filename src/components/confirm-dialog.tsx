"use client";

type ConfirmDialogProps = {
  titleId: string;
  title: string;
  description: string;
  error?: string | null;
  isPending: boolean;
  confirmLabel?: string;
  pendingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  titleId,
  title,
  description,
  error,
  isPending,
  confirmLabel = "削除",
  pendingLabel = "削除中…",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-lg"
    >
      <div className="flex w-full max-w-[480px] flex-col gap-lg rounded-lg bg-surface-elevated p-xl">
        <h3 id={titleId} className="text-heading-lg">
          {title}
        </h3>
        <p className="text-body-sm text-body-dark">{description}</p>
        {error && (
          <p role="alert" className="text-caption-md text-warning">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-sm">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="h-12 rounded-full border border-hairline-dark px-lg text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="h-12 rounded-full border border-warning px-lg text-button-md text-warning transition-colors hover:bg-warning hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
