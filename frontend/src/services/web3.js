/**
 * Web3 Service
 * Handles MetaMask connection and Web3 provider setup
 * 
 * TODO: Implement MetaMask connection
 * - Check if MetaMask is installed
 * - Request account access
 * - Switch to localhost network if needed
 * - Handle network changes
 * - Handle account changes
 */

import { ethers } from 'ethers';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.isConnected = false;
  }

  /**
   * Check if MetaMask is installed
   * 
   * @returns {boolean} True if MetaMask is available
   * 
   * Checks if window.ethereum exists, which indicates MetaMask is installed.
   */
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  /**
   * Connect to MetaMask wallet
   * 
   * @returns {Promise<string>} Connected account address
   * 
   * Checks if MetaMask is installed, requests account access,
   * creates provider and signer, gets account address, stores state,
   * and returns the account address.
   */
  async connectWallet() {
    // Check if MetaMask is installed
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Create provider using ethers v6 BrowserProvider
      this.provider = new ethers.BrowserProvider(window.ethereum);

      // Get signer from provider
      this.signer = await this.provider.getSigner();

      // Get account address
      this.account = await this.signer.getAddress();
      this.isConnected = true;

      // Ensure we're on the correct network
      await this.switchToLocalhost();

      return this.account;
    } catch (error) {
      // Reset state on error
      this.provider = null;
      this.signer = null;
      this.account = null;
      this.isConnected = false;

      // Provide user-friendly error messages
      if (error.code === 4001) {
        throw new Error('Please connect to MetaMask.');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check MetaMask.');
      } else {
        throw new Error(error.message || 'Failed to connect to MetaMask');
      }
    }
  }

  /**
   * Disconnect wallet
   * 
   * Resets provider, signer, account to null and sets isConnected to false.
   * Note: MetaMask doesn't have a true disconnect, so we just reset our state.
   */
  disconnectWallet() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.isConnected = false;
  }

  /**
   * Get current connected account
   * 
   * @returns {string|null} Account address or null
   */
  getAccount() {
    return this.account;
  }

  /**
   * Check if wallet is connected
   * 
   * @returns {boolean} True if connected
   */
  getIsConnected() {
    return this.isConnected && this.account !== null;
  }

  /**
   * Check current connection status
   * Attempts to get accounts without requesting access
   * 
   * @returns {Promise<boolean>} True if already connected
   */
  async checkConnection() {
    if (!this.isMetaMaskInstalled()) {
      return false;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts && accounts.length > 0) {
        // Already connected
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.account = accounts[0];
        this.isConnected = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  /**
   * Get provider instance
   * 
   * @returns {ethers.Provider|null} Provider or null
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Get signer instance
   * 
   * @returns {ethers.Signer|null} Signer or null
   */
  getSigner() {
    return this.signer;
  }

  /**
   * Switch to localhost network
   * 
   * @returns {Promise<void>}
   * 
   * Checks if already on localhost (chainId 1337), and if not,
   * requests network switch or adds the network if it doesn't exist.
   */
  async switchToLocalhost() {
    if (!this.isMetaMaskInstalled()) {
      return;
    }

    const targetChainId = '0x539'; // 1337 in hex
    const targetChainIdDecimal = 1337;

    try {
      // Get current chain ID
      const currentChainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      // If already on correct network, return
      if (currentChainId === targetChainId || parseInt(currentChainId, 16) === targetChainIdDecimal) {
        return;
      }

      // Try to switch network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }]
        });
      } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetChainId,
              chainName: 'Hardhat Local',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:8545'],
              blockExplorerUrls: null
            }]
          });
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      // Don't throw - allow connection to continue even if network switch fails
      // User can manually switch network
    }
  }

  /**
   * Listen for account changes
   * 
   * @param {Function} callback - Callback function when account changes
   * 
   * Listens to window.ethereum.on('accountsChanged'), calls callback with new accounts,
   * and updates internal state. Returns cleanup function to remove listener.
   * 
   * @returns {Function} Cleanup function to remove listener
   */
  onAccountsChanged(callback) {
    if (!this.isMetaMaskInstalled()) {
      return () => {};
    }

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected
        this.disconnectWallet();
        callback(null);
      } else {
        // Account changed
        this.account = accounts[0];
        if (this.provider) {
          this.provider.getSigner().then(signer => {
            this.signer = signer;
            callback(accounts[0]);
          });
        } else {
          callback(accounts[0]);
        }
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Return cleanup function
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }

  /**
   * Listen for network changes
   * 
   * @param {Function} callback - Callback function when network changes
   * 
   * Listens to window.ethereum.on('chainChanged'), calls callback with new chainId.
   * Returns cleanup function to remove listener.
   * 
   * @returns {Function} Cleanup function to remove listener
   */
  onChainChanged(callback) {
    if (!this.isMetaMaskInstalled()) {
      return () => {};
    }

    const handleChainChanged = (chainId) => {
      // Reload page on network change (MetaMask recommendation)
      // Or update state if preferred
      callback(chainId);
      // Optionally reload page: window.location.reload();
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    // Return cleanup function
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }
}

export default new Web3Service();

