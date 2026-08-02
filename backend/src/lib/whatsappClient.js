// Stubbed until real WhatsApp Business API (Meta) and Twilio SMS-fallback
// credentials are available, per the vision doc's "Remaining Phase 1 Work".
// Swap this module out for a real client without touching notificationService.js
// or the routes that call it — same sendSessionMessage/sendTemplateMessage shape.
export const stubWhatsappClient = {
  async sendSessionMessage(phone, text) {
    console.log(`[stub-whatsapp:session] -> ${phone}: ${text}`);
  },
  async sendTemplateMessage(phone, template, params) {
    console.log(`[stub-whatsapp:template:${template}] -> ${phone}:`, params);
  },
};
