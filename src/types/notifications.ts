
export type NotificationChannel = 'in_app' | 'email' | 'push';
export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed';
export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  read: boolean;
  metadata: Record<string, any>;
  template_id?: string;
  scheduled_for?: string;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  channels: NotificationChannel[];
  categories: string[];
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  subject_template: string;
  body_template: string;
  default_channels: NotificationChannel[];
  created_at: string;
  updated_at: string;
}

export interface SendNotificationParams {
  userIds: string[]; // List of user IDs to send to
  templateCode?: string; // If using a template
  title?: string; // If not using a template
  message?: string; // If not using a template
  type?: NotificationType;
  data?: Record<string, any>; // Variables for template
  channels?: NotificationChannel[]; // Override user preferences or default channels
  scheduledFor?: Date;
}
