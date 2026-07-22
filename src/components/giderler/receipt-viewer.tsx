"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface ReceiptViewerProps {
  fisYolu: string;
  fisAdi: string;
}

export function ReceiptViewer({ fisYolu, fisAdi }: ReceiptViewerProps) {
  const isPdf = fisYolu.toLowerCase().endsWith(".pdf");

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Eye className="mr-1 size-4" />
        {isPdf ? "PDF" : "Fis"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{fisAdi || "Fis Goruntule"}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 max-h-[70vh] overflow-auto">
          {isPdf ? (
            <iframe
              src={fisYolu}
              className="h-[60vh] w-full rounded border"
              title={fisAdi}
            />
          ) : (
            <img
              src={fisYolu}
              alt={fisAdi || "Fis"}
              className="w-full rounded object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
