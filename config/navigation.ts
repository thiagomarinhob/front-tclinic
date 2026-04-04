import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Stethoscope,
  FileText,
  FileSearch,
  UsersRound,
  DoorOpen,
  DollarSign,
  Settings,
  FlaskConical,
} from "lucide-react";
import { ROUTES } from "./constants";
import { UserRole } from "@/types";

/**
 * Item do menu lateral. O array `roles` define quais papéis podem ver o item.
 * Única fonte da verdade para visibilidade do menu por tipo de usuário.
 */
export interface NavSubItem {
  name: string;
  href: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Quem pode ver este item. Se vazio, ninguém (não usar vazio na prática). */
  roles: UserRole[];
  /** Oculta o item da sidebar mas mantém a proteção de rota. */
  hidden?: boolean;
  /** Sub-itens exibidos como flyout no hover da sidebar. */
  subItems?: NavSubItem[];
}

/** Rotas do dashboard com permissão por role. Usado no Sidebar e na proteção de rotas. */
export const NAV_ROUTES: NavItem[] = [
  {
    name: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    roles: [
      UserRole.ADMIN_CLINIC,
      UserRole.PROFISSIONAL_SAUDE,
      UserRole.RECEPCIONISTA,
    ],
  },
  {
    name: "Pacientes",
    href: ROUTES.PATIENTS,
    icon: Users,
    roles: [
      UserRole.ADMIN_CLINIC,
      UserRole.PROFISSIONAL_SAUDE,
      UserRole.RECEPCIONISTA,
    ],
  },
  {
    name: "Exames",
    href: ROUTES.EXAMS,
    icon: FileSearch,
    roles: [
      UserRole.ADMIN_CLINIC,
      UserRole.PROFISSIONAL_SAUDE,
      UserRole.RECEPCIONISTA,
    ],
  },
  {
    name: "Agendamentos",
    href: ROUTES.APPOINTMENTS,
    icon: Calendar,
    roles: [
      UserRole.ADMIN_CLINIC,
      UserRole.PROFISSIONAL_SAUDE,
      UserRole.RECEPCIONISTA,
    ],
  },
  {
    name: "Prontuários",
    href: ROUTES.MEDICAL_RECORDS,
    icon: ClipboardList,
    roles: [
      UserRole.ADMIN_CLINIC,
      UserRole.PROFISSIONAL_SAUDE,
      UserRole.RECEPCIONISTA,
    ],
  },
  {
    name: "Profissionais",
    href: ROUTES.PROFESSIONALS,
    icon: Stethoscope,
    roles: [UserRole.ADMIN_CLINIC, UserRole.PROFISSIONAL_SAUDE],
  },
  {
    name: "Procedimentos",
    href: ROUTES.PROCEDURES,
    icon: FileText,
    roles: [
      UserRole.ADMIN_CLINIC,
      UserRole.PROFISSIONAL_SAUDE,
      UserRole.RECEPCIONISTA,
    ],
  },
  {
    name: "Usuários",
    href: ROUTES.USERS,
    icon: UsersRound,
    roles: [UserRole.ADMIN_CLINIC],
  },
  {
    name: "Salas",
    href: "/rooms",
    icon: DoorOpen,
    roles: [UserRole.ADMIN_CLINIC],
    hidden: true,
  },
  {
    name: "Laboratório",
    href: ROUTES.LABORATORY,
    icon: FlaskConical,
    roles: [
      UserRole.ADMIN_CLINIC,
      UserRole.PROFISSIONAL_SAUDE,
      UserRole.RECEPCIONISTA,
    ],
    subItems: [
      { name: "Dashboard", href: ROUTES.LABORATORY },
      { name: "Solicitações", href: ROUTES.LABORATORY_ORDERS },
      { name: "Catálogo de Exames", href: ROUTES.LABORATORY_EXAM_TYPES },
    ],
  },
  {
    name: "Financeiro",
    href: ROUTES.FINANCIAL,
    icon: DollarSign,
    roles: [UserRole.ADMIN_CLINIC],
  },
  {
    name: "Configurações",
    href: ROUTES.SETTINGS,
    icon: Settings,
    roles: [
      UserRole.ADMIN_CLINIC,
      UserRole.PROFISSIONAL_SAUDE,
      UserRole.RECEPCIONISTA,
    ],
    subItems: [
      { name: "Clínica", href: ROUTES.SETTINGS_CLINICA },
      { name: "Prontuários", href: ROUTES.SETTINGS_PRONTUARIOS },
      { name: "Documentos", href: ROUTES.SETTINGS_DOCUMENTOS },
      { name: "Convênios", href: ROUTES.SETTINGS_CONVENIOS },
    ],
  },
];

/**
 * Mapa path base → roles permitidos. Usado na proteção de rota (layout).
 * Derivado de NAV_ROUTES para uma única fonte da verdade.
 */
export function getRouteRoles(): Array<{ path: string; roles: UserRole[] }> {
  return NAV_ROUTES.map((item) => ({
    path: item.href,
    roles: item.roles,
  }));
}

/**
 * Verifica se o usuário tem permissão para acessar a rota (pathname).
 * Considera path exato ou prefixo (ex.: /patients e /patients/123).
 */
export function isPathAllowedForRole(
  pathname: string,
  role: UserRole | undefined,
): boolean {
  if (!role) return false;
  const routeRoles = getRouteRoles();
  for (const { path, roles } of routeRoles) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return roles.includes(role);
    }
  }
  // Rotas não listadas: negar por segurança (dashboard já está em routeRoles)
  return false;
}
