import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/hooks/useSettings';

/**
 * Converts a HEX color to HSL values
 * @param hex - Color in HEX format (e.g., "#ff6a00")
 * @returns HSL values as "H S% L%" string for CSS variables
 */
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Convert to CSS HSL format (without hsl() wrapper, just values)
  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return `${hDeg} ${sPct}% ${lPct}%`;
}

export function applyPrimaryColor(primaryColor: string | null | undefined) {
  if (primaryColor && primaryColor.startsWith('#')) {
    const hsl = hexToHSL(primaryColor);

    document.documentElement.style.setProperty('--primary', hsl);
    document.documentElement.style.setProperty('--accent', hsl);
    document.documentElement.style.setProperty('--ring', hsl);
    document.documentElement.style.setProperty('--sidebar-primary', hsl);
    document.documentElement.style.setProperty('--sidebar-ring', hsl);

    const hPart = hsl.split(' ')[0];
    const sPart = parseInt(hsl.split(' ')[1]);
    const lPart = parseInt(hsl.split(' ')[2]);
    const lighterL = Math.min(lPart + 15, 70);
    const gradientPrimary = `linear-gradient(135deg, hsl(${hsl}), hsl(${hPart} ${Math.max(sPart - 10, 0)}% ${lighterL}%))`;
    document.documentElement.style.setProperty('--gradient-primary', gradientPrimary);

    const shadowColored = `0 10px 30px -10px hsl(${hsl} / 0.3)`;
    document.documentElement.style.setProperty('--shadow-colored', shadowColored);

    document.documentElement.style.setProperty('--sidebar-background', hsl);
    const accentL = Math.max(lPart - 10, 0);
    const borderL = Math.max(lPart - 12, 0);
    const accent = `${hPart} ${sPart}% ${accentL}%`;
    const border = `${hPart} ${sPart}% ${borderL}%`;
    document.documentElement.style.setProperty('--sidebar-accent', accent);
    document.documentElement.style.setProperty('--sidebar-border', border);
  } else {
    document.documentElement.style.removeProperty('--primary');
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--ring');
    document.documentElement.style.removeProperty('--sidebar-primary');
    document.documentElement.style.removeProperty('--sidebar-ring');
    document.documentElement.style.removeProperty('--gradient-primary');
    document.documentElement.style.removeProperty('--shadow-colored');
    document.documentElement.style.removeProperty('--sidebar-background');
    document.documentElement.style.removeProperty('--sidebar-accent');
    document.documentElement.style.removeProperty('--sidebar-border');
  }
}

/**
 * Hook that applies the tenant's primary color to CSS variables
 * Listens to both authUser (initial load) and tenant query (updates)
 */
export function useThemeColor() {
  const { authUser } = useAuth();
  const { data: tenant } = useTenant();

  // Apply color from tenant query (gets updated when settings change)
  useEffect(() => {
    if (tenant?.primary_color) {
      applyPrimaryColor(tenant.primary_color);
    }
  }, [tenant?.primary_color]);

  // Initial load from authUser before tenant query resolves
  useEffect(() => {
    if (!tenant && authUser?.tenant?.primary_color) {
      applyPrimaryColor(authUser.tenant.primary_color);
    }
  }, [authUser?.tenant?.primary_color, tenant]);
}
