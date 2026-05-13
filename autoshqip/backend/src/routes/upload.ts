import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { authenticate } from '../middleware/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuid } from 'uuid'
import path from 'path'
import fs from 'fs'
import { AppError } from '../utils/AppError'

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
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  },
})

async function moderateImage(buffer: Buffer): Promise<void> {
  let meta: sharp.Metadata
  try {
    meta = await sharp(buffer).metadata()
  } catch {
    throw new AppError('Skedari nuk është imazh i vlefshëm', 400)
  }

  const { width = 0, height = 0 } = meta
  if (width < 100 || height < 100) {
    throw new AppError(`Imazhi është shumë i vogël (${width}x${height}). Minimumi: 100x100px`, 400)
  }
  if (width > 8000 || height > 8000) {
    throw new AppError('Imazhi është shumë i madh. Maksimumi: 8000x8000px', 400)
  }
}

uploadRouter.post('/images', upload.array('images', 10), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files?.length) return res.status(400).json({ error: 'Nuk u ngarkua asnjë foto' })

    // Moderate every image before storing
    await Promise.all(files.map((f) => moderateImage(f.buffer)))

    let urls: string[]

    if (R2_CONFIGURED && s3) {
      urls = await Promise.all(
        files.map(async (file) => {
          const ext = path.extname(file.originalname).toLowerCase()
          const key = `listings/${uuid()}${ext}`
          // Convert to webp for storage efficiency when using R2
          const optimised = await sharp(file.buffer).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
          await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key.replace(ext, '.webp'),
            Body: optimised,
            ContentType: 'image/webp',
          }))
          return `${process.env.R2_PUBLIC_URL}/${key.replace(ext, '.webp')}`
        })
      )
    } else {
      // Local dev: save validated images to disk
      urls = await Promise.all(
        files.map(async (file) => {
          const filename = `${uuid()}${path.extname(file.originalname).toLowerCase()}`
          const dest = path.join(LOCAL_UPLOADS_DIR, filename)
          await sharp(file.buffer).resize({ width: 1600, withoutEnlargement: true }).toFile(dest)
          const base = process.env.LOCAL_UPLOADS_URL || `http://localhost:${process.env.PORT || 4000}`
          return `${base}/uploads/${filename}`
        })
      )
    }

    res.json({ urls })
  } catch (err) {
    next(err)
  }
})
