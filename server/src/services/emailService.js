import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendConfirmationEmail = async ({ to, fullName, ticketCode, issueType, customIssue, priority, laptopNumber, desktopNumber, siteName }) => {
  const trackingUrl = `${process.env.FRONTEND_URL}/track?email=${encodeURIComponent(to)}&code=${ticketCode}`

  const assetRow = laptopNumber
    ? `<tr><td style="color:#888;padding:4px 0">Laptop</td><td style="font-weight:500">${laptopNumber}</td></tr>`
    : desktopNumber
    ? `<tr><td style="color:#888;padding:4px 0">Desktop</td><td style="font-weight:500">${desktopNumber}</td></tr>`
    : ''

  const issueDisplay = issueType === 'Other' && customIssue
    ? `Other — ${customIssue}`
    : issueType

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `[${ticketCode}] Your IT Support Ticket Has Been Received`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <div style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">DSCA IT Support</h1>
        </div>
        <div style="background:#f8faff;padding:32px;border:1px solid #e8eef8;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px">Hi <strong>${fullName}</strong>,</p>
          <p style="margin:0 0 24px;color:#555">Your IT support ticket has been received. Here are your details:</p>

          <div style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:20px;margin-bottom:24px">
            <div style="text-align:center;margin-bottom:16px">
              <span style="font-size:28px;font-weight:600;color:#2563eb">${ticketCode}</span>
              <p style="margin:4px 0 0;font-size:12px;color:#aaa">Your ticket code — save this!</p>
            </div>
            <hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0" />
            <table style="width:100%;font-size:13px">
              <tr><td style="color:#888;padding:4px 0">Issue</td><td style="font-weight:500">${issueDisplay}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Priority</td><td style="font-weight:500">${priority}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Site</td><td style="font-weight:500">${siteName}</td></tr>
              ${assetRow}
            </table>
          </div>

          <a href="${trackingUrl}" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:500;margin-bottom:16px">
            Track my ticket →
          </a>

          <p style="font-size:12px;color:#aaa;text-align:center">
            Or go to ${process.env.FRONTEND_URL}/track and enter:<br/>
            Email: ${to} · Code: ${ticketCode}
          </p>
        </div>
      </div>
    `
  })
}

export const sendStatusUpdateEmail = async ({ to, fullName, ticketCode, status, remark }) => {
  const trackingUrl = `${process.env.FRONTEND_URL}/track?email=${encodeURIComponent(to)}&code=${ticketCode}`

  const statusColors = {
    PENDING: '#ea580c',
    UNRESOLVED: '#ef4444',
    RESOLVED: '#16a34a'
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `[${ticketCode}] Your Ticket Status Has Been Updated`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <div style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">DSCA IT Support</h1>
        </div>
        <div style="background:#f8faff;padding:32px;border:1px solid #e8eef8;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px">Hi <strong>${fullName}</strong>,</p>
          <p style="margin:0 0 24px;color:#555">Your ticket <strong>${ticketCode}</strong> has been updated.</p>

          <div style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:0.05em">New status</p>
            <span style="display:inline-block;padding:6px 16px;border-radius:20px;background:${statusColors[status]}20;color:${statusColors[status]};font-weight:600;font-size:14px">
              ${status}
            </span>
            ${remark ? `
            <hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0"/>
            <p style="margin:0 0 6px;font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:0.05em">Remark from IT team</p>
            <p style="margin:0;font-size:13px;color:#1a1a1a">${remark}</p>
            ` : ''}
          </div>

          <a href="${trackingUrl}" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:500">
            View ticket status →
          </a>
        </div>
      </div>
    `
  })
}
export const sendTicketAssignedEmail = async ({ to, adminName, ticketCode, fullName, issueType, customIssue, priority, siteLocation, ticketId }) => {
  const ticketUrl = `${process.env.FRONTEND_URL}/admin/tickets/${ticketId}`
  const issueDisplay = issueType === 'Other' && customIssue ? `Other — ${customIssue}` : issueType

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `[${ticketCode}] New support ticket submitted — ${issueDisplay}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <div style="background:#2563eb;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">DSCA IT Support</h1>
        </div>
        <div style="background:#f8faff;padding:32px;border:1px solid #e8eef8;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px">Hi <strong>${adminName}</strong>,</p>
          <p style="margin:0 0 24px;color:#555">A new support ticket has been submitted and requires attention.</p>
          <div style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:20px;margin-bottom:24px">
            <div style="text-align:center;margin-bottom:16px">
              <span style="font-size:24px;font-weight:600;color:#2563eb">${ticketCode}</span>
            </div>
            <hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0" />
            <table style="width:100%;font-size:13px">
              <tr><td style="color:#888;padding:4px 0">Submitted by</td><td style="font-weight:500">${fullName}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Issue</td><td style="font-weight:500">${issueDisplay}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Priority</td><td style="font-weight:500">${priority}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Site</td><td style="font-weight:500">${siteLocation}</td></tr>
            </table>
          </div>
          <a href="${ticketUrl}" style="display:block;text-align:center;background:#2563eb;color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:500">
            View ticket →
          </a>
        </div>
      </div>
    `
  })
}

export const sendSLABreachEmail = async ({ to, adminName, ticketCode, fullName, issueType, customIssue, priority, siteLocation, hoursElapsed, ticketId }) => {
  const ticketUrl = `${process.env.FRONTEND_URL}/admin/tickets/${ticketId}`
  const issueDisplay = issueType === 'Other' && customIssue ? `Other — ${customIssue}` : issueType

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `⚠️ [${ticketCode}] SLA Breach — Immediate attention required`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <div style="background:#ef4444;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">⚠️ SLA Breach Alert</h1>
        </div>
        <div style="background:#fff8f8;padding:32px;border:1px solid #fecaca;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 16px">Hi <strong>${adminName}</strong>,</p>
          <p style="margin:0 0 24px;color:#555">
            A ticket has exceeded the <strong>48-hour SLA threshold</strong> 
            and has been open for <strong>${hoursElapsed} hours</strong> without resolution.
          </p>
          <div style="background:#fff;border:1px solid #fecaca;border-radius:8px;padding:20px;margin-bottom:24px">
            <div style="text-align:center;margin-bottom:16px">
              <span style="font-size:24px;font-weight:600;color:#ef4444">${ticketCode}</span>
              <p style="margin:4px 0 0;font-size:12px;color:#ef4444">${hoursElapsed} hours overdue</p>
            </div>
            <hr style="border:none;border-top:1px solid #fee2e2;margin:16px 0" />
            <table style="width:100%;font-size:13px">
              <tr><td style="color:#888;padding:4px 0">Submitted by</td><td style="font-weight:500">${fullName}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Issue</td><td style="font-weight:500">${issueDisplay}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Priority</td><td style="font-weight:500">${priority}</td></tr>
              <tr><td style="color:#888;padding:4px 0">Site</td><td style="font-weight:500">${siteLocation}</td></tr>
            </table>
          </div>
          <a href="${ticketUrl}" style="display:block;text-align:center;background:#ef4444;color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:500">
            Resolve ticket now →
          </a>
        </div>
      </div>
    `
  })
}