const honeypot = (req, res, next) => {
    const trap = req.body?._trap
  
    if (trap && trap.length > 0) {
      // Silently reject — return 200 so bots think it worked
      return res.status(200).json({ success: true, message: 'Ticket submitted successfully.' })
    }
  
    next()
  }
  
  export default honeypot