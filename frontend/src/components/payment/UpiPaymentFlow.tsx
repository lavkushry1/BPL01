import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import {
    initiateUpiPayment,
    getUpiPaymentStatus,
    confirmUpiPayment
} from '@/services/api/paymentApi';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import QRCode from 'react-qr-code';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { API_BASE_URL } from '@/config';

// Define payment statuses
enum PaymentStatus {
    PENDING = 'PENDING',
    VERIFICATION_PENDING = 'VERIFICATION_PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    EXPIRED = 'EXPIRED'
}

// UPI payment flow props
interface UpiPaymentFlowProps {
    eventId: string;
    selectedSeats: string[];
    onPaymentComplete: (bookingId: string) => void;
    onPaymentCancel: () => void;
}

const UpiPaymentFlow: React.FC<UpiPaymentFlowProps> = ({
    eventId,
    selectedSeats,
    onPaymentComplete,
    onPaymentCancel
}) => {
    const { user } = useUser();
    const { toast } = useToast();

    // State variables
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
    const [remainingTime, setRemainingTime] = useState<number>(600); // 10 minutes in seconds
    const [utrNumber, setUtrNumber] = useState<string>('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [hasCopiedUpi, setHasCopiedUpi] = useState(false);
    const [expireWarning, setExpireWarning] = useState(false);
    const [pollingActive, setPollingActive] = useState(true);

    // Initialize payment session
    const initializePayment = useCallback(async () => {
        if (!user?.id || !eventId || !selectedSeats.length) {
            toast({
                title: "Error",
                description: "Missing required information to start payment",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsLoading(true);
            const response = await initiateUpiPayment({
                eventId,
                seatIds: selectedSeats,
                userId: user.id
            });

            setSession(response);

            // Calculate initial remaining time
            if (response.expiresAt) {
                const expiryDate = parseISO(response.expiresAt);
                const secondsRemaining = differenceInSeconds(expiryDate, new Date());
                setRemainingTime(Math.max(0, secondsRemaining));
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error initializing payment:', error);
            toast({
                title: "Payment Initialization Failed",
                description: "Could not start the payment process. Please try again.",
                variant: "destructive"
            });
            setIsLoading(false);
        }
    }, [user, eventId, selectedSeats, toast]);

    // Initialize on component mount
    useEffect(() => {
        initializePayment();
    }, [initializePayment]);

    // Set up socket connection for real-time updates
    useEffect(() => {
        if (!session?.sessionId) return;

        const socket = io(`${API_BASE_URL}`, {
            path: '/ws',
            withCredentials: true
        });

        socket.on('connect', () => {
            console.log('WebSocket connected');

            // Subscribe to payment updates
            socket.emit('join:payment', session.sessionId);
        });

        socket.on('payment_status_changed', (data) => {
            if (data.sessionId === session.sessionId) {
                setPaymentStatus(data.status as PaymentStatus);

                if (data.status === PaymentStatus.COMPLETED) {
                    // Handle successful payment
                    if (data.bookingId) {
                        onPaymentComplete(data.bookingId);
                    }
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        return () => {
            socket.disconnect();
        };
    }, [session, onPaymentComplete]);

    // Check payment status periodically
    useEffect(() => {
        if (!session?.sessionId || !pollingActive) return;

        const checkStatus = async () => {
            try {
                const response = await getUpiPaymentStatus(session.sessionId);

                // Update status if changed
                if (response.status !== paymentStatus) {
                    setPaymentStatus(response.status as PaymentStatus);

                    // Handle payment completion
                    if (response.status === PaymentStatus.COMPLETED && response.booking) {
                        onPaymentComplete(response.booking.id);
                        setPollingActive(false);
                    }

                    // Handle payment expiry
                    if (response.status === PaymentStatus.EXPIRED) {
                        toast({
                            title: "Payment Expired",
                            description: "Your payment session has expired. Please try again.",
                            variant: "destructive"
                        });
                        setPollingActive(false);
                    }
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }
        };

        // Poll every 5 seconds
        const interval = setInterval(checkStatus, 5000);

        return () => clearInterval(interval);
    }, [session, paymentStatus, onPaymentComplete, toast, pollingActive]);

    // Countdown timer effect
    useEffect(() => {
        if (remainingTime <= 0 || !pollingActive) return;

        const timer = setInterval(() => {
            setRemainingTime(prev => {
                const newTime = prev - 1;

                // Show warning when less than 1 minute remains
                if (newTime === 60) {
                    setExpireWarning(true);
                }

                if (newTime <= 0) {
                    clearInterval(timer);
                    // Payment will expire on server but we'll still poll once more to confirm
                }

                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [remainingTime, pollingActive]);

    // Handle UTR submission
    const handleSubmitUtr = async () => {
        if (!utrNumber.trim() || !session?.sessionId) {
            toast({
                title: "Invalid UTR Number",
                description: "Please enter a valid UTR number",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsConfirming(true);
            await confirmUpiPayment(session.sessionId, utrNumber);

            toast({
                title: "UTR Submitted",
                description: "Your payment is being verified",
            });

            // The status polling will handle the rest
        } catch (error) {
            console.error('Error confirming payment:', error);
            toast({
                title: "Error",
                description: "Failed to confirm payment. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsConfirming(false);
        }
    };

    // Handle UPI ID copy
    const handleCopyUpiId = () => {
        if (!session?.upiId) return;

        navigator.clipboard.writeText(session.upiId);
        setHasCopiedUpi(true);

        toast({
            title: "UPI ID Copied",
            description: "UPI ID has been copied to clipboard"
        });

        setTimeout(() => setHasCopiedUpi(false), 2000);
    };

    // Open UPI app if on mobile
    const handleOpenUpiApp = () => {
        if (!session?.upiLink) return;

        window.location.href = session.upiLink;
    };

    // Format remaining time for display
    const formatRemainingTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Check if running on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Render loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-64">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">Initializing payment session...</p>
            </div>
        );
    }

    // Render payment expired state
    if (paymentStatus === PaymentStatus.EXPIRED || remainingTime <= 0) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Payment Session Expired</CardTitle>
                    <CardDescription>
                        Your payment session has expired. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Button onClick={onPaymentCancel}>
                        Return to Seat Selection
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // Render payment completed state (though this should be handled by onPaymentComplete)
    if (paymentStatus === PaymentStatus.COMPLETED) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Payment Successful!</CardTitle>
                    <CardDescription>
                        Your payment has been completed successfully.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Main payment flow UI
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>UPI Payment</CardTitle>
                <CardDescription>
                    Pay via UPI by scanning this QR code or copying the UPI ID below
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Timer warning */}
                {expireWarning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                        <p className="text-amber-800 text-sm font-medium">
                            <span className="mr-2">⚠️</span>
                            Less than 1 minute remaining! Complete your payment quickly.
                        </p>
                    </div>
                )}

                {/* Timer display */}
                <div className={`text-center ${remainingTime < 60 ? 'text-red-500' : remainingTime < 180 ? 'text-amber-500' : 'text-gray-700'}`}>
                    <div className="text-xs uppercase font-semibold mb-1">Time Remaining</div>
                    <div className="text-2xl font-bold">{formatRemainingTime(remainingTime)}</div>
                </div>

                {/* Amount */}
                <div className="text-center">
                    <div className="text-xs uppercase font-semibold mb-1">Amount to Pay</div>
                    <div className="text-3xl font-bold">₹{session?.amount.toFixed(2)}</div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center py-4">
                    {session?.qrCode ? (
                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <QRCode
                                value={session.upiLink || `upi://pay?pa=${session.upiId}&am=${session.amount}`}
                                size={200}
                                level="H"
                                onError={(error) => {
                                    console.error("QR Code error:", error);
                                    toast({
                                        title: "QR Code Error",
                                        description: "Unable to render QR code. You can still use the UPI ID below.",
                                        variant: "destructive"
                                    });
                                }}
                            />
                        </div>
                    ) : (
                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 h-[200px] w-[200px] flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-gray-500 text-sm mb-2">Unable to generate QR code. Please try again.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={initializePayment}
                                    className="text-xs"
                                >
                                    Try Again
                                </Button>
                                <p className="text-gray-600 font-medium mt-3">{session?.upiId}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* UPI ID */}
                <div className="relative">
                    <div className="flex items-center space-x-2">
                        <Input
                            value={session?.upiId || 'N/A'}
                            readOnly
                            className="pr-24 font-medium"
                        />
                        <Button
                            size="sm"
                            onClick={handleCopyUpiId}
                            variant="outline"
                            className="absolute right-2"
                        >
                            {hasCopiedUpi ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Pay to this UPI ID with reference: {session?.referenceId}</p>
                </div>

                {/* Mobile UPI app button */}
                {isMobile && session?.upiLink && (
                    <Button
                        onClick={handleOpenUpiApp}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        Open UPI App
                    </Button>
                )}

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">After Payment</span>
                    </div>
                </div>

                {/* UTR Input */}
                <div className="space-y-2">
                    <Label htmlFor="utr">Enter UTR Number / Reference ID</Label>
                    <Input
                        id="utr"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="Enter the UTR number from your payment"
                        className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                        You can find this number in your UPI app payment receipt or bank statement
                    </p>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
                <Button
                    onClick={handleSubmitUtr}
                    className="w-full"
                    disabled={isConfirming || !utrNumber.trim() || utrNumber.length < 8}
                >
                    {isConfirming ? <Spinner size="sm" className="mr-2" /> : null}
                    Confirm Payment
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            Cancel Payment
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Payment?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to cancel this payment? Your selected seats will be released and available for others to book.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Continue Payment</AlertDialogCancel>
                            <AlertDialogAction onClick={onPaymentCancel}>
                                Yes, Cancel Payment
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
};

export default UpiPaymentFlow; 