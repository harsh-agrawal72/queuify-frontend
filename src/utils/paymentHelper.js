/**
 * Payment Fee Calculation Utility (Frontend)
 * Mirrors Backend: backend/src/utils/paymentHelper.js
 */

export const PLATFORM_FEE_NET = 5;
export const GST_RATE = 0.18;
export const RZP_FEE_RATE = 0.02;

export const calculatePaymentBreakdown = (basePrice) => {
    const B = parseFloat(basePrice) || 0;
    if (B === 0) {
        return {
            basePrice: 0,
            platformFee: 0,
            transactionFee: 0,
            paymentGst: 0,
            totalPayable: 0
        };
    }

    // 1. Total Payable
    // Formula: X = (B + (PLATFORM_FEE_NET * (1 + GST_RATE))) / (1 - (RZP_FEE_RATE * (1 + GST_RATE)))
    const totalPayable = (B + (PLATFORM_FEE_NET * (1 + GST_RATE))) / (1 - (RZP_FEE_RATE * (1 + GST_RATE)));
    
    // 2. Transaction Fee (Base 2% of total)
    const transactionFee = totalPayable * RZP_FEE_RATE;
    
    // 3. GST Components
    const platformGst = PLATFORM_FEE_NET * GST_RATE;
    const transactionGst = transactionFee * GST_RATE;
    const totalGst = platformGst + transactionGst;

    return {
        basePrice: parseFloat(B.toFixed(2)),
        platformFee: parseFloat(PLATFORM_FEE_NET.toFixed(2)),
        transactionFee: parseFloat(transactionFee.toFixed(2)),
        paymentGst: parseFloat(totalGst.toFixed(2)),
        totalPayable: parseFloat(totalPayable.toFixed(2))
    };
};
