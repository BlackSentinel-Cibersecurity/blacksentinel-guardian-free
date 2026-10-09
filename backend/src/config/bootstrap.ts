import { randomBytes } from 'crypto'

const configured = process.env.ADMIN_PASSWORD?.trim()

/**
 * One-time setup sign-in, valid only while no user exists.
 * SECURITY FIX: the password used to be the published 'Guardian$etup2024!'.
 * It is now ADMIN_PASSWORD (12+ characters) or a random one printed once in
 * the API log on start.
 */
export const BOOTSTRAP_CREDENTIALS = {
  email: 'setup@blacksentinel.io',
  password: configured && configured.length >= 12 ? configured : randomBytes(12).toString('base64url'),
  fromEnv: !!configured && configured.length >= 12,
  name: 'System Setup',
  role: 'SUPER_ADMIN',
}

export const BOOTSTRAP_CONFIG = {
  enabled: false,
  checkedAt: null as Date | null,
}
