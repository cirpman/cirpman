import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';

export interface CustomerSubscriptionData {
  // Personal Information
  surname: string;
  middleName: string;
  firstName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  contactAddress: string;
  email: string;
  occupation: string;
  referredBy: string;
  designation: string;
  phone: string;
  
  // Package & Payment
  selectedPackages: string[];
  duration: string;
  paymentPlan: string;
  plotSize: string;
  numberOfPlots: string;
  
  // Next of Kin
  nextOfKinSurname: string;
  nextOfKinOtherNames: string;
  nextOfKinAddress: string;
  nextOfKinPhone: string;
  nextOfKinIdNumber: string;
  nextOfKinRelationship: string;
  
  // Digital Signature
  digitalSignature: string;
  date: string;
  
  // Files
  passport_photo_url?: string;
  installment_preview?: {
    monthlyPayment: number;
    totalAmount: number;
    firstDeposit: number;
  };
}

export interface ConsultantSubscriptionData {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  contactAddress: string;
  email: string;
  occupation: string;
  employer: string;
  referredBy: string;
  designation: string;
  placement: string;
  phone: string;
  idNumber: string;
  
  // Next of Kin
  nextOfKinSurname: string;
  nextOfKinOtherNames: string;
  nextOfKinAddress: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  
  // Bank Account Information
  bankName: string;
  accountName: string;
  accountNumber: string;
  
  // Digital Signature
  digitalSignature: string;
  date: string;
  
  // Files
  passport_photo_url?: string;
}

export async function generateCustomerSubscriptionPDF(data: CustomerSubscriptionData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper function to draw text
  const drawText = (text: string, x: number, y: number, fontSize: number = 12, font: PDFFont = helveticaFont, color = rgb(0, 0, 0)) => {
    page.drawText(text, {
      x,
      y: height - y,
      size: fontSize,
      font,
      color,
    });
  };

  // Helper function to draw field label and value
  const drawField = (label: string, value: string, x: number, y: number, maxWidth: number = 200) => {
    drawText(label, x, y, 10, helveticaBold);
    const lines = wrapText(value, maxWidth, helveticaFont, 10);
    lines.forEach((line, index) => {
      drawText(line, x + 5, y - 15 - (index * 12), 10);
    });
    return lines.length * 12 + 15;
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Header
  drawText('CIRPMAN HOMES LTD', width / 2 - 100, 50, 18, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  drawText('CUSTOMER SUBSCRIPTION FORM', width / 2 - 120, 80, 16, helveticaBold);
  drawText('Installment Payment Plan', width / 2 - 80, 105, 12);

  // Date
  drawText(`Date: ${data.date}`, width - 150, 50, 10);

  let currentY = 150;

  // Personal Information Section
  drawText('PERSONAL INFORMATION', 50, currentY, 14, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  currentY += 30;

  // Name fields
  currentY += drawField('Surname:', data.surname, 50, currentY);
  currentY += drawField('Middle Name:', data.middleName, 300, currentY - 25);
  currentY += drawField('First Name:', data.firstName, 50, currentY);

  // Personal details
  currentY += drawField('Gender:', data.gender, 300, currentY - 25);
  currentY += drawField('Date of Birth:', data.dateOfBirth, 50, currentY);
  currentY += drawField('Marital Status:', data.maritalStatus, 300, currentY - 25);

  // Contact information
  currentY += drawField('Contact Address:', data.contactAddress, 50, currentY, 250);
  currentY += drawField('Email:', data.email, 50, currentY);
  currentY += drawField('Phone:', data.phone, 300, currentY - 25);

  // Occupation
  currentY += drawField('Occupation/Profession:', data.occupation, 50, currentY);
  currentY += drawField('Referred By:', data.referredBy, 300, currentY - 25);
  currentY += drawField('Designation:', data.designation, 50, currentY);

  currentY += 40;

  // Package & Payment Section
  drawText('PACKAGE & PAYMENT INFORMATION', 50, currentY, 14, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  currentY += 30;

  currentY += drawField('Selected Packages:', data.selectedPackages.join(', '), 50, currentY, 250);
  currentY += drawField('Duration:', `${data.duration} Months`, 50, currentY);
  currentY += drawField('Payment Plan:', data.paymentPlan, 300, currentY - 25);
  currentY += drawField('Plot Size:', data.plotSize, 50, currentY);
  currentY += drawField('Number of Plots:', data.numberOfPlots, 300, currentY - 25);

  // Installment Preview
  if (data.installment_preview) {
    currentY += 20;
    drawText('INSTALLMENT PREVIEW', 50, currentY, 12, helveticaBold, rgb(212 / 255, 175 / 255, 55 / 255));
    currentY += 20;
    drawText(`First Deposit: Naira ${data.installment_preview.firstDeposit.toLocaleString()}`, 50, currentY, 10);
    drawText(`Monthly Payment: Naira ${data.installment_preview.monthlyPayment.toLocaleString()}`, 200, currentY, 10);
    drawText(`Total Amount: Naira ${data.installment_preview.totalAmount.toLocaleString()}`, 350, currentY, 10);
    currentY += 30;
  }

  // Next of Kin Section
  drawText('NEXT OF KIN INFORMATION', 50, currentY, 14, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  currentY += 30;

  currentY += drawField('Surname:', data.nextOfKinSurname, 50, currentY);
  currentY += drawField('Other Names:', data.nextOfKinOtherNames, 300, currentY - 25);
  currentY += drawField('Residential Address:', data.nextOfKinAddress, 50, currentY, 250);
  currentY += drawField('Contact Number(s):', data.nextOfKinPhone, 50, currentY);
  currentY += drawField('ID Number:', data.nextOfKinIdNumber, 300, currentY - 25);
  currentY += drawField('Relationship:', data.nextOfKinRelationship, 50, currentY);

  currentY += 40;

  // Digital Signature Section
  drawText('DIGITAL SIGNATURE', 50, currentY, 14, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  currentY += 30;

  drawText('Digital Signature:', 50, currentY, 10, helveticaBold);
  drawText(data.digitalSignature, 50, currentY - 15, 10);

  drawText('Date:', 300, currentY, 10, helveticaBold);
  drawText(data.date, 300, currentY - 15, 10);

  // Footer
  const footerY = height - 50;
  drawText('This document was generated by Cirpman Homes Ltd', width / 2 - 150, footerY, 10, helveticaFont, rgb(0.5, 0.5, 0.5));

  return await pdfDoc.save();
}

export async function generateConsultantSubscriptionPDF(data: ConsultantSubscriptionData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper function to draw text
  const drawText = (text: string, x: number, y: number, fontSize: number = 12, font: PDFFont = helveticaFont, color = rgb(0, 0, 0)) => {
    page.drawText(text, {
      x,
      y: height - y,
      size: fontSize,
      font,
      color,
    });
  };

  // Helper function to draw field label and value
  const drawField = (label: string, value: string, x: number, y: number, maxWidth: number = 200) => {
    drawText(label, x, y, 10, helveticaBold);
    const lines = wrapText(value, maxWidth, helveticaFont, 10);
    lines.forEach((line, index) => {
      drawText(line, x + 5, y - 15 - (index * 12), 10);
    });
    return lines.length * 12 + 15;
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Header
  drawText('CIRPMAN HOMES LTD', width / 2 - 100, 50, 18, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  drawText('CONSULTANT APPLICATION FORM', width / 2 - 120, 80, 16, helveticaBold);
  drawText('Sales Representative Application', width / 2 - 100, 105, 12);

  // Date
  drawText(`Date: ${data.date}`, width - 150, 50, 10);

  let currentY = 150;

  // Personal Information Section
  drawText('PERSONAL INFORMATION', 50, currentY, 14, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  currentY += 30;

  // Name fields
  currentY += drawField('First Name:', data.firstName, 50, currentY);
  currentY += drawField('Middle Name:', data.middleName, 300, currentY - 25);
  currentY += drawField('Last Name:', data.lastName, 50, currentY);

  // Personal details
  currentY += drawField('Gender:', data.gender, 300, currentY - 25);
  currentY += drawField('Date of Birth:', data.dateOfBirth, 50, currentY);
  currentY += drawField('Marital Status:', data.maritalStatus, 300, currentY - 25);

  // Contact information
  currentY += drawField('Contact Address:', data.contactAddress, 50, currentY, 250);
  currentY += drawField('Email:', data.email, 50, currentY);
  currentY += drawField('Phone:', data.phone, 300, currentY - 25);

  // Employment
  currentY += drawField('Occupation/Profession:', data.occupation, 50, currentY);
  currentY += drawField('Employer:', data.employer, 300, currentY - 25);
  currentY += drawField('Referred By:', data.referredBy, 50, currentY);
  currentY += drawField('Designation:', data.designation, 300, currentY - 25);
  currentY += drawField('Placement/Package:', data.placement, 50, currentY);
  currentY += drawField('ID Number:', data.idNumber, 300, currentY - 25);

  currentY += 40;

  // Next of Kin Section
  drawText('NEXT OF KIN INFORMATION', 50, currentY, 14, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  currentY += 30;

  currentY += drawField('Surname:', data.nextOfKinSurname, 50, currentY);
  currentY += drawField('Other Names:', data.nextOfKinOtherNames, 300, currentY - 25);
  currentY += drawField('Residential Address:', data.nextOfKinAddress, 50, currentY, 250);
  currentY += drawField('Contact Number(s):', data.nextOfKinPhone, 50, currentY);
  currentY += drawField('Relationship:', data.nextOfKinRelationship, 300, currentY - 25);

  currentY += 40;

  // Bank Account Information Section
  drawText('BANK ACCOUNT INFORMATION', 50, currentY, 14, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  currentY += 30;

  currentY += drawField('Bank Name:', data.bankName, 50, currentY);
  currentY += drawField('Account Name:', data.accountName, 300, currentY - 25);
  currentY += drawField('Account Number:', data.accountNumber, 50, currentY);

  currentY += 40;

  // Digital Signature Section
  drawText('DIGITAL SIGNATURE', 50, currentY, 14, helveticaBold, rgb(11 / 255, 61 / 255, 145 / 255));
  currentY += 30;

  drawText('Digital Signature:', 50, currentY, 10, helveticaBold);
  drawText(data.digitalSignature, 50, currentY - 15, 10);

  drawText('Date:', 300, currentY, 10, helveticaBold);
  drawText(data.date, 300, currentY - 15, 10);

  // Footer
  const footerY = height - 50;
  drawText('This document was generated by Cirpman Homes Ltd', width / 2 - 150, footerY, 10, helveticaFont, rgb(0.5, 0.5, 0.5));

  return await pdfDoc.save();
}

// Helper function to download PDF
export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
