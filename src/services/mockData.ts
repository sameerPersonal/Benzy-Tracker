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
  taskName: string;
  resource: string;
  status: 'Open' | 'In Progress' | 'UAT' | 'Ready for Live' | 'Completed' | 'On Hold';
  liveUpdates?: Record<string, string[]>;
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

export const RESOURCE_OPTIONS = [
  'Sameer',
  'Thomas',
  'Nilha',
  'Sreeyuktha',
  'Sidharth',
  'Shehana Sherin'
];

const getOffsetDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Local Storage backing key
const STORAGE_KEY = 'operations_portal_db';

interface DB {
  productionRegistry: ProductionRegistryEntry[];
  deliveryTracker: DeliveryItem[];
  leaveTracker: LeaveEntry[];
  dailyStatus: DailyStatus[];
  users: User[];
  currentUser: User | null;
}

const initialDB: DB = {
  productionRegistry: [],
  deliveryTracker: [],
  leaveTracker: [],
  dailyStatus: [],
  users: [],
  currentUser: null
};

export function getDB(): DB {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
    return initialDB;
  }
  const db = JSON.parse(data);
  // Migrate old db if it contains Alice Smith
  if (db.dailyStatus && db.dailyStatus.some((s: any) => s.resource === 'Alice Smith')) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
    return initialDB;
  }
  return db;
}

export function saveDB(db: DB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
