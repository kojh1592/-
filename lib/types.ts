export type ProfileStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string | null;
  name: string;
  station: string;
  role: string;
  rank: string;
  status: ProfileStatus;
  is_admin: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  category: string;
  author_id: string | null;
  title: string;
  content: string;
  anonymous: boolean;
  station: string;
  role: string;
  rank: string;
  author_name: string;
  extra: string | null;
  extra2: string | null;
  link: string | null;
  photo_paths: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}
