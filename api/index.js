const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();

app.use(cors());
app.use(express.json());

/* ---------- Design settings ---------- */
const COLORS = {
  navy: '#1E293B',    // header band, table header, main headings
  accent: '#2563EB',  // grand total highlight
  text: '#334155',    // body text
  muted: '#64748B',   // labels, secondary text
  line: '#E2E8F0',    // borders
  zebra: '#F8FAFC',   // alternate row background
  white: '#FFFFFF',
};

const FONT = { regular: 'Helvetica', bold: 'Helvetica-Bold' };

const PAGE_WIDTH = 595.28;                 // A4
const PAGE_HEIGHT = 841.89;
const LEFT = 50;
const RIGHT = 545;                         // right edge of content
const CONTENT_WIDTH = RIGHT - LEFT;        // 495
const BOTTOM_LIMIT = 740;                  // content must end above this
const TAX_RATE = 0.05;

// Table columns: defined once, used by header and rows
const COL = {
  desc:  { x: 62,  w: 235, align: 'left'  },
  qty:   { x: 305, w: 40,  align: 'right' },
  price: { x: 355, w: 80,  align: 'right' },
  total: { x: 445, w: 88,  align: 'right' },
};

/* ---------- Helpers ---------- */
const money = (n) =>
  '$' +
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (d = new Date()) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const safeFileName = (name) =>
  String(name || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '_');

function drawTopBand(doc, invoiceNumber, businessName) {
  doc.rect(0, 0, PAGE_WIDTH, 100).fill(COLORS.navy);

  doc
    .font(FONT.bold)
    .fontSize(18)
    .fillColor(COLORS.white)
    .text(businessName, LEFT, 40, { width: 280, lineBreak: false });

  doc
    .font(FONT.bold)
    .fontSize(30)
    .fillColor(COLORS.white)
    .text('INVOICE', LEFT, 33, { width: CONTENT_WIDTH, align: 'right', lineBreak: false });
}

function drawInfoSection(doc, { invoiceNumber, clientName, clientEmail }) {
  const y = 130;

  // Billed to (left)
  doc
    .font(FONT.bold)
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text('BILLED TO', LEFT, y, { characterSpacing: 1, lineBreak: false });

  doc
    .font(FONT.bold)
    .fontSize(13)
    .fillColor(COLORS.navy)
    .text(clientName, LEFT, y + 16, { width: 260, lineBreak: false });

  doc
    .font(FONT.regular)
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(clientEmail, LEFT, y + 36, { width: 260, lineBreak: false });

  // Invoice details (right)
  const labelX = 340;
  const valueW = RIGHT - 430;
  const rows = [
    ['Invoice No.', invoiceNumber],
    ['Date', formatDate()],
  ];
  rows.forEach(([label, value], i) => {
    const ry = y + i * 20;
    doc
      .font(FONT.regular)
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(label, labelX, ry, { width: 85, lineBreak: false });
    doc
      .font(FONT.bold)
      .fontSize(10)
      .fillColor(COLORS.navy)
      .text(value, 430, ry, { width: valueW, align: 'right', lineBreak: false });
  });
}

function drawTableHeader(doc, y) {
  doc.rect(LEFT, y, CONTENT_WIDTH, 28).fill(COLORS.navy);

  doc.font(FONT.bold).fontSize(9).fillColor(COLORS.white);
  const headers = { desc: 'DESCRIPTION', qty: 'QTY', price: 'PRICE', total: 'AMOUNT' };
  Object.keys(COL).forEach((k) => {
    doc.text(headers[k], COL[k].x, y + 10, {
      width: COL[k].w,
      align: COL[k].align,
      lineBreak: false,
      characterSpacing: 0.5,
    });
  });
  return y + 28;
}

function drawFooter(doc) {
  const y = PAGE_HEIGHT - 80;
  doc.moveTo(LEFT, y).lineTo(RIGHT, y).lineWidth(0.5).strokeColor(COLORS.line).stroke();
  doc
    .font(FONT.bold)
    .fontSize(10)
    .fillColor(COLORS.navy)
    .text('Thank you for your business!', LEFT, y + 12, {
      width: CONTENT_WIDTH,
      align: 'center',
      lineBreak: false,
    });
}

/* ---------- Routes ---------- */
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/generate-invoice', (req, res) => {
  try {
    const body = req.body || {};
    const invoiceNumber = String(body.invoiceNumber || 'INV-1001');
    const clientName = String(body.clientName || 'N/A');
    const clientEmail = String(body.clientEmail || 'N/A');
    const businessName = String(body.businessName || 'Invoice Generator');
    const items = Array.isArray(body.items) ? body.items : [];

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: { Title: `Invoice ${invoiceNumber}`, Author: businessName },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFileName(invoiceNumber)}.pdf"`
    );
    doc.pipe(res);

    // Header + info
    drawTopBand(doc, invoiceNumber, businessName);
    drawInfoSection(doc, { invoiceNumber, clientName, clientEmail });

    // Table
    let y = drawTableHeader(doc, 230);
    let subtotal = 0;

    items.forEach((item, index) => {
      const qty = Math.max(0, Number(item.qty) || 1);
      const price = Math.max(0, Number(item.price) || 0);
      const lineTotal = qty * price;
      subtotal += lineTotal;

      const name = String(item.name || 'Service');

      doc.font(FONT.regular).fontSize(10);
      const textHeight = doc.heightOfString(name, { width: COL.desc.w });
      const rowHeight = Math.max(textHeight, 12) + 20;

      // New page if row does not fit
      if (y + rowHeight > BOTTOM_LIMIT) {
        doc.addPage();
        y = drawTableHeader(doc, 50);
      }

      // Zebra background
      if (index % 2 === 1) {
        doc.rect(LEFT, y, CONTENT_WIDTH, rowHeight).fill(COLORS.zebra);
      }

      const ty = y + 10;
      doc.font(FONT.regular).fontSize(10).fillColor(COLORS.text);
      doc.text(name, COL.desc.x, ty, { width: COL.desc.w, align: 'left' });
      doc.text(String(qty), COL.qty.x, ty, { width: COL.qty.w, align: 'right', lineBreak: false });
      doc.text(money(price), COL.price.x, ty, { width: COL.price.w, align: 'right', lineBreak: false });
      doc
        .font(FONT.bold)
        .fillColor(COLORS.navy)
        .text(money(lineTotal), COL.total.x, ty, { width: COL.total.w, align: 'right', lineBreak: false });

      // Row bottom border
      doc
        .moveTo(LEFT, y + rowHeight)
        .lineTo(RIGHT, y + rowHeight)
        .lineWidth(0.5)
        .strokeColor(COLORS.line)
        .stroke();

      y += rowHeight;
    });

    // Totals
    const tax = subtotal * TAX_RATE;
    const grandTotal = subtotal + tax;

    if (y + 120 > BOTTOM_LIMIT) {
      doc.addPage();
      y = 50;
    }
    y += 20;

    const boxX = 335;
    const boxW = RIGHT - boxX;
    const valueX = 445;
    const valueW = 88;

    const totalsLine = (label, value) => {
      doc.font(FONT.regular).fontSize(10).fillColor(COLORS.muted);
      doc.text(label, boxX + 12, y, { width: 100, lineBreak: false });
      doc.font(FONT.bold).fillColor(COLORS.navy);
      doc.text(value, valueX, y, { width: valueW, align: 'right', lineBreak: false });
      y += 22;
    };

    totalsLine('Subtotal', money(subtotal));
    totalsLine(`Tax (${TAX_RATE * 100}%)`, money(tax));

    // Grand total highlight
    y += 4;
    doc.rect(boxX, y, boxW, 36).fill(COLORS.accent);
    doc
      .font(FONT.bold)
      .fontSize(11)
      .fillColor(COLORS.white)
      .text('Grand Total', boxX + 12, y + 12, { width: 100, lineBreak: false });
    doc
      .font(FONT.bold)
      .fontSize(13)
      .fillColor(COLORS.white)
      .text(money(grandTotal), valueX, y + 11, { width: valueW, align: 'right', lineBreak: false });

    drawFooter(doc);
    doc.end();
  } catch (err) {
    console.error('PDF error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
});

module.exports = app;

// Only for local testing (Vercel does not use this)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}