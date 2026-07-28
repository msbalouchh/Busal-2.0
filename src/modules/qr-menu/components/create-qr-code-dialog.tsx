"use client";

import { QRCodeFormDialog, type QRCodeFormDialogProps } from "./qr-code-form-dialog";

type CreateQRCodeDialogProps = Omit<QRCodeFormDialogProps, "mode">;

export function CreateQRCodeDialog(props: CreateQRCodeDialogProps) {
  return <QRCodeFormDialog {...props} mode="create" />;
}
