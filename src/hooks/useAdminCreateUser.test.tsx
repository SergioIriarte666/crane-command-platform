import { renderHook, waitFor } from '@testing-library/react';
import { useAdminCreateUser } from './useSettings';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

// Mock dependencies
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

const mockIsSuperAdmin = vi.fn();
const mockAuthUser = { tenant: { id: 'tenant-123' } };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    authUser: mockAuthUser,
    isSuperAdmin: mockIsSuperAdmin,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useAdminCreateUser', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should call admin-create-user function with correct arguments', async () => {
    mockIsSuperAdmin.mockReturnValue(false);
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useAdminCreateUser(), { wrapper });

    await result.current.mutateAsync({
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'operator',
      mustChangePassword: true,
    });

    expect(mockInvoke).toHaveBeenCalledWith('admin-create-user', {
      body: {
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'operator',
        tenantId: 'tenant-123',
        mustChangePassword: true,
      },
    });
  });

  it('should handle errors from the edge function', async () => {
    mockIsSuperAdmin.mockReturnValue(false);
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Function error') });

    const { result } = renderHook(() => useAdminCreateUser(), { wrapper });

    await expect(result.current.mutateAsync({
      email: 'fail@example.com',
      fullName: 'Fail User',
      role: 'operator',
    })).rejects.toThrow('Function error');

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Error al crear usuario'));
  });

  it('should handle functional errors returned in data', async () => {
    mockIsSuperAdmin.mockReturnValue(false);
    mockInvoke.mockResolvedValue({ data: { error: 'Logic error' }, error: null });

    const { result } = renderHook(() => useAdminCreateUser(), { wrapper });

    await expect(result.current.mutateAsync({
      email: 'fail@example.com',
      fullName: 'Fail User',
      role: 'operator',
    })).rejects.toThrow('Logic error');
  });

  it('should allow super admin to specify tenantId', async () => {
    mockIsSuperAdmin.mockReturnValue(true);
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useAdminCreateUser(), { wrapper });

    await result.current.mutateAsync({
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'operator',
      tenantId: 'other-tenant-456',
    });

    expect(mockInvoke).toHaveBeenCalledWith('admin-create-user', {
      body: {
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'operator',
        tenantId: 'other-tenant-456',
        mustChangePassword: undefined,
      },
    });
  });
});
