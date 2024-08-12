import { agreement, rollerImageByte } from '../data/agreement';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

let y = 150;
let page = null;
let font = null;
let boldFont = null;
let pageAdded = 0;

const reset = () => {
  y = 150;
  page = null;
  font = null;
  boldFont = null;
  pageAdded = 0;
}

const renewPage = (pdfDoc) => {
  y = 750; // Reset y to the top of the new page
  page = pdfDoc.addPage([600, 800]); // Add a new page to the document
  page.setFont(font); // Set the font for the new page
  page.setFontSize(12); // Set the font size for the new page
  pageAdded++;
};

const getY = (gap, pdfDoc) => {
  if (y - gap <= 50) { // If there isn't enough space for the next text block
    renewPage(pdfDoc); // Create a new page
  }
  y -= gap; // Adjust y-coordinate by the gap
  return y;
};

const formatDate = (rawDate) => {
  const date = new Date(rawDate);

  // Format the date as yyyy/mm/dd
  return date.toISOString().split('T')[0].replace(/-/g, '/');
}

export async function createFilledPDF(primaryPlayer, kids) {
  reset();
  // Load the existing PDF
  // const existingPdfBytes = new toUint8Array(agreement);
  const pdfDoc = await PDFDocument.load(agreement);

  // Embed the signature image
  const signatureImage = await pdfDoc.embedPng(primaryPlayer.Signature);

  //roller image
  // Embed the signature image
  const rollerImage = await pdfDoc.embedPng(rollerImageByte);

  // Assuming primaryPlayer.DateSigned is a valid date string or Date object
  const dateSigned = new Date(primaryPlayer.DateSigned);
  const formattedDateSigned = formatDate(dateSigned);

  // Calculate the expiration date by adding 2 years
  const expirationDate = new Date(dateSigned);
  expirationDate.setFullYear(dateSigned.getFullYear() + 2);
  const formattedExpirationDate = formatDate(expirationDate);

  // Embed fonts
  font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Get the pages of the existing PDF
  const pages = pdfDoc.getPages();

  // Start adding content to the last page
  page = pages[pages.length - 1];

  // Add the primary player's name and DOB in bold
  page.drawText(`${primaryPlayer.FirstName} ${primaryPlayer.LastName} (${formatDate(primaryPlayer.DateOfBirth)})`, { 
    x: 50, 
    y: getY(0, pdfDoc), 
    size: 12, 
    font: boldFont, 
    color: rgb(0.2, 0.2, 0.2) // Lighter shade of black
  });

  // Add the "Kids:" label
  if(kids.length > 0) {
    page.drawText(`Kids:`, { 
      x: 50, 
      y: getY(20, pdfDoc), 
      size: 12, 
      font, 
      color: rgb(0.2, 0.2, 0.2) 
    });
  }

  // Add the kids' names and DOBs
  kids.forEach((kid, index) => {
    page.drawText(`${index + 1}. ${kid.FirstName} ${kid.LastName} (${formatDate(kid.DateOfBirth)})`, { 
      x: 50, 
      y: getY(20, pdfDoc), 
      size: 12, 
      font, 
      color: rgb(0.2, 0.2, 0.2) 
    });
  });

  if(pageAdded<=0){
    renewPage(pdfDoc);
  }
  const signY = getY(70, pdfDoc);
  
  // Add the signature image
  page.drawImage(signatureImage, {
    x: 50,
    y: signY,
    width: 200,
    height: 70,
  });

  // Draw a line under the signature
  page.drawLine({
    start: { x: 50, y: getY(10, pdfDoc) },
    end: { x: 250, y: signY-10 },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2)
  });

  // Add signed details in lighter black color
  page.drawText(`Signed by: ${primaryPlayer.FirstName} ${primaryPlayer.LastName}`, { 
    x: 50, 
    y: getY(20, pdfDoc), 
    size: 12, 
    font, 
    color: rgb(0.2, 0.2, 0.2) 
  });
  page.drawText(`Signed Date: ${formattedDateSigned}`, { 
    x: 50, 
    y: getY(20, pdfDoc), 
    size: 12, 
    font, 
    color: rgb(0.2, 0.2, 0.2) 
  });
  page.drawText(`Expires At: ${formattedExpirationDate}`, { 
    x: 50, 
    y: getY(20, pdfDoc), 
    size: 12, 
    font, 
    color: rgb(0.2, 0.2, 0.2) 
  });

  page.drawImage(rollerImage, {
    x: 475,
    y: getY(30, pdfDoc),
    width: 75,
    height: 30,
  });

  // Serialize the PDFDocument to bytes
  const pdfBytes = await pdfDoc.save();

  // // it view in Ifame
  // const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });

  return pdfBytes;
}
