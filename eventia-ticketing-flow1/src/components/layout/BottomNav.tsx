
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Home, Ticket, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

type NavItem = {
  icon: React.ReactNode;
  label: string;
  path: string;
};

const BottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: t('navbar.home'),
      path: '/'
    },
    {
      icon: <Ticket className="h-5 w-5" />,
      label: t('navbar.tickets'),
      path: '/events'
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: t('navbar.support'),
      path: '/support'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-3 px-2 text-xs font-medium",
                isActive ? "text-primary" : "text-foreground/60"
              )}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-2 left-0 right-0 mx-auto h-1 w-5 bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
