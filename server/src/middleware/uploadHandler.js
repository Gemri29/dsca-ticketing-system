import multer from 'multer'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'), false)
  }
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter
})

export default upload