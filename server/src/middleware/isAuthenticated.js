import jwt from 'jsonwebtoken'

const isAuthenticated = (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
  }
}

export default isAuthenticated