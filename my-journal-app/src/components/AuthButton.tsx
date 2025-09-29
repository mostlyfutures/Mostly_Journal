'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/lib/auth';
import { useUserStore } from '@/lib/store';
import { AuthProvider } from '@/lib/types';

interface AuthButtonProps {
  provider?: AuthProvider;
  className?: string;
}

export default function AuthButton({ provider = 'privy', className = '' }: AuthButtonProps) {
  const [currentProvider, setCurrentProvider] = useState<AuthProvider>(provider);
  const { setAddress } = useUserStore();

  // Privy hooks
  const { login: privyLogin, logout: privyLogout, user: privyUser, ready: privyReady } = usePrivy();

  // SIWE hooks
  const siweAuth = useAuth('siwe');

  // Determine current auth state
  const isConnected = currentProvider === 'privy' ? !!privyUser : siweAuth.isConnected;
  const userAddress = currentProvider === 'privy' 
    ? (privyUser?.wallet?.address as `0x${string}` | null)
    : siweAuth.address;
  const isLoading = currentProvider === 'privy' ? !privyReady : siweAuth.isLoading;

  // Update global state when address changes
  React.useEffect(() => {
    setAddress(userAddress);
  }, [userAddress, setAddress]);

  const handleConnect = async () => {
    try {
      if (currentProvider === 'privy') {
        await privyLogin();
      } else {
        await siweAuth.connectWallet();
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (currentProvider === 'privy') {
        await privyLogout();
      } else {
        await siweAuth.disconnect();
      }
      setAddress(null);
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  };

  const toggleProvider = () => {
    if (isConnected) {
      handleDisconnect();
    }
    setCurrentProvider(currentProvider === 'privy' ? 'siwe' : 'privy');
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Provider Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Auth:</span>
        <button
          onClick={toggleProvider}
          disabled={isConnected}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            isConnected
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {currentProvider === 'privy' ? 'Privy' : 'SIWE'}
        </button>
      </div>

      {/* Auth Button */}
      {isConnected ? (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Connected'}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {currentProvider === 'privy' ? 'Connect with Privy' : 'Connect Wallet'}
        </button>
      )}

      {/* Error Display */}
      {currentProvider === 'siwe' && siweAuth.error && (
        <div className="text-xs text-red-600 max-w-xs truncate">
          {siweAuth.error}
        </div>
      )}
    </div>
  );
}

// Add React import (should be at the top in a real file)
import React from 'react';
