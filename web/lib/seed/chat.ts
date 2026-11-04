import type { ChatChannel, ChatMessage } from "../types";

/** Canales y mensajes de ejemplo: solo los usa el modo demo. */
export const seedChannels = (): ChatChannel[] => [
      { id: "ch-bruma", name: "# café-bruma", type: "brand", brandId: "brand-bruma", unread: 2 },
      { id: "ch-min", name: "# min-marroquinería", type: "brand", brandId: "brand-min", unread: 0 },
      { id: "ch-norte", name: "# clínica-norte", type: "brand", brandId: "brand-norte", unread: 1 },
      { id: "ch-dm-lucia", name: "Lucía Ramírez (Diseño)", type: "direct", unread: 0 },
      { id: "ch-dm-diego", name: "Diego Morales (Paid Media)", type: "direct", unread: 0 },
];

export const seedMessages = (): ChatMessage[] => [
      {
        id: "msg-1",
        channelId: "ch-bruma",
        sender: "Lucía Ramírez",
        senderInitials: "LR",
        text: "Subí las portadas corregidas del lote de Coatepec y el Reel de V60 con subtítulos.",
        time: "10:14",
      },
      {
        id: "msg-2",
        channelId: "ch-bruma",
        sender: "Jair Bonilla",
        senderInitials: "JB",
        text: "Perfecto. Elena dejó un comentario en el post del panqué pidiendo cambiar la hora a las 8:00 am. En cuanto quede, le mandamos la liga final.",
        time: "10:28",
      },
      {
        id: "msg-3",
        channelId: "ch-min",
        sender: "Diego Morales",
        senderInitials: "DM",
        text: "El anuncio de la bota Chelsea en piel avellana llegó a Click Score 100 con CTR de 5.40%.",
        time: "11:05",
      },
];
