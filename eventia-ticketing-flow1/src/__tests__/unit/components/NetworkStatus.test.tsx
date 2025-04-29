import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NetworkStatus from '../../../components/ui/NetworkStatus';
import useNetwork from '../../../hooks/useNetwork';
import { toast } from '../../../hooks/use-toast';

// Mock the useNetwork hook
vi.mock('../../../hooks/useNetwork', () => ({
  __esModule: true,
  default: vi.fn(),
}));

// Mock the toast
vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('NetworkStatus Component', () => {
  // Define different network states for testing
  const onlineState = {
    isOnline: true,
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    isConnectionFast: true,
  };
  
  const offlineState = {
    ...onlineState,
    isOnline: false,
  };
  
  const slowConnectionState = {
    ...onlineState,
    effectiveType: '2g',
    isConnectionFast: false,
  };
  
  const dataSaverState = {
    ...onlineState,
    saveData: true,
  };
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default to online state
    (useNetwork as any).mockReturnValue(onlineState);
  });
  
  it('displays online status correctly', () => {
    render(<NetworkStatus />);
    
    expect(screen.getByText('Online')).toBeInTheDocument();
    // Check for the Wifi icon by its accessible name or role
    expect(screen.getByText('4G')).toBeInTheDocument();
  });
  
  it('displays offline status correctly', () => {
    // Set mock to return offline state
    (useNetwork as any).mockReturnValue(offlineState);
    
    render(<NetworkStatus />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
  
  it('displays slow connection status correctly', () => {
    // Set mock to return slow connection state
    (useNetwork as any).mockReturnValue(slowConnectionState);
    
    render(<NetworkStatus />);
    
    expect(screen.getByText('2G (Slow)')).toBeInTheDocument();
  });
  
  it('displays data saver mode correctly', () => {
    // Set mock to return data saver state
    (useNetwork as any).mockReturnValue(dataSaverState);
    
    render(<NetworkStatus />);
    
    expect(screen.getByText('Data Saver')).toBeInTheDocument();
  });
  
  it('applies custom className', () => {
    const { container } = render(<NetworkStatus className="test-class" />);
    
    expect(container.querySelector('.test-class')).not.toBeNull();
  });
  
  it('shows toast notification when going offline', () => {
    // Render with online state
    const { rerender } = render(<NetworkStatus />);
    
    // Update to set previous online state
    vi.runAllTimers();
    
    // Update network status to offline and rerender
    (useNetwork as any).mockReturnValue(offlineState);
    rerender(<NetworkStatus />);
    
    // Check if toast was called with offline message
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "You're offline",
      variant: "destructive",
    }));
  });
  
  it('shows toast notification when coming back online', () => {
    // Start with offline state
    (useNetwork as any).mockReturnValue(offlineState);
    const { rerender } = render(<NetworkStatus />);
    
    // Update to set previous offline state
    vi.runAllTimers();
    
    // Update network status to online and rerender
    (useNetwork as any).mockReturnValue(onlineState);
    rerender(<NetworkStatus />);
    
    // Check if toast was called with online message
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "You're back online",
      variant: "default",
    }));
  });
  
  it('does not show toast when showToast is false', () => {
    // Start with online state
    (useNetwork as any).mockReturnValue(onlineState);
    const { rerender } = render(<NetworkStatus showToast={false} />);
    
    // Update to set previous online state
    vi.runAllTimers();
    
    // Change to offline and rerender
    (useNetwork as any).mockReturnValue(offlineState);
    rerender(<NetworkStatus showToast={false} />);
    
    // Toast should not be called
    expect(toast).not.toHaveBeenCalled();
  });
}); 