const ALLOWED_DOMAINS = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || ['dscacontracting.com']
const LAPTOP_REGEX = new RegExp(process.env.LAPTOP_NUMBER_REGEX || '^DSCA-IT-L-[0-9]{3,4}$')

export const validateEmail = (email) => {
  if (!email) return 'Email is required.'
  const domain = email.split('@')[1]
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    return `Email must be from an allowed domain: ${ALLOWED_DOMAINS.join(', ')}`
  }
  return null
}

export const validateLaptopNumber = (laptopNumber) => {
  if (!laptopNumber) return null // optional
  if (!LAPTOP_REGEX.test(laptopNumber)) {
    return 'Invalid laptop number format. Expected: DSCA-IT-L-XXX'
  }
  return null
}

export const validateTicketFields = (body) => {
  const errors = {}

  if (!body.fullName?.trim()) errors.fullName = 'Full name is required.'
  
  const emailError = validateEmail(body.email)
  if (emailError) errors.email = emailError

  const laptopError = validateLaptopNumber(body.laptopNumber)
  if (laptopError) errors.laptopNumber = laptopError

  if (!body.siteName?.trim()) errors.siteName = 'Site name is required.'

  if (!body.issueType?.trim()) errors.issueType = 'Issue type is required.'

  if (body.issueType === 'Other' && !body.customIssue?.trim()) {
    errors.customIssue = 'Please describe your issue.'
  }

  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  if (!body.priority || !validPriorities.includes(body.priority)) {
    errors.priority = 'Valid priority is required: LOW, MEDIUM, HIGH, or CRITICAL.'
  }

  return Object.keys(errors).length > 0 ? errors : null
}

export const validatePasswordStrength = (password) => {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain at least one special character.'
  return null
}