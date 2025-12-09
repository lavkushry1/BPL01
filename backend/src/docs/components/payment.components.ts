
/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentStatus:
 *       type: string
 *       enum:
 *         - pending
 *         - verified
 *         - rejected
 *         - refunded
 * 
 *     PaymentCreate:
 *       type: object
 *       required:
 *         - booking_id
 *         - amount
 *         - status
 *       properties:
 *         booking_id:
 *           type: string
 *           description: ID of the booking
 *         amount:
 *           type: number
 *           format: float
 *           description: Payment amount
 *         utr_number:
 *           type: string
 *           description: UTR number for the payment
 *         payment_date:
 *           type: string
 *           format: date-time
 *           description: Date of payment
 *         status:
 *           $ref: '#/components/schemas/PaymentStatus'
 *         verified_by:
 *           type: string
 *           description: ID of admin who verified the payment
 * 
 *     Payment:
 *       allOf:
 *         - $ref: '#/components/schemas/PaymentCreate'
 *         - type: object
 *           required:
 *             - id
 *             - created_at
 *             - updated_at
 *           properties:
 *             id:
 *               type: string
 *               description: Payment ID
 *             created_at:
 *               type: string
 *               format: date-time
 *             updated_at:
 *               type: string
 *               format: date-time
 * 
 *     UpiSettingsCreate:
 *       type: object
 *       required:
 *         - upiVPA
 *         - discountAmount
 *         - isActive
 *       properties:
 *         upiVPA:
 *           type: string
 *           description: UPI VPA address
 *         discountAmount:
 *           type: number
 *           format: float
 *           description: Discount amount for UPI payments
 *         isActive:
 *           type: boolean
 *           description: Whether these settings are active
 * 
 *     UpiSettings:
 *       allOf:
 *         - $ref: '#/components/schemas/UpiSettingsCreate'
 *         - type: object
 *           required:
 *             - id
 *             - created_at
 *             - updated_at
 *           properties:
 *             id:
 *               type: string
 *               description: Settings ID
 *             created_at:
 *               type: string
 *               format: date-time
 *             updated_at:
 *               type: string
 *               format: date-time
 */
