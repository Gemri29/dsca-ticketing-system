import { useEffect } from 'react'

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} — DSCA IT Support` : 'DSCA IT Support'
  }, [title])
}

export default usePageTitle