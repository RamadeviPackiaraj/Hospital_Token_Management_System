import type { MockUser } from "@/lib/auth-flow";

export type AdminManagedRole = "doctor" | "hospital";

type StoredUserMap = Record<string, MockUser>;

function getStorageKey(role: AdminManagedRole, type: "edits" | "deleted") {
  return `hospital_token_admin_${role}_${type}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function applyAdminUserMocks(role: AdminManagedRole, users: MockUser[]) {
  const edits = readJson<StoredUserMap>(getStorageKey(role, "edits"), {});
  const deletedIds = new Set(readJson<string[]>(getStorageKey(role, "deleted"), []));

  return users
    .filter((user) => !deletedIds.has(user.id))
    .map((user) => ({
      ...user,
      ...(edits[user.id] || {}),
    }));
}

export function saveAdminUserMock(role: AdminManagedRole, user: MockUser) {
  const edits = readJson<StoredUserMap>(getStorageKey(role, "edits"), {});
  edits[user.id] = user;
  writeJson(getStorageKey(role, "edits"), edits);

  const deletedIds = readJson<string[]>(getStorageKey(role, "deleted"), []).filter((id) => id !== user.id);
  writeJson(getStorageKey(role, "deleted"), deletedIds);
}

export function deleteAdminUserMock(role: AdminManagedRole, userId: string) {
  const deletedIds = readJson<string[]>(getStorageKey(role, "deleted"), []);
  if (!deletedIds.includes(userId)) {
    deletedIds.push(userId);
  }
  writeJson(getStorageKey(role, "deleted"), deletedIds);
}
