import { UserRepository } from '../../../../repositories/userRepository';
import { UserFactory } from '../../../factories/user.factory';
import db from '../../../../db';

// Mock the database client
jest.mock('../../../../db');

describe('UserRepository', () => {
  let userRepository: UserRepository;
  
  beforeEach(() => {
    userRepository = new UserRepository();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      // Arrange
      const mockUser = UserFactory.createBasic();
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      const result = await userRepository.findByEmail(mockUser.email);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found by email', async () => {
      // Arrange
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      });

      // Act
      const result = await userRepository.findByEmail('non-existent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found by ID', async () => {
      // Arrange
      const mockUser = UserFactory.createBasic();
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      const result = await userRepository.findById(mockUser.id);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found by ID', async () => {
      // Arrange
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      });

      // Act
      const result = await userRepository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'USER'
      };
      
      const mockCreatedUser = { ...userData, id: 1, created_at: new Date(), updated_at: new Date() };
      (db as any).mockResolvedValue({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockCreatedUser])
      });

      // Act
      const result = await userRepository.create(userData as any);

      // Assert
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      // Arrange
      const userId = 1;
      const updateData = { name: 'Updated Name' };
      const mockUpdatedUser = { id: userId, email: 'test@example.com', name: 'Updated Name', role: 'USER', created_at: new Date(), updated_at: new Date() };
      
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUpdatedUser])
      });

      // Act
      const result = await userRepository.update(userId, updateData);

      // Assert
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw an error when user is not found for update', async () => {
      // Arrange
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([])
      });

      // Act & Assert
      await expect(userRepository.update(999, { name: 'Updated Name' }))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete a user and return true', async () => {
      // Arrange
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue(1)
      });

      // Act
      const result = await userRepository.delete(1);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user is not found for deletion', async () => {
      // Arrange
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue(0)
      });

      // Act
      const result = await userRepository.delete(999);

      // Assert
      expect(result).toBe(false);
    });
  });
});