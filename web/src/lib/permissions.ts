// Rol bazlı yetkiler. Brief'in kuralı: direksiyon eğitmeni finansı görmez,
// muhasebe ders detayının tamamına erişmek zorunda değildir.
export type Permission =
  | "student.read" | "student.write" | "student.delete"
  | "lead.read" | "lead.write"
  | "lesson.read" | "lesson.write" | "lesson.review"
  | "theory.read" | "theory.write" | "attendance.write"
  | "exam.read" | "exam.write"
  | "document.read" | "document.write"
  | "vehicle.read" | "vehicle.write"
  | "instructor.read" | "instructor.write"
  | "finance.read" | "finance.write"
  | "report.read" | "message.send"
  | "settings.write" | "users.manage" | "export";

const ALL: Permission[] = [
  "student.read", "student.write", "student.delete", "lead.read", "lead.write",
  "lesson.read", "lesson.write", "lesson.review", "theory.read", "theory.write", "attendance.write",
  "exam.read", "exam.write", "document.read", "document.write", "vehicle.read", "vehicle.write",
  "instructor.read", "instructor.write", "finance.read", "finance.write",
  "report.read", "message.send", "settings.write", "users.manage", "export",
];

const MATRIX: Record<string, Permission[]> = {
  OWNER: ALL,
  MANAGER: ALL.filter((p) => p !== "student.delete"),
  SECRETARY: [
    "student.read", "student.write", "lead.read", "lead.write", "lesson.read", "lesson.write",
    "theory.read", "attendance.write", "exam.read", "exam.write", "document.read", "document.write",
    "vehicle.read", "instructor.read", "finance.read", "finance.write", "message.send",
  ],
  ACCOUNTANT: ["student.read", "finance.read", "finance.write", "report.read", "export", "vehicle.read"],
  THEORY_TEACHER: ["student.read", "theory.read", "theory.write", "attendance.write", "lesson.read"],
  // Direksiyon eğitmeni: kendi dersleri ve kursiyer gelişimi — finans yok.
  DRIVING_INSTRUCTOR: ["student.read", "lesson.read", "lesson.review", "exam.read", "vehicle.read"],
  STUDENT: [],
};

export function can(role: string, perm: Permission) {
  if (role === "SUPER_ADMIN") return true;
  return (MATRIX[role] ?? []).includes(perm);
}

export const permissionsOf = (role: string): Permission[] => (role === "SUPER_ADMIN" ? ALL : MATRIX[role] ?? []);
