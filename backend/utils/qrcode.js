const crypto = require('crypto');
const QRCode = require('qrcode');

// Produces a unique, unguessable ticket code. This is what's encoded into the
// QR image and what the gate scanner looks up (Table 24: Ticket.QRCode).
function generateTicketCode(reservationId) {
  const random = crypto.randomBytes(16).toString('hex');
  return `STRS-${reservationId}-${random}`;
}

// Renders the ticket code as a scannable QR image (base64 data URL) for the frontend.
async function generateQrImage(code) {
  return QRCode.toDataURL(code, { margin: 1, width: 320 });
}

module.exports = { generateTicketCode, generateQrImage };
