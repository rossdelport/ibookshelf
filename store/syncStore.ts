import { create } from 'zustand';

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error';

// Lightweight, ephemeral status the sync layer pushes into and the UI reads.
interface SyncStatusStore {
  status: SyncState;
  pending: number;         // number of changes not yet confirmed in the cloud
  lastSyncedAt: number | null;
}

export const useSyncStore = create<SyncStatusStore>(() => ({
  status: 'idle',
  pending: 0,
  lastSyncedAt: null,
}));
