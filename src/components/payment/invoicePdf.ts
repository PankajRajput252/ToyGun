import jsPDF from "jspdf";
import letterhead from "../images/invoice-letterhead.jpg";
import type { PaymentSubmission, ShopOrder } from "../../services/paymentApi";

// Letterhead image is 1110 x 1600 px; the PDF page uses the same proportions
const PAGE_W = 210;
const PAGE_H = (210 * 1600) / 1110;
const px = (n: number) => (n * PAGE_W) / 1110; // letterhead pixels → mm

export interface InvoiceLine {
  name: string;
  units: number;
  unitPrice: number;
}

/** Order items when the order loaded, otherwise a single line for the payment itself. */
export const invoiceLines = (payment: PaymentSubmission, order: ShopOrder | null): InvoiceLine[] =>
  order?.items.length
    ? order.items.map((i) => ({ name: i.productName, units: i.units, unitPrice: i.unitPrice }))
    : [{ name: payment.orderReference ? `Order ${payment.orderReference}` : "Payment", units: 1, unitPrice: payment.amount }];

export const invoiceNumber = (payment: PaymentSubmission) => `INV-${String(payment.id).padStart(6, "0")}`;

// jsPDF's built-in fonts have no ₹ glyph
const rs = (n: number) =>
  `Rs. ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export async function downloadInvoicePdf(payment: PaymentSubmission, order: ShopOrder | null, issuedAt: Date) {
  const doc = new jsPDF({ unit: "mm", format: [PAGE_W, PAGE_H] });
  doc.addImage(await loadImage(letterhead), "JPEG", 0, 0, PAGE_W, PAGE_H);

  // Date written over the printed "DATE - __/____/20__" blanks
  doc.setFillColor(255, 255, 255);
  doc.rect(px(130), px(292), px(250), px(48), "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text(issuedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }), px(140), px(322));

  // White panel so the text stays readable over the watermark
  const left = 12;
  const right = PAGE_W - 12;
  const top = px(350);
  doc.setFillColor(255, 255, 255); // text colour calls also change the fill colour
  doc.setGState(new (doc as any).GState({ opacity: 0.92 }));
  doc.roundedRect(left, top, right - left, PAGE_H - top - 12, 3, 3, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  let y = top + 10;
  const x = left + 6;
  const xr = right - 6;

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(18);
  doc.text("INVOICE", x, y);
  doc.setFillColor(22, 163, 74);
  doc.roundedRect(xr - 52, y - 6, 52, 8.5, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.text("PAYMENT SUCCESSFUL", xr - 26, y - 0.6, { align: "center" });

  y += 9;
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(9.5);
  const meta: [string, string][] = [
    ["Invoice no.", invoiceNumber(payment)],
    ["Date & time", issuedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })],
    ["Order", payment.orderReference ?? "—"],
    ["Payment method", payment.paymentMethodName],
    ["Transaction ref.", payment.transactionReference],
    ["Paid on", payment.paymentDate],
  ];
  meta.forEach(([k, v], i) => {
    const col = i % 2 === 0 ? x : x + 95;
    const row = y + Math.floor(i / 2) * 6;
    doc.setFont("helvetica", "normal");
    doc.text(`${k}:`, col, row);
    doc.setFont("helvetica", "bold");
    doc.text(v, col + 30, row);
  });
  y += Math.ceil(meta.length / 2) * 6 + 4;

  const a = order?.shippingAddress;
  if (a) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Bill to", x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const addr = [
      a.fullName,
      [a.addressLine1, a.addressLine2].filter(Boolean).join(", "),
      `${a.city}, ${a.state} - ${a.pincode}`,
      `Phone: ${a.phone}${a.email ? `  ·  ${a.email}` : ""}`,
    ];
    addr.forEach((line, i) => doc.text(line, x, y + 5 + i * 5));
    y += 5 + addr.length * 5 + 4;
  }

  // Items table
  const cQty = xr - 70;
  const cPrice = xr - 35;
  doc.setFillColor(17, 24, 39);
  doc.rect(x, y, xr - x, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Product", x + 3, y + 5.5);
  doc.text("Qty", cQty, y + 5.5, { align: "right" });
  doc.text("Unit price", cPrice, y + 5.5, { align: "right" });
  doc.text("Amount", xr - 3, y + 5.5, { align: "right" });
  y += 8;

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "normal");
  const lines = invoiceLines(payment, order);
  lines.forEach((l) => {
    const name = doc.splitTextToSize(l.name, cQty - x - 20) as string[];
    const h = Math.max(8, name.length * 4.5 + 3.5);
    doc.text(name, x + 3, y + 5.5);
    doc.text(String(l.units), cQty, y + 5.5, { align: "right" });
    doc.text(rs(l.unitPrice), cPrice, y + 5.5, { align: "right" });
    doc.text(rs(l.units * l.unitPrice), xr - 3, y + 5.5, { align: "right" });
    y += h;
    doc.setDrawColor(229, 231, 235);
    doc.line(x, y, xr, y);
  });

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total paid", cPrice, y, { align: "right" });
  doc.text(rs(payment.amount), xr - 3, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  doc.text("This is a computer-generated invoice and does not require a signature.", PAGE_W / 2, PAGE_H - 18, {
    align: "center",
  });

  doc.save(`${invoiceNumber(payment)}.pdf`);
}
