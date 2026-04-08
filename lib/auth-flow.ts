import { apiRequest, setAuthToken } from "@/lib/api";

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
  mobileNumber?: string;
  email: string;
  hospitalName?: string;
  gender?: string;
  specialization?: string;
  department?: string;
  medicalRegistrationId?: string;
  bloodGroup?: string;
  adminAccessCode?: string;
  country?: string;
  state?: string;
  city?: string;
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
  department: string;
  gender: string;
  dob: string;
  bloodGroup: string;
}

export interface HospitalSignupPayload extends BaseSignupPayload {
  role: "hospital";
  hospitalName: string;
  department: string;
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
  token: string;
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

const MOCK_SESSION_KEY = "hospital_token_auth_session";
const MOCK_USER_KEY = "hospital_token_auth_user";
const PENDING_AUTH_KEY = "hospital_token_pending_auth";

export function isAuthRole(value: string | null | undefined): value is AuthRole {
  return !!value && AUTH_ROLES.includes(value as AuthRole);
}

export function isAuthMode(value: string | null | undefined): value is AuthMode {
  return !!value && AUTH_MODES.includes(value as AuthMode);
}

export function isUserApprovalStatus(value: string | null | undefined): value is UserApprovalStatus {
  return !!value && USER_APPROVAL_STATUSES.includes(value as UserApprovalStatus);
}

export function formatRoleLabel(role: AuthRole) {
  return roleThemes[role].title;
}

export function formatApprovalStatus(status: UserApprovalStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
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

export function getRoleTheme(role: AuthRole | null | undefined) {
  return roleThemes[role ?? "doctor"];
}

function getStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setStoredJson<T>(key: string, value: T | null) {
  if (typeof window === "undefined") return;
  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
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
    approvalStatus?: string;
    loginStatus?: string;
    departmentName?: string | null;
  };
  profile?: {
    id?: string;
    name?: string;
    phone?: string;
    location?: string;
    department?: string;
    specialization?: string;
    medical_registration_id?: string;
    medicalRegistrationId?: string;
    createdAt?: string;
  } | null;
}): MockUser {
  const { user, profile } = payload;
  const role = isAuthRole(user.role) ? user.role : "doctor";
  const locationParts = parseLocation(profile?.location);
  const approvalStatus = normalizeApprovalStatus(
    user.approvalStatus || user.loginStatus
  );

  return {
    id: user.id,
    role,
    fullName: profile?.name || user.name,
    mobileNumber: profile?.phone || "",
    email: user.email,
    hospitalName: role === "hospital" ? profile?.name || user.name : undefined,
    specialization: profile?.specialization || undefined,
    department: profile?.department || user.departmentName || undefined,
    medicalRegistrationId:
      profile?.medical_registration_id || profile?.medicalRegistrationId || undefined,
    country: locationParts.country,
    state: locationParts.state,
    city: locationParts.city,
    registrationDate: profile?.createdAt || new Date().toISOString().slice(0, 10),
    approvalStatus,
  };
}

export type AdminEntityItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string | null;
  gender?: string | null;
  department?: string | null;
  departmentName?: string | null;
  location?: string | null;
  specialization?: string | null;
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
  const role = isAuthRole(entity.role) ? entity.role : "doctor";
  const locationParts = parseLocation(entity.location);
  return {
    id: entity.userId || entity.id,
    role,
    fullName: entity.name,
    mobileNumber: entity.phone || "",
    email: entity.email,
    hospitalName: role === "hospital" ? entity.name : undefined,
    gender: entity.gender || undefined,
    specialization: entity.specialization || undefined,
    department: entity.department || entity.departmentName || undefined,
    medicalRegistrationId:
      entity.medicalRegistrationId || entity.medical_registration_id || undefined,
    bloodGroup: entity.bloodGroup || entity.blood_group || undefined,
    country: entity.country || locationParts.country,
    state: entity.state || locationParts.state,
    city: entity.city || locationParts.city,
    registrationDate: entity.createdAt || new Date().toISOString().slice(0, 10),
    approvalStatus: normalizeApprovalStatus(entity.status),
  };
}

export async function beginMockSignin(payload: SignInPayload): Promise<PendingAuthChallenge> {
  await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { auth: false });

  const storedRole =
    typeof window === "undefined" ? null : window.localStorage.getItem("hospital_token_selected_role");
  const roleHint = isAuthRole(storedRole) ? storedRole : "doctor";
  const challenge: PendingAuthChallenge = {
    mode: "signin",
    role: roleHint || "doctor",
    email: payload.email,
  };
  setStoredJson(PENDING_AUTH_KEY, challenge);
  return challenge;
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
      department: payload.department,
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
      departments: payload.department ? [payload.department] : [],
    });
  }

  if (payload.role === "admin") {
    Object.assign(basePayload, {
      adminAccessCode: payload.adminAccessCode,
    });
  }

  await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(basePayload),
  }, { auth: false });

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

  const path =
    challenge.mode === "signin" ? "/auth/resend-login-otp" : "/auth/resend-register-otp";

  await apiRequest(
    path,
    {
      method: "POST",
      body: JSON.stringify({ email: challenge.email }),
    },
    { auth: false }
  );

  setStoredJson(PENDING_AUTH_KEY, challenge);
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

  if (challenge.mode === "signup") {
    await apiRequest("/auth/verify-register-otp", {
      method: "POST",
      body: JSON.stringify({ email: challenge.email, otp: payload.otp }),
    }, { auth: false });

    clearPendingAuthChallenge();
    return { mode: "signup" };
  }

  const loginData = await apiRequest<{ token: string; role: string }>(
    "/auth/verify-login-otp",
    {
      method: "POST",
      body: JSON.stringify({ email: challenge.email, otp: payload.otp }),
    },
    { auth: false }
  );

  const token = loginData.token;
  if (!token) {
    throw new Error("Login token not received.");
  }

  setAuthToken(token);
  const me = await apiRequest<{ user: Record<string, unknown>; profile?: Record<string, unknown> }>(
    "/users/me"
  );
  const currentUser = mapMeToMockUser(me as unknown as { user: any; profile?: any });

  const session: MockSession = {
    userId: currentUser.id,
    role: currentUser.role,
    mobileNumber: currentUser.mobileNumber,
    mode: "signin",
    name: currentUser.fullName,
    email: currentUser.email,
    token,
  };

  saveMockSession(session);
  saveCurrentUser(currentUser);
  clearPendingAuthChallenge();

  return { mode: "signin", session };
}

export function saveMockSession(session: MockSession) {
  setStoredJson(MOCK_SESSION_KEY, session);
}

function saveCurrentUser(user: MockUser) {
  setStoredJson(MOCK_USER_KEY, user);
}

export function getMockSession() {
  const session = getStoredJson<MockSession | null>(MOCK_SESSION_KEY, null);

  if (!session || !isAuthRole(session.role) || !isAuthMode(session.mode)) {
    return null;
  }

  return session;
}

export function getCurrentSessionUser() {
  return getStoredJson<MockUser | null>(MOCK_USER_KEY, null);
}

export async function refreshSessionUser() {
  const session = getMockSession();
  if (!session) return null;

  const me = await apiRequest<{ user: Record<string, unknown>; profile?: Record<string, unknown> }>(
    "/users/me"
  );
  const currentUser = mapMeToMockUser(me as unknown as { user: any; profile?: any });
  saveCurrentUser(currentUser);
  saveMockSession({
    ...session,
    userId: currentUser.id,
    role: currentUser.role,
    mobileNumber: currentUser.mobileNumber,
    name: currentUser.fullName,
    email: currentUser.email,
  });
  return currentUser;
}

export function clearMockSession() {
  setStoredJson(MOCK_SESSION_KEY, null);
  setStoredJson(MOCK_USER_KEY, null);
  setAuthToken(null);
}
