import * as upiPaymentService from '../../../services/upiPayment.service';
import crypto from 'crypto';
import config from '../../../config';

// Mock dependencies
jest.mock('crypto');
jest.mock('../../../config', () => ({
  upiPayment: {
    merchantUpiId: 'test@upi',
    merchantName: 'Test Merchant',
    webhookSecret: 'test-webhook-secret'
  }
}));

describe('UPI Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUpiLink', () => {
    it('should generate a valid UPI payment link', () => {
      // Test data
      const amount = 10000; // 100 INR in paise
      const referenceId = 'txn_123456';
      
      // Expected UPI link components
      const expectedParams = {
        pa: 'test@upi',
        pn: 'Test Merchant',
        tr: 'txn_123456',
        am: '100.00',
        cu: 'INR',
        tn: 'Payment for Eventia tickets'
      };
      
      // Generate UPI link
      const upiLink = upiPaymentService.generateUpiLink(amount, referenceId);
      
      // Verify link format
      expect(upiLink).toMatch(/^upi:\/\/pay\?/);
      
      // Verify each parameter is included
      Object.entries(expectedParams).forEach(([key, value]) => {
        expect(upiLink).toContain(`${key}=${encodeURIComponent(value)}`);
      });
    });
    
    it('should include custom transaction note when provided', () => {
      // Test data
      const amount = 20000; // 200 INR in paise
      const referenceId = 'txn_789012';
      const options = { note: 'Custom payment note' };
      
      // Generate UPI link with custom note
      const upiLink = upiPaymentService.generateUpiLink(amount, referenceId, options);
      
      // Verify custom note is included
      expect(upiLink).toContain(`tn=${encodeURIComponent('Custom payment note')}`);
    });
  });

  describe('generateQrCodeData', () => {
    it('should return the same data as generateUpiLink', () => {
      // Test data
      const amount = 15000; // 150 INR in paise
      const referenceId = 'txn_qrcode';
      
      // Generate both outputs
      const upiLink = upiPaymentService.generateUpiLink(amount, referenceId);
      const qrCodeData = upiPaymentService.generateQrCodeData(amount, referenceId);
      
      // Verify they are the same
      expect(qrCodeData).toBe(upiLink);
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate a correct signature', () => {
      // Test data
      const payload = { transactionId: 'txn_123', status: 'success' };
      const signature = 'valid-signature';
      const payloadString = JSON.stringify(payload);
      
      // Mock crypto functions
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-signature')
      };
      (crypto.createHmac as jest.Mock).mockReturnValue(mockHmac);
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);
      
      // Call the function
      const result = upiPaymentService.validateWebhookSignature(payload, signature);
      
      // Verify the result and function calls
      expect(result).toBe(true);
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'test-webhook-secret');
      expect(mockHmac.update).toHaveBeenCalledWith(payloadString);
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
      expect(crypto.timingSafeEqual).toHaveBeenCalled();
    });
    
    it('should reject an invalid signature', () => {
      // Test data
      const payload = { transactionId: 'txn_123', status: 'success' };
      const signature = 'invalid-signature';
      
      // Mock crypto functions
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-signature')
      };
      (crypto.createHmac as jest.Mock).mockReturnValue(mockHmac);
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(false);
      
      // Call the function
      const result = upiPaymentService.validateWebhookSignature(payload, signature);
      
      // Verify the result
      expect(result).toBe(false);
    });
    
    it('should handle errors gracefully', () => {
      // Test data
      const payload = { transactionId: 'txn_123', status: 'success' };
      const signature = 'signature';
      
      // Mock crypto functions to throw an error
      (crypto.createHmac as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Call the function
      const result = upiPaymentService.validateWebhookSignature(payload, signature);
      
      // Verify the result
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
      
      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('verifyUpiPayment', () => {
    it('should verify a valid UTR number', async () => {
      // Test data - valid UTR format
      const validUtr = 'UTR123456789012';
      
      // Call the function
      const result = await upiPaymentService.verifyUpiPayment(validUtr);
      
      // Verify the result
      expect(result.verified).toBe(true);
      expect(result.payment).toEqual(expect.objectContaining({
        utrNumber: validUtr,
        status: 'verified',
        method: 'upi',
        verified: true
      }));
    });
    
    it('should reject an invalid UTR number', async () => {
      // Test data - invalid UTR format
      const invalidUtr = 'UTR-123';
      
      // Call the function
      const result = await upiPaymentService.verifyUpiPayment(invalidUtr);
      
      // Verify the result
      expect(result.verified).toBe(false);
      expect(result.payment).toBeNull();
    });
  });
});