import { useEffect, useState, useCallback } from 'react'
import { FarmerAPI } from '../lib/services'
import { extractError } from '../lib/api'
import { useAuth } from '../context/AuthContext'

// The backend only exposes GET /farmers (all) and GET /farmers/{id} (internal id) —
// there is no "get my own profile by farmer code" endpoint. A logged-in farmer's JWT
// carries their farmerCode as the subject, so we resolve their record client-side by
// scanning the list once, then fetch the full nested detail by internal id.
export function useMyFarmer() {
  const { username } = useAuth() // farmerCode, since farmer-login stores it as the username
  const [farmer, setFarmer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: all } = await FarmerAPI.list()
      const match = all.find((f) => f.farmerCode === username)
      if (!match) {
        setError('Could not find your farmer profile. Please contact the factory office.')
        setFarmer(null)
        return
      }
      const { data: detail } = await FarmerAPI.get(match.id)
      setFarmer(detail)
    } catch (err) {
      setError(extractError(err, 'Could not load your profile.'))
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    load()
  }, [load])

  return { farmer, loading, error, reload: load }
}
