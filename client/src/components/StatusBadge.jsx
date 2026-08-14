const styles = {
    PENDING: 'bg-orange-50 text-orange-600 border border-orange-200',
    UNRESOLVED: 'bg-red-50 text-red-500 border border-red-200',
    RESOLVED: 'bg-green-50 text-green-600 border border-green-200'
  }
  
  const labels = {
    PENDING: 'Pending',
    UNRESOLVED: 'Unresolved',
    RESOLVED: 'Resolved'
  }
  
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  )
  
  export default StatusBadge