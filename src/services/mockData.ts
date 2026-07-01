export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ProductionRegistryEntry {
  id: string;
  region: string;
  project: string;
  version: string;
  updatedDate: string;
  remarks: string;
}

export interface DeliveryItem {
  id: string;
  jiraId: string;
  resource: string;
  status: 'Open' | 'In Progress' | 'UAT' | 'Ready for Live' | 'Completed' | 'On Hold';
  expectedDeliveryDate: string;
  liveDate?: string;
}

export interface LeaveEntry {
  id: string;
  resource: string;
  leaveType: 'Planned' | 'Emergency';
  startDate: string;
  endDate: string;
}

export interface DailyStatus {
  id: string;
  date: string;
  resource: string;
  focus: string;
  remarks?: string;
}

export interface AssetEntry {
  id: string;
  region: string;
  environment: 'Beta' | 'Live' | 'Meta' | 'Google';
  assetType: 'Main' | 'Utils' | 'MainDB' | 'Replication DB' | 'LogDB';
  ipAddress: string;
  remarks?: string;
}

// Local Storage backing key
const STORAGE_KEY = 'operations_portal_db';

interface DB {
  productionRegistry: ProductionRegistryEntry[];
  deliveryTracker: DeliveryItem[];
  leaveTracker: LeaveEntry[];
  dailyStatus: DailyStatus[];
  assetRegistry: AssetEntry[];
  users: User[];
  currentUser: User | null;
}

const initialDB: DB = {
  productionRegistry: [
    { id: '1', region: 'US-East', project: 'Billing Service', version: 'v2.4.1', updatedDate: '2026-06-15', remarks: 'Optimized performance' },
    { id: '2', region: 'EU-West', project: 'Billing Service', version: 'v2.4.0', updatedDate: '2026-06-14', remarks: 'Awaiting sync' },
    { id: '3', region: 'AP-South', project: 'Auth Provider', version: 'v1.1.2', updatedDate: '2026-06-17', remarks: 'Security patches' },
  ],
  deliveryTracker: [
    { id: '1', jiraId: 'OPS-101', resource: 'Alice Smith', status: 'In Progress', expectedDeliveryDate: '2026-06-20' },
    { id: '2', jiraId: 'OPS-102', resource: 'Bob Jones', status: 'UAT', expectedDeliveryDate: '2026-06-19' },
    { id: '3', jiraId: 'OPS-103', resource: 'Charlie Brown', status: 'Completed', expectedDeliveryDate: '2026-06-15', liveDate: '2026-06-16' },
    { id: '4', jiraId: 'OPS-104', resource: 'David Miller', status: 'Open', expectedDeliveryDate: '2026-06-25' },
  ],
  leaveTracker: [
    { id: '1', resource: 'Bob Jones', leaveType: 'Planned', startDate: '2026-06-22', endDate: '2026-06-24' },
    { id: '2', resource: 'Alice Smith', leaveType: 'Emergency', startDate: '2026-06-18', endDate: '2026-06-18' },
  ],
  dailyStatus: [
    { id: '1', date: '2026-06-18', resource: 'Alice Smith', focus: 'Working on OPS-101 billing updates', remarks: 'Emergency leave in the afternoon' },
    { id: '2', date: '2026-06-18', resource: 'Bob Jones', focus: 'UAT testing for OPS-102', remarks: '' },
    { id: '3', date: '2026-06-18', resource: 'David Miller', focus: 'Triage and bugs', remarks: '' },
  ],
  assetRegistry: [
    { id: '1', region: 'US-East', environment: 'Live', assetType: 'Main', ipAddress: '10.0.1.5', remarks: 'Primary web' },
    { id: '2', region: 'US-East', environment: 'Live', assetType: 'MainDB', ipAddress: '10.0.1.10', remarks: 'RDS Postgres' },
    { id: '3', region: 'EU-West', environment: 'Beta', assetType: 'Utils', ipAddress: '10.2.4.15', remarks: 'Cron runner' },
  ],
  users: [
    { id: '1', email: 'admin@ops.portal', name: 'Ops Admin' }
  ],
  currentUser: { id: '1', email: 'admin@ops.portal', name: 'Ops Admin' }
};

export function getDB(): DB {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
    return initialDB;
  }
  return JSON.parse(data);
}

export function saveDB(db: DB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
