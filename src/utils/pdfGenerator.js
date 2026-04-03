import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, isValid, parseISO } from 'date-fns';

/**
 * Generates a professional, modern PDF receipt for an appointment.
 * @param {Object} appointment - The enriched appointment details (containing org data).
 */
export const generateInvoice = async (appointment) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // --- Colors & Branding ---
        const colors = {
            primary: [79, 70, 229], // Indigo-600
            secondary: [55, 65, 81], // Slate-700
            light: [243, 244, 246],  // Gray-100
            accent: [99, 102, 241],  // Indigo-500
            text: [31, 41, 55]       // Gray-900
        };

        // --- Helper for safe dates ---
        const safeFormat = (dateStr, fmt) => {
            if (!dateStr) return 'N/A';
            const date = parseISO(dateStr);
            return isValid(date) ? format(date, fmt) : 'N/A';
        };

        // --- 1. Top Decorative Bar ---
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 2, 'F');

        // --- 2. Header: Logo & Receipt Info ---
        let currentY = 15;

        // Try to add Logo if available
        if (appointment.org_logo_url) {
            try {
                // We add the image if it's reachable and valid
                doc.addImage(appointment.org_logo_url, 'PNG', 20, currentY, 25, 25);
                currentY += 10;
            } catch (e) {
                console.warn("Logo failed to load:", e);
                // Fallback to stylized name
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(22);
                doc.setTextColor(...colors.primary);
                doc.text(appointment.org_name || 'Receipt', 20, currentY + 12);
                currentY += 10;
            }
        } else {
            // Stylized Organization Name
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(...colors.primary);
            doc.text((appointment.org_name || 'Appointment').toUpperCase(), 20, currentY + 12);
            currentY += 10;
        }

        // Receipt Details (Right Aligned)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...colors.secondary);
        doc.text('RECEIPT', pageWidth - 20, currentY + 5, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128); // Gray-500
        doc.text(`ID: ${appointment.display_token || (appointment.id ? String(appointment.id).slice(-8).toUpperCase() : 'N/A')}`, pageWidth - 20, currentY + 12, { align: 'right' });
        doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy')}`, pageWidth - 20, currentY + 17, { align: 'right' });
        
        const status = (appointment.status || 'Completed').toUpperCase();
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(status === 'CANCELLED' ? [220, 38, 38] : (status === 'COMPLETED' ? [37, 99, 235] : colors.primary)));
        doc.text(status, pageWidth - 20, currentY + 23, { align: 'right' });

        currentY += 35;

        // --- 3. Information Grid (Provider & Customer) ---
        // Left Box: Provider Details
        doc.setFillColor(...colors.light);
        doc.roundedRect(20, currentY, 80, 45, 3, 3, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('SERVICE PROVIDER', 25, currentY + 8);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.text);
        const providerLines = [
            appointment.org_name,
            appointment.org_address,
            `${appointment.org_city || ''} ${appointment.org_state || ''} ${appointment.org_pincode || ''}`.trim(),
            `Phone: ${appointment.org_contact_phone || 'N/A'}`,
            `Email: ${appointment.org_contact_email || 'N/A'}`
        ].filter(l => l && l !== '  ');
        doc.text(providerLines.slice(0, 5), 25, currentY + 16, { lineHeightFactor: 1.4 });

        // Right Box: Customer Details
        doc.setFillColor(...colors.light);
        doc.roundedRect(pageWidth / 2 + 5, currentY, 80, 45, 3, 3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('BILLED TO', pageWidth / 2 + 10, currentY + 8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.text);
        const customerLines = [
            appointment.customer_name || appointment.user_name || 'Valued Guest',
            appointment.customer_email || appointment.user_email || 'Walk-in Customer',
            `Ticket #: ${appointment.display_token || appointment.token_number || (appointment.id ? appointment.id.slice(-6).toUpperCase() : 'N/A')}`,
            `Payment: ${String(appointment.payment_status || 'Paid').toUpperCase()}`
        ];
        doc.text(customerLines, pageWidth / 2 + 10, currentY + 16, { lineHeightFactor: 1.4 });

        currentY += 55;

        // --- 4. Service Table ---
        autoTable(doc, {
            startY: currentY,
            head: [['Service Description', 'Professional', 'Date & Time', 'Amount']],
            body: [
                [
                    { content: appointment.service_name || 'Consultation', styles: { fontStyle: 'bold' } },
                    appointment.resource_name || 'Assigned Staff',
                    safeFormat(appointment.start_time || appointment.date, 'dd MMM yyyy, hh:mm a'),
                    { content: `INR ${Number(appointment.price || 0).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }
                ]
            ],
            theme: 'striped',
            headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontSize: 10, cellPadding: 4 },
            bodyStyles: { fontSize: 10, cellPadding: 4, textColor: colors.secondary },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: 20, right: 20 }
        });

        currentY = doc.lastAutoTable.finalY + 15;

        // --- 5. Summary & Totals ---
        const summaryX = pageWidth - 90;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('Subtotal:', summaryX, currentY);
        doc.text(`INR ${Number(appointment.price || 0).toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });

        currentY += 8;
        doc.setDrawColor(...colors.light);
        doc.line(summaryX, currentY - 2, pageWidth - 20, currentY - 2);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.primary);
        doc.text('Total Amount Paid:', summaryX, currentY + 8);
        doc.text(`INR ${Number(appointment.price || 0).toFixed(2)}`, pageWidth - 20, currentY + 8, { align: 'right' });

        // --- 6. Professional Footer ---
        const footerY = 275;
        
        // Add a signature line/token indicator
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'italic');
        doc.text('This is an electronically generated document. No physical signature required.', pageWidth / 2, footerY, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.secondary);
        doc.text(`Thank you for choosing ${appointment.org_name || 'us'}!`, pageWidth / 2, footerY + 7, { align: 'center' });
        
        // Small Queuify Pulse branding
        doc.setFontSize(7);
        doc.setTextColor(209, 213, 219);
        doc.setFont('helvetica', 'normal');
        doc.text('Powered by Queuify Smart Management', pageWidth / 2, footerY + 13, { align: 'center' });

        // --- 7. Save PDF ---
        const fileName = `Receipt_${appointment.display_token || (appointment.id ? String(appointment.id).slice(-6).toUpperCase() : 'TXN')}.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error("PDF Generation Error:", error);
        throw new Error("Failed to generate receipt. Please try again.");
    }
};
