import type { InvoiceWithDetails } from "@/services/billing";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function getPaidAmount(invoice: InvoiceWithDetails): number {
  if (invoice.payments && invoice.payments.length > 0) {
    return invoice.payments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
  }
  return invoice.status === "paid" ? Number(invoice.total_amount) : 0;
}

/**
 * Universal, popup-blocker-safe printing using a hidden DOM iframe.
 * Works seamlessly in Safari, Chrome, Firefox, Edge, and iOS/Android without triggering popup blockers.
 */
export function printHtmlDocument(html: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print execution failed:", e);
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  }, 250);
}

export function printOfficialReceipt(invoice: InvoiceWithDetails) {
  const receipt = invoice.payments && invoice.payments.length > 0 ? invoice.payments[0] : null;
  const clientName = invoice.owner?.full_name || "Walk-in Client";
  const totalPaid = getPaidAmount(invoice);
  const totalAmount = Number(invoice.total_amount) || 0;
  const vatAmount = Number(invoice.vat_amount) || 0;
  const subtotal = totalAmount - vatAmount;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${invoice.invoice_number || "Draft"}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .meta { font-size: 13px; color: #666; margin-top: 5px; }
          .items { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .items th { text-align: left; border-bottom: 1px solid #ddd; padding: 8px 4px; }
          .items td { padding: 8px 4px; border-bottom: 1px solid #eee; }
          .totals { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 14px; }
          .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #111; padding-top: 8px; margin-top: 8px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #888; border-top: 1px dashed #ccc; padding-top: 15px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">E-VetDoc Clinic</div>
          <div class="meta">Official Veterinary Care Receipt & Billing Statement</div>
          <div class="meta">Invoice: <strong>${invoice.invoice_number || "Draft"}</strong> ${receipt ? `| Receipt: <strong>${receipt.receipt_number || ""}</strong>` : ""}</div>
          <div class="meta">Date: ${formatDate(invoice.created_at || invoice.issue_date)}</div>
          <div class="meta">Client / Billed To: <strong>${clientName}</strong></div>
        </div>
        <table class="items">
          <thead>
            <tr>
              <th>Item / Service</th>
              <th style="text-align: right;">Qty</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.invoice_items || [])
              .map(
                (item) => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">₱${(Number(item.quantity) * Number(item.unit_price)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>₱${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
          ${
            vatAmount > 0
              ? `
          <div class="totals-row">
            <span>VAT (12%)</span>
            <span>₱${vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
          `
              : ""
          }
          <div class="totals-row grand-total">
            <span>Total Amount</span>
            <span>₱${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="totals-row" style="color: #059669; font-weight: bold; margin-top: 4px;">
            <span>Amount Paid</span>
            <span>₱${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for trusting E-VetDoc with your pet's healthcare!</p>
          <p style="font-size: 10px; margin-top: 5px;">This is a system-generated official billing statement & receipt.</p>
        </div>
      </body>
    </html>
  `;

  printHtmlDocument(html);
}
