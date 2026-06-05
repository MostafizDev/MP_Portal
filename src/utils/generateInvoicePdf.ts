import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Invoice, Order } from '../types';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });
}

function buildItemRows(order: Order | null): string {
  if (!order || !order.items || order.items.length === 0) {
    return `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:16px;">No items found</td></tr>`;
  }
  return order.items.map((item) => `
    <tr>
      <td style="padding:10px 16px;">${item.productName}</td>
      <td style="padding:10px 16px;color:#64748b;">${item.productSku}</td>
      <td style="padding:10px 16px;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 16px;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding:10px 16px;text-align:right;font-weight:700;color:#0f172a;">$${item.total.toFixed(2)}</td>
    </tr>
  `).join('');
}

function buildHtml(inv: Invoice, order: Order | null, generatedAt: string): string {
  const statusColor =
    inv.status === 'paid' ? '#16a34a' : inv.status === 'overdue' ? '#dc2626' : '#d97706';
  const statusLabel =
    inv.status === 'paid' ? 'PAID' : inv.status === 'overdue' ? 'OVERDUE' : 'ISSUED';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
         background: #fff; color: #0f172a; font-size: 13px; }
  .page { max-width: 720px; margin: 0 auto; padding: 48px 40px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start;
            border-bottom: 3px solid #6366f1; padding-bottom: 24px; margin-bottom: 32px; }
  .brand { font-size: 26px; font-weight: 900; color: #6366f1; letter-spacing: -0.5px; }
  .brand-sub { font-size: 10px; color: #64748b; letter-spacing: 2px;
               text-transform: uppercase; margin-top: 2px; }
  .inv-title { text-align: right; }
  .inv-title h1 { font-size: 32px; font-weight: 900; color: #1e293b; letter-spacing: -1px; }
  .inv-num { font-size: 14px; font-weight: 700; color: #6366f1; margin-top: 4px; }
  .status-badge {
    display: inline-block; padding: 4px 14px; border-radius: 20px;
    font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
    color: ${statusColor}; border: 2px solid ${statusColor};
    background: ${statusColor}18; margin-top: 8px;
  }

  /* Parties */
  .parties { display: flex; margin-bottom: 28px; }
  .party { flex: 1; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; }
  .party:first-child { margin-right: 16px; }
  .party-label { font-size: 9px; font-weight: 800; letter-spacing: 2px;
                 color: #6366f1; text-transform: uppercase; margin-bottom: 8px; }
  .party-label.to { color: #f59e0b; }
  .party-name { font-size: 15px; font-weight: 700; color: #0f172a; }
  .party-role { font-size: 11px; color: #64748b; margin-top: 2px; }

  /* Meta grid */
  .meta { display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
  .meta-box { flex: 1; min-width: 140px; background: #f8fafc;
              border-radius: 8px; padding: 12px 14px; }
  .meta-label { font-size: 9px; font-weight: 700; color: #94a3b8;
                text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
  .meta-value { font-size: 12px; font-weight: 600; color: #0f172a; }

  /* Section title */
  .section-title { font-size: 10px; font-weight: 800; color: #64748b;
                   text-transform: uppercase; letter-spacing: 1.5px;
                   margin-bottom: 10px; margin-top: 28px; }

  /* Items table */
  .items-table { width: 100%; border-collapse: collapse;
                 border: 1px solid #e2e8f0; border-radius: 10px;
                 overflow: hidden; margin-bottom: 28px; }
  .items-table thead { background: #f8fafc; }
  .items-table thead th { padding: 10px 16px; text-align: left; font-size: 10px;
                           font-weight: 800; color: #64748b; text-transform: uppercase;
                           letter-spacing: 1px; }
  .items-table thead th:nth-child(3) { text-align: center; }
  .items-table thead th:nth-child(4),
  .items-table thead th:nth-child(5) { text-align: right; }
  .items-table tbody tr { border-top: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
  .items-table tbody tr:nth-child(even) { background: #fafafa; }

  /* Totals */
  .totals { border: 1px solid #e2e8f0; border-radius: 10px;
            overflow: hidden; margin-bottom: 28px; }
  .totals-row { display: flex; justify-content: space-between;
                align-items: center; padding: 11px 20px;
                border-top: 1px solid #f1f5f9; }
  .totals-row:first-child { border-top: none; }
  .totals-label { font-size: 13px; color: #475569; }
  .totals-value { font-size: 13px; font-weight: 600; color: #0f172a; }
  .totals-divider { border-top: 2px solid #e2e8f0; }
  .totals-final { display: flex; justify-content: space-between;
                  align-items: center; padding: 16px 20px; background: #f8fafc; }
  .totals-final-label { font-size: 14px; font-weight: 700; color: #0f172a; }
  .totals-final-value { font-size: 28px; font-weight: 900; color: #6366f1;
                        letter-spacing: -0.5px; }

  /* Footer */
  .footer { border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 16px;
            color: #94a3b8; font-size: 10px; line-height: 1.8; }
  .footer-row { display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">VendorLink</div>
      <div class="brand-sub">Procurement Portal</div>
    </div>
    <div class="inv-title">
      <h1>INVOICE</h1>
      <div class="inv-num">${inv.invoiceNumber}</div>
      <div class="status-badge">${statusLabel}</div>
    </div>
  </div>

  <!-- Parties -->
  <div class="parties">
    <div class="party">
      <div class="party-label">From (Supplier)</div>
      <div class="party-name">${inv.supplierName}</div>
      <div class="party-role">Supplier</div>
    </div>
    <div class="party">
      <div class="party-label to">To (Vendor)</div>
      <div class="party-name">${inv.vendorName}</div>
      <div class="party-role">Vendor</div>
    </div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-box">
      <div class="meta-label">Order Number</div>
      <div class="meta-value">${inv.orderNumber}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Invoice Issued</div>
      <div class="meta-value">${fmtDateTime(inv.issuedAt)}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Due Date</div>
      <div class="meta-value">${fmtDate(inv.dueDate)}</div>
    </div>
    ${inv.paidAt ? `<div class="meta-box">
      <div class="meta-label">Paid On</div>
      <div class="meta-value">${fmtDateTime(inv.paidAt)}</div>
    </div>` : ''}
  </div>

  <!-- Order Items -->
  <div class="section-title">Order Items</div>
  <table class="items-table">
    <thead>
      <tr>
        <th>Product</th>
        <th>SKU</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${buildItemRows(order)}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-row">
      <span class="totals-label">Subtotal</span>
      <span class="totals-value">$${inv.subtotal.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">Tax (13% HST)</span>
      <span class="totals-value">$${inv.tax.toFixed(2)}</span>
    </div>
    <hr class="totals-divider"/>
    <div class="totals-final">
      <span class="totals-final-label">Total Due</span>
      <span class="totals-final-value">$${inv.totalAmount.toFixed(2)}</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-row">
      <span>Generated by VendorLink &middot; CS5450 Mobile Programming &mdash; Group 7</span>
      <span>PDF generated: ${generatedAt}</span>
    </div>
    <div style="margin-top:4px;">This is a computer-generated invoice and does not require a signature.</div>
  </div>

</div>
</body>
</html>`;
}

export async function downloadInvoicePdf(invoice: Invoice, order: Order | null): Promise<void> {
  const generatedAt = new Date().toLocaleString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });

  const html = buildHtml(invoice, order, generatedAt);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device.');

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Invoice ${invoice.invoiceNumber}`,
    UTI: 'com.adobe.pdf',
  });
}
