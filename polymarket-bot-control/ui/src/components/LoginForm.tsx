'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import BrandLogo from './BrandLogo'

export default function LoginForm() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(formData.username, formData.password)
    } catch {
      setError('Invalid username or password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{backgroundColor: 'var(--background)'}}
    >
      <div 
        className="card-enhanced max-w-md w-full p-8 animate-fade-in"
        style={{maxWidth: '28rem'}}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div 
              className="p-4 rounded-2xl"
              style={{backgroundColor: 'var(--primary-light)'}}
            >
              <BrandLogo variant="icon" size="xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{color: 'var(--foreground)'}}>
            Welcome Back
          </h1>
          <p className="text-lg" style={{color: 'var(--foreground-muted)'}}>
            Sign in to your trading dashboard
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div 
              className="p-4 rounded-xl border animate-fade-in"
              style={{
                backgroundColor: 'var(--error-light)',
                borderColor: 'var(--error)',
                color: 'var(--error)'
              }}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-semibold mb-2"
                style={{color: 'var(--foreground)'}}
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="input-enhanced"
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold mb-2"
                style={{color: 'var(--foreground)'}}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-enhanced pr-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors rounded-lg"
                  style={{color: 'var(--foreground-muted)'}}
                  onMouseEnter={(e) => e.target.style.color = 'var(--foreground)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--foreground-muted)'}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary-enhanced w-full py-4 text-base font-semibold group"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="loading-spinner-enhanced" style={{width: '20px', height: '20px'}}></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign in to Dashboard</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              )}
            </button>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm" style={{color: 'var(--foreground-muted)'}}>
              Secure access to your trading operations
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
