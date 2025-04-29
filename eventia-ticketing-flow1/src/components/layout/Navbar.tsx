
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { Ticket, Calendar, Home, User, Moon, Sun, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Detect scroll position for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Main navigation links
  const navLinks = [
    { name: t('navbar.home'), path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
    { name: t('navbar.events'), path: '/events', icon: <Calendar className="h-4 w-4 mr-2" /> },
    { name: t('navbar.ipl'), path: '/ipl-tickets', icon: <Ticket className="h-4 w-4 mr-2" /> },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full",
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm border-b" : "bg-background/80 backdrop-blur-sm"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="ml-2 text-xl font-bold text-primary hidden sm:inline-block">{t('app.name')}</span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-foreground/80 hover:text-primary transition-colors px-3 py-2 rounded-md flex items-center",
                  location.pathname === link.path && "text-primary font-medium"
                )}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-foreground/80"
              aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Link to="/admin-login" className="hidden md:block">
              <Button variant="outline" size="sm" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {t('navbar.admin')}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="md:hidden text-foreground/80"
              aria-label={isOpen ? t('common.close') : t('common.menu')}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background border-t overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "flex items-center py-3 px-4 rounded-md text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors",
                      location.pathname === link.path && "bg-accent/50 text-primary font-medium"
                    )}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
                <Link to="/admin-login" className="mt-2">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    {t('navbar.admin')}
                  </Button>
                </Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
