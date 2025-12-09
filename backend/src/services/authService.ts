import bcrypt from 'bcryptjs';
import { User, UserRepository } from '../repositories/userRepository';
import { ApiError } from '../utils/apiError';
import { generateToken } from '../utils/jwt';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Login a user
   * @param credentials User login credentials
   * @returns User data and JWT token
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as Omit<User, 'password'>,
      token
    };
  }

  /**
   * Register a new user
   * @param data User registration data
   * @returns User data and JWT token
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, name } = data;

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: data.role || 'user'
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as Omit<User, 'password'>,
      token
    };
  }

  /**
   * Verify a user's token and return user data
   * @param userId User ID to verify
   * @returns User data without password
   */
  async getProfile(userId: string | number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Return user data without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }
}
