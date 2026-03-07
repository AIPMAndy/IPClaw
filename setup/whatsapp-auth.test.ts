import { describe, it, expect } from 'vitest';

import { generateQrAuthHtml } from './whatsapp-auth.js';

describe('whatsapp auth QR HTML generation', () => {
  it('renders QR HTML without leaving template placeholders', async () => {
    const qrData = `payload-with-special-chars '"\`$(){}[];`;
    const html = await generateQrAuthHtml(qrData);

    expect(html).toContain('<svg');
    expect(html).toContain('Scan with WhatsApp');
    expect(html).not.toContain('{{QR_SVG}}');
  });
});
