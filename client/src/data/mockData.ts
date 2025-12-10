export interface MockViolation {
  id: string;
  violationId: string;
  vehicleId: string;
  officerId: string;
  officerName: string;
  offenseCode: number;
  offenseName: string;
  evidenceHash: string;
  timestamp: number;
  fineAmount: string;
  status: 'Unpaid' | 'Paid' | 'Appealed' | 'Waived' | 'Rejected' | 'Refunded';
  driverId: string;
  location?: string;
}

export interface MockAppeal {
  id: string;
  violationId: string;
  vehicleId: string;
  appellant: string;
  appealReason: string;
  appealTime: number;
  resolved: boolean;
  approved: boolean;
  resolution: string;
  resolvedBy: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface MockOfficer {
  address: string;
  name: string;
  badgeNumber: string;
  isActive: boolean;
  registrationTime: number;
  violationsLogged: number;
}

export const MOCK_VIOLATIONS: MockViolation[] = [
  {
    id: '1',
    violationId: '0x1234567890abcdef',
    vehicleId: 'KAA 123A',
    officerId: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    officerName: 'Officer John Kamau',
    offenseCode: 14,
    offenseName: 'Using mobile phone while driving',
    evidenceHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    timestamp: Date.now() - 86400000,
    fineAmount: '2000',
    status: 'Unpaid',
    driverId: '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed',
    location: 'Uhuru Highway, Nairobi'
  },
  {
    id: '2',
    violationId: '0xabcdef1234567890',
    vehicleId: 'KBB 456B',
    officerId: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    officerName: 'Officer Jane Wanjiru',
    offenseCode: 3,
    offenseName: 'Speeding 11-15 kph over limit',
    evidenceHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    timestamp: Date.now() - 172800000,
    fineAmount: '3000',
    status: 'Paid',
    driverId: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
    location: 'Mombasa Road, Nairobi'
  },
  {
    id: '3',
    violationId: '0x9876543210fedcba',
    vehicleId: 'KCC 789C',
    officerId: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    officerName: 'Officer Peter Ochieng',
    offenseCode: 7,
    offenseName: 'Failure to obey traffic signs',
    evidenceHash: 'QmPXME1oRtoT627YKaDPDQ3PwA8tdP9rWuAAweLzqSwAWT',
    timestamp: Date.now() - 259200000,
    fineAmount: '3000',
    status: 'Appealed',
    driverId: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    location: 'Waiyaki Way, Westlands'
  },
  {
    id: '4',
    violationId: '0xfedcba9876543210',
    vehicleId: 'KDD 012D',
    officerId: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    officerName: 'Officer Mary Njoki',
    offenseCode: 5,
    offenseName: 'Failure to wear seatbelt',
    evidenceHash: 'QmNqz5JccrE5P1nAkoaSJj8DcZoMXLKJeyX9AqgBBuSWpe',
    timestamp: Date.now() - 345600000,
    fineAmount: '500',
    status: 'Waived',
    driverId: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
    location: 'Kenyatta Avenue, CBD'
  },
  {
    id: '5',
    violationId: '0x5432109876fedcba',
    vehicleId: 'KEE 345E',
    officerId: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    officerName: 'Officer James Mwangi',
    offenseCode: 11,
    offenseName: 'Driving without identification plates',
    evidenceHash: 'QmRhVjWerBUpEJj8DcZoMXLKJeyX9AqgBBuSWpe3kBCmZ',
    timestamp: Date.now() - 432000000,
    fineAmount: '10000',
    status: 'Rejected',
    driverId: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    location: 'Thika Road, Roysambu'
  }
];

export const MOCK_APPEALS: MockAppeal[] = [
  {
    id: '1',
    violationId: '0x9876543210fedcba',
    vehicleId: 'KCC 789C',
    appellant: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    appealReason: 'The traffic sign was obscured by overgrown vegetation, making it impossible to see.',
    appealTime: Date.now() - 86400000,
    resolved: false,
    approved: false,
    resolution: '',
    resolvedBy: '',
    status: 'Pending'
  },
  {
    id: '2',
    violationId: '0x5432109876fedcba',
    vehicleId: 'KEE 345E',
    appellant: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    appealReason: 'The plate was temporarily removed for cleaning and was in the vehicle at the time.',
    appealTime: Date.now() - 172800000,
    resolved: true,
    approved: false,
    resolution: 'Evidence shows the vehicle was on public road without plates. Appeal rejected.',
    resolvedBy: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
    status: 'Rejected'
  },
  {
    id: '3',
    violationId: '0xfedcba9876543210',
    vehicleId: 'KDD 012D',
    appellant: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
    appealReason: 'Medical emergency - rushing pregnant wife to hospital.',
    appealTime: Date.now() - 259200000,
    resolved: true,
    approved: true,
    resolution: 'Medical emergency verified. Fine waived.',
    resolvedBy: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
    status: 'Approved'
  }
];

export const MOCK_OFFICERS: MockOfficer[] = [
  {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    name: 'John Kamau',
    badgeNumber: 'NPS-001',
    isActive: true,
    registrationTime: Date.now() - 31536000000,
    violationsLogged: 156
  },
  {
    address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    name: 'Jane Wanjiru',
    badgeNumber: 'NPS-002',
    isActive: true,
    registrationTime: Date.now() - 15768000000,
    violationsLogged: 89
  },
  {
    address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
    name: 'Peter Ochieng',
    badgeNumber: 'NPS-003',
    isActive: false,
    registrationTime: Date.now() - 47304000000,
    violationsLogged: 234
  },
  {
    address: '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
    name: 'Mary Njoki',
    badgeNumber: 'NPS-004',
    isActive: true,
    registrationTime: Date.now() - 7884000000,
    violationsLogged: 42
  }
];

export const MOCK_STATISTICS = {
  totalViolations: 1284,
  totalFinesPaid: 4200000,
  totalFinesRefunded: 125000,
  pendingAppeals: 3,
  activeOfficers: 3,
  totalOfficers: 4,
  averageResolutionTime: 48,
  complianceRate: 67.5
};

export const OFFENSE_CODES = [
  { code: 1, name: 'Speeding 1-5 kph over limit (Warning)', fineKES: 0 },
  { code: 2, name: 'Speeding 6-10 kph over limit', fineKES: 500 },
  { code: 3, name: 'Speeding 11-15 kph over limit', fineKES: 3000 },
  { code: 4, name: 'Speeding 16-20 kph over limit', fineKES: 10000 },
  { code: 5, name: 'Failure to wear seatbelt', fineKES: 500 },
  { code: 6, name: 'Driving without valid license', fineKES: 3000 },
  { code: 7, name: 'Failure to obey traffic signs', fineKES: 3000 },
  { code: 8, name: 'Failure to stop when signaled by police', fineKES: 5000 },
  { code: 9, name: 'Causing obstruction with vehicle', fineKES: 10000 },
  { code: 10, name: 'Driving on pavement or pedestrian walkway', fineKES: 5000 },
  { code: 11, name: 'Driving without identification plates', fineKES: 10000 },
  { code: 12, name: 'Motorcycle carrying more than one pillion passenger', fineKES: 1000 },
  { code: 13, name: 'Touting', fineKES: 3000 },
  { code: 14, name: 'Using mobile phone while driving', fineKES: 2000 },
  { code: 15, name: 'Driving without valid inspection certificate', fineKES: 10000 }
];