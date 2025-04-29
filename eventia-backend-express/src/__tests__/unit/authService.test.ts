import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { AuthService } from '../../services/authService';
import { UserRepository } from '../../repositories/userRepository';
import { ApiError } from '../../utils/apiError';

// Mock dependencies
jest.mock('../../repositories/userRepository');
jest.mock('../../utils/jwt');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup mocks
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    authService = new AuthService(mockUserRepository);
  });
  
  describe('login', () => {
    test('should throw ApiError when user is not found', async () => {
      // Setup
      const credentials = { email: 'test@example.com', password: 'password123' };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(ApiError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
    });
    
    test('should return user and token when login is successful', async () => {
      // Setup
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockUser = { 
        id: 1, 
        email: 'test@example.com',
        password: '$2b$10$validHashedPassword',
        role: 'user'
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      // Mock bcrypt compare to return true
      jest.spyOn(require('bcrypt'), 'compare').mockImplementation(() => Promise.resolve(true));
      
      // Mock JWT generation
      jest.spyOn(require('../../utils/jwt'), 'generateToken').mockReturnValue('valid.jwt.token');
      
      // Act
      const result = await authService.login(credentials);
      
      // Assert
      expect(result).toEqual({
        user: expect.objectContaining({ id: mockUser.id, email: mockUser.email }),
        token: 'valid.jwt.token'
      });
    });
  });
}); 