import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Helper function to convert number to words for TZS/Currency
const amountToWords = (amount: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    if (amount === 0) return 'Zero';

    const formatGroup = (n: number): string => {
        let str = '';
        if (n >= 100) {
            str += units[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 10 && n <= 19) {
            str += teens[n - 10] + ' ';
        } else if (n >= 20 || (n > 0 && n < 10)) {
            str += tens[Math.floor(n / 10)] + (n % 10 !== 0 && n > 20 ? '-' : '') + units[n % 10] + ' ';
        }
        return str;
    };

    let integerPart = Math.floor(amount);
    let decimalPart = Math.round((amount - integerPart) * 100);

    let result = '';
    let scaleIdx = 0;

    while (integerPart > 0) {
        let group = integerPart % 1000;
        if (group > 0) {
            result = formatGroup(group) + scales[scaleIdx] + ' ' + result;
        }
        integerPart = Math.floor(integerPart / 1000);
        scaleIdx++;
    }

    result = result.trim();
    if (decimalPart > 0) {
        result += ` and ${decimalPart}/100`;
    }

    return result;
};

export const generateInvoicePdf = async (invoiceData: any, documentType: string = "Proforma Invoice") => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // -- WATERMARK --
    try {
        const logoImg = new Image();
        logoImg.src = '/logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
        });
        if (logoImg.complete && logoImg.naturalWidth > 0) {
            doc.saveGraphicsState();
            doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
            doc.addImage(logoImg, 'PNG', pageWidth / 2 - 40, pageHeight / 2 - 40, 80, 80);
            doc.restoreGraphicsState();
        }
    } catch (e) { console.error("Watermark load failed", e); }

    // -- TOP HEADER IDENTIFIERS --
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`TIN : ${invoiceData.company_tin || '119-056-861'}`, margin, 10);
    doc.text("Original Copy", pageWidth - margin, 10, { align: "right" });

    doc.setFontSize(14);
    doc.text(documentType, pageWidth / 2, 18, { align: "center" });
    const titleWidth = doc.getTextWidth(documentType);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - (titleWidth / 2), 19, pageWidth / 2 + (titleWidth / 2), 19);

    // -- COMPANY BRANDING --
    doc.setFontSize(16);
    doc.text("MICROFAST DISTRIBUTION COMPANY LIMITED", pageWidth / 2, 28, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("P O Box-20626, Dar Es Salaam, Tanzania", pageWidth / 2, 33, { align: "center" });
    doc.text("Tel. : +255-22-2137508 email : sahajacct@gmail.com", pageWidth / 2, 37, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`VRN No: ${invoiceData.company_vrn || '40-014365-J'}`, pageWidth / 2, 42, { align: "center" });

    // -- INFO BOXES (Party Details & Order Info) --
    const boxY = 48;
    const boxHeight = 35;
    const midPoint = pageWidth / 2;

    // Draw Main Container Box
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(margin, boxY, pageWidth - (margin * 2), boxHeight);
    doc.line(midPoint, boxY, midPoint, boxY + boxHeight); // Vertical divider

    // Left Box: Party Details
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Party Details :", margin + 2, boxY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(invoiceData.client_name || "CLIENT NAME", margin + 2, boxY + 10);
    doc.setFont("helvetica", "normal");
    // Simulated address
    doc.text("P.O. BOX 1234", margin + 2, boxY + 15);
    doc.text("DAR ES SALAAM, TANZANIA", margin + 2, boxY + 19);
    doc.setFont("helvetica", "bold");
    doc.text(`Party TIN : ${invoiceData.client_tin || 'N/A'}  VRN: ${invoiceData.client_vrn || 'N/A'}`, margin + 2, boxY + boxHeight - 3);

    // Right Box: Order Information
    const rightX = midPoint + 2;
    const rightCol2 = pageWidth - margin - 2;

    const orderItems = [
        { label: "Order No.", value: invoiceData.invoice_number || "N/A" },
        { label: "Dated", value: format(new Date(invoiceData.created_at || new Date()), 'dd-MM-yyyy hh:mm a') },
        { label: "Exempt", value: invoiceData.exempt ? "Yes" : "No" },
        { label: "Credit Period", value: "N/A" },
        { label: "LPO No.", value: invoiceData.lpo_no || "N/A" }
    ];

    doc.setFont("helvetica", "normal");
    orderItems.forEach((item, i) => {
        doc.setFont("helvetica", "normal");
        doc.text(item.label, rightX, boxY + 5 + (i * 6));
        doc.text(":", midPoint + 25, boxY + 5 + (i * 6));
        doc.setFont("helvetica", "bold");
        doc.text(String(item.value), midPoint + 27, boxY + 5 + (i * 6));
    });

    // -- ITEMS TABLE --
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("We are pleased to receive the order for the following items :", margin, boxY + boxHeight + 8);

    const items = invoiceData.items || [];
    const tableBody = items.map((item: any, index: number) => [
        (index + 1).toString(),
        item.product_name || `Product ${index + 1}`,
        item.quantity.toString(),
        "Pcs.", // Default unit
        parseFloat(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        (item.quantity * parseFloat(item.price)).toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    autoTable(doc, {
        startY: boxY + boxHeight + 12,
        head: [['S.N.', 'Description of Goods', 'Qty', 'Unit', 'Price', 'Amount(TZS)']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.1
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 30 },
            5: { halign: 'right', cellWidth: 35 },
        },
        margin: { left: margin, right: margin }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 2;

    // -- FOOTER CALCULATIONS --
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * parseFloat(item.price)), 0);
    const vat = invoiceData.exempt ? 0 : subtotal * 0.18;
    const grandTotal = subtotal + vat;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    // VAT Row
    if (!invoiceData.exempt) {
        doc.text("Add : VAT Input @ 18.00 %", pageWidth - 100, finalY + 5);
        doc.text(vat.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - margin - 2, finalY + 5, { align: "right" });
    } else {
        doc.text("Tax Exempted", pageWidth - 100, finalY + 5);
        doc.text("0.00", pageWidth - margin - 2, finalY + 5, { align: "right" });
    }

    // Total Row
    doc.line(pageWidth - 110, finalY + 8, pageWidth - margin, finalY + 8);
    doc.text("Grand Total", pageWidth - 100, finalY + 13);
    doc.text(grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - margin - 2, finalY + 13, { align: "right" });
    doc.line(pageWidth - 110, finalY + 15, pageWidth - margin, finalY + 15);

    // Amount in Words
    doc.setFont("helvetica", "normal");
    doc.text(`Shilling ${amountToWords(grandTotal)} Only`, margin, finalY + 25, { maxWidth: pageWidth - (margin * 2) });

    // -- TERMS AND SIGNATURES --
    const footerY = pageHeight - 40;

    // Terms (Left)
    doc.setFontSize(7);
    doc.text("1. Above Quote is valid for only 7 days", margin, footerY);
    doc.text("2. Price will change without Notice", margin, footerY + 4);
    doc.text("3. 100% Payment against Delivery", margin, footerY + 8);

    // Signatures (Right)
    doc.setFontSize(9);
    doc.text("Receiver's Signature :", pageWidth - 70, footerY);
    doc.line(pageWidth - 70, footerY - 5, pageWidth - margin, footerY - 5, "D"); // Dotted simulation

    doc.text("for Microfast Distribution co. Ltd", pageWidth - 70, footerY + 15);
    doc.setFont("helvetica", "bold");
    doc.text("Authorised Signatory", pageWidth - 70, footerY + 25);

    // Save PDF
    const safeName = `${documentType.replace(/ /g, '_')}-${invoiceData.invoice_number || 'Draft'}`;
    doc.save(`${safeName}.pdf`);
};

