export interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export type EventType = 'Pernikahan' | 'Perusahaan' | 'Ulang Tahun' | 'Konferensi' | 'Konser' | 'Lainnya';
