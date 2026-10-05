import { config } from '../config/index.js';
import { normalizePhoneForWhatsApp } from './whatsappTemplates.js';

/**
 * Server-side WhatsApp delivery for one-time passcodes.
 *
 * The existing whatsappTemplates.ts only builds wa.me click-to-chat links for
 * sales staff, which cannot deliver a code automatically. OTP delivery goes
 * through the WhatsApp Cloud API using an approved AUTHENTICATION template.
 *
 * Never log the code, the access token, or the provider response body.
 */
export interface OtpSender {
  isConfigured(): boolean;
  sendOtp(phoneE164: string, code: string): Promise<void>;
}

export class OtpDeliveryError extends Error {
  constructor(message: string, public readonly providerStatus?: number) {
    super(message);
    this.name = 'OtpDeliveryError';
  }
}

const cloudApiSender: OtpSender = {
  isConfigured() {
    const { accessToken, phoneNumberId, otpTemplateName } = config.whatsapp;
    return Boolean(accessToken && phoneNumberId && otpTemplateName);
  },

  async sendOtp(phoneE164, code) {
    const wa = config.whatsapp;
    const components: any[] = [
      { type: 'body', parameters: [{ type: 'text', text: code }] },
    ];
    if (wa.otpTemplateHasCopyButton) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: code }],
      });
    }

    let res: Response;
    try {
      res = await fetch(`https://graph.facebook.com/${wa.apiVersion}/${wa.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${wa.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizePhoneForWhatsApp(phoneE164),
          type: 'template',
          template: {
            name: wa.otpTemplateName,
            language: { code: wa.otpTemplateLanguage },
            components,
          },
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (err: any) {
      throw new OtpDeliveryError(`WhatsApp API unreachable (${err?.name || 'Error'})`);
    }

    if (!res.ok) {
      // Only surface the provider's numeric error code — never the body.
      let providerCode: string | number = 'unknown';
      try {
        const body: any = await res.json();
        providerCode = body?.error?.code ?? 'unknown';
      } catch {
        // ignore
      }
      throw new OtpDeliveryError(`WhatsApp API rejected message (code ${providerCode})`, res.status);
    }
  },
};

/**
 * LOCAL DEVELOPMENT ONLY: print the code to the server console instead of sending
 * it. The code is still generated, hashed, stored, rate-limited and verified by
 * the normal OTP service — only delivery differs. Requires BOTH
 * NODE_ENV=development and DEV_AUTH_OTP_MODE=console, and is refused on Railway.
 */
export function isDevConsoleOtpEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const onRailway = Boolean(env.RAILWAY_ENVIRONMENT || env.RAILWAY_ENVIRONMENT_NAME || env.RAILWAY_PROJECT_ID);
  return env.NODE_ENV === 'development' && env.DEV_AUTH_OTP_MODE === 'console' && !onRailway;
}

const devConsoleSender: OtpSender = {
  isConfigured: () => true,
  async sendOtp(phoneE164, code) {
    console.log(`[DEV OTP] ${phoneE164} -> ${code}`);
  },
};

let overrideSender: OtpSender | null = null;

export function getOtpSender(): OtpSender {
  if (overrideSender) return overrideSender;
  return isDevConsoleOtpEnabled() ? devConsoleSender : cloudApiSender;
}

/** Test seam: swap the delivery provider (pass null to restore normal selection). */
export function setOtpSender(sender: OtpSender | null) {
  overrideSender = sender;
}
