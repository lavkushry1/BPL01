import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Trash2, ArrowLeft, ChevronRight, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/hooks/useCart';
import { Input } from '@/components/ui/input';

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    totalItems,
    totalAmount
  } = useCart();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout",
        variant: "destructive"
      });
      return;
    }

    // Store cart data in sessionStorage for checkout
    sessionStorage.setItem('bookingData', JSON.stringify({
      eventId: cartItems[0].eventId,
      eventTitle: cartItems[0].eventTitle,
      eventDate: cartItems[0].eventDate,
      eventTime: cartItems[0].eventTime,
      venue: "Event Venue", // This should ideally come from the event data
      tickets: cartItems[0].tickets.map(ticket => ({
        category: ticket.name,
        quantity: ticket.quantity,
        price: ticket.price,
        subtotal: ticket.price * ticket.quantity
      })),
      totalAmount: totalAmount
    }));

    navigate('/checkout');
  };

  // Handle ticket quantity update
  const handleUpdateQuantity = (eventId: string, ticketId: string, quantity: number) => {
    updateQuantity(eventId, ticketId, quantity);
  };

  // Handle remove from cart
  const handleRemoveFromCart = (eventId: string) => {
    removeFromCart(eventId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/events" className="flex items-center text-gray-500 hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.backToEvents', 'Back to Events')}
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8 flex items-center">
          <ShoppingCart className="mr-3 h-7 w-7" />
          {t('cart.yourCart', 'Your Cart')}
          {totalItems > 0 && (
            <span className="ml-3 text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
              {totalItems} {totalItems === 1 ? t('common.item', 'item') : t('common.items', 'items')}
            </span>
          )}
        </h1>
        
        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <Card key={item.eventId} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {item.eventImage && (
                      <div className="w-full md:w-1/3 bg-gray-100">
                        <img 
                          src={item.eventImage} 
                          alt={item.eventTitle} 
                          className="w-full h-full object-cover"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 p-6">
                      <h2 className="text-xl font-bold mb-2">{item.eventTitle}</h2>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 opacity-70" />
                          <span>{item.eventDate}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 opacity-70" />
                          <span>{item.eventTime}</span>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <h3 className="font-medium mb-3">{t('cart.tickets', 'Tickets')}</h3>
                      
                      <div className="space-y-3">
                        {item.tickets.map((ticket) => (
                          <div key={ticket.id} className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{ticket.name}</div>
                              <div className="text-sm text-gray-600">
                                {formatCurrency(ticket.price)} x {ticket.quantity}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => handleUpdateQuantity(
                                    item.eventId, 
                                    ticket.id, 
                                    Math.max(0, ticket.quantity - 1)
                                  )}
                                >
                                  -
                                </Button>
                                
                                <span className="w-8 text-center">
                                  {ticket.quantity}
                                </span>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => handleUpdateQuantity(
                                    item.eventId, 
                                    ticket.id, 
                                    ticket.quantity + 1
                                  )}
                                >
                                  +
                                </Button>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleUpdateQuantity(item.eventId, ticket.id, 0)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{t('cart.subtotal', 'Subtotal')}</div>
                        <div className="font-bold">{formatCurrency(item.totalAmount)}</div>
                      </div>
                      
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveFromCart(item.eventId)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('cart.removeItem', 'Remove')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>{t('cart.orderSummary', 'Order Summary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>{t('cart.subtotal', 'Subtotal')}</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('cart.fees', 'Service Fee')}</span>
                    <span>₹99</span>
                  </div>
                  
                  <div className="pt-4">
                    <label htmlFor="promo" className="block text-sm font-medium mb-2">
                      {t('cart.promoCode', 'Promo Code')}
                    </label>
                    <div className="flex space-x-2">
                      <Input 
                        id="promo" 
                        type="text" 
                        placeholder={t('cart.enterPromoCode', 'Enter code')}
                        className="flex-1"
                      />
                      <Button variant="outline">
                        {t('cart.apply', 'Apply')}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('cart.total', 'Total')}</span>
                    <span>{formatCurrency(totalAmount + 99)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleProceedToCheckout}
                  >
                    {t('cart.checkout', 'Proceed to Checkout')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="bg-gray-100 inline-flex items-center justify-center rounded-full p-6 mb-6">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {t('cart.emptyCart', 'Your cart is empty')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('cart.emptyCartMessage', 'Looks like you haven\'t added any events to your cart yet.')}
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/events')}
            >
              {t('cart.browseEvents', 'Browse Events')}
            </Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Cart; 