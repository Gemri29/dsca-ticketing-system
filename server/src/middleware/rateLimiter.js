import rateLimit from 'express-rate-limit'

export const submitLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_SUBMIT_MAX) || 5,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  message: { success: false, message: 'Too many login attempts. Please try again in 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

export const trackLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_TRACK_MAX) || 20,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})