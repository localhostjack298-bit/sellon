/**
 * Provisioning for newly-registered customers. Runs from the Better Auth `user.create.after` hook.
 *  • assigns the `customer` role
 *  • links (claims) an existing guest/walk-in CustomerProfile that has the same email, or creates one
 *  • opens a Stellar Rewards account with a welcome bonus (demo points)
 */
import { prisma } from "@/lib/prisma/client";

export const WELCOME_BONUS_POINTS = 50;

export async function provisionCustomerAccount(user: { id: string; name: string; email: string }) {
  const email = user.email.trim().toLowerCase();
  const branch = await prisma.salonBranch.findFirst({ where: { isPrimary: true }, select: { id: true } });

  await prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({ where: { key: "customer" }, select: { id: true } });
    if (role) {
      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        create: { userId: user.id, roleId: role.id },
        update: {},
      });
    }

    let profile = await tx.customerProfile.findUnique({ where: { email } });
    if (profile && !profile.userId) {
      profile = await tx.customerProfile.update({ where: { id: profile.id }, data: { userId: user.id } });
    } else if (!profile) {
      profile = await tx.customerProfile.create({
        data: { userId: user.id, fullName: user.name, email, branchId: branch?.id ?? null },
      });
    }

    const existing = await tx.loyaltyAccount.findUnique({ where: { customerId: profile.id } });
    if (!existing) {
      const account = await tx.loyaltyAccount.create({
        data: { customerId: profile.id, pointsBalance: WELCOME_BONUS_POINTS, lifetimePoints: WELCOME_BONUS_POINTS },
      });
      await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: "BONUS",
          points: WELCOME_BONUS_POINTS,
          balanceAfter: WELCOME_BONUS_POINTS,
          description: "Welcome to Stellar Rewards (demo points)",
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Welcome to Stellar",
        body: "Your account is ready. Book your first visit and start collecting Stellar Rewards demo points.",
        href: "/book",
      },
    });
  });
}
