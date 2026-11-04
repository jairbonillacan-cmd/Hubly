export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  avatarInitial: string;
  avatarColor: string;
  role: string;
  email: string;
  status: "Activo" | "Invitado";
  baseActiveMinutes: number;
  brandIds?: string[];
  brandsCount: number;
  tasksCompleted: number;
  tasksInProgress: number;
  postsPublished: number;
  activeTimeLabel: string;
  points: number;
}

export interface TeamInvitation {
  id: string;
  email: string;
  name: string;
  role: string;
  brandIds: string[];
  createdAt: string;
  status: "Pendiente" | "Aceptada" | "Cancelada";
  inviteLink: string;
}

