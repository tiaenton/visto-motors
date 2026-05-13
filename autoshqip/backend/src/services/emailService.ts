import sgMail from '@sendgrid/mail'
import nodemailer from 'nodemailer'
import { logger } from '../utils/logger'

const BASE = process.env.FRONTEND_URL || 'http://localhost:3000'
const FROM = process.env.EMAIL_FROM || 'noreply@autoshqip.al'

const USE_SENDGRID = !!process.env.SENDGRID_API_KEY

if (USE_SENDGRID) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
  logger.info('Email: SendGrid configured')
} else {
  logger.info('Email: SMTP fallback (dev mode)')
}

const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

async function send(to: string, subject: string, html: string) {
  if (USE_SENDGRID) {
    await sgMail.send({ to, from: FROM, subject, html })
  } else {
    await smtpTransport.sendMail({ from: `AutoShqip <${FROM}>`, to, subject, html })
  }
}

function emailLayout(content: string) {
  return `
    <!DOCTYPE html>
    <html lang="sq">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
        <tr><td align="center">
          <table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
            <tr><td style="background:#1a56db;padding:24px 32px">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">AutoShqip</h1>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:14px">Platforma nr.1 për makinat në Shqipëri</p>
            </td></tr>
            <tr><td style="padding:32px">${content}</td></tr>
            <tr><td style="background:#f1f5f9;padding:20px 32px;text-align:center">
              <p style="margin:0;color:#94a3b8;font-size:12px">© 2026 AutoShqip · <a href="${BASE}" style="color:#64748b">autoshqip.al</a></p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>
  `
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const html = emailLayout(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px">Mirë se vjen, ${name}!</h2>
    <p style="color:#475569;line-height:1.6">Llogaria jote u krijua me sukses. Kliko butonin më poshtë për të verifikuar emailin tënd dhe aktivizuar llogarinë:</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${BASE}/verify-email/${token}"
        style="display:inline-block;background:#1a56db;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
        Verifiko Emailin
      </a>
    </div>
    <p style="color:#94a3b8;font-size:13px">Ky link skadon pas 24 orësh. Nëse nuk e krijuat këtë llogari, injoroni këtë email.</p>
  `)
  await send(email, 'Verifiko emailin tënd — AutoShqip', html)
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const html = emailLayout(`
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px">Rivendosja e Fjalëkalimit</h2>
    <p style="color:#475569;line-height:1.6">Përshëndetje, <strong>${name}</strong>. Kemi marrë një kërkesë për rivendosjen e fjalëkalimit tuaj.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${BASE}/reset-password/${token}"
        style="display:inline-block;background:#1a56db;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
        Rivendos Fjalëkalimin
      </a>
    </div>
    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-top:8px">
      <p style="margin:0;color:#92400e;font-size:13px">⚠️ Ky link skadon pas <strong>1 ore</strong>. Nëse nuk e kërkuat këtë, ndryshoni fjalëkalimin tuaj menjëherë.</p>
    </div>
  `)
  await send(email, 'Rivendos fjalëkalimin — AutoShqip', html)
}
