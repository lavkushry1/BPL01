import { faker } from '@faker-js/faker';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Factory for generating test user data
 */
export class UserFactory {
  /**
   * Create a basic user with required fields
   */
  static createBasic(overrides: Record<string, any> = {}) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      id: faker.string.uuid(),
      email: faker.internet.email({ firstName, lastName }),
      name: `${firstName} ${lastName}`,
      password: faker.internet.password(),
      role: UserRole.USER,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      isDeleted: false,
      ...overrides
    };
  }

  /**
   * Create a user with hashed password (for database insertion)
   */
  static async createWithHashedPassword(overrides: Record<string, any> = {}) {
    const user = this.createBasic(overrides);
    const password = user.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return {
      ...user,
      password: hashedPassword,
      rawPassword: password // Store original password for test use
    };
  }

  /**
   * Create a user with admin role
   */
  static createAdmin(overrides: Record<string, any> = {}) {
    return this.createBasic({
      role: UserRole.ADMIN,
      ...overrides
    });
  }

  /**
   * Create a user with organizer role
   */
  static createOrganizer(overrides: Record<string, any> = {}) {
    return this.createBasic({
      role: UserRole.ORGANIZER,
      ...overrides
    });
  }

  /**
   * Create a user with profile details
   */
  static createWithProfile(overrides: Record<string, any> = {}) {
    return this.createBasic({
      profile: {
        id: faker.string.uuid(),
        userId: overrides.id || faker.string.uuid(),
        bio: faker.person.bio(),
        phoneNumber: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        postalCode: faker.location.zipCode(),
        avatarUrl: faker.image.avatar(),
        socialLinks: {
          twitter: `https://twitter.com/${faker.internet.username()}`,
          facebook: `https://facebook.com/${faker.internet.username()}`,
          instagram: `https://instagram.com/${faker.internet.username()}`,
          linkedin: `https://linkedin.com/in/${faker.internet.username()}`
        },
        preferences: {
          emailNotifications: faker.datatype.boolean(),
          smsNotifications: faker.datatype.boolean(),
          marketingCommunications: faker.datatype.boolean()
        }
      },
      ...overrides
    });
  }

  /**
   * Create an array of users
   */
  static createMany(count = 5, factory = this.createBasic, overrides: Record<string, any> = {}) {
    return Array.from({ length: count }, () =>
      factory({
        id: faker.string.uuid(),
        ...overrides
      })
    );
  }
}
