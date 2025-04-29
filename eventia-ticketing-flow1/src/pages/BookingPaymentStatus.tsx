import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaymentStatusPage } from '@/components/payment/PaymentStatusPage';
import { apiClient } from '@/services/api/client';

export const BookingPaymentStatusPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookingDetails() {
      if (!bookingId) {
        setError('Booking ID not provided');
        setLoading(false);
        return;
      }
      
      try {
        const response = await apiClient.get(`/bookings/${bookingId}`);
        setBookingDetails(response.data);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBookingDetails();
  }, [bookingId]);

  const handlePaymentComplete = async (status: string) => {
    // You could show a success message, or get updated booking details
    if (status === 'COMPLETED' || status === 'VERIFIED') {
      try {
        const response = await apiClient.get(`/bookings/${bookingId}/ticket`);
        
        // Store ticket info if needed
        localStorage.setItem(`ticket_${bookingId}`, JSON.stringify(response.data));
        
        // Wait a moment before redirecting to let user see success message
        setTimeout(() => {
          navigate(`/bookings/${bookingId}/ticket`);
        }, 2000);
      } catch (err) {
        console.error('Error fetching ticket:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !bookingId) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="mt-4">{error || 'Missing booking ID'}</p>
        <button 
          onClick={() => navigate('/bookings')}
          className="mt-6 px-4 py-2 bg-primary text-white rounded-md"
        >
          Go to My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Payment Status</h1>
        {bookingDetails && (
          <p className="text-gray-600">
            Booking #{bookingId.substring(0, 8)} • {bookingDetails.event?.name}
          </p>
        )}
      </div>
      
      <PaymentStatusPage 
        bookingId={bookingId} 
        onComplete={handlePaymentComplete}
        returnUrl="/bookings"
      />
    </div>
  );
};

export default BookingPaymentStatusPage; 