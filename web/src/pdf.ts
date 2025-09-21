// web/src/pdf.ts
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type PdfArgs = {
  userId: string;
  premium: number;
  risk: number;             // 0..1
  metrics: Record<string, number>;
  nodes: {
    premium: HTMLElement | null;
    chart: HTMLElement | null;
    factors: HTMLElement | null;
  };
};

export async function downloadQuotePdf(args: PdfArgs) {
  const { userId, premium, risk, metrics, nodes } = args;

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 40;
  let cursorY = margin;

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('Dynamic Premium Quote', margin, cursorY);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const ts = new Date().toLocaleString();
  pdf.text(`Generated: ${ts}`, pageW - margin, cursorY, { align: 'right' });

  cursorY += 18;

  // Quote summary row
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const premiumTxt = fmt.format(Number(premium || 0));
  const riskPct = Math.round((risk ?? 0) * 100);

  cursorY += 10;
  pdf.setFontSize(12);
  pdf.text(`User: ${userId}`, margin, cursorY);
  pdf.text(`Premium: ${premiumTxt}`, pageW / 2, cursorY);
  cursorY += 16;
  pdf.text(`Risk Score: ${riskPct}%`, margin, cursorY);

  // Disclaimer
  cursorY += 14;
  pdf.setTextColor(120);
  pdf.setFontSize(9);
  pdf.text(
    'This is a non-binding quote preview. Final premiums may vary based on underwriting and policy terms.',
    margin,
    cursorY
  );
  pdf.setTextColor(0);

  cursorY += 14;

  // Helper to add a DOM node as an image (keeps dark/light backgrounds)
  const snap = async (el: HTMLElement | null): Promise<{ w: number; h: number; data: string } | null> => {
    if (!el) return null;
    const dark = document.documentElement.classList.contains('dark');
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: dark ? '#000000' : '#FFFFFF',
      useCORS: true,
    });
    const data = canvas.toDataURL('image/png', 0.92);
    return { w: canvas.width, h: canvas.height, data };
  };

  // Add cards as images
  const blocks = [
    await snap(nodes.premium),
    await snap(nodes.chart),
    await snap(nodes.factors),
  ].filter(Boolean) as Array<{ w: number; h: number; data: string }>;

  const contentW = pageW - margin * 2;

  for (const block of blocks) {
    const scale = contentW / block.w;
    const imgW = contentW;
    const imgH = block.h * scale;

    if (cursorY + imgH > pageH - margin) {
      pdf.addPage();
      cursorY = margin;
    }

    pdf.addImage(block.data, 'PNG', margin, cursorY, imgW, imgH);
    cursorY += imgH + 16;
  }

  // Metrics summary at the end
  if (cursorY > pageH - margin - 120) {
    pdf.addPage();
    cursorY = margin;
  }
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
  pdf.text('Metrics Snapshot', margin, cursorY);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  cursorY += 14;

  const colGap = 180;
  const pairs = Object.entries(metrics);
  for (let i = 0; i < pairs.length; i++) {
    const [k, v] = pairs[i];
    const x = margin + (i % 2) * colGap;
    const y = cursorY + Math.floor(i / 2) * 14;
    pdf.text(`${k}: ${v}`, x, y);
  }

  // Save
  pdf.save(`quote-${userId}.pdf`);
}
