"use client";

import { QRCodeFormDialog, type QRCodeFormDialogProps } from "./qr-code-form-dialog";

type EditQRCodeDialogProps = Omit<QRCodeFormDialogProps, "mode">;

export function EditQRCodeDialog(props: EditQRCodeDialogProps) {
  return <QRCodeFormDialog {...props} mode="edit" />;
}
