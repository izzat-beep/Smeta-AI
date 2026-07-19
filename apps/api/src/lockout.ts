// Account lockout (brute-force himoyasi) — sof funksiyalar.
// IP bo'yicha rate-limit (auth route'lari)ni to'ldiradi: taqsimlangan (IP
// almashtirib) sekin brute-force'ni ham to'sadi, chunki blok akkaunt bo'yicha.
//
// Dizayn: N ta ketma-ket muvaffaqiyatsiz urinishdan so'ng akkaunt LOCK_MINUTES
// davomida bloklanadi (avtomatik ochiladi). Muvaffaqiyatli login hisoblagichni
// tozalaydi. Blok holatida parol umuman tekshirilmaydi.
//
// Qoldiq risk (hujjatlashtirilgan): mavjud akkauntga qasddan muvaffaqiyatsiz
// urinishlar yuborib, uni vaqtincha bloklab qo'yish (lockout-DoS) mumkin.
// Avtomatik ochilish + yuqori chegara (10) buni yumshatadi; IP rate-limit ham
// bir vaqtda ishlaydi.

export const LOCKOUT = {
  maxFailed: Number(process.env.LOGIN_MAX_FAILED ?? 10),
  lockMinutes: Number(process.env.LOGIN_LOCK_MINUTES ?? 15),
};

export interface LockState {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

// Hozir bloklanganmi?
export function isLocked(state: LockState, now: Date = new Date()): boolean {
  return !!state.lockedUntil && state.lockedUntil.getTime() > now.getTime();
}

// Blok tugashiga qolgan soniyalar (foydalanuvchiga ko'rsatish uchun).
export function lockRemainingSeconds(state: LockState, now: Date = new Date()): number {
  if (!state.lockedUntil) return 0;
  return Math.max(0, Math.ceil((state.lockedUntil.getTime() - now.getTime()) / 1000));
}

// Muvaffaqiyatsiz urinishdan keyingi yangi holat. Chegaraga yetsa — bloklaymiz
// va hisoblagichni nolga qaytaramiz (blok tugagach yangi hisob boshlanadi).
export function nextFailedState(state: LockState, now: Date = new Date()): LockState {
  const attempts = (state.failedLoginAttempts ?? 0) + 1;
  if (attempts >= LOCKOUT.maxFailed) {
    return {
      failedLoginAttempts: 0,
      lockedUntil: new Date(now.getTime() + LOCKOUT.lockMinutes * 60 * 1000),
    };
  }
  return { failedLoginAttempts: attempts, lockedUntil: null };
}

// Muvaffaqiyatli login — hisoblagich va blokni tozalash.
export const CLEARED_STATE: LockState = { failedLoginAttempts: 0, lockedUntil: null };

// Muvaffaqiyatli loginda DB yozuvini kamaytirish: allaqachon toza bo'lsa
// update qilmaymiz.
export function needsClear(state: LockState): boolean {
  return (state.failedLoginAttempts ?? 0) > 0 || state.lockedUntil !== null;
}
