export const AUTH_ROLES = ["doctor", "hospital", "admin"] as const;
export const AUTH_MODES = ["signin", "signup"] as const;
export const USER_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export const MOCK_OTP = "123456";
export const MOCK_SESSION_KEY = "hospital_token_auth_session";
export const MOCK_USERS_KEY = "hospital_token_mock_users";
export const PENDING_AUTH_KEY = "hospital_token_pending_auth";

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
  mobileNumber: string;
  email: string;
  password: string;
  hospitalName?: string;
  specialization?: string;
  department?: string;
  medicalRegistrationId?: string;
  adminAccessCode?: string;
  country: string;
  state: string;
  city: string;
  registrationDate: string;
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
  mobileNumber: string;
  email: string;
  name: string;
  userId?: string;
  signupData?: SignupPayload;
}

export interface MockSession {
  userId: string;
  role: AuthRole;
  mobileNumber: string;
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
    subtle: "#CCFBF1"
  },
  hospital: {
    title: "Hospital",
    badge: "Hospital workspace",
    tint: "bg-teal-50",
    accent: "text-teal-700",
    primary: "#0EA5A4",
    subtle: "#CCFBF1"
  },
  admin: {
    title: "Admin",
    badge: "Admin workspace",
    tint: "bg-teal-50",
    accent: "text-teal-700",
    primary: "#0EA5A4",
    subtle: "#CCFBF1"
  }
};

const defaultMockUsers: MockUser[] = [
  {
    id: "admin-1",
    role: "admin",
    fullName: "Rahul Mehta",
    mobileNumber: "9988776655",
    email: "admin@caregrid.com",
    password: "password123",
    hospitalName: "City Care Hospital",
    adminAccessCode: "ADMIN-2026",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    registrationDate: "2026-03-10",
    approvalStatus: "approved"
  },
  {
    id: "hospital-1",
    role: "hospital",
    fullName: "Nina Shah",
    mobileNumber: "9123456780",
    email: "hospital@caregrid.com",
    password: "password123",
    hospitalName: "City Care Hospital",
    department: "Front Desk",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    registrationDate: "2026-03-11",
    approvalStatus: "approved"
  },
  {
    id: "doctor-1",
    role: "doctor",
    fullName: "Dr. Avery Stone",
    mobileNumber: "9876543210",
    email: "doctor@caregrid.com",
    password: "password123",
    medicalRegistrationId: "MCI-45892",
    specialization: "Cardiology",
    department: "Cardiology",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    registrationDate: "2026-03-12",
    approvalStatus: "approved"
  },
  {
    id: "hospital-2",
    role: "hospital",
    fullName: "Priya Nair",
    mobileNumber: "9112233445",
    email: "operations@greenvalleyhealth.com",
    password: "password123",
    hospitalName: "Green Valley Health",
    department: "Operations",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    registrationDate: "2026-03-18",
    approvalStatus: "pending"
  },
  {
    id: "doctor-2",
    role: "doctor",
    fullName: "Dr. Mason Lee",
    mobileNumber: "9000012345",
    email: "mason.lee@caregrid.com",
    password: "password123",
    medicalRegistrationId: "MCI-55102",
    specialization: "General Medicine",
    department: "General",
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    registrationDate: "2026-03-20",
    approvalStatus: "pending"
  },
  {
    id: "doctor-3",
    role: "doctor",
    fullName: "Dr. Harper Diaz",
    mobileNumber: "9000054321",
    email: "harper.diaz@caregrid.com",
    password: "password123",
    medicalRegistrationId: "MCI-55888",
    specialization: "Orthopedics",
    department: "Orthopedics",
    country: "India",
    state: "Delhi",
    city: "New Delhi",
    registrationDate: "2026-03-22",
    approvalStatus: "rejected"
  }
];

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

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeMobileNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
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

function setStoredJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getMockUsers() {
  return getStoredJson<MockUser[]>(MOCK_USERS_KEY, defaultMockUsers);
}

function saveMockUsers(users: MockUser[]) {
  setStoredJson(MOCK_USERS_KEY, users);
}

export function getMockUserById(userId: string) {
  return getMockUsers().find((user) => user.id === userId) ?? null;
}

export function getMockUserByEmail(email: string) {
  return getMockUsers().find((user) => user.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

export function updateMockUserStatus(userId: string, approvalStatus: UserApprovalStatus) {
  const users = getMockUsers().map((user) => (user.id === userId ? { ...user, approvalStatus } : user));
  saveMockUsers(users);
  return users.find((user) => user.id === userId) ?? null;
}

export async function beginMockSignin(payload: SignInPayload): Promise<PendingAuthChallenge> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const user = getMockUserByEmail(payload.email);

  if (!user || user.password !== payload.password) {
    throw new Error("Invalid email or password.");
  }

  const accessMessage = getAccessControlMessage(user.approvalStatus);
  if (accessMessage) {
    throw new Error(accessMessage);
  }

  const challenge: PendingAuthChallenge = {
    mode: "signin",
    role: user.role,
    mobileNumber: user.mobileNumber,
    email: user.email,
    name: user.fullName,
    userId: user.id
  };

  setStoredJson(PENDING_AUTH_KEY, challenge);
  return challenge;
}

export async function beginMockSignup(payload: SignupPayload): Promise<PendingAuthChallenge> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const users = getMockUsers();
  const email = payload.email.trim().toLowerCase();
  const mobileNumber = sanitizeMobileNumber(payload.mobileNumber);

  if (payload.password !== payload.confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  if (mobileNumber.length !== 10) {
    throw new Error("Enter a valid 10-digit mobile number.");
  }

  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error("An account with this email already exists.");
  }

  const challenge: PendingAuthChallenge = {
    mode: "signup",
    role: payload.role,
    mobileNumber,
    email,
    name: payload.fullName.trim(),
    signupData: {
      ...payload,
      email,
      mobileNumber
    }
  };

  setStoredJson(PENDING_AUTH_KEY, challenge);
  return challenge;
}

export function getPendingAuthChallenge() {
  return getStoredJson<PendingAuthChallenge | null>(PENDING_AUTH_KEY, null);
}

export function clearPendingAuthChallenge() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_AUTH_KEY);
}

function createUserFromSignup(payload: SignupPayload): MockUser {
  const common = {
    id: createId(payload.role),
    role: payload.role,
    fullName: payload.fullName.trim(),
    mobileNumber: sanitizeMobileNumber(payload.mobileNumber),
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    country: payload.country.trim(),
    state: payload.state.trim(),
    city: payload.city.trim(),
    registrationDate: new Date().toISOString().slice(0, 10),
    approvalStatus: "pending" as const
  };

  if (payload.role === "doctor") {
    return {
      ...common,
      medicalRegistrationId: payload.medicalRegistrationId.trim(),
      specialization: payload.specialization?.trim() || undefined,
      department: payload.department.trim()
    };
  }

  if (payload.role === "hospital") {
    return {
      ...common,
      hospitalName: payload.hospitalName.trim(),
      department: payload.department.trim()
    };
  }

  return {
    ...common,
    hospitalName: payload.hospitalName.trim(),
    adminAccessCode: payload.adminAccessCode.trim(),
    approvalStatus: "approved"
  };
}

export async function verifyMockOtp(payload: VerifyOtpPayload): Promise<MockSession> {
  await new Promise((resolve) => setTimeout(resolve, 450));

  const challenge = getPendingAuthChallenge();

  if (!challenge) {
    throw new Error("No pending authentication request found.");
  }

  if (payload.otp !== MOCK_OTP) {
    throw new Error("Invalid OTP. Use 123456 for the mock flow.");
  }

  let currentUser = challenge.userId ? getMockUserById(challenge.userId) : null;

  if (challenge.mode === "signup" && challenge.signupData) {
    const createdUser = createUserFromSignup(challenge.signupData);
    saveMockUsers([...getMockUsers(), createdUser]);
    currentUser = createdUser;
  }

  if (!currentUser) {
    clearPendingAuthChallenge();
    throw new Error("Unable to complete authentication.");
  }

  const accessMessage = getAccessControlMessage(currentUser.approvalStatus);
  if (accessMessage) {
    clearPendingAuthChallenge();
    throw new Error(accessMessage);
  }

  const session: MockSession = {
    userId: currentUser.id,
    role: currentUser.role,
    mobileNumber: currentUser.mobileNumber,
    mode: challenge.mode,
    name: currentUser.fullName,
    email: currentUser.email
  };

  saveMockSession(session);
  clearPendingAuthChallenge();

  return session;
}

export function saveMockSession(session: MockSession) {
  setStoredJson(MOCK_SESSION_KEY, session);
}

export function getMockSession() {
  const session = getStoredJson<MockSession | null>(MOCK_SESSION_KEY, null);

  if (!session || !isAuthRole(session.role) || !isAuthMode(session.mode)) {
    return null;
  }

  return session;
}

export function getCurrentSessionUser() {
  const session = getMockSession();
  if (!session) return null;
  return getMockUserById(session.userId);
}

export function clearMockSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MOCK_SESSION_KEY);
}
