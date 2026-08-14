const publicTicketShape = (ticket) => {
    return {
      ticketCode: ticket.ticketCode,
      status: ticket.status,
      issueType: ticket.issueType,
      customIssue: ticket.customIssue,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      assignedAdminFirstName: ticket.assignedUser
        ? ticket.assignedUser.name.split(' ')[0]
        : null,
      remark: ticket.status === 'RESOLVED' ? ticket.remark : null
    }
  }
  
  export default publicTicketShape