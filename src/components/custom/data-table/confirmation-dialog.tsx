import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { JSX } from "react";

type ConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | JSX.Element;
  buttonText: string;
  buttonClass?: string;
  onConfirm: () => void;
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  buttonText,
  buttonClass,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="select-none py-2">
        <AlertDialogHeader className="rtl:items-center pb-3">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-x-3 rtl:flex-row-reverse">
          <AlertDialogCancel variant={"destructive"}>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={buttonClass}>
            {buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
