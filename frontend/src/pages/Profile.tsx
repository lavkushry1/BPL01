import React from 'react';
import ProfileForm from '@/components/auth/ProfileForm';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

const ProfilePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Update document title
  React.useEffect(() => {
    document.title = "My Profile | Eventia";
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-8 dark:text-white">My Account</h1>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <ProfileForm />
            </TabsContent>
            
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>View all your past and upcoming event bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">You haven't made any bookings yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account password and security options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border p-4 rounded-md">
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Change your password to keep your account secure
                      </p>
                      <button className="text-primary hover:underline text-sm font-medium">
                        Change Password
                      </button>
                    </div>
                    
                    <div className="border p-4 rounded-md">
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <button className="text-primary hover:underline text-sm font-medium">
                        Enable 2FA
                      </button>
                    </div>
                    
                    <div className="border p-4 rounded-md">
                      <h3 className="font-medium">Account Activity</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Monitor your account login activity
                      </p>
                      <button className="text-primary hover:underline text-sm font-medium">
                        View Activity Log
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage; 