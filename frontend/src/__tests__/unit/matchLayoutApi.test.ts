import { matchLayoutApi } from '../../services/api/matchLayoutApi';
import { defaultApiClient } from '../../services/api/apiUtils';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the API Client
vi.mock('../../services/api/apiUtils', () => ({
  defaultApiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock response utils
vi.mock('../../services/api/responseUtils', () => ({
  unwrapApiResponse: (res: any) => res.data
}));

describe('matchLayoutApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMatchLayout', () => {
    it('should fetch layout from correct endpoint', async () => {
      const mockResponse = {
        data: {
          stadium: { name: 'Test Stadium' },
          stands: []
        }
      };

      (defaultApiClient.get as any).mockResolvedValue(mockResponse);

      const result = await matchLayoutApi.getMatchLayout('match-123');

      expect(defaultApiClient.get).toHaveBeenCalledWith('/matches/match-123/layout', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getZoneSeats', () => {
    it('should fetch seats for specific zone', async () => {
      const mockResponse = {
        data: [{ id: 'seat-1', status: 'AVAILABLE' }]
      };

      (defaultApiClient.get as any).mockResolvedValue(mockResponse);

      const result = await matchLayoutApi.getZoneSeats('match-123', 'zone-1');

      expect(defaultApiClient.get).toHaveBeenCalledWith('/matches/match-123/zones/zone-1/seats', { params: undefined });
      expect(result).toHaveLength(1);
    });
  });
});
