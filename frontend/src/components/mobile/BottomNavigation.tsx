import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Ticket, User, CalendarDays } from 'lucide-react';
import useHapticFeedback from '../../hooks/useHapticFeedback';

interface NavigationItem {
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
  path: string;
}

/**
 * Bottom navigation component for mobile devices
 * Includes haptic feedback and active state indicators
 */
const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { triggerHaptic } = useHapticFeedback();
  
  // Define navigation items with their icons, labels and paths
  const navigationItems: NavigationItem[] = [
    {
      icon: <Home className="h-6 w-6" />,
      activeIcon: <Home className="h-6 w-6 fill-current" />,
      label: 'Home',
      path: '/',
    },
    {
      icon: <Search className="h-6 w-6" />,
      activeIcon: <Search className="h-6 w-6 fill-current" />,
      label: 'Explore',
      path: '/events',
    },
    {
      icon: <CalendarDays className="h-6 w-6" />,
      activeIcon: <CalendarDays className="h-6 w-6 fill-current" />,
      label: 'Events',
      path: '/calendar',
    },
    {
      icon: <Ticket className="h-6 w-6" />,
      activeIcon: <Ticket className="h-6 w-6 fill-current" />,
      label: 'Tickets',
      path: '/tickets',
    },
    {
      icon: <User className="h-6 w-6" />,
      activeIcon: <User className="h-6 w-6 fill-current" />,
      label: 'Profile',
      path: '/profile',
    },
  ];
  
  // Check if a path is currently active
  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <ul className="flex justify-around items-center h-16">
        {navigationItems.map((item, index) => (
          <li key={index} className="w-full">
            <Link 
              to={item.path}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                isActive(item.path) 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => triggerHaptic('medium')}
            >
              <div className="relative">
                {isActive(item.path) ? item.activeIcon : item.icon}
                {isActive(item.path) && (
                  <span className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-primary rounded-full transform -translate-x-1/2"></span>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      
      {/* Add safe area inset padding for newer iOS devices */}
      <div className="h-safe-inset-bottom bg-background"></div>
    </nav>
  );
};

export default BottomNavigation; 