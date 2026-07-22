"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Plus, BarChart3, CheckCircle } from "lucide-react";
import Link from "next/link";

interface PollVote {
  id: string;
  secenek: number;
  pollId: string;
  userId: string;
}

interface Poll {
  id: string;
  soru: string;
  secenekler: string;
  durum: "AKTIF" | "TAMAMLANDI" | "IPTAL";
  bitisTarihi: string;
  buildingId: string;
  votes: PollVote[];
}

const durumRenk: Record<string, string> = {
  AKTIF: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  TAMAMLANDI: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  IPTAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const durumEtiket: Record<string, string> = {
  AKTIF: "Aktif",
  TAMAMLANDI: "Tamamlandı",
  IPTAL: "İptal",
};

export default function OylamalarPage() {
  const { data: session } = useSession();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/oylamalar");
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
      }
    } catch (error) {
      console.error("Oylamalar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleVote = async (pollId: string, secenek: number) => {
    setVotingPollId(pollId);
    try {
      const res = await fetch("/api/oylamalar/oy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, secenek }),
      });
      if (res.ok) {
        await fetchPolls();
      }
    } catch (error) {
      console.error("Oy kullanılırken hata:", error);
    } finally {
      setVotingPollId(null);
    }
  };

  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Oylamalar</h1>
          <p className="text-muted-foreground">Bina oylamaları</p>
        </div>
        {userRole === "MASTER_ADMIN" && (
          <Link href="/oylamalar/ekle">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Oylama
            </Button>
          </Link>
        )}
      </div>

      {polls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Vote className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">Henüz oylama yok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => {
            const secenekler: string[] = JSON.parse(poll.secenekler);
            const toplamOy = poll.votes.length;
            const kullaniciOyKullandi = poll.votes.some(
              (v) => v.userId === userId
            );
            const sonuclariGoster =
              kullaniciOyKullandi || poll.durum !== "AKTIF";

            return (
              <Card key={poll.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{poll.soru}</CardTitle>
                    <Badge className={durumRenk[poll.durum]} variant="secondary">
                      {durumEtiket[poll.durum]}
                    </Badge>
                  </div>
                  <CardDescription>
                    Bitiş tarihi:{" "}
                    {new Date(poll.bitisTarihi).toLocaleDateString("tr-TR")}
                    {" · "}
                    {toplamOy} oy kullanıldı
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {secenekler.map((secenek, index) => {
                    const oyCount = poll.votes.filter(
                      (v) => v.secenek === index
                    ).length;
                    const yuzde =
                      toplamOy > 0 ? Math.round((oyCount / toplamOy) * 100) : 0;
                    const kullaniciSecimi = poll.votes.find(
                      (v) => v.userId === userId
                    );

                    return (
                      <div key={index} className="space-y-1">
                        {sonuclariGoster ? (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="flex items-center gap-2">
                                {secenek}
                                {kullaniciSecimi?.secenek === index && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                {oyCount} oy ({yuzde}%)
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                              <div
                                className="bg-primary rounded-full h-3 transition-all duration-500"
                                style={{ width: `${yuzde}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleVote(poll.id, index)}
                            disabled={votingPollId === poll.id}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            {secenek}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
