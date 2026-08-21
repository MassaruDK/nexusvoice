import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('[SERVER_ERROR]', err.message);
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.'
  });
}
