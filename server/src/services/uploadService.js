import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadFile = async (fileBuffer, mimetype, ticketCode) => {
  const resourceType = mimetype === 'application/pdf' ? 'raw' : 'image'

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `dsca-tickets/${ticketCode}`,
        resource_type: resourceType,
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf']
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result.secure_url)
      }
    )
    uploadStream.end(fileBuffer)
  })
}

export default uploadFile