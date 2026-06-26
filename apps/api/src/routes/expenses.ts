import { Router } from 'express';
import { prisma } from '../prisma';
 
const router = Router();
 
// Umumiy harajatlarni olish
router.get('/expenses', async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan' });
    }
 
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
    if (!tenantId) {
      return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan' });
    }
 
    const { rows, currency } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: 'rows massiv bo\'lishi kerak' });
    }
 
    // Bo'sh nomli/summasiz qatorlarni o'tkazib yuboramiz, summani raqamga aylantiramiz
    const data = rows
      .filter((r: any) => r && r.name && r.amount !== '' && r.amount !== undefined)
      .map((r: any) => ({
        tenantId,
        label: r.name,
        amount: Number(r.amount) || 0,
        currency: currency ?? 'UZS',
      }));
 
    await prisma.$transaction([
      prisma.generalExpenses.deleteMany({ where: { tenantId } }),
      ...(data.length ? [prisma.generalExpenses.createMany({ data })] : []),
    ]);
 
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});
 
export default router;