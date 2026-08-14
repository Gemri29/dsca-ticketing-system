export const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }
  
  export const formatDateTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }
  
  export const formatTimeAgo = (dateStr) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
  
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }
  
  export const formatStatus = (status) => {
    const map = {
      PENDING: 'Pending',
      UNRESOLVED: 'Unresolved',
      RESOLVED: 'Resolved'
    }
    return map[status] || status
  }
  
  export const formatPriority = (priority) => {
    const map = {
      LOW: 'Low',
      MEDIUM: 'Medium',
      HIGH: 'High',
      CRITICAL: 'Critical'
    }
    return map[priority] || priority
  }
  
  export const isSLABreached = (createdAt, status, thresholdHours = 48) => {
    if (status === 'RESOLVED') return false
    const diffHours = (new Date() - new Date(createdAt)) / 3600000
    return diffHours > thresholdHours
  }