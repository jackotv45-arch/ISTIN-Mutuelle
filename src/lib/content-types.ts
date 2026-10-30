export type AnnouncementItem = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  author: string;
  image: string;
  published?: boolean;
};

export type EventItem = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  dateLabel: string;
  startAt: string;
  location: string;
  organizer: string;
  statusLabel: string;
  image: string;
  practicalInfo: string[];
  registrationEnabled: boolean;
  published?: boolean;
};
