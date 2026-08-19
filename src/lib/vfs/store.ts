import { get, set } from 'idb-keyval';
import type { VFSNode } from './types';
import { INITIAL_VFS } from './initialFS';

const VFS_STORAGE_KEY = 'olt_vfs_tree_v1';
const HISTORY_STORAGE_KEY = 'olt_shell_history_v1';
const INSTALLED_PKGS_KEY = 'olt_installed_pkgs_v1';

export async function getStoredVFS(): Promise<VFSNode> {
  try {
    if (typeof window === 'undefined') return INITIAL_VFS;
    const stored = await get<VFSNode>(VFS_STORAGE_KEY);
    if (stored && stored.children) {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to load VFS from IndexedDB, using initial VFS:', e);
  }
  return INITIAL_VFS;
}

export async function saveVFS(tree: VFSNode): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    await set(VFS_STORAGE_KEY, tree);
  } catch (e) {
    console.warn('Failed to save VFS to IndexedDB:', e);
  }
}

export async function resetVFS(): Promise<VFSNode> {
  try {
    if (typeof window !== 'undefined') {
      await set(VFS_STORAGE_KEY, INITIAL_VFS);
      await set(HISTORY_STORAGE_KEY, []);
      await set(INSTALLED_PKGS_KEY, []);
    }
  } catch (e) {
    console.warn('Failed to reset VFS:', e);
  }
  return INITIAL_VFS;
}

export async function getStoredHistory(): Promise<string[]> {
  try {
    if (typeof window === 'undefined') return [];
    const history = await get<string[]>(HISTORY_STORAGE_KEY);
    return history || [];
  } catch {
    return [];
  }
}

export async function saveStoredHistory(history: string[]): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    await set(HISTORY_STORAGE_KEY, history.slice(-200));
  } catch (e) {
    console.warn('Failed to save command history:', e);
  }
}

export async function getInstalledPackages(): Promise<string[]> {
  try {
    if (typeof window === 'undefined') return [];
    const pkgs = await get<string[]>(INSTALLED_PKGS_KEY);
    return pkgs || [];
  } catch {
    return [];
  }
}

export async function addInstalledPackage(pkg: string): Promise<string[]> {
  const current = await getInstalledPackages();
  if (!current.includes(pkg)) {
    const updated = [...current, pkg];
    try {
      await set(INSTALLED_PKGS_KEY, updated);
    } catch {}
    return updated;
  }
  return current;
}
