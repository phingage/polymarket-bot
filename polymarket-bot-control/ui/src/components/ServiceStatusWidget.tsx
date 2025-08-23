'use client';

import { useState, useEffect } from 'react';

interface ServiceStatus {
  success: boolean;
  service: string;
  status: string;
  lastCheck: number;
}

export default function ServiceStatusWidget() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/services/polymarket-mm/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    if (restarting) return;

    setRestarting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/services/polymarket-mm/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to restart service');
      }

      const data = await response.json();
      if (data.success) {
        // Update status to show restart was initiated
        setStatus(prev => prev ? { ...prev, status: 'restarting' } : null);
        
        // Fetch updated status after a delay
        setTimeout(fetchStatus, 2000);
      } else {
        throw new Error(data.message || 'Restart failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restart failed');
    } finally {
      setRestarting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600';
      case 'restarting':
        return 'text-yellow-600';
      case 'stopped':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return '🟢';
      case 'restarting':
        return '🟡';
      case 'stopped':
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--foreground)'}}>Polymarket MM Service</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-enhanced p-6">
      <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--foreground)'}}>Polymarket MM Service</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {status && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{getStatusIcon(status.status)}</span>
              <span className="font-medium">Status:</span>
              <span className={`font-semibold capitalize ${getStatusColor(status.status)}`}>
                {status.status}
              </span>
            </div>
            <button
              onClick={handleRestart}
              disabled={restarting || status.status === 'restarting'}
              className={`btn-primary ${
                restarting || status.status === 'restarting'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {restarting ? 'Restarting...' : 'Restart Service'}
            </button>
          </div>

          <div className="text-sm" style={{color: 'var(--foreground-muted)'}}>
            <p>Service: {status.service}</p>
            <p>Last Check: {new Date(status.lastCheck).toLocaleString()}</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={fetchStatus}
              className="btn-secondary text-sm"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}