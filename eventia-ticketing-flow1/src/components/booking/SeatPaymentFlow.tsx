import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import QRCodeGenerator from '@/components/payment/QRCodeGenerator';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle,
    Clock,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import * as paymentApi from '@/services/api/paymentApi';
import { io, Socket } from 'socket.io-client';
import config from '@/config/appConfig';

interface SeatPaymentFlowProps {
    eventId: string;
    selectedSeats: string[];
    onPaymentComplete: (bookingId: string) => void;
    onPaymentFailure: (error: any) => void;
}

const SeatPaymentFlow: React.FC<SeatPaymentFlowProps> = ({
    eventId,
    selectedSeats,
    onPaymentComplete,
    onPaymentFailure
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [paymentIntent, setPaymentIntent] = useState<any>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [upiUrl, setUpiUrl] = useState<string>('');
    const [status, setStatus] = useState<string>('INITIATING');
    const [error, setError] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isPollActive, setIsPollActive] = useState<boolean>(false);

    // Initialize payment flow
    useEffect(() => {
        const initiatePayment = async () => {
            try {
                setIsLoading(true);
                setError(null);

                if (!user) {
                    throw new Error('User not authenticated');
                }

                // Call API to initiate payment and lock seats
                const response = await paymentApi.initiatePayment({
                    eventId,
                    seatIds: selectedSeats,
                    userId: user.id
                });

                if (response.data && response.data.data) {
                    const data = response.data.data;
                    setPaymentIntent(data.paymentIntent);
                    setQrCodeUrl(data.qrCodeDataUrl);
                    setUpiUrl(data.upiUrl);
                    setStatus('PENDING');

                    // Calculate expiry time
                    const expiresAt = new Date(data.expiresAt).getTime();
                    const currentTime = new Date().getTime();
                    const remainingSeconds = Math.max(0, Math.floor((expiresAt - currentTime) / 1000));
                    setTimeRemaining(remainingSeconds);

                    // Start checking payment status
                    setIsPollActive(true);
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error: any) {
                console.error('Error initiating payment:', error);
                setError(error.response?.data?.message || 'Failed to initiate payment');
                setStatus('ERROR');
                onPaymentFailure(error);
            } finally {
                setIsLoading(false);
            }
        };

        initiatePayment();

        // Connect to socket
        const socketInstance = io(config.apiBaseUrl, {
            withCredentials: true,
            transports: ['websocket']
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setIsPollActive(false);
        };
    }, [eventId, selectedSeats, user, onPaymentFailure]);

    // Handle socket connections and events
    useEffect(() => {
        if (!socket || !paymentIntent) return;

        // Subscribe to event updates
        socket.emit('subscribe-to-event', eventId);

        // Subscribe to individual seat updates
        selectedSeats.forEach(seatId => {
            socket.emit('subscribe-to-seat', seatId);
        });

        // Listen for seat status changes
        socket.on('seat-status-change', (data) => {
            if (selectedSeats.includes(data.seatId)) {
                console.log(`Seat ${data.seatId} status changed to ${data.status}`);
            }
        });

        // Listen for payment status changes
        socket.on('payment-status-update', (data) => {
            console.log('Payment status update:', data);

            if (data.bookingId === paymentIntent.id) {
                updatePaymentStatus(data.status);
            }
        });

        return () => {
            socket.off('seat-status-change');
            socket.off('payment-status-update');
        };
    }, [socket, paymentIntent, eventId, selectedSeats]);

    // Poll for payment status
    useEffect(() => {
        if (!isPollActive || !paymentIntent || status !== 'PENDING') return;

        const intervalId = setInterval(async () => {
            try {
                const response = await paymentApi.getPaymentStatus(paymentIntent.id);

                if (response.data && response.data.data) {
                    const paymentStatus = response.data.data.status;
                    updatePaymentStatus(paymentStatus);

                    if (paymentStatus !== 'PENDING') {
                        setIsPollActive(false);
                    }
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(intervalId);
    }, [isPollActive, paymentIntent, status]);

    // Countdown timer
    useEffect(() => {
        if (status !== 'PENDING' || timeRemaining <= 0) return;

        const timerId = setInterval(() => {
            setTimeRemaining(prevTime => {
                const newTime = prevTime - 1;

                if (newTime <= 0) {
                    // Time expired
                    setStatus('EXPIRED');
                    setIsPollActive(false);
                    onPaymentFailure(new Error('Payment time expired'));
                    clearInterval(timerId);
                }

                return newTime;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [status, timeRemaining, onPaymentFailure]);

    const updatePaymentStatus = (newStatus: string) => {
        setStatus(newStatus);

        if (newStatus === 'SUCCESS') {
            toast({
                title: 'Payment Successful',
                description: 'Your seats have been booked successfully.',
                variant: 'success'
            });

            // Call the success callback with booking ID
            onPaymentComplete(paymentIntent.id);
        } else if (newStatus === 'FAILED') {
            toast({
                title: 'Payment Failed',
                description: 'Your payment could not be processed.',
                variant: 'destructive'
            });

            setError('Payment failed. Please try again.');
            onPaymentFailure(new Error('Payment failed'));
        } else if (newStatus === 'EXPIRED') {
            toast({
                title: 'Payment Expired',
                description: 'The payment time has expired.',
                variant: 'destructive'
            });

            setError('Payment time expired. Please try again.');
            onPaymentFailure(new Error('Payment expired'));
        }
    };

    const handleRetry = () => {
        window.location.reload();
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const openUpiApp = () => {
        if (upiUrl) {
            window.location.href = upiUrl;
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-center">Initiating Payment</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Please wait while we secure your seats and prepare the payment...
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error || status === 'ERROR') {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-center">Payment Error</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <p className="text-center mb-6">{error || 'An error occurred during payment processing'}</p>
                    <Button onClick={handleRetry}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Success state
    if (status === 'SUCCESS') {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-center">Payment Successful</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <p className="text-center mb-6">Your booking has been confirmed!</p>
                    <Button onClick={() => navigate(`/bookings/${paymentIntent.id}`)}>
                        View Booking
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Pending state (default)
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Complete Payment</CardTitle>
                    <Badge variant={status === 'EXPIRED' ? 'destructive' : status === 'SUCCESS' ? 'success' : 'outline'}>
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(timeRemaining)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress indicator */}
                <div className="space-y-2">
                    <Progress value={(timeRemaining / 600) * 100} />
                    <p className="text-xs text-muted-foreground text-center">
                        Time remaining to complete payment
                    </p>
                </div>

                <Separator />

                {/* QR Code */}
                <div className="flex flex-col items-center py-4">
                    <h3 className="font-medium mb-4">Scan QR Code with any UPI App</h3>

                    {qrCodeUrl ? (
                        <QRCodeGenerator
                            value={upiUrl}
                            size={200}
                            className="mb-4"
                            paymentDetails={{
                                upiId: config.upiId,
                                amount: paymentIntent?.amount || 0,
                                description: `Booking for ${selectedSeats.length} seat(s)`
                            }}
                        />
                    ) : (
                        <div className="h-48 w-48 flex items-center justify-center border rounded">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}

                    {/* UPI App button for mobile */}
                    {upiUrl && (
                        <Button
                            variant="outline"
                            onClick={openUpiApp}
                            className="mt-4"
                        >
                            Open UPI App
                        </Button>
                    )}
                </div>

                <Separator />

                {/* Instructions */}
                <div className="space-y-2 py-2">
                    <h3 className="font-medium">Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Scan the QR code with any UPI app</li>
                        <li>Complete the payment in your UPI app</li>
                        <li>Wait for automatic confirmation (may take a moment)</li>
                    </ol>
                </div>

                {/* Security note */}
                <div className="bg-muted p-3 rounded-md flex items-start text-xs">
                    <ShieldCheck className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Your selected seats are temporarily locked. The booking will be confirmed after successful payment.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default SeatPaymentFlow; 