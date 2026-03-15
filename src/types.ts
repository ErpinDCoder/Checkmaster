export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  notes?: string;
  noteAuthorId?: string;
  noteAuthorName?: string;
  noteUpdatedAt?: any;
  dueDate?: string; // ISO string
  uid: string;
  eventId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Event {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  members: { [uid: string]: string }; // uid -> role
  memberJoinedAt?: { [uid: string]: any }; // uid -> timestamp
  nicknames?: { [uid: string]: string }; // uid -> nickname
  ownerColor?: string;
  memberColor?: string;
  completed?: boolean;
  lastReadAt?: { [uid: string]: any }; // uid -> timestamp
  createdAt: any;
  updatedAt: any;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export type EventType = 'Pernikahan' | 'Perusahaan' | 'Ulang Tahun' | 'Konferensi' | 'Konser' | 'Perjalanan' | 'Hari Besar' | 'Sekolah/Kampus' | 'Lainnya';

export interface ChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  senderName: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  deleted?: boolean;
  createdAt: any;
}
