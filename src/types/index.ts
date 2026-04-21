import { Request } from 'express';

export interface AuthPayload {
  adminId: number;
  username: string;
  role: string;
}

export interface AuthRequest extends Request {
  admin?: AuthPayload;
}

export interface Admin {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
}

export interface Contact {
  id: number;
  full_name: string;
  email: string;
  subject: string | null;
  message: string;
  ip_address: string | null;
  status: 'unread' | 'read' | 'replied';
  replied_at: Date | null;
  created_at: Date;
}

export interface ProjectRequest {
  id: number;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  project_type: 'web' | 'mobile' | 'desktop' | 'custom';
  project_title: string;
  description: string;
  budget_range: string | null;
  timeline: string | null;
  tech_preferences: string | null;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  priority: 'low' | 'normal' | 'high';
  admin_notes: string | null;
  assigned_to: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChatSession {
  id: number;
  session_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'active' | 'closed' | 'archived';
  is_admin_joined: boolean;
  started_at: Date;
  last_message_at: Date | null;
  ended_at: Date | null;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  sender_type: 'visitor' | 'admin' | 'bot';
  sender_name: string | null;
  content: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  sent_at: Date;
}

export interface Testimonial {
  id: number;
  client_name: string;
  client_title: string | null;
  client_company: string | null;
  avatar_url: string | null;
  content: string;
  rating: number;
  project_type: string | null;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: Date;
}

export interface PortfolioProject {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  category: 'web' | 'mobile' | 'desktop' | 'custom';
  tech_stack: string;
  thumbnail_url: string | null;
  images: string | null;
  live_url: string | null;
  github_url: string | null;
  client_name: string | null;
  completion_date: Date | null;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface PQRS {
  id: number;
  radicado: string;
  type: 'peticion' | 'queja' | 'reclamo' | 'sugerencia';
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  admin_comments: string | null;
  attachments: string[];
  ip_address: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
