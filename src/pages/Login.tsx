import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react'

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const submitTimeoutRef = useRef<number | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [error])

  const validateForm = useCallback(() => {
    const { email, password } = formData
    
    if (!email.trim()) {
      setError('Email is required')
      return false
    }
    
    if (!email.includes('@') || email.length < 5) {
      setError('Please enter a valid email address')
      return false
    }
    
    if (!password.trim()) {
      setError('Password is required')
      return false
    }
    
    if (password.length < 3) {
      setError('Password must be at least 3 characters long')
      return false
    }
    
    return true
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (loading) {
      return
    }
    
    // Clear previous messages
    setError('')
    setSuccess('')
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    // Clear any existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }
    
    // Set a maximum loading time
    submitTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setError('Login is taking longer than expected. Please try again.')
    }, 30000) // 30 second timeout

    try {
      await login(formData.email, formData.password)
      setSuccess('Login successful! Redirecting...')
      setRetryCount(0)
      // Navigate to dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      
      // Track retry attempts for network errors
      if (errorMessage.includes('Network error') || errorMessage.includes('Request timeout')) {
        setRetryCount(prev => prev + 1)
      } else {
        setRetryCount(0)
      }
    } finally {
      setLoading(false)
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [formData, loading, login, validateForm, error])

  // Cleanup timeout on unmount
  const handleCleanup = useCallback(() => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }
  }, [])

  // Auto-retry for network errors
  const handleRetry = useCallback(() => {
    if (retryCount > 0 && retryCount < 3) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }
  }, [retryCount, handleSubmit])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      handleCleanup()
    }
  }, [handleCleanup])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100" style={{ background: 'linear-gradient(to bottom right, rgba(26, 61, 158, 0.05), rgba(26, 61, 158, 0.1))' }}>
      <div className="max-w-xs w-full space-y-2 p-3">
        <div className="admin-card rounded shadow-2xl p-4 min-h-[300px] flex flex-col">
          <div className="text-center flex-shrink-0">
            {/* Logo */}
            <div className="mx-auto mb-1">
              <img 
                src="/motor.jpeg" 
                alt="MotorGas Logo" 
                className="h-20 w-auto mx-auto rounded shadow-lg"
              />
            </div>
          
          </div>
          
          <form className="mt-6 space-y-5 flex-1 flex flex-col justify-center" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded flex items-start space-x-1.5">
                <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-medium">{error}</p>
                  {retryCount > 0 && retryCount < 3 && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="text-[10px] text-red-600 underline hover:text-red-800 mt-0.5"
                    >
                      Retry connection ({retryCount}/3)
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 rounded flex items-center space-x-1.5">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <p className="text-[11px] font-medium">{success}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-[11px] font-medium text-gray-700 mb-0.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                  <Mail className="h-3 w-3 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={loading}
                  className={`admin-input w-full pl-6 pr-2 py-1.5 text-[11px] rounded focus:outline-none transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-[11px] font-medium text-gray-700 mb-0.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
                  <Lock className="h-3 w-3 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={loading}
                  className={`admin-input w-full pl-6 pr-2 py-1.5 text-[11px] rounded focus:outline-none transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || !formData.email.trim() || !formData.password.trim()}
              className="admin-button w-full py-2 px-2 rounded text-white text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#25be03] disabled:opacity-80 disabled:cursor-not-allowed transition-all duration-200 hover:enabled:shadow-lg mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
 
        </div>
      </div>
    </div>
  )
}

export default Login
