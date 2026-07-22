import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  data: { baslik: string; mesaj: string; tip: string; link?: string }
) {
  return prisma.notification.create({
    data: { ...data, userId },
  });
}

export async function createBuildingNotification(
  buildingId: string,
  data: { baslik: string; mesaj: string; tip: string; link?: string },
  excludeUserId?: string,
  onlyRoles?: string[]
) {
  const users = await prisma.user.findMany({
    where: {
      buildingId,
      aktif: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(onlyRoles ? { rol: { in: onlyRoles as any } } : {}),
    },
    select: { id: true },
  });

  const notifications = users
    .filter((u) => u.id !== excludeUserId)
    .map((u) => ({ ...data, userId: u.id }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}
