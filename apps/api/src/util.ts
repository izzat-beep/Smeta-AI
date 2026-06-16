import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Async route handlerlarni o'rab, xatolarni next()'ga uzatadi
export const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
