import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, isValid, parseISO } from 'date-fns';

/**
 * Generates a professional PDF invoice for an appointment
 * @param {Object} appointment - The appointment details
 * @param {Object} org - The organization details
 */
export const generateInvoice = (appointment, org) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // --- Helper for safe dates ---
        const safeFormat = (dateStr, fmt) => {
            if (!dateStr) return 'N/A';
            const date = parseISO(dateStr);
            return isValid(date) ? format(date, fmt) : 'N/A';
        };

        // --- Header & Branding ---
        doc.setFillColor(79, 70, 229); // Indigo-600
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(org?.name || 'Appointment Receipt', 20, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('OFFICIAL BOOKING RECEIPT', 20, 32);
        
        // --- Right Aligned Header Info ---
        doc.setFontSize(10);
        const receiptNo = `Receipt #: ${appointment.display_token || String(appointment.id || '').slice(-8).toUpperCase() || 'N/A'}`;
        const dateStr = `Date: ${format(new Date(), 'dd MMM yyyy')}`;
        const statusStr = `Status: ${String(appointment.status || 'unknown').toUpperCase()}`;
        
        doc.text(receiptNo, pageWidth - 20, 18, { align: 'right' });
        doc.text(dateStr, pageWidth - 20, 25, { align: 'right' });
        doc.text(statusStr, pageWidth - 20, 32, { align: 'right' });
        
        // --- Organization & Customer Details ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PROVIDER DETAILS', 20, 55);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text([
            org?.name || 'Queuify Service Provider',
            org?.address || '',
            `${org?.city || ''}, ${org?.state || ''} ${org?.pincode || ''}`.trim().replace(/^,/, ''),
            `Phone: ${org?.contact_phone || 'N/A'}`,
            `Email: ${org?.contact_email || 'N/A'}`
        ].filter(line => line && line !== ' ,  '), 20, 62);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('CUSTOMER DETAILS', pageWidth / 2 + 10, 55);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text([
            appointment.customer_name || 'Valued Guest',
            appointment.customer_email || 'Walk-in Customer',
            `Token: ${appointment.display_token || appointment.token_number || String(appointment.id || '').slice(-8).toUpperCase()}`,
            `Payment: ${String(appointment.payment_status || 'UNPAID').toUpperCase()}`
        ].filter(Boolean), pageWidth / 2 + 10, 62);
        
        // --- Service Details Table ---
        autoTable(doc, {
            startY: 95,
            head: [['Service Description', 'Provider/Resource', 'Scheduled Date', 'Amount']],
            body: [
                [
                    appointment.service_name || 'Standard Service',
                    appointment.resource_name || appointment.resource_id || 'Staff',
                    safeFormat(appointment.start_time || appointment.date || appointment.created_at, 'dd MMM yyyy, hh:mm a'),
                    `INR ${Number(appointment.price || 0).toFixed(2)}`
                ]
            ],
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' }
            }
        });
        
        // --- Summary Section ---
        const finalY = doc.lastAutoTable.finalY + 10;
        
        doc.setDrawColor(243, 244, 246);
        doc.line(pageWidth - 80, finalY, pageWidth - 20, finalY);
        
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal:', pageWidth - 80, finalY + 10);
        doc.text(`INR ${Number(appointment.price || 0).toFixed(2)}`, pageWidth - 20, finalY + 10, { align: 'right' });
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Total Paid:', pageWidth - 80, finalY + 22);
        doc.text(`INR ${Number(appointment.price || 0).toFixed(2)}`, pageWidth - 20, finalY + 22, { align: 'right' });
        
        // --- Footer ---
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'italic');
        const footerText = 'This is a computer-generated receipt. No signature required.';
        doc.text(footerText, pageWidth / 2, 280, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Thank you for choosing ${org?.name || 'us'}!`, pageWidth / 2, 285, { align: 'center' });
        
        // Save the PDF
        const fileName = `Receipt_${appointment.display_token || String(appointment.id || '').slice(-6)}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("PDF Generation Error:", error);
        throw new Error("Failed to generate receipt. Please try again.");
    }
};
