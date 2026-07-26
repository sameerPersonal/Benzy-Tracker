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
  users: [
    { id: 'sameer', email: 'sameer@opsportal.com', name: 'Sameer' }
  ],
  currentUser: { id: 'sameer', email: 'sameer@opsportal.com', name: 'Sameer' }
};

export function getDB(): DB {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
    return initialDB;
  }
  try {
    const db = JSON.parse(data);
    let updated = false;

    // Filter out dummy test items if any exist
    if (db.productionRegistry && db.productionRegistry.some((p: any) => p.id === 'p1' || p.project === 'Flight Booking Engine')) {
      db.productionRegistry = [];
      updated = true;
    }
    if (db.deliveryTracker && db.deliveryTracker.some((d: any) => d.id === 'd1' || d.jiraId === 'OPS-201')) {
      db.deliveryTracker = [];
      updated = true;
    }
    if (db.leaveTracker && db.leaveTracker.some((l: any) => l.id === 'l1' || l.id === 'l3')) {
      db.leaveTracker = [];
      updated = true;
    }
    if (db.dailyStatus && db.dailyStatus.some((s: any) => s.id === 's1' || s.focus.includes('OpsPortal authentication'))) {
      db.dailyStatus = [];
      updated = true;
    }

    if (!Array.isArray(db.productionRegistry)) {
      db.productionRegistry = [];
      updated = true;
    }
    if (!Array.isArray(db.deliveryTracker)) {
      db.deliveryTracker = [];
      updated = true;
    }
    if (!Array.isArray(db.leaveTracker)) {
      db.leaveTracker = [];
      updated = true;
    }
    if (!Array.isArray(db.dailyStatus)) {
      db.dailyStatus = [];
      updated = true;
    }

    if (updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
    return db;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
    return initialDB;
  }
}

export function resetDB(): DB {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
  return initialDB;
}

export function saveDB(db: DB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
