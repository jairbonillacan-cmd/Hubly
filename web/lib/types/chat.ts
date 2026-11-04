export interface ChatAttachment {
  kind: "post" | "grid" | "task" | "project" | "asset" | "ad" | "lead" | "automation" | "file" | "voice";
  id: string;
  title: string;
  meta?: string;
  href: string;
  /** Solo en `file` y `voice`: el binario vive en la biblioteca de medios. */
  mediaId?: string;
  mime?: string;
}

/** Mensaje en cola: lo envía el navegador de su autor al llegar la hora. */
export interface ChatScheduledMessage {
  id: string;
  channelId: string;
  text: string;
  sendAt: number;
  repeat: "none" | "weekly" | "monthly";
  authorId: string;
  sender: string;
  senderInitials: string;
}

export interface ChatReminder {
  id: string;
  channelId: string;
  messageId: string;
  text: string;
  remindAt: number;
  authorId: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  sender: string;
  senderInitials: string;
  /** Solo con el chat en tablas. */
  senderId?: string;
  senderAvatar?: string;
  isBot?: boolean;
  botButtons?: { id: string; texto: string; estilo?: string }[];
  text: string;
  time: string;
  /** Marca de tiempo en ms. Los mensajes de ejemplo no la tienen y cuentan como de hoy. */
  createdAt?: number;
  /** Id del mensaje al que responde, si es una respuesta en hilo. */
  parentId?: string;
  editedAt?: number;
  pinned?: boolean;
  /** Emoji → nombres de quienes reaccionaron. */
  reactions?: Record<string, string[]>;
  attachment?: ChatAttachment;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: "brand" | "direct" | "agency" | "general" | "self";
  brandId?: string;
  unread: number;
  description?: string;
  /** En un mensaje directo: la persona del equipo con quien se habla. */
  memberId?: string;
  archived?: boolean;
  emoji?: string;
  /** Canal privado: solo estas personas. Vacío o ausente, abierto a toda la agencia. */
  memberIds?: string[];
  /** Hay una mención sin leer para quien mira. */
  mentioned?: boolean;
  /** Preferencias de quien mira; en modo demo viven en su navegador. */
  muted?: boolean;
  listPinned?: boolean;
  hidden?: boolean;
}

