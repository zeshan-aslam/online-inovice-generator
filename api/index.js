const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/generate-pdf', (req, res) => {
  const { invoiceNumber, clientName, clientEmail, items } = req.body;

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${invoiceNumber || 'invoice'}.pdf`);

  doc.pipe(res);

  // Title
  doc.fontSize(22).fillColor('#333').text('INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#666').text(`Invoice #: ${invoiceNumber || 'INV-1001'}`, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
  doc.moveDown();

  // Client Details
  doc.fontSize(12).fillColor('#000').text('Billed To:', { underline: true });
  doc.fontSize(10).fillColor('#444').text(`Name: ${clientName || 'N/A'}`);
  doc.text(`Email: ${clientEmail || 'N/A'}`);
  doc.moveDown(2);

  // Table Headers
  doc.fillColor('#000').fontSize(10);
  doc.text('Item Description', 50, doc.y, { continued: true });
  doc.text('Qty', 320, doc.y, { continued: true });
  doc.text('Price', 400, doc.y, { continued: true });
  doc.text('Total', 480, doc.y);
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
  doc.moveDown();

  // Items Loop
  let subtotal = 0;
  if (items && items.length > 0) {
    items.forEach(item => {
      const itemTotal = (Number(item.qty) || 1) * (Number(item.price) || 0);
      subtotal += itemTotal;

      doc.text(item.name || 'Service', 50, doc.y, { continued: true, width: 250 });
      doc.text(String(item.qty || 1), 320, doc.y, { continued: true });
      doc.text(`$${item.price || 0}`, 400, doc.y, { continued: true });
      doc.text(`$${itemTotal}`, 480, doc.y);
      doc.moveDown(0.5);
    });
  }

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  // Total Summary
  doc.fontSize(12).text(`Subtotal: $${subtotal}`, { align: 'right' });
  doc.text(`Tax (5%): $${(subtotal * 0.05).toFixed(2)}`, { align: 'right' });
  doc.fontSize(14).fillColor('#0070f3').text(`Grand Total: $${(subtotal * 1.05).toFixed(2)}`, { align: 'right' });

  doc.end();
});

module.exports = app;