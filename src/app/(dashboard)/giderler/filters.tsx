"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { KATEGORI_LABELS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

export function GiderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const kategori = searchParams.get("kategori") || "";
  const baslangic = searchParams.get("baslangic") || "";
  const bitis = searchParams.get("bitis") || "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "TUMU") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/giderler?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/giderler");
  };

  const hasFilters = kategori || baslangic || bitis;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[160px] space-y-1.5">
            <Label className="text-xs">Kategori</Label>
            <Select
              value={kategori || "TUMU"}
              onValueChange={(val) => updateParams("kategori", val || "TUMU")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tumu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TUMU">Tumu</SelectItem>
                {Object.entries(KATEGORI_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Baslangic Tarihi</Label>
            <Input
              type="date"
              value={baslangic}
              onChange={(e) => updateParams("baslangic", e.target.value)}
              className="w-auto"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Bitis Tarihi</Label>
            <Input
              type="date"
              value={bitis}
              onChange={(e) => updateParams("bitis", e.target.value)}
              className="w-auto"
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 size-4" />
              Temizle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
