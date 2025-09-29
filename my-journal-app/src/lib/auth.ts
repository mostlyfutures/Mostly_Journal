import { useState, useMemo } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { SiweMessage } from 'siwe';
import { createWalletClient, custom, getAddress } from 'viem';
import { polygon } from 'viem/chains';
import { AuthProvider, AuthState } from './types';
import { createUserTables } from './tableland';

// Privy configuration
export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  config: {
    loginMethods: ['wallet', 'email'],
    appearance: {
      theme: 'light',
      accentColor: '#676FFF',
    },
  },
};

// SIWE authentication utilities
export class SIWEAuth {
  private walletClient: any;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.walletClient = createWalletClient({
        chain: polygon,
        transport: custom(window.ethereum),
      });
    }
  }

  async connect(): Promise<`0x${string}` | null> {
    try {
      if (!this.walletClient) {
        throw new Error('No wallet detected');
      }

      // Request account access
      const accounts = await this.walletClient.requestAddresses();
      if (!accounts.length) {
        throw new Error('No accounts found');
      }

      return getAddress(accounts[0]) as `0x${string}`;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }

  async signIn(address: `0x${string}`): Promise<string | null> {
    try {
      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Decentralized Journal',
        uri: window.location.origin,
        version: '1',
        chainId: 137, // Polygon mainnet
        nonce: this.generateNonce(),
      });

      const messageString = message.prepareMessage();

      // Sign the message
      const signature = await this.walletClient.signMessage({
        account: address,
        message: messageString,
      });

      // Verify the signature
      const verification = await message.verify({ signature });
      
      if (verification.success) {
        // Initialize user tables if first time
        try {
          await createUserTables(address);
        } catch (error) {
          // Tables might already exist, which is fine
          console.log('Tables already exist or error creating:', error);
        }
        
        return signature;
      } else {
        throw new Error('Signature verification failed');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      return null;
    }
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  async disconnect(): Promise<void> {
    // For SIWE, we just clear local state
    // The wallet connection persists until user manually disconnects
  }
}

// Unified auth hook that can switch between Privy and SIWE
export const useAuth = (provider: AuthProvider = 'privy') => {
  const [authState, setAuthState] = useState<AuthState>({
    isConnected: false,
    address: null,
    isLoading: false,
    error: null,
  });

  const siweAuth = useMemo(() => new SIWEAuth(), []);

  const connectWallet = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (provider === 'siwe') {
        const address = await siweAuth.connect();
        if (address) {
          const signature = await siweAuth.signIn(address);
          if (signature) {
            setAuthState({
              isConnected: true,
              address,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Failed to sign message');
          }
        } else {
          throw new Error('Failed to connect wallet');
        }
      }
      // Privy connection will be handled by Privy hooks in components
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
    }
  };

  const disconnect = async () => {
    try {
      if (provider === 'siwe') {
        await siweAuth.disconnect();
      }
      // Privy disconnection handled by Privy hooks
      
      setAuthState({
        isConnected: false,
        address: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  return {
    ...authState,
    connectWallet,
    disconnect,
  };
};
