/**
 * Public Routes
 * 
 * These routes are accessible without authentication.
 * They are mounted before the auth middleware is applied.
 * 
 * @deprecated - Use the new structure in /routes/v1/public/index.ts
 */

import { Router } from 'express';
import publicRoutes from './public';

// This file now serves as a redirect to the new structure
export default publicRoutes; 