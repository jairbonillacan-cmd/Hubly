import type { CoverKind } from "@/components/Cover";

export type SocialNetwork =
  | "Instagram"
  | "TikTok"
  | "Facebook"
  | "LinkedIn"
  | "YouTube"
  | "X"
  | "Threads"
  | "Pinterest"
  | "Reddit"
  | "Google Business";

export type PostStatus =
  | "draft"
  | "pending"
  | "changes"
  | "approved"
  | "scheduled"
  | "published";

export type PostStatusLabel =
  | "Borrador"
  | "En aprobación"
  | "Aprobado"
  | "Programado"
  | "Publicado"
  | "Requiere cambios";

export type PostFormat = "Reel / Video" | "Carrusel" | "Imagen" | "Story" | "Texto";

export interface PostComment {
  id: string;
  author: string;
  role: "client" | "agency";
  text: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  brandId: string;
  title: string;
  caption: string;
  network?: SocialNetwork;
  networks: SocialNetwork[];
  format: PostFormat;
  cover: CoverKind;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: PostStatus;
  statusLabel?: PostStatusLabel;
  assignee: string;
  authorId?: string;
  approverName?: string;
  pillar: string;
  metrics?: {
    reach: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
  };
  comments: PostComment[];
  mediaUrl?: string;
  publishedUrl?: string;
  metricsSource?: "manual";
  notifyOnPublish?: boolean;
  notes?: string;
  todos?: PostTodo[];
  documents?: PostDocument[];
  chat?: PostChatMessage[];
  activity?: PostActivityEntry[];
  /** Hasta diez archivos en el orden de publicación; `mediaUrl` queda solo para posts antiguos. */
  media?: PostMedia[];
  platformSettings?: Partial<Record<SocialNetwork, PlatformSettings>>;
  workflowStatusId?: string | null;
  assigneeIds?: string[];
  color?: string;
  customFields?: Record<string, string | number | boolean | null>;
}

/** `CoverKind` sin importar el componente en módulos que corren en el servidor. */
export type CoverKindValue = CoverKind;

export interface PostMedia {
  id: string;
  kind: "image" | "video";
  name: string;
  /** Archivo de la biblioteca; sin él, `url` contiene el dato heredado. */
  assetId?: string;
  url?: string;
}

export interface PlatformSettings {
  /** Con valor, esta red deja de heredar el copy general. */
  caption?: string;
  format?: PostFormat;
  title?: string;
  link?: string;
  boardName?: string;
  firstComment?: string;
  location?: string;
  subreddit?: string;
  flair?: string;
  topicType?: "STANDARD" | "EVENT" | "OFFER";
  callToAction?: string;
  couponCode?: string;
  privacy?: string;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  color: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "date" | "url" | "checkbox";
  options?: { id: string; label: string; color: string }[];
}

export interface PostTodo {
  id: string;
  text: string;
  done: boolean;
}

export interface PostDocument {
  id: string;
  name: string;
  url: string;
  folder?: string;
}

export interface PostChatMessage {
  id: string;
  author: string;
  text: string;
  at: string; // ISO
}

export interface PostActivityEntry {
  id: string;
  author: string;
  text: string;
  at: string; // ISO
}

export type PostExtrasPatch = Partial<
  Pick<SocialPost, "notes" | "todos" | "documents" | "chat">
>;

export interface ContentIdea {
  id: string;
  brandId: string;
  title: string;
  notes: string;
  pillar: string;
  createdAt: string; // ISO
  convertedPostId?: string;
}

export type LeadStage = "nuevo" | "contactado" | "propuesta" | "ganado" | "perdido";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  value: number; // MXN al mes
  stage: LeadStage;
  notes: string;
  createdAt: string; // ISO
}

export type QuoteStatus = "Borrador" | "Enviada" | "Aceptada" | "Rechazada";

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  leadId: string;
  title: string;
  status: QuoteStatus;
  items: QuoteItem[];
  createdAt: string; // ISO
}

export type AutomationTrigger = "post_pending" | "post_changes" | "post_approved";
export type AutomationAction = "create_task" | "notify";

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  /** Texto de la tarea o notificación; {post} se sustituye por el título. */
  text: string;
  enabled: boolean;
  runs: number;
  lastRunAt?: string; // ISO
}

export type PostItem = SocialPost;

export interface BuyerPersona {
  id: string;
  name: string;
  ageRange: string;
  occupation: string;
  painPoints: string;
  motivation: string;
  accepted: boolean;
}

export interface BrandCore {
  whatTheySell: string;
  category: string;
  websiteUrl: string;
  toneOfVoice: string;
  pillars: string[];
  doWords: string[];
  dontWords: string[];
  personas: BuyerPersona[];
}

export type CommitmentPeriod =
  | "mes_actual"
  | "mes_anterior"
  | "trimestre"
  | "7d"
  | "30d"
  | "semana"
  | "mes"
  | "custom";

export interface PeriodCommitmentSnapshot {
  period: "mes_actual" | "mes_anterior" | "trimestre";
  postsCommitted: number;
  postsCompleted: number;
  StoriesCommitted: number;
  StoriesCompleted: number;
  storiesCommitted: number;
  storiesCompleted: number;
  reelsCommitted: number;
  reelsCompleted: number;
  adCampaignsCommitted: number;
  adCampaignsCompleted: number;
  adSpend?: number;
  reachTotal?: number;
  clicksTotal?: number;
  landingPageViewsPerWeek?: number;
  clicksPerWeek?: number;
}

export interface CustomCommitmentMetric {
  id: string;
  checked?: boolean;
  icon?: "globe" | "mouse" | "messages" | "reach";
  title?: string;
  subtitle?: string;
  target?: string;
  currentValue?: number;
  name?: string;
  unit?: string;
  value?: number | string;
}

export interface AccountCommitment {
  postsCommitted: number;
  postsCompleted: number;
  StoriesCommitted: number;
  StoriesCompleted: number;
  storiesCommitted: number;
  storiesCompleted: number;
  reelsCommitted: number;
  reelsCompleted: number;
  adCampaignsCommitted: number;
  adCampaignsCompleted: number;
  period: "mes_actual" | "mes_anterior" | "trimestre";
  periodHistory: {
    mes_actual: PeriodCommitmentSnapshot;
    mes_anterior: PeriodCommitmentSnapshot;
    trimestre: PeriodCommitmentSnapshot;
  };
  customMetrics?: CustomCommitmentMetric[];
  hasDeclaredCommitments?: boolean;
}

export type BrandHealthStatus = "completa" | "en_progreso" | "en_riesgo" | "sin_compromisos";

export interface BrandWorkspace {
  mediaFolders?: string[];
  workflowStatuses?: WorkflowStatus[];
  customFieldDefinitions?: CustomFieldDefinition[];
  id: string;
  name: string;
  slug: string;
  handle: string;
  shareToken: string;
  initials: string;
  initial: string;
  color: string;
  avatarBg: string;
  avatarColor: string;
  industry: string;
  city: string;
  connectedNetworks: SocialNetwork[];
  Networks: SocialNetwork[];
  monthlyPostTarget: number;
  monthlyBudget: number;
  monthlySpend?: number;
  adBudget: number;
  hasPaidAds: boolean;
  paidAdsLabel: "con pauta" | "sin pauta";
  healthStatus: BrandHealthStatus;
  healthScore: number;
  status?: string;
  archived?: boolean;
  commitments: AccountCommitment;
  core: BrandCore;
  bioLink: {
    handle: string;
    headline: string;
    whatsapp: string;
    buttons: { id: string; label: string; url: string }[];
  };
}

export type BrandAccount = BrandWorkspace;
export type Brand = BrandWorkspace;

export type TaskDueBucket = "overdue" | "today" | "tomorrow" | "upcoming";
export type TaskPriority = "Alta" | "Media" | "Baja" | "alta" | "media" | "baja";
export type TaskStatus =
  | "pendiente"
  | "en_curso"
  | "completada"
  | "Pendiente"
  | "En curso"
  | "Completada"
  | "todo"
  | "in_progress"
  | "done";

export interface AgencyTask {
  id: string;
  brandId: string;
  title: string;
  description?: string;
  dueLabel: string;
  dueDate: string; // ISO YYYY-MM-DD
  dueBucket?: TaskDueBucket;
  assignee: string;
  assigneeId: string;
  assigneeName: string;
  assigneeInitial: string;
  listName: string;
  listId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  completed: boolean;
  completedAt?: string;
  estimatedMinutes?: number;
  spentMinutes?: number;
  highlighted?: boolean;
  tags: string[];
}

export interface TaskListDef {
  id: string;
  brandId: string;
  name: string;
}

export type TaskItem = AgencyTask;
export type Task = AgencyTask;

export interface NotebookItem {
  id: string;
  brandId: string;
  title: string;
  subtitle: string;
  stamp?: string;
  variant?: "post" | "report" | "space" | "brand";
  category: string;
  content: string;
  bgGradient: string;
  accentColor: string;
  updatedAt: string;
  updatedBy: string;
  isPinned: boolean;
}

export type NotebookNote = NotebookItem;

export interface MediaAsset {
  id: string;
  brandId: string;
  name: string;
  kind: "video" | "image" | "pdf" | "doc";
  cover: CoverKind;
  sizeLabel: string;
  aiTags: string[];
  folder: string;
  uploadedAt: string;
  usedInPosts: number;
}

export interface BrandProject {
  id: string;
  brandId: string;
  title: string;
  description: string;
  progress: number;
  status: "En curso" | "Revisión" | "Completado";
  dueDate: string;
  deliverablesCount: number;
  pinned?: boolean;
  archived?: boolean;
}

export interface AdCreative {
  id: string;
  brandId: string;
  name: string;
  platform: "Meta" | "Google" | "TikTok";
  cover: CoverKind;
  status: "Activo" | "Pausado";
  spend: number;
  results: number;
  resultLabel: string;
  cpa: number;
  ctr: number;
  clickScore: number;
  hookScore: number;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  sender: string;
  senderInitials: string;
  text: string;
  time: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: "brand" | "direct";
  brandId?: string;
  unread: number;
}

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

export type ActivityEventType =
  | "task_completed"
  | "task_started"
  | "post_published"
  | "post_submitted"
  | "post_approved"
  | "notebook_updated"
  | "commitment_updated"
  | "session_active";

export interface ActivityEvent {
  id: string;
  memberId: string;
  brandId?: string;
  type: ActivityEventType;
  timestamp: string; // ISO string
  durationMinutes?: number;
  metadata?: Record<string, string | number | boolean>;
}

export type RecommendationMetricKey = "posts" | "reels" | "stories" | "ads";

export type RecommendationRuleId =
  | "CONSISTENT_CAPACITY_UPGRADE"
  | "PAID_ADS_CONVERSION_TRACKING"
  | "OVERLOAD_RISK_ADJUSTMENT"
  | "STORY_CADENCE_BOOST"
  | "REELS_ENGAGEMENT_EXPANSION";

export interface AccountRecommendation {
  id: string;
  brandId: string;
  brandName: string;
  brandInitial: string;
  brandColor: string;
  brandBg?: string;
  metricKey: RecommendationMetricKey;
  metricTitle?: string;
  title?: string;
  priority?: "alta" | "media" | "baja" | "Alta" | "Media" | "Baja";
  icon?: "globe" | "mouse" | "messages" | "reach";
  currentCommitted: number;
  completedLastPeriod: number;
  recommendedCommitted: number;
  deltaPercent: number;
  ruleId: RecommendationRuleId;
  reason: string;
  dataSourceLabel: string;
  applied: boolean;
}

export type DashboardWidgetId =
  | "tareas"
  | "libretas"
  | "hoy"
  | "notificaciones"
  | "aprobaciones"
  | "grafica_ads"
  | "ads_activos"
  | "proyectos_criticos";

export type DashboardWidgetSpan = 1 | 2 | 3;

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  description: string;
  visible: boolean;
  enabled?: boolean;
  order: number;
  column: "left" | "right";
  span?: DashboardWidgetSpan;
}

export interface OnboardingProgress {
  brandCreatedOrSelected: boolean;
  taskCreatedOrCompleted: boolean;
  postCreatedOrScheduled: boolean;
  teamCheckedOrInvited: boolean;
  dismissed: boolean;
  minimized: boolean;
  manualOverrides?: Record<string, boolean>;
}

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
  team: TeamMember[];
  invitations: TeamInvitation[];
  activityEvents: ActivityEvent[];
  notifications: WorkspaceNotification[];
  widgets: DashboardWidgetConfig[];
  onboarding: OnboardingProgress;
  dismissedRecommendationIds: string[];
  appliedRecommendationsMap: Record<string, boolean>;
}
