import prisma from '../utils/prismaClient.js'



const generateTicketCode = async () => {
  let code
  let exists = true

  while (exists) {
    const number = Math.floor(1000 + Math.random() * 9000)
    code = `TKT-${number}`
    const found = await prisma.ticket.findUnique({
      where: { ticketCode: code }
    })
    exists = !!found
  }

  return code
}

export default generateTicketCode