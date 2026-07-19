// Bootstrap super admin paroli siyosati (production fail-fast uchun).
// Repoda ochiq yozilgan namuna/dev parollar productionda ishlatilsa —
// server bootstrap bosqichida ishga tushmaydi.
const KNOWN_DEFAULTS = [
  'admin1234',
  'smeta@admin2026',
  'demo1234',
  'admin',
  'password',
  'parol123',
  'changeme',
];

const MIN_LENGTH = 10;

// Muammolar ro'yxatini qaytaradi; bo'sh ro'yxat = parol yaroqli.
export function adminPasswordProblems(password: string | null | undefined): string[] {
  if (!password) return ["ADMIN_PASSWORD o'rnatilmagan (.env yoki muhit o'zgaruvchisi)"];
  const problems: string[] = [];
  if (KNOWN_DEFAULTS.includes(password.toLowerCase())) {
    problems.push('ADMIN_PASSWORD repodagi namuna/dev parollardan biri — kuchli parolga almashtiring');
  }
  if (password.length < MIN_LENGTH) {
    problems.push(`ADMIN_PASSWORD kamida ${MIN_LENGTH} belgi bo'lishi kerak`);
  }
  return problems;
}
