import { BookingPaymentRepository } from '../../../../repositories/paymentRepository';
import prisma from '../../../../db/prisma';
import { ApiError } from '../../../../utils/apiError';

// Mock Prisma
jest.mock('../../../../db/prisma', () => ({
  bookingPayment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
}));

describe('BookingPaymentRepository', () => {
  let paymentRepository: BookingPaymentRepository;

  beforeEach(() => {
    paymentRepository = new BookingPaymentRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return payment when found', async () => {
      const mockPayment = { id: 'payment-123', amount: 100, status: 'pending' };
      (prisma.bookingPayment.findUnique as jest.Mock).mockResolvedValue(mockPayment);

      const result = await paymentRepository.findById('payment-123');
      expect(result).toEqual(mockPayment);
      expect(prisma.bookingPayment.findUnique).toHaveBeenCalledWith({ where: { id: 'payment-123' } });
    });

    it('should throw ApiError on db error', async () => {
      (prisma.bookingPayment.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));
      await expect(paymentRepository.findById('payment-123')).rejects.toThrow(ApiError);
    });
  });

  describe('create', () => {
    it('should create payment', async () => {
      const mockData = { amount: 100, status: 'pending', bookingId: 'booking-123' };
      const mockCreated = { id: 'payment-123', ...mockData };
      (prisma.bookingPayment.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await paymentRepository.create(mockData);
      expect(result).toEqual(mockCreated);
      expect(prisma.bookingPayment.create).toHaveBeenCalledWith({ data: mockData });
    });
  });

    describe('verifyPayment', () => {
    it('should verify payment', async () => {
      const mockVerified = { id: 'payment-123', status: 'verified', verifiedBy: 'admin-1' };
      (prisma.bookingPayment.update as jest.Mock).mockResolvedValue(mockVerified);

      const result = await paymentRepository.verifyPayment('payment-123', 'admin-1');
      expect(result).toEqual(mockVerified);
      expect(prisma.bookingPayment.update).toHaveBeenCalledWith(expect.objectContaining({
          where: { id: 'payment-123' },
          data: expect.objectContaining({ status: 'verified', verifiedBy: 'admin-1' })
      }));
    });
  });
});
