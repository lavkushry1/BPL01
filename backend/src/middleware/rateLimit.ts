import { NextFunction, Request, Response } from 'express';

// Dummy limiter middleware that allows all requests
const dummyLimiter = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const standardLimiter = dummyLimiter;
export const apiKeyLimiter = dummyLimiter;
export const strictLimiter = dummyLimiter;
export const loginLimiter = dummyLimiter;
export const authLimiter = dummyLimiter;

export default {
  standardLimiter,
  apiKeyLimiter,
  strictLimiter,
  loginLimiter,
  authLimiter
};
