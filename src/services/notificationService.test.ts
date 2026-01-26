
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notificationService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(),
        })),
        order: vi.fn(),
      })),
      upsert: vi.fn(),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(), // chaining for markAllAsRead
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call send-notification edge function', async () => {
    const mockParams = {
      userIds: ['user1'],
      title: 'Test',
      message: 'Hello',
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const result = await NotificationService.send(mockParams);

    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-notification', {
      body: mockParams,
    });
    expect(result).toEqual({ success: true });
  });

  it('should get preferences for authenticated user', async () => {
    const mockUser = { id: 'user1' };
    const mockPrefs = { user_id: 'user1', channels: ['in_app'] };

    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
    
    // Mock chain for select
    const mockSingle = vi.fn().mockResolvedValue({ data: mockPrefs, error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as any).mockReturnValue({ select: mockSelect });

    const prefs = await NotificationService.getPreferences();

    expect(supabase.from).toHaveBeenCalledWith('notification_preferences');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user1');
    expect(prefs).toEqual(mockPrefs);
  });

  it('should update preferences', async () => {
    const mockUser = { id: 'user1' };
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
    
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ upsert: mockUpsert });

    await NotificationService.updatePreferences({ settings: { foo: 'bar' } });

    expect(supabase.from).toHaveBeenCalledWith('notification_preferences');
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user1',
      settings: { foo: 'bar' },
    }));
  });
});
