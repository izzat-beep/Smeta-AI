import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Umumiy harajatlarni olish
router.get('/expenses', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const rows = await prisma.generalExpenses.findMany({
      where: { tenantId },
      orderBy: { id: 'asc' },
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Umumiy harajatlarni saqlash (hammasini almashtirish)
router.post('/expenses', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { rows, currency } = req.body;

    await prisma.$transaction([
      prisma.generalExpenses.deleteMany({ where: { tenantId } }),
      prisma.generalExpenses.createMany({
        data: rows.map((r: any) => ({
          tenantId,
          label: r.label,
          amount: r.amount,
          currency: currency ?? 'UZS',
        })),
      }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

export default router;