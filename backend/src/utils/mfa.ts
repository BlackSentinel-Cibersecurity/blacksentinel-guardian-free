import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { config } from '../config/index.js'

export interface MfaSetupResult {
  secret: string
  otpauthUrl: string
  qrCodeDataUrl: string
}

export function generateMfaSecret(email: string): MfaSetupResult {
  const secret = speakeasy.generateSecret({
    name: `${config.mfaIssuer} (${email})`,
    issuer: config.mfaIssuer,
    length: 20,
  })

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url!,
    qrCodeDataUrl: '',
  }
}

export async function generateQrCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl)
}

export function verifyMfaToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  })
}

export function generateMfaToken(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  })
}
