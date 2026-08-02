/**
 * notificationService.js
 *
 * Handles sending WhatsApp trip notifications to guardians, with two
 * independent rules layered together:
 *
 *  1. OPT-IN GATE (hard rule, never bypassed):
 *     A guardian only receives a message if their "notify" toggle is on,
 *     set on the scholar registration screen. If it's off, no message is
 *     sent through any channel. This is a delivery decision, not a cost
 *     decision.
 *
 *  2. FREE SESSION WINDOW (cost optimization only):
 *     If the guardian has messaged the business number within the last
 *     24 hours (e.g. replying to the morning opt-in prompt), the message
 *     is sent as a free session reply instead of a paid template message.
 *     This NEVER blocks sending — it only changes which WhatsApp API call
 *     is used. A guardian who hasn't opened today's session still gets
 *     notified; it just costs the business a per-message template fee.
 *
 * This separation matters: opting out of the daily "reply to save us
 * money" prompt must never be confused with opting out of safety
 * notifications. Only the explicit notify toggle controls delivery.
 *
 * Ported verbatim (CommonJS -> ESM) from the project's original spec file
 * at the repo root — this is now the real implementation, wired to a
 * stubbed WhatsApp client (see whatsappClient.js) until real Meta/Twilio
 * credentials are available.
 */

const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Returns true if this guardian should receive notifications at all.
 * @param {{ notify: boolean }} guardian
 */
export function isOptedIn(guardian) {
  return guardian.notify === true;
}

/**
 * Returns true if the guardian is currently inside a free WhatsApp
 * session window (they messaged the business within the last 24h).
 * @param {{ lastInboundMessageAt: Date|null }} guardian
 */
export function hasFreeSessionWindow(guardian) {
  if (!guardian.lastInboundMessageAt) return false;
  const elapsed = Date.now() - new Date(guardian.lastInboundMessageAt).getTime();
  return elapsed < SESSION_WINDOW_MS;
}

/**
 * Builds the notification payload for a trip event.
 * @param {{ name: string }} scholar
 * @param {"home_pickup"|"school_dropoff"|"school_pickup"|"home_dropoff"} eventType
 * @param {Date} timestamp
 */
export function buildMessageText(scholar, eventType, timestamp) {
  const labels = {
    home_pickup: 'picked up from home',
    school_dropoff: 'dropped off at school',
    school_pickup: 'picked up from school',
    home_dropoff: 'dropped off at home',
  };
  const time = new Date(timestamp).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${scholar.name} was ${labels[eventType]} at ${time}.`;
}

/**
 * Sends a trip notification to every eligible guardian for a scholar.
 * Skips guardians who are opted out. Never skips an opted-in guardian
 * due to session-window status — it only changes which send method
 * (free session reply vs. paid template) is used.
 *
 * @param {object} whatsappClient - wraps the WhatsApp send API (e.g. Twilio)
 * @param {{ name: string }} scholar
 * @param {string} eventType
 * @param {Date} timestamp
 * @param {Array<{ id: string, name: string, phone: string, notify: boolean, lastInboundMessageAt: Date|null }>} guardians
 * @returns {Promise<Array<{ guardianId: string, sent: boolean, channel: string|null, reason: string|null }>>}
 */
export async function sendTripNotification(whatsappClient, scholar, eventType, timestamp, guardians) {
  const messageText = buildMessageText(scholar, eventType, timestamp);
  const results = [];

  for (const guardian of guardians) {
    if (!isOptedIn(guardian)) {
      results.push({
        guardianId: guardian.id,
        sent: false,
        channel: null,
        reason: 'guardian has notifications turned off',
      });
      continue; // hard gate — no message sent, regardless of cost
    }

    const freeWindow = hasFreeSessionWindow(guardian);

    try {
      if (freeWindow) {
        await whatsappClient.sendSessionMessage(guardian.phone, messageText);
      } else {
        await whatsappClient.sendTemplateMessage(guardian.phone, 'trip_update', {
          scholarName: scholar.name,
          eventText: messageText,
        });
      }
      results.push({
        guardianId: guardian.id,
        sent: true,
        channel: freeWindow ? 'free_session' : 'paid_template',
        reason: null,
      });
    } catch (err) {
      // WhatsApp send failed — this is where an SMS backup send would
      // be triggered, per the existing SMS-fallback plan.
      results.push({
        guardianId: guardian.id,
        sent: false,
        channel: null,
        reason: `send failed: ${err.message}`,
      });
    }
  }

  return results;
}
