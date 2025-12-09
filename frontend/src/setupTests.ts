import '@testing-library/jest-dom';
import { setupApiMocks } from './__tests__/mocks/api';

// Setup API mocking for all tests
setupApiMocks();

// This extends Vitest's expect with Jest DOM matchers 