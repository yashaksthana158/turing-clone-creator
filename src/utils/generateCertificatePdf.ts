import jsPDF from 'jspdf';

interface CertificateData {
  title: string;
  recipientName: string;
  description?: string | null;
  eventTitle?: string | null;
  certificateNumber: string;
  issuedAt: string;
}

// Convert image URL to base64 data URL
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateCertificatePdf(data: CertificateData) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;

  // ── Background ──
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // ── Decorative border ──
  const purple = [145, 19, 255] as const;
  const gold = [212, 175, 55] as const;

  // Outer border
  doc.setDrawColor(...purple);
  doc.setLineWidth(2);
  doc.rect(8, 8, W - 16, H - 16);

  // Inner border
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, W - 24, H - 24);

  // Corner accents
  const cornerSize = 15;
  const corners = [
    [12, 12], [W - 12, 12], [12, H - 12], [W - 12, H - 12]
  ];
  doc.setDrawColor(...purple);
  doc.setLineWidth(1.2);
  corners.forEach(([x, y]) => {
    const dx = x < W / 2 ? 1 : -1;
    const dy = y < H / 2 ? 1 : -1;
    doc.line(x, y, x + cornerSize * dx, y);
    doc.line(x, y, x, y + cornerSize * dy);
  });

  // ── Logo ──
  try {
    const logoBase64 = await loadImageAsBase64('/img/turing-logo.webp');
    doc.addImage(logoBase64, 'PNG', W / 2 - 12, 18, 24, 24);
  } catch {
    // Skip logo if it can't load
  }

  // ── Top decorative line ──
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 60, 46, W / 2 + 60, 46);

  // ── Title ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(150, 150, 150);
  doc.text('TURING CLUB', W / 2, 52, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...purple);
  doc.text('Certificate of Achievement', W / 2, 65, { align: 'center' });

  // ── Subtitle ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100, 100, 100);
  doc.text(data.title, W / 2, 75, { align: 'center' });

  // ── "This is awarded to" ──
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(120, 120, 120);
  doc.text('This certificate is proudly presented to', W / 2, 90, { align: 'center' });

  // ── Recipient name ──
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 30);
  doc.text(data.recipientName, W / 2, 105, { align: 'center' });

  // Name underline
  const nameWidth = doc.getTextWidth(data.recipientName);
  doc.setDrawColor(...purple);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - nameWidth / 2 - 5, 108, W / 2 + nameWidth / 2 + 5, 108);

  // ── Description / Event ──
  let yPos = 120;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);

  if (data.description) {
    const lines = doc.splitTextToSize(data.description, 200);
    doc.text(lines, W / 2, yPos, { align: 'center' });
    yPos += lines.length * 6;
  }

  if (data.eventTitle) {
    doc.setFont('helvetica', 'italic');
    doc.text(`For participation in: ${data.eventTitle}`, W / 2, yPos + 4, { align: 'center' });
    yPos += 10;
  }

  // ── Signature lines ──
  const sigY = 160;
  const sigWidth = 50;

  // Left signature
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(50, sigY, 50 + sigWidth, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Faculty Advisor', 50 + sigWidth / 2, sigY + 5, { align: 'center' });

  // Right signature
  doc.line(W - 50 - sigWidth, sigY, W - 50, sigY);
  doc.text('President, Turing Club', W - 50 - sigWidth / 2, sigY + 5, { align: 'center' });

  // ── Seal / watermark circle ──
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.circle(W / 2, sigY - 2, 12);
  doc.circle(W / 2, sigY - 2, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...gold);
  doc.text('VERIFIED', W / 2, sigY - 3, { align: 'center' });
  doc.setFontSize(5);
  doc.text('TURING CLUB', W / 2, sigY + 1, { align: 'center' });

  // ── Bottom decorative line ──
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 60, 175, W / 2 + 60, 175);

  // ── Footer meta ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Certificate #${data.certificateNumber}  |  Issued: ${new Date(data.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    W / 2,
    182,
    { align: 'center' }
  );

  doc.setFontSize(7);
  doc.text('Acharya Narendra Dev College, University of Delhi', W / 2, 188, { align: 'center' });

  // ── Save ──
  doc.save(`certificate-${data.certificateNumber}.pdf`);
}
