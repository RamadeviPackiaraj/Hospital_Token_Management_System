import { apiRequest, clearApiSessionState } from "@/lib/api";

export const AUTH_ROLES = ["doctor", "hospital", "admin"] as const;
export const AUTH_MODES = ["signin", "signup"] as const;
export const USER_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];
export type AuthMode = (typeof AUTH_MODES)[number];
export type UserApprovalStatus = (typeof USER_APPROVAL_STATUSES)[number];

export interface RoleTheme {
  title: string;
  badge: string;
  tint: string;
  accent: string;
  primary: string;
  subtle: string;
}

export interface MockUser {
  id: string;
  role: AuthRole;
  fullName: string;
  displayFullName?: string;
  mobileNumber?: string;
  email: string;
  hospitalName?: string;
  displayHospitalName?: string;
  gender?: string;
  displayGender?: string;
  specialization?: string;
  displaySpecialization?: string;
  department?: string;
  displayDepartment?: string;
  medicalRegistrationId?: string;
  bloodGroup?: string;
  adminAccessCode?: string;
  country?: string;
  displayCountry?: string;
  state?: string;
  displayState?: string;
  city?: string;
  displayCity?: string;
  registrationDate?: string;
  approvalStatus: UserApprovalStatus;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface BaseSignupPayload {
  role: AuthRole;
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  state: string;
  city: string;
}

export interface DoctorSignupPayload extends BaseSignupPayload {
  role: "doctor";
  medicalRegistrationId: string;
  specialization?: string;
  departmentId: string;
  gender: string;
  dob: string;
  bloodGroup: string;
}

export interface HospitalSignupPayload extends BaseSignupPayload {
  role: "hospital";
  hospitalName: string;
  departmentId: string;
}

export interface AdminSignupPayload extends BaseSignupPayload {
  role: "admin";
  hospitalName: string;
  adminAccessCode: string;
}

export type SignupPayload = DoctorSignupPayload | HospitalSignupPayload | AdminSignupPayload;

export interface PendingAuthChallenge {
  mode: AuthMode;
  role: AuthRole;
  mobileNumber?: string;
  email: string;
  name?: string;
}

export interface MockSession {
  userId: string;
  role: AuthRole;
  mobileNumber?: string;
  mode: AuthMode;
  name: string;
  email: string;
}

export interface VerifyOtpPayload {
  otp: string;
}

export const roleThemes: Record<AuthRole, RoleTheme> = {
  doctor: {
    title: "Doctor",
    badge: "Doctor workspace",
    tint: "bg-teal-50",
    accent: "text-teal-700",
    primary: "#0EA5A4",
    subtle: "#CCFBF1",
  },
  hospital: {
    title: "Hospital",
    badge: "Hospital workspace",
    tint: "bg-teal-50",
    accent: "text-teal-700",
    primary: "#0EA5A4",
    subtle: "#CCFBF1",
  },
  admin: {
    title: "Admin",
    badge: "Admin workspace",
    tint: "bg-teal-50",
    accent: "text-teal-700",
    primary: "#0EA5A4",
    subtle: "#CCFBF1",
  },
};

const SESSION_KEY = "hospital_token_auth_session";
const USER_KEY = "hospital_token_auth_user";
const PENDING_AUTH_KEY = "hospital_token_pending_auth";

export function isAuthRole(value: string | null | undefined): value is AuthRole {
  return !!value && AUTH_ROLES.includes(value as AuthRole);
}

export function isAuthMode(value: string | null | undefined): value is AuthMode {
  return !!value && AUTH_MODES.includes(value as AuthMode);
}

export function formatRoleLabel(role: AuthRole) {
  return roleThemes[role].title;
}

export function getRoleTheme(role: AuthRole | null | undefined) {
  return roleThemes[role ?? "doctor"];
}

export function getAccessControlMessage(status: UserApprovalStatus) {
  if (status === "approved") {
    return "";
  }

  if (status === "rejected") {
    return "Your account has been rejected. Please contact support";
  }

  return "Your account is under review by admin";
}

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function getStoredJson<T>(key: string, fallback: T): T {
  const storage = getStorage();
  if (!storage) return fallback;

  const raw = storage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setStoredJson<T>(key: string, value: T | null) {
  const storage = getStorage();
  if (!storage) return;

  if (value === null) {
    storage.removeItem(key);
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

function normalizeApprovalStatus(value: string | null | undefined): UserApprovalStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function parseLocation(location?: string | null) {
  if (!location) return { city: "", state: "", country: "" };
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    city: parts[0] || "",
    state: parts[1] || "",
    country: parts[2] || "",
  };
}

function mapMeToMockUser(payload: {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    actualRole?: string;
    approvalStatus?: string;
    loginStatus?: string;
    departmentName?: string | null;
  };
  profile?: {
    id?: string;
    name?: string;
    displayName?: string;
    phone?: string;
    location?: string;
    displayLocation?: string;
    department?: string;
    displayDepartment?: string;
    specialization?: string;
    displaySpecialization?: string;
    medical_registration_id?: string;
    medicalRegistrationId?: string;
    createdAt?: string;
  } | null;
}): MockUser {
  const { user, profile } = payload;
  const resolvedRole = user.role === "super_admin" ? "admin" : user.role;
  const role = isAuthRole(resolvedRole) ? resolvedRole : "doctor";
  const locationParts = parseLocation(profile?.location);
  const approvalStatus = normalizeApprovalStatus(user.approvalStatus || user.loginStatus);

  return {
    id: user.id,
    role,
    fullName: profile?.name || user.name,
    displayFullName: profile?.displayName || profile?.name || user.name,
    mobileNumber: profile?.phone || "",
    email: user.email,
    hospitalName: role === "hospital" ? profile?.name || user.name : undefined,
    displayHospitalName:
      role === "hospital" ? profile?.displayName || profile?.name || user.name : undefined,
    specialization: profile?.specialization || undefined,
    displaySpecialization: profile?.displaySpecialization || profile?.specialization || undefined,
    department: profile?.department || user.departmentName || undefined,
    displayDepartment:
      profile?.displayDepartment || profile?.department || user.departmentName || undefined,
    medicalRegistrationId:
      profile?.medical_registration_id || profile?.medicalRegistrationId || undefined,
    country: locationParts.country,
    state: locationParts.state,
    city: locationParts.city,
    displayCity: parseLocation(profile?.displayLocation || profile?.location).city || locationParts.city,
    displayState: parseLocation(profile?.displayLocation || profile?.location).state || locationParts.state,
    displayCountry:
      parseLocation(profile?.displayLocation || profile?.location).country || locationParts.country,
    registrationDate: profile?.createdAt || new Date().toISOString().slice(0, 10),
    approvalStatus,
  };
}

export type AdminEntityItem = {
  id: string;
  userId: string;
  name: string;
  displayName?: string;
  email: string;
  role: string;
  status: string;
  phone?: string | null;
  gender?: string | null;
  displayGender?: string | null;
  department?: string | null;
  displayDepartment?: string | null;
  departmentName?: string | null;
  location?: string | null;
  displayLocation?: string | null;
  specialization?: string | null;
  displaySpecialization?: string | null;
  medicalRegistrationId?: string | null;
  medical_registration_id?: string | null;
  bloodGroup?: string | null;
  blood_group?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  createdAt?: string;
};

export function mapAdminEntityToMockUser(entity: AdminEntityItem): MockUser {
  const resolvedRole = entity.role === "super_admin" ? "admin" : entity.role;
  const role = isAuthRole(resolvedRole) ? resolvedRole : "doctor";
  const locationParts = parseLocation(entity.location);
  return {
    id: entity.userId || entity.id,
    role,
    fullName: entity.name,
    displayFullName: entity.displayName || entity.name,
    mobileNumber: entity.phone || "",
    email: entity.email,
    hospitalName: role === "hospital" ? entity.name : undefined,
    displayHospitalName: role === "hospital" ? entity.displayName || entity.name : undefined,
    gender: entity.gender || undefined,
    displayGender: entity.displayGender || entity.gender || undefined,
    specialization: entity.specialization || undefined,
    displaySpecialization: entity.displaySpecialization || entity.specialization || undefined,
    department: entity.department || entity.departmentName || undefined,
    displayDepartment:
      entity.displayDepartment || entity.department || entity.departmentName || undefined,
    medicalRegistrationId:
      entity.medicalRegistrationId || entity.medical_registration_id || undefined,
    bloodGroup: entity.bloodGroup || entity.blood_group || undefined,
    country: entity.country || locationParts.country,
    state: entity.state || locationParts.state,
    city: entity.city || locationParts.city,
    displayCity: parseLocation(entity.displayLocation || entity.location).city || entity.city || locationParts.city,
    displayState:
      parseLocation(entity.displayLocation || entity.location).state || entity.state || locationParts.state,
    displayCountry:
      parseLocation(entity.displayLocation || entity.location).country ||
      entity.country ||
      locationParts.country,
    registrationDate: entity.createdAt || new Date().toISOString().slice(0, 10),
    approvalStatus: normalizeApprovalStatus(entity.status),
  };
}

function saveSession(session: MockSession | null) {
  setStoredJson(SESSION_KEY, session);
}

function saveCurrentUser(user: MockUser | null) {
  setStoredJson(USER_KEY, user);
}

function buildSessionFromUser(user: MockUser): MockSession {
  return {
    userId: user.id,
    role: user.role,
    mobileNumber: user.mobileNumber,
    mode: "signin",
    name: user.fullName,
    email: user.email,
  };
}

async function fetchCurrentUser() {
  const me = await apiRequest<{ user: Record<string, unknown>; profile?: Record<string, unknown> }>("/users/me");
  const currentUser = mapMeToMockUser(me as unknown as { user: any; profile?: any });
  saveCurrentUser(currentUser);
  saveSession(buildSessionFromUser(currentUser));
  return currentUser;
}

export async function beginMockSignin(payload: SignInPayload): Promise<MockSession> {
  await apiRequest(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { auth: false }
  );

  const currentUser = await fetchCurrentUser();
  clearPendingAuthChallenge();
  return buildSessionFromUser(currentUser);
}

export async function beginMockSignup(payload: SignupPayload): Promise<PendingAuthChallenge> {
  const basePayload: Record<string, unknown> = {
    name: payload.fullName,
    email: payload.email,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    role: payload.role,
  };

  if (payload.role === "doctor") {
    Object.assign(basePayload, {
      phone: payload.mobileNumber,
      gender: payload.gender,
      dob: payload.dob,
      blood_group: payload.bloodGroup,
      departmentId: payload.departmentId,
      specialization: payload.specialization || null,
      medicalRegistrationId: payload.medicalRegistrationId || null,
    });
  }

  if (payload.role === "hospital") {
    const location = [payload.city, payload.state, payload.country]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(", ");
    Object.assign(basePayload, {
      name: payload.hospitalName || payload.fullName,
      phone: payload.mobileNumber,
      location,
      departmentId: payload.departmentId,
    });
  }

  if (payload.role === "admin") {
    Object.assign(basePayload, {
      adminAccessCode: payload.adminAccessCode,
    });
  }

  await apiRequest(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(basePayload),
    },
    { auth: false }
  );

  const challenge: PendingAuthChallenge = {
    mode: "signup",
    role: payload.role,
    email: payload.email,
    name: payload.fullName,
    mobileNumber: payload.mobileNumber,
  };
  setStoredJson(PENDING_AUTH_KEY, challenge);
  return challenge;
}

export function getPendingAuthChallenge() {
  return getStoredJson<PendingAuthChallenge | null>(PENDING_AUTH_KEY, null);
}

export function clearPendingAuthChallenge() {
  setStoredJson(PENDING_AUTH_KEY, null);
}

export async function resendMockOtp() {
  const challenge = getPendingAuthChallenge();

  if (!challenge) {
    throw new Error("Resend is unavailable. Please restart the authentication flow.");
  }

  await apiRequest(
    "/auth/resend-register-otp",
    {
      method: "POST",
      body: JSON.stringify({ email: challenge.email }),
    },
    { auth: false }
  );

  return challenge;
}

export async function verifyMockOtp(payload: VerifyOtpPayload): Promise<{
  mode: AuthMode;
  session?: MockSession;
}> {
  const challenge = getPendingAuthChallenge();

  if (!challenge) {
    throw new Error("No pending authentication request found.");
  }

  await apiRequest(
    "/auth/verify-register-otp",
    {
      method: "POST",
      body: JSON.stringify({ email: challenge.email, otp: payload.otp }),
    },
    { auth: false }
  );

  clearPendingAuthChallenge();
  return { mode: "signup" };
}

export function getMockSession() {
  const session = getStoredJson<MockSession | null>(SESSION_KEY, null);
  if (!session || !isAuthRole(session.role) || !isAuthMode(session.mode)) {
    return null;
  }
  return session;
}

export function getCurrentSessionUser() {
  return getStoredJson<MockUser | null>(USER_KEY, null);
}

export async function refreshSessionUser() {
  try {
    return await fetchCurrentUser();
  } catch {
    clearMockSession();
    throw new Error("Your session has expired. Please sign in again.");
  }
}

export async function logoutCurrentSession() {
  try {
    await apiRequest(
      "/auth/logout",
      {
        method: "POST",
      },
      { retryOnAuthFailure: false }
    );
  } finally {
    clearMockSession();
  }
}

export function clearMockSession() {
  saveSession(null);
  saveCurrentUser(null);
  clearApiSessionState();
}
