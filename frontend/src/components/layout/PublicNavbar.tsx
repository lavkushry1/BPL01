import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, Home, Shield, Ticket } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const PublicNavbar = () => {
  const location = useLocation();

  // Main navigation links
  const navLinks = [
    { name: 'Home', path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
    { name: 'Events', path: '/events', icon: <Calendar className="h-4 w-4 mr-2" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">IPL 2026</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === link.path ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side - Admin button */}
          <div className="flex items-center gap-2">
            <Link to="/admin">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin Portal</span>
                <span className="sm:hidden">Admin</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
