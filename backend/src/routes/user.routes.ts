import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { databaseMiddleware, DatabaseRequest } from '../middleware/database';
import { validate } from '../middleware/validate';
import * as userValidation from '../validations/user.validation';

const router = express.Router();

// Apply database middleware to all routes
router.use(databaseMiddleware);

/**
 * @route GET /api/v1/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/profile',
  authenticate,
  (req, res, next) => UserController.getProfile(req as DatabaseRequest, res, next)
);

/**
 * @route PUT /api/v1/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.put(
  '/profile',
  authenticate,
  validate(userValidation.updateProfileSchema),
  (req, res, next) => UserController.updateProfile(req as DatabaseRequest, res, next)
);

// Admin routes below
// All routes below this line require ADMIN role
router.use(authenticate, authorize(['ADMIN']));

/**
 * @route GET /api/v1/users
 * @desc Get all users (admin only)
 * @access Private (Admin)
 */
router.get(
  '/',
  validate(userValidation.getAllUsersQuerySchema),
  (req, res, next) => UserController.getAllUsers(req as DatabaseRequest, res, next)
);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user by ID (admin only)
 * @access Private (Admin)
 */
router.get(
  '/:id',
  validate(userValidation.getUserParamsSchema),
  (req, res, next) => UserController.getUserById(req as DatabaseRequest, res, next)
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update user (admin only)
 * @access Private (Admin)
 */
router.put(
  '/:id',
  validate(userValidation.updateUserSchema),
  (req, res, next) => UserController.updateUser(req as DatabaseRequest, res, next)
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Delete user (admin only)
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  validate(userValidation.getUserParamsSchema),
  (req, res, next) => UserController.deleteUser(req as DatabaseRequest, res, next)
);

export default router;
