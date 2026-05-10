"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FileAttachment } from "@/hooks/useSales";

export function DeleteAttachmentDialog({
  attachment,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  attachment: FileAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити файл?</DialogTitle>
          <DialogDescription>
            {attachment
              ? `Ви впевнені, що хочете видалити «${attachment.originalFilename}»? Цю дію не можна скасувати.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Скасувати
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            Видалити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
