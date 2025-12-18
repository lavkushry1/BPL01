import React from 'react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  LogOut, 
  Settings, 
  Ticket, 
  CreditCard,
  ChevronDown
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const UserMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive"
      });
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const isAdmin = user.role?.toLowerCase() === 'admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-sm leading-none">
            <span className="font-medium">{user.name || 'User'}</span>
            <span className="text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'User'}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin/dashboard" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/my-bookings" className="cursor-pointer">
            <Ticket className="mr-2 h-4 w-4" />
            <span>My Bookings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/payment-methods" className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Payment Methods</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu; 
