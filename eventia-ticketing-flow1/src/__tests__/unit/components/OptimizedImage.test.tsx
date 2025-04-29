import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OptimizedImage from '../../../components/ui/OptimizedImage';
import { act } from 'react-dom/test-utils';

// Mock the network utility functions
vi.mock('../../../utils/network', () => ({
  getLoadingStrategy: vi.fn(() => 'lazy'),
  getImageQuality: vi.fn(() => 80),
}));

// Mock the useNetwork hook
vi.mock('../../../hooks/useNetwork', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    isConnectionFast: true,
    effectiveType: '4g',
    downlink: 10,
    saveData: false,
    isOnline: true,
  })),
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  
  observe(target: Element): void {
    // Immediate simulate an intersection
    this.callback([{
      isIntersecting: true,
      target,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRatio: 1,
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now(),
    } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  
  unobserve(): void {
    // Do nothing
  }
  
  disconnect(): void {
    // Do nothing
  }
}

describe('OptimizedImage Component', () => {
  beforeEach(() => {
    // Setup mock IntersectionObserver
    global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });
  
  it('renders with the correct alt text', () => {
    render(
      <OptimizedImage
        src="/images/test.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );
    
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });
  
  it('includes picture element with source elements for AVIF and WebP', () => {
    const { container } = render(
      <OptimizedImage
        src="/images/test.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );
    
    const picture = container.querySelector('picture');
    expect(picture).not.toBeNull();
    
    const sources = container.querySelectorAll('source');
    expect(sources.length).toBeGreaterThanOrEqual(2);
    
    // Check for AVIF source
    const avifSource = Array.from(sources).find(
      source => source.type === 'image/avif'
    );
    expect(avifSource).not.toBeNull();
    
    // Check for WebP source
    const webpSource = Array.from(sources).find(
      source => source.type === 'image/webp'
    );
    expect(webpSource).not.toBeNull();
  });
  
  it('applies width and height attributes correctly', () => {
    const { container } = render(
      <OptimizedImage
        src="/images/test.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );
    
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('width')).toBe('300');
    expect(img?.getAttribute('height')).toBe('200');
  });
  
  it('applies lazy loading by default when network strategy suggests it', () => {
    const { container } = render(
      <OptimizedImage
        src="/images/test.jpg"
        alt="Test image"
      />
    );
    
    const img = container.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('lazy');
  });
  
  it('handles blur placeholder correctly', async () => {
    const { container } = render(
      <OptimizedImage
        src="/images/test.jpg"
        alt="Test image"
        blurPlaceholder="data:image/jpeg;base64,someBase64Data"
      />
    );
    
    // Check if blur placeholder div exists
    const blurDiv = container.querySelector('div[style*="blur"]');
    expect(blurDiv).not.toBeNull();
    
    // Simulate image load
    const img = container.querySelector('img');
    await act(async () => {
      img?.dispatchEvent(new Event('load'));
    });
    
    // Check if the blur placeholder is removed or hidden
    const imgComputed = window.getComputedStyle(img as Element);
    expect(imgComputed.opacity).not.toBe('0');
  });
  
  it('applies correct sizes attribute', () => {
    const { container } = render(
      <OptimizedImage
        src="/images/test.jpg"
        alt="Test image"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    );
    
    const sources = container.querySelectorAll('source');
    Array.from(sources).forEach(source => {
      expect(source.getAttribute('sizes')).toBe('(max-width: 768px) 100vw, 50vw');
    });
  });
  
  it('forces eager loading when lazy is set to false', () => {
    const { container } = render(
      <OptimizedImage
        src="/images/test.jpg"
        alt="Test image"
        lazy={false}
      />
    );
    
    const img = container.querySelector('img');
    expect(img?.getAttribute('loading')).toBe('eager');
  });
}); 