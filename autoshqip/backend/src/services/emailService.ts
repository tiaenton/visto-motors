import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

const BASE = process.env.FRONTEND_URL || 'http://localhost:3000'

export async function sendVerificationEmail(email: string, name: string, token: string) {
  await transporter.sendMail({
    from: `AutoShqip <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verifiko emailin tënd — AutoShqip',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a56db">Mirë se vjen, ${name}!</h2>
        <p>Klikoni butonin më poshtë për të verifikuar emailin tuaj:</p>
        <a href="${BASE}/verify-email/${token}" style="display:inline-block;background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Verifiko Emailin
        </a>
        <p style="color:#666;margin-top:24px">Nëse nuk e krijuat këtë llogari, injoroni këtë email.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  await transporter.sendMail({
    from: `AutoShqip <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Rivendos fjalëkalimin — AutoShqip',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a56db">Rivendosja e fjalëkalimit</h2>
        <p>Keni kërkuar rivendosjen e fjalëkalimit për llogarinë tuaj, ${name}.</p>
        <a href="${BASE}/reset-password/${token}" style="display:inline-block;background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Rivendos Fjalëkalimin
        </a>
        <p style="color:#666;margin-top:24px">Ky link skadon pas 1 ore.</p>
      </div>
    `,
  })
}
