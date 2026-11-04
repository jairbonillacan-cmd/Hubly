import type { BrandWorkspace } from "./brands";
import type { SocialPost, ContentIdea } from "./social";
import type { Lead, Quote } from "./crm";
import type { AutomationRule } from "./automations";
import type { AgencyTask, TaskListDef } from "./tasks";
import type { NotebookItem } from "./notebooks";
import type { MediaAsset } from "./assets";
import type { BrandProject } from "./projects";
import type { AdCreative } from "./ads";
import type { ChatChannel, ChatMessage, ChatReminder, ChatScheduledMessage } from "./chat";
import type { TeamInvitation, TeamMember } from "./team";
import type { ActivityEvent } from "./activity";
import type { DashboardWidgetConfig, OnboardingProgress } from "./dashboard";

export interface TestClockConfig {
  fixedIsoNow?: string | null;
}

export interface WorkspaceProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarInitial: string;
  avatarUrl?: string;
  avatarSourceUrl?: string; // original reducido, para reencuadrar la foto
  timezone: string; // ej. "America/Mexico_City"
  locale: string; // ej. "es-MX"
  theme?: "claro" | "oscuro";
}

export interface AgencyInfo {
  id: string;
  name: string;
  plan: string;
  activeDays: number;
  activeStreak: number;
  bestStreak?: number;
  xp?: number;
  level?: number;
  nextLevelXp?: number;
  timezone: string;
  currency: string;
}

export interface WorkspaceNotification {
  id: string;
  brandId?: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  kind: "aprobacion" | "tarea" | "comentario" | "sistema" | "ads";
  actionUrl?: string;
}

export interface HublyAgentMessage {
  id: string;
  role: "hubi" | "user";
  text: string;
}

export interface HublyAgent {
  id: string;
  name: string;
  templateId?: string;
  purpose: string;
  cadence: string;
  notes: string[];
  messages: HublyAgentMessage[];
  createdAt: string;
}

export interface HublyWorkspaceData {
  /** Versión del documento; 2 introduce `media` y ajustes por red en los posts. */
  schemaVersion?: number;
  workspaceId: string;
  agencyName: string;
  profile: WorkspaceProfile;
  agency: AgencyInfo;
  testClock: TestClockConfig;
  activeBrandId: string;
  brands: BrandWorkspace[];
  posts: SocialPost[];
  ideas?: ContentIdea[];
  leads?: Lead[];
  quotes?: Quote[];
  automations?: AutomationRule[];
  agents?: HublyAgent[];
  tasks: AgencyTask[];
  taskLists?: TaskListDef[];
  calendarActivities?: unknown[];
  notebooks: NotebookItem[];
  assets: MediaAsset[];
  projects: BrandProject[];
  ads: AdCreative[];
  channels: ChatChannel[];
  messages: ChatMessage[];
  chatScheduled?: ChatScheduledMessage[];
  chatReminders?: ChatReminder[];
  team: TeamMember[];
  invitations: TeamInvitation[];
  activityEvents: ActivityEvent[];
  notifications: WorkspaceNotification[];
  widgets: DashboardWidgetConfig[];
  onboarding: OnboardingProgress;
  dismissedRecommendationIds: string[];
  appliedRecommendationsMap: Record<string, boolean>;
}
