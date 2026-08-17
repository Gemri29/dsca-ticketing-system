const styles = {
  PENDING: 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30',
  UNRESOLVED: 'bg-red-50 text-red-500 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
  RESOLVED: 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30'
}

const labels = {
  PENDING: 'Pending',
  UNRESOLVED: 'Unresolved',
  RESOLVED: 'Resolved'
}

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'}`}>
    {labels[status] || status}
  </span>
)

export default StatusBadge