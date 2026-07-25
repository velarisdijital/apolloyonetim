"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCog, Plus, Users, Search } from "lucide-react";
import { ROL_LABELS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";

interface Apartment {
  id: string;
  no: string;
}

interface User {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  rol: string;
  telefon?: string | null;
  aktif: boolean;
  apartment?: { no: string } | null;
}

export default function SakinlerPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arama, setArama] = useState("");

  const [form, setForm] = useState({
    ad: "",
    soyad: "",
    telefon: "",
    email: "",
    password: "",
    rol: "",
    apartmentId: "",
  });

  // Auth check
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.rol !== "MASTER_ADMIN") {
      router.push("/panel");
    }
  }, [session, status, router]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/kullanicilar");
      if (!res.ok) throw new Error(t.errors.generic);
      const data = await res.json();
      setUsers(data);
    } catch {
      setError(t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  // Fetch apartments
  const fetchApartments = async () => {
    try {
      const res = await fetch("/api/daireler");
      if (!res.ok) return;
      const data = await res.json();
      setApartments(data);
    } catch {
      // Daire listesi opsiyonel
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.rol === "MASTER_ADMIN") {
      fetchUsers();
      fetchApartments();
    }
  }, [status, session]);

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, string> = {
        ad: form.ad,
        soyad: form.soyad,
        telefon: form.telefon,
        email: form.email,
        password: form.password,
        rol: form.rol,
      };
      if (form.apartmentId) {
        body.apartmentId = form.apartmentId;
      }

      const res = await fetch("/api/kullanicilar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || t.errors.generic);
      }

      setForm({ ad: "", soyad: "", telefon: "", email: "", password: "", rol: "", apartmentId: "" });
      setDialogOpen(false);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.residents.title}</h1>
          <p className="text-muted-foreground">{t.residents.subtitle}</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">{t.common.loading}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session?.user?.rol !== "MASTER_ADMIN") {
    return null;
  }

  const filteredUsers = users.filter((user) => {
    if (!arama.trim()) return true;
    const q = arama.toLowerCase();
    return (
      `${user.ad} ${user.soyad}`.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.telefon && user.telefon.includes(q)) ||
      (user.apartment?.no && user.apartment.no.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.residents.title}</h1>
          <p className="text-muted-foreground">{t.residents.subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
              <Plus className="mr-2 size-4" />
              {t.residents.addNew}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t.residents.addTitle}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ad">{t.residents.name}</Label>
                <Input
                  id="ad"
                  value={form.ad}
                  onChange={(e) => setForm({ ...form, ad: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soyad">{t.residents.surname}</Label>
                <Input
                  id="soyad"
                  value={form.soyad}
                  onChange={(e) => setForm({ ...form, soyad: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefon">{t.residents.phone}</Label>
                <Input
                  id="telefon"
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t.residents.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rol">{t.residents.role}</Label>
                <Select
                  value={form.rol}
                  onValueChange={(value) => setForm({ ...form, rol: value || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.residents.selectRole} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apartment">{t.residents.apartment}</Label>
                <Select
                  value={form.apartmentId}
                  onValueChange={(value) => setForm({ ...form, apartmentId: value || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.residents.selectApartment} />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t.common.saving : t.common.save}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="size-5" />
              {t.residents.userList}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t.residents.searchPlaceholder}
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 size-12 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">
                {t.residents.noResidents}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.residents.addHint}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.residents.fullName}</TableHead>
                    <TableHead>{t.residents.email}</TableHead>
                    <TableHead>{t.residents.role}</TableHead>
                    <TableHead>{t.residents.apartment}</TableHead>
                    <TableHead>{t.residents.phone}</TableHead>
                    <TableHead>{t.residents.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.ad} {user.soyad}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ROL_LABELS[user.rol] || user.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.apartment?.no || "-"}</TableCell>
                      <TableCell>{user.telefon || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.aktif ? "default" : "destructive"}
                          className={
                            user.aktif
                              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200"
                          }
                        >
                          {user.aktif ? t.residents.active : t.residents.inactive}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
