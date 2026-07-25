import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const personel = await prisma.personel.findUnique({ where: { id } });

  if (!personel) {
    return NextResponse.json({ error: "Personel bulunamadi" }, { status: 404 });
  }

  if (personel.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const maaslar = await prisma.personelMaas.findMany({
    where: { personelId: id },
    orderBy: [{ yil: "desc" }, { ay: "desc" }],
  });

  return NextResponse.json(maaslar);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { ay, yil, brutMaas, netMaas, sgkPrim, vergi, not: notText } = body;

  if (!ay || !yil || !brutMaas || !netMaas) {
    return NextResponse.json({ error: "Ay, yil, brut maas ve net maas zorunludur" }, { status: 400 });
  }

  const personel = await prisma.personel.findUnique({ where: { id } });

  if (!personel) {
    return NextResponse.json({ error: "Personel bulunamadi" }, { status: 404 });
  }

  if (personel.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const maas = await prisma.personelMaas.create({
    data: {
      personelId: id,
      ay: Number(ay),
      yil: Number(yil),
      brutMaas: parseFloat(brutMaas),
      netMaas: parseFloat(netMaas),
      sgkPrim: sgkPrim ? parseFloat(sgkPrim) : null,
      vergi: vergi ? parseFloat(vergi) : null,
      not: notText || null,
      buildingId: session.user.buildingId!,
    },
  });

  return NextResponse.json(maas, { status: 201 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (session.user.rol !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { maasId } = body;

  if (!maasId) {
    return NextResponse.json({ error: "Maas ID zorunludur" }, { status: 400 });
  }

  const maas = await prisma.personelMaas.findUnique({ where: { id: maasId } });

  if (!maas) {
    return NextResponse.json({ error: "Maas kaydi bulunamadi" }, { status: 404 });
  }

  if (maas.personelId !== id) {
    return NextResponse.json({ error: "Maas kaydi bu personele ait degil" }, { status: 400 });
  }

  if (maas.buildingId !== session.user.buildingId) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const updated = await prisma.personelMaas.update({
    where: { id: maasId },
    data: {
      odendi: true,
      odenmeTarihi: new Date(),
      odendiIsaretleyen: session.user.id,
    },
  });

  return NextResponse.json(updated);
}
