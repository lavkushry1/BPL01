import QRCode from 'qrcode';

/**
 * Generates a QR code as data URL
 * @param data Data to encode in QR code
 * @returns Promise resolving to data URL string
 */
export const generateQRCode = async (data: string): Promise<string> => {
    try {
        const dataUrl = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        return dataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}; 