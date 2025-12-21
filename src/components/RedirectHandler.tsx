import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useRedirectsStore from '@/stores/useRedirectsStore'

export function RedirectHandler() {
  const location = useLocation()
  const navigate = useNavigate()
  const { redirects, fetchRedirects } = useRedirectsStore()

  // Initial fetch of redirects
  useEffect(() => {
    fetchRedirects()
  }, [fetchRedirects])

  // Check for redirects on location change
  useEffect(() => {
    if (redirects.length === 0) return

    const currentPath = location.pathname
    // Check exact match
    const match = redirects.find(
      (r) =>
        r.source_path === currentPath ||
        (r.source_path.endsWith('/')
          ? r.source_path.slice(0, -1) === currentPath
          : r.source_path === currentPath),
    )

    if (match) {
      console.log(`Redirecting from ${currentPath} to ${match.target_path}`)
      navigate(match.target_path, { replace: true })
    }
  }, [location.pathname, redirects, navigate])

  return null
}
