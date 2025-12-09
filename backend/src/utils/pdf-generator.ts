import jsPDF from 'jspdf';
import { Booking } from '../models/booking';
import { Event } from '../models/event.model';
import { DeliveryDetails } from '../models/booking';

export const generateTicketPDF = (
  booking: Booking,
  event: Event,
  deliveryDetails: DeliveryDetails
) => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add logo and header
  doc.setFontSize(22);
  doc.setTextColor(0, 102, 204);
  doc.text('EVENTIA', 20, 20);
  doc.setFontSize(18);
  doc.text('E-TICKET', 20, 30);
  
  // Add event details
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(event.title, 20, 45);
  
  doc.setFontSize(12);
  doc.text(`Date: ${new Date(event.start_date).toLocaleDateString()}`, 20, 55);
  doc.text(`Venue: ${event.location}`, 20, 62);
  
  // Add booking details
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text('Booking Information', 20, 75);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Booking ID: ${booking.id}`, 20, 85);
  doc.text(`Booking Date: ${new Date(booking.created_at).toLocaleDateString()}`, 20, 92);
  // Use the seats length if available, otherwise use a fallback
  const ticketCount = booking.seats ? booking.seats.length : 1;
  doc.text(`Number of Tickets: ${ticketCount}`, 20, 99);
  doc.text(`Amount Paid: ₹${booking.final_amount}`, 20, 106);
  
  // Add customer details
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text('Customer Details', 20, 120);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Name: ${deliveryDetails.name}`, 20, 130);
  doc.text(`Phone: ${deliveryDetails.phone}`, 20, 137);
  doc.text(`Address: ${deliveryDetails.address}`, 20, 144);
  doc.text(`${deliveryDetails.city}, ${deliveryDetails.pincode}`, 20, 151);
  
  // Add QR code placeholder text (in a real app, you would generate an actual QR code)
  doc.setDrawColor(0);
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(130, 80, 60, 60, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Scan QR code at venue', 140, 115);
  
  // Add footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('This is an electronically generated ticket and does not require a signature.', 20, 280);
  
  return doc;
};

export const downloadTicketPDF = (
  booking: Booking,
  event: Event,
  deliveryDetails: DeliveryDetails
) => {
  const doc = generateTicketPDF(booking, event, deliveryDetails);
  doc.save(`Eventia-Ticket-${booking.id}.pdf`);
};
