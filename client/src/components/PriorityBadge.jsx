const styles = {
    LOW: 'bg-gray-50 text-gray-500 border border-gray-200',
    MEDIUM: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
    HIGH: 'bg-orange-50 text-orange-600 border border-orange-200',
    CRITICAL: 'bg-red-50 text-red-500 border border-red-200'
  }
  
  const labels = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical'
  }
  
  const PriorityBadge = ({ priority }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority] || 'bg-gray-100 text-gray-500'}`}>
      {labels[priority] || priority}
    </span>
  )
  
  export default PriorityBadge