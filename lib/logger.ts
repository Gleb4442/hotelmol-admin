import { CONFIG } from '../constants';

const SECRETS = [CONFIG.DATABASE_URL, CONFIG.N8N_WEBHOOK_SECRET];

// Securely removes secrets from log strings/objects
const scrub = (msg: any): any => {
  if (typeof msg === 'string') {
    let scrubbed = msg;
    SECRETS.forEach(secret => {
      if (secret && secret.length > 5) { // Prevent scrubbing empty/short strings accidentally
         scrubbed = scrubbed.replace(new RegExp(secret, 'g'), '[REDACTED]');
      }
    });
    return scrubbed;
  }
  if (typeof msg === 'object' && msg !== null) {
    // Basic shallow copy and scrub for demo purposes
    // In prod, use a dedicated library like 'pino' with redaction
    try {
        const copy = JSON.parse(JSON.stringify(msg));
        for (const key in copy) {
            if (typeof copy[key] === 'string') {
                copy[key] = scrub(copy[key]);
            }
        }
        return copy;
    } catch {
        return msg;
    }
  }
  return msg;
};

export const Logger = {
  info: (msg: string, data?: any) => {
    // In production, this would ship to Datadog/Sentry
    console.log(`[INFO] ${msg}`, data ? scrub(data) : '');
  },
  error: (msg: string, err?: any) => {
    console.error(`[ERROR] ${msg}`, err ? scrub(err) : '');
  },
  warn: (msg: string, data?: any) => {
    console.warn(`[WARN] ${msg}`, data ? scrub(data) : '');
  },
};