import { Navigate } from 'react-router-dom';

// Onboarding page is disabled - only Super Admin can create tenants
// Users must be invited by an admin to join a company
export default function Onboarding() {
  return <Navigate to="/auth/login" replace />;
}
