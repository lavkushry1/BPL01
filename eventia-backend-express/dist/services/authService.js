"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const apiError_1 = require("../utils/apiError");
const jwt_1 = require("../utils/jwt");
class AuthService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    /**
     * Login a user
     * @param credentials User login credentials
     * @returns User data and JWT token
     */
    async login(credentials) {
        const { email, password } = credentials;
        // Find user by email
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new apiError_1.ApiError(401, 'Invalid email or password');
        }
        // Verify password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new apiError_1.ApiError(401, 'Invalid email or password');
        }
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role
        });
        // Return user data (without password) and token
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token
        };
    }
    /**
     * Register a new user
     * @param data User registration data
     * @returns User data and JWT token
     */
    async register(data) {
        const { email, password, name } = data;
        // Check if email already exists
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new apiError_1.ApiError(409, 'Email already in use');
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create user
        const user = await this.userRepository.create({
            email,
            password: hashedPassword,
            name,
            role: data.role || 'user'
        });
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role
        });
        // Return user data (without password) and token
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token
        };
    }
    /**
     * Verify a user's token and return user data
     * @param userId User ID to verify
     * @returns User data without password
     */
    async getProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new apiError_1.ApiError(404, 'User not found');
        }
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map