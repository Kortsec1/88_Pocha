import type { User, UserRole } from "@/lib/types";

export type Permission =
  | "manageUsers"
  | "manageRoles"
  | "manageMenus"
  | "viewSessionArchives"
  | "manageBusinessSession"
  | "manageSettlement"
  | "manageTableMemos"
  | "manageReservations"
  | "manageInventory"
  | "manageSoldOut";

const rolePermissions: Record<UserRole, Permission[]> = {
  staff: ["manageReservations", "manageTableMemos", "manageInventory", "manageSoldOut"],
  manager: ["manageReservations", "manageTableMemos", "manageInventory", "manageSoldOut", "manageSettlement", "manageBusinessSession"],
  admin: ["manageUsers", "manageMenus", "manageReservations", "manageTableMemos", "manageInventory", "manageSoldOut", "manageSettlement", "manageBusinessSession"],
  developer: ["manageUsers", "manageRoles", "manageMenus", "viewSessionArchives", "manageBusinessSession", "manageSettlement", "manageTableMemos", "manageReservations", "manageInventory", "manageSoldOut"],
};

export function can(user: User | null | undefined, permission: Permission) {
  if (!user) return false;
  return rolePermissions[user.role].includes(permission);
}

export function assertCan(user: User | null | undefined, permission: Permission) {
  if (!can(user, permission)) throw new Error("이 기능을 사용할 권한이 없습니다.");
}

