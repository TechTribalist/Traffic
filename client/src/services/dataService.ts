import { ethers } from 'ethers';
import { 
  MOCK_VIOLATIONS, 
  MOCK_APPEALS, 
  MOCK_OFFICERS, 
  MOCK_STATISTICS,
  OFFENSE_CODES,
  MockViolation,
  MockAppeal,
  MockOfficer
} from '../data/mockData';

export class DataService {
  private useMockData: boolean;
  private contract: ethers.Contract | null;

  constructor(useMockData: boolean, contract?: ethers.Contract) {
    this.useMockData = useMockData;
    this.contract = contract || null;
  }

  // Violations
  async getViolations(filters?: { 
    vehicleId?: string; 
    status?: string; 
    officerId?: string;
    driverId?: string;
  }): Promise<MockViolation[]> {
    if (this.useMockData) {
      let violations = [...MOCK_VIOLATIONS];
      
      if (filters?.vehicleId) {
        violations = violations.filter(v => 
          v.vehicleId.toLowerCase().includes(filters.vehicleId!.toLowerCase())
        );
      }
      if (filters?.status) {
        violations = violations.filter(v => v.status === filters.status);
      }
      if (filters?.officerId) {
        violations = violations.filter(v => v.officerId === filters.officerId);
      }
      if (filters?.driverId) {
        violations = violations.filter(v => v.driverId === filters.driverId);
      }
      
      return violations;
    }

    // Live contract implementation
    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      // This would need to be implemented based on contract events or a backend indexer
      // For now, return empty array
      console.log('Fetching violations from contract...');
      return [];
    } catch (error) {
      console.error('Error fetching violations:', error);
      throw error;
    }
  }

  async getViolationById(violationId: string): Promise<MockViolation | null> {
    if (this.useMockData) {
      return MOCK_VIOLATIONS.find(v => v.violationId === violationId) || null;
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      const violation = await this.contract.getViolation(violationId);
      // Transform contract data to MockViolation format
      return {
        id: violationId,
        violationId: violation.violationId,
        vehicleId: violation.vehicleId,
        officerId: violation.officerId,
        officerName: 'Officer', // Would need to fetch from officers mapping
        offenseCode: violation.offenseCode,
        offenseName: OFFENSE_CODES.find(o => o.code === violation.offenseCode)?.name || 'Unknown',
        evidenceHash: violation.evidenceHash,
        timestamp: violation.timestamp.toNumber() * 1000,
        fineAmount: ethers.utils.formatEther(violation.fineAmount),
        status: violation.status,
        driverId: violation.driverId,
      };
    } catch (error) {
      console.error('Error fetching violation:', error);
      return null;
    }
  }

  // Appeals
  async getAppeals(filters?: { 
    status?: string; 
    violationId?: string;
    appellant?: string;
  }): Promise<MockAppeal[]> {
    if (this.useMockData) {
      let appeals = [...MOCK_APPEALS];
      
      if (filters?.status) {
        appeals = appeals.filter(a => a.status === filters.status);
      }
      if (filters?.violationId) {
        appeals = appeals.filter(a => a.violationId === filters.violationId);
      }
      if (filters?.appellant) {
        appeals = appeals.filter(a => a.appellant === filters.appellant);
      }
      
      return appeals;
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      // Would need to implement based on contract events
      console.log('Fetching appeals from contract...');
      return [];
    } catch (error) {
      console.error('Error fetching appeals:', error);
      throw error;
    }
  }

  // Officers
  async getOfficers(activeOnly: boolean = false): Promise<MockOfficer[]> {
    if (this.useMockData) {
      if (activeOnly) {
        return MOCK_OFFICERS.filter(o => o.isActive);
      }
      return [...MOCK_OFFICERS];
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      // Would need to implement based on contract events
      console.log('Fetching officers from contract...');
      return [];
    } catch (error) {
      console.error('Error fetching officers:', error);
      throw error;
    }
  }

  // Statistics
  async getStatistics(): Promise<typeof MOCK_STATISTICS> {
    if (this.useMockData) {
      return { ...MOCK_STATISTICS };
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      const [totalViolations, totalFinesPaid, totalFinesRefunded] = await Promise.all([
        this.contract.totalViolations(),
        this.contract.totalFinesPaid(),
        this.contract.totalFinesRefunded()
      ]);

      return {
        totalViolations: totalViolations.toNumber(),
        totalFinesPaid: parseFloat(ethers.utils.formatEther(totalFinesPaid)),
        totalFinesRefunded: parseFloat(ethers.utils.formatEther(totalFinesRefunded)),
        pendingAppeals: 0, // Would need to calculate from events
        activeOfficers: 0, // Would need to calculate from events
        totalOfficers: 0, // Would need to calculate from events
        averageResolutionTime: 0, // Would need to calculate from events
        complianceRate: 0 // Would need to calculate
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Return mock data as fallback
      return { ...MOCK_STATISTICS };
    }
  }

  // Actions (these would only work with live contract)
  async payFine(violationId: string, amount: string): Promise<ethers.ContractTransaction | null> {
    if (this.useMockData) {
      console.log('Mock mode: Simulating fine payment for', violationId);
      // Update local mock data
      const violation = MOCK_VIOLATIONS.find(v => v.violationId === violationId);
      if (violation) {
        violation.status = 'Paid';
      }
      return null;
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      return await this.contract.payFine(violationId, {
        value: ethers.utils.parseEther(amount)
      });
    } catch (error) {
      console.error('Error paying fine:', error);
      throw error;
    }
  }

  async submitAppeal(violationId: string, reason: string): Promise<ethers.ContractTransaction | null> {
    if (this.useMockData) {
      console.log('Mock mode: Simulating appeal submission for', violationId);
      // Update local mock data
      const violation = MOCK_VIOLATIONS.find(v => v.violationId === violationId);
      if (violation) {
        violation.status = 'Appealed';
      }
      return null;
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      return await this.contract.submitAppeal(violationId, reason);
    } catch (error) {
      console.error('Error submitting appeal:', error);
      throw error;
    }
  }

  async logViolation(
    vehicleId: string,
    offenseCode: number,
    evidenceHash: string,
    driverId: string
  ): Promise<string | null> {
    if (this.useMockData) {
      console.log('Mock mode: Simulating violation logging');
      const mockId = '0x' + Math.random().toString(16).substr(2, 16);
      
      const newViolation: MockViolation = {
        id: (MOCK_VIOLATIONS.length + 1).toString(),
        violationId: mockId,
        vehicleId,
        officerId: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        officerName: 'Current Officer',
        offenseCode,
        offenseName: OFFENSE_CODES.find(o => o.code === offenseCode)?.name || 'Unknown',
        evidenceHash,
        timestamp: Date.now(),
        fineAmount: OFFENSE_CODES.find(o => o.code === offenseCode)?.fineKES.toString() || '0',
        status: 'Unpaid',
        driverId,
        location: 'Mock Location'
      };
      
      MOCK_VIOLATIONS.unshift(newViolation);
      return mockId;
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      const tx = await this.contract.logViolation(vehicleId, offenseCode, evidenceHash, driverId);
      const receipt = await tx.wait();
      
      // Extract violation ID from events
      const event = receipt.events?.find((e: any) => e.event === 'ViolationLogged');
      return event?.args?.violationId || null;
    } catch (error) {
      console.error('Error logging violation:', error);
      throw error;
    }
  }

  async resolveAppeal(
    violationId: string,
    approve: boolean,
    resolution: string
  ): Promise<ethers.ContractTransaction | null> {
    if (this.useMockData) {
      console.log('Mock mode: Simulating appeal resolution for', violationId);
      const appeal = MOCK_APPEALS.find(a => a.violationId === violationId);
      if (appeal) {
        appeal.resolved = true;
        appeal.approved = approve;
        appeal.resolution = resolution;
        appeal.status = approve ? 'Approved' : 'Rejected';
      }
      
      const violation = MOCK_VIOLATIONS.find(v => v.violationId === violationId);
      if (violation) {
        violation.status = approve ? 'Waived' : 'Rejected';
      }
      return null;
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      return await this.contract.resolveAppeal(violationId, approve, resolution);
    } catch (error) {
      console.error('Error resolving appeal:', error);
      throw error;
    }
  }

  // Officer Management
  async registerOfficer(
    officerAddress: string,
    name: string,
    badgeNumber: string
  ): Promise<ethers.ContractTransaction | null> {
    if (this.useMockData) {
      console.log('Mock mode: Simulating officer registration');
      const newOfficer: MockOfficer = {
        address: officerAddress,
        name,
        badgeNumber,
        isActive: true,
        registrationTime: Date.now(),
        violationsLogged: 0
      };
      MOCK_OFFICERS.push(newOfficer);
      return null;
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      return await this.contract.registerOfficer(officerAddress, name, badgeNumber);
    } catch (error) {
      console.error('Error registering officer:', error);
      throw error;
    }
  }

  async deactivateOfficer(officerAddress: string): Promise<ethers.ContractTransaction | null> {
    if (this.useMockData) {
      console.log('Mock mode: Simulating officer deactivation');
      const officer = MOCK_OFFICERS.find(o => o.address === officerAddress);
      if (officer) {
        officer.isActive = false;
      }
      return null;
    }

    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      return await this.contract.deactivateOfficer(officerAddress);
    } catch (error) {
      console.error('Error deactivating officer:', error);
      throw error;
    }
  }
}