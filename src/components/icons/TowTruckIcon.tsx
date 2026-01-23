import React from 'react';

export const TowTruckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Ruedas */}
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
    
    {/* Cabina (Estilo moderno/Lucide) */}
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <path d="M17 18H7" /> 
    
    {/* Brazo de Grúa y Gancho */}
    <path d="M2 12h5" /> 
    <path d="M5 12l7-6" /> 
    <path d="M12 6v4" /> 
    <path d="M12 10a2 2 0 0 0-2 2" /> 
  </svg>
);
