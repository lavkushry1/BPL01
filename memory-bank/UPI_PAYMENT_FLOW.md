# Eventia UPI Payment Flow Guide

Alright bro, soch ki tu kirana store pe jaa rahe ho aur shopkeeper bole, "Bhaiya, cash nahin, UPI kar do." Eventia mein bhi kuch aise hi custom UPI + UTR workflow chal raha hai. Let's break it down in 5 easy, totally Bihari-style steps—assure karte hoonga ki ek baar padh loge toh kabhi bhoologe nahi! 😉

---

## 1. QR Code 📱 → Custom VPA

- **What happens:**  
  – Admin dashboard mein tu apna UPI VPA (jaise `eventia@bank`) set karta hai.  
  – Jab user checkout pe "Pay via UPI" choose karta hai, frontend backend se bolta hai "bhai, ek QR bana do" → backend PDFKit + UPI VPA se QR generate karke frontend ko bhejta hai.  
- **Real-life:**  
  – Jaise kirana waley ka display QR laga hota hai, waise hi Eventia ka page pe dikhega custom QR.  
- **Memory trick:**  
  – "Custom VPA se QR banta hai—bilkul apne kirana wale ka poster."  

---

## 2. User Scans & Pays 💸

- **What happens:**  
  – User apna PhonePe/GPay/Amazon Pay kholta hai, "Scan QR" karta hai, amount auto-filled, "Pay" tap karta hai.  
  – UPI app se transaction instantly bank ke beech settle ho jaata hai.  
- **Real-life:**  
  – Jaise petrol pump pe "Scan & Pay," waise hi yahan.  
- **Memory trick:**  
  – "Scan, tap, done—UPI magic."  

---

## 3. UTR Reference Submission 🖊️

- **What's UTR?**  
  – Unique Transaction Reference—UPI ka bahut bada receipt number (12–16 digits).  
- **What happens:**  
  – Payment screen pe user ko ek input box milega: "Enter UTR here."  
  – User UPI app ke "Transaction History" se UTR copy-paste karega.  
- **Real-life:**  
  – Jaise bank slip pe slip number likhte ho, yahan slip ka UTR bharo.  
- **Memory trick:**  
  – "Slip number = UTR number. Copy–paste karo, bs."  

---

## 4. Admin Verification 🔍

- **What happens:**  
  – User UTR submit karte hi, backend record banaata hai: `{ bookingId, utr, status: 'pending' }`.  
  – Admin dashboard pe "Pending Payments" list me dikhega.  
  – Admin apne bank account statement ya bank portal se UTR match karke "Approve" ya "Reject" button dabata hai.  
- **Real-life:**  
  – Jaise school me fees slip dikhake principal stamp lagwate ho—waise hi admin stamp maar raha hai.  
- **Memory trick:**  
  – "Principal's stamp = Admin's approval."  

---

## 5. Ticket Generation & Delivery 🎟️

- **What happens:**  
  – Admin "Approve" dabate hi backend:  
    1. `Booking.status = 'confirmed'`  
    2. PDF ticket generate hota hai with unique QR code for entry  
    3. PDF download link / email link frontend me dikha deta hai  
- **Real-life:**  
  – Jaise train ticket IRCTC se download karte ho, waise hi Eventia ticket.  
- **Memory trick:**  
  – "Payment approved → Click download → Ticket ready."  

---

### TL;DR in ek line
> **"Scan custom QR → UPI se pay karo → slip ka UTR daalo → admin stamp approve karega → ticket PDF download karo."**

Bas bhai, yehi full custom UPI + UTR workflow hai Eventia mein. Ek baar samajh jaoge na, phir booking mast ho jaayega—no login, bas scan–pay–UTR–approve–ticket! 🚀  

## Technical Implementation Notes

### Mobile-First Enhancements (Already Implemented)

1. **Direct App Integration**
   - Deep linking with `upi://pay?pa=...` to launch payment apps directly
   - Intent URLs for Android with proper app package targeting
   - Fallback URLs if app isn't installed

2. **Native Payment Support**
   - Payment Request API integration for browsers that support it
   - Seamless native payment sheet experience

3. **Feature Phone Support**
   - SMS-based OTP fallback for basic phones
   - Works without smartphone apps

4. **UI/UX Improvements**
   - Device detection for showing appropriate payment options
   - Mobile-optimized QR code display
   - Touch-friendly buttons for all major UPI apps

### Admin Verification Process

1. **UTR Verification Flow**
   - Admin dashboard displays all pending payments
   - Search by booking ID or UTR number
   - Verification status tracking (pending, verified, rejected)
   
2. **Security Measures**
   - Only admins can verify payments
   - All verification actions are logged with timestamps
   - Double verification option for high-value transactions 