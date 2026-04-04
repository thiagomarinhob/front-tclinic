export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SET_PASSWORD: "/set-password",
  REGISTER: "/register",
  REGISTER_CLINIC: "/register-clinic",
  PLAN_SELECTION: "/plan-selection",
  PLAN_SELECTION_SUCCESS: "/plan-selection/success",

  DASHBOARD: "/dashboard",
  PATIENTS: "/patients",
  EXAMS: "/exams",
  APPOINTMENTS: "/appointments",
  ATTENDANCE: "/attendance",
  MEDICAL_RECORDS: "/medical-records",
  PROFESSIONALS: "/professionals",
  PROCEDURES: "/procedures",
  USERS: "/users",
  FINANCIAL: "/financial",
  SETTINGS: "/settings",
  SETTINGS_CLINICA: "/settings/clinica",
  SETTINGS_PRONTUARIOS: "/settings/prontuarios",
  SETTINGS_DOCUMENTOS: "/settings/documentos",
  SETTINGS_MEDICAL_RECORD_TEMPLATES_NEW: "/settings/medical-record-templates/new",
  SETTINGS_MEDICAL_RECORD_TEMPLATES_EDIT: (id: string) => `/settings/medical-record-templates/${id}/edit`,
  SETTINGS_CONVENIOS: "/settings/convenios",

  LABORATORY: "/laboratory",
  LABORATORY_ORDERS: "/laboratory/orders",
  LABORATORY_ORDERS_NEW: "/laboratory/orders/new",
  LABORATORY_ORDER_DETAIL: (id: string) => `/laboratory/orders/${id}`,
  LABORATORY_EXAM_TYPES: "/laboratory/exam-types",
} as const;

export const API_ROUTES = {
  AUTH: {
    SIGN_IN: "/auth/sign-in",
    SWITCH_TENANT: "/auth/switch-tenant",
    SIGNUP_CLINIC_OWNER: "/auth/signup/clinic-owner",
    SIGNUP_SOLO: "/auth/signup/solo",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },
  CLINICS: {
    REGISTER: "/clinics/register",
    ME: "/clinics/me",
  },
  TENANTS: {
    UPDATE_PLAN: (tenantId: string) => `/tenants/${tenantId}/plan`,
    CREATE_CHECKOUT: (tenantId: string) => `/tenants/${tenantId}/checkout`,
    START_TRIAL: (tenantId: string) => `/tenants/${tenantId}/trial`,
  },
  PATIENTS: "/patients",
  EXAMS: "/exams",
  APPOINTMENTS: "/appointments",
  PROFESSIONALS: "/professionals",
  PROCEDURES: "/procedures",
  USERS: "/users",
  ROOMS: "/rooms",
  MEDICAL_RECORDS: "/medical-records",
  LABORATORY: "/lab",
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "@solutionsclinic:accessToken",
  REFRESH_TOKEN: "@solutionsclinic:refreshToken",
  USER: "@solutionsclinic:user",
} as const;
