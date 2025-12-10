import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import contractData from "../contract-data.json";
import { DataService } from "../services/dataService";

declare global {
  interface Window {
    ethereum: any;
  }
}

interface Web3ContextType {
  account: string | null;
  contract: ethers.Contract | null;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | null;
  isAdmin: boolean;
  isOfficerManager: boolean;
  isOfficer: boolean;
  isJudge: boolean;
  isTreasury: boolean;
  dataService: DataService | null;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  contract: null,
  connectWallet: async () => {},
  isConnected: false,
  provider: null,
  isAdmin: false,
  isOfficerManager: false,
  isOfficer: false,
  isJudge: false,
  isTreasury: false,
  dataService: null,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode; useMockData: boolean }> = ({ children, useMockData }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [dataService, setDataService] = useState<DataService | null>(null);
  
  // Roles
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOfficerManager, setIsOfficerManager] = useState(false);
  const [isOfficer, setIsOfficer] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [isTreasury, setIsTreasury] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
        
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        
        // Connect to contract
        const trafficContract = new ethers.Contract(
          contractData.address,
          contractData.abi,
          signer
        );
        setContract(trafficContract);
        
        // Create data service
        const service = new DataService(useMockData, trafficContract);
        setDataService(service);
        
        // Check roles using AccessControl
        try {
          // Role hashes
          const ADMIN_ROLE = await trafficContract.ADMIN_ROLE();
          const OFFICER_MANAGER_ROLE = await trafficContract.OFFICER_MANAGER_ROLE();
          const OFFICER_ROLE = await trafficContract.OFFICER_ROLE();
          const JUDGE_ROLE = await trafficContract.JUDGE_ROLE();
          const TREASURY_ROLE = await trafficContract.TREASURY_ROLE();
          
          const [admin, manager, officer, judge, treasury] = await Promise.all([
            trafficContract.hasRole(ADMIN_ROLE, address),
            trafficContract.hasRole(OFFICER_MANAGER_ROLE, address),
            trafficContract.hasRole(OFFICER_ROLE, address),
            trafficContract.hasRole(JUDGE_ROLE, address),
            trafficContract.hasRole(TREASURY_ROLE, address)
          ]);
          
          setIsAdmin(admin);
          setIsOfficerManager(manager);
          setIsOfficer(officer);
          setIsJudge(judge);
          setIsTreasury(treasury);
          
          // In mock mode, set some default roles for testing
          if (useMockData) {
            // Make first account admin for testing
            const testAccounts = [
              '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Admin
              '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Officer
              '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Judge
            ];
            
            if (address.toLowerCase() === testAccounts[0].toLowerCase()) {
              setIsAdmin(true);
              setIsOfficerManager(true);
              setIsTreasury(true);
            } else if (address.toLowerCase() === testAccounts[1].toLowerCase()) {
              setIsOfficer(true);
            } else if (address.toLowerCase() === testAccounts[2].toLowerCase()) {
              setIsJudge(true);
            }
          }
          
        } catch (error) {
          console.error("Error checking roles:", error);
          
          // If contract not deployed, use mock roles in development
          if (useMockData) {
            setIsAdmin(true);
            setIsOfficerManager(true);
          }
        }
        
      } catch (error) {
        console.error("User denied account access", error);
      }
    } else {
      console.error("MetaMask not detected");
      alert("Please install MetaMask to use this application!");
    }
  };

  useEffect(() => {
    // Initialize or update data service based on mode
    const service = new DataService(useMockData, contract || null);
    setDataService(service);
    
    // In development mode, set default roles for testing even without wallet
    if (useMockData && !account) {
      setIsAdmin(true);
      setIsOfficerManager(true);
      setIsOfficer(true);
      setIsJudge(true);
      setIsTreasury(true);
    }
  }, [useMockData, contract, account]);

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          connectWallet();
        }
      }
    };
    
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setAccount(null);
          setContract(null);
          setIsAdmin(false);
          setIsOfficerManager(false);
          setIsOfficer(false);
          setIsJudge(false);
          setIsTreasury(false);
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        contract,
        connectWallet,
        isConnected: !!account,
        provider,
        isAdmin,
        isOfficerManager,
        isOfficer,
        isJudge,
        isTreasury,
        dataService
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
