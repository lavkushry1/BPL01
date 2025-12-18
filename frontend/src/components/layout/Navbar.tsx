import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/hooks/use-theme';
import useAuth from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Home, LogOut, Menu, Search, Settings, Ticket, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

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
    {
      name: t('navbar.ipl'),
      path: '/ipl-tickets',
      icon: <Ticket className="h-4 w-4 mr-2" />,
      highlight: true,
      badge: 'LIVE'
    },
    {
      name: t('navbar.search'),
      path: '/search',
      icon: <Search className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full border-b border-white/0",
        isScrolled || isOpen
          ? "bg-slate-950/80 backdrop-blur-md shadow-lg border-white/5"
          : "bg-transparent backdrop-blur-sm"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/20 mr-3 group-hover:bg-blue-600/30 transition-colors duration-300">
              <Ticket className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">IPL 2026</span>
              <span className="text-[10px] font-medium text-slate-400 tracking-widest uppercase">Official Tickets</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-2 rounded-full flex items-center text-sm font-medium transition-all duration-300",
                  location.pathname === link.path
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                  link.highlight && location.pathname !== link.path && "text-blue-400"
                )}
              >
                {link.icon}
                {link.name}
                {link.badge && (
                  <span className={cn(
                    "ml-2 px-1.5 py-0.5 text-[10px] rounded-full font-bold animate-pulse",
                    location.pathname === link.path ? "bg-white text-blue-600" : "bg-blue-500 text-white"
                  )}>
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Show UserMenu or login button based on auth state */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:text-white px-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt={user?.name || 'User'} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900 border-white/10 text-slate-200 backdrop-blur-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
                      <p className="text-xs leading-none text-slate-400">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {user?.role?.toLowerCase() === 'admin' && (
                    <DropdownMenuItem asChild className="focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer">
                      <Link to="/admin/dashboard" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer">
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-blue-600/20 focus:text-blue-400 cursor-pointer">
                    <Link to="/my-bookings" className="flex items-center">
                      <Ticket className="mr-2 h-4 w-4" />
                      <span>My Bookings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                    onClick={() => logout()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="hidden sm:inline-block">
                    <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5 font-medium">
                      {t('common.login')}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 rounded-full px-6">
                      Sign Up
                    </Button>
                  </Link>
                </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="md:hidden text-slate-300 hover:text-white hover:bg-white/5"
              aria-label={isOpen ? t('common.close') : t('common.menu')}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-slate-950/95 backdrop-blur-xl border-b border-white/5 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 space-y-6">
              <nav className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center py-3 px-4 rounded-xl text-lg font-medium transition-colors",
                      location.pathname === link.path
                        ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className={cn("p-2 rounded-lg mr-3 bg-white/5", location.pathname === link.path && "bg-blue-600/20 text-blue-400")}>
                      {link.icon}
                    </span>
                    {link.name}
                    {link.badge && (
                      <span className="ml-auto px-2 py-1 text-xs rounded-full bg-blue-500 text-white font-bold">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>

              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:bg-white/5 hover:text-white h-12 rounded-xl">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl font-bold custom-shadow">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
