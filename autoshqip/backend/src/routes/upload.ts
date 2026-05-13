import { Router } from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuid } from 'uuid'
import path from 'path'
import fs from 'fs'

export const uploadRouter = Router()
uploadRouter.use(authenticate)

const R2_CONFIGURED =
  process.env.R2_ACCOUNT_ID &&
  !process.env.R2_ACCOUNT_ID.includes('your_') &&
  process.env.R2_ACCESS_KEY_ID &&
  !process.env.R2_ACCESS_KEY_ID.includes('your_')

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads')
if (!R2_CONFIGURED && !fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true })
}

const s3 = R2_CONFIGURED
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

const upload = multer({
  storage: R2_CONFIGURED
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: LOCAL_UPLOADS_DIR,
        filename: (_, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
      }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
})

uploadRouter.post('/images', upload.array('images', 10), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files?.length) return res.status(400).json({ error: 'Nuk u ngarkua asnjë foto' })

    let urls: string[]

    if (R2_CONFIGURED && s3) {
      urls = await Promise.all(
        files.map(async (file) => {
          const key = `listings/${uuid()}${path.extname(file.originalname)}`
          await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }))
          return `${process.env.R2_PUBLIC_URL}/${key}`
        })
      )
    } else {
      const base = process.env.LOCAL_UPLOADS_URL || `http://localhost:${process.env.PORT || 4000}`
      urls = files.map((file) => `${base}/uploads/${file.filename}`)
    }

    res.json({ urls })
  } catch (err) {
    next(err)
  }
})
