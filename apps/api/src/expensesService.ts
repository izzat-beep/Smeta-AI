// Umumiy harajatlar (generalExpenses) uchun ulashiladigan "replace-all" mantig'i.
// Ham /api/expenses, ham kalkulyatorning bitta "Saqlash" oqimi (POST /api/estimates)
// shu funksiyadan foydalanadi — mantiq bitta joyda (Vazifa 1A).
// Buyurtmadan avtomatik yozilgan qatorlar (orderId) yo'qolmasligi kafolatlanadi.
import type { Prisma } from '@prisma/client';

export interface ExpenseRowInput {
  name?: string;
  amount?: number | string;
  orderId?: string | null;
}

// projectId doirasidagi umumiy harajatlarni yangi ro'yxat bilan almashtiradi.
// tx — tranzaksiya klienti (atomiklik chaqiruvchi tomonda ta'minlanadi).
export async function replaceGeneralExpenses(
  tx: Prisma.TransactionClient,
  tenantId: string,
  projectId: string | null,
  currency: 'UZS' | 'USD',
  rows: ExpenseRowInput[],
): Promise<number> {
  // orderId'lar faqat shu tenant buyurtmalariga tegishli bo'lishi mumkin (begona ID ulanmasin).
  const sentOrderIds = [...new Set(rows.map((r) => r.orderId).filter((v): v is string => !!v))];
  const validOrderIds = new Set(
    sentOrderIds.length
      ? (
          await tx.order.findMany({
            where: { id: { in: sentOrderIds }, tenantId },
            select: { id: true },
          })
        ).map((o) => o.id)
      : [],
  );
  // Boshqa scope'da band orderId — unique to'qnashuv bermasligi uchun oddiy qator sifatida saqlanadi.
  if (sentOrderIds.length) {
    const busyElsewhere = await tx.generalExpenses.findMany({
      where: { orderId: { in: sentOrderIds }, NOT: { tenantId, projectId } },
      select: { orderId: true },
    });
    for (const row of busyElsewhere) validOrderIds.delete(row.orderId!);
  }

  const seenOrderIds = new Set<string>();
  const data = rows
    .map((r) => ({ name: (r.name ?? '').trim(), amount: Number(r.amount) || 0, orderId: r.orderId ?? null }))
    .filter((r) => r.name !== '' || r.amount > 0)
    .map((r) => {
      let orderId: string | null = null;
      if (r.orderId && validOrderIds.has(r.orderId) && !seenOrderIds.has(r.orderId)) {
        orderId = r.orderId;
        seenOrderIds.add(r.orderId);
      }
      return {
        tenantId,
        projectId,
        label: r.name,
        amount: Math.round(r.amount * 100) / 100,
        currency,
        orderId,
      };
    });

  await tx.generalExpenses.deleteMany({ where: { tenantId, projectId } });
  if (data.length) await tx.generalExpenses.createMany({ data });
  return data.length;
}
