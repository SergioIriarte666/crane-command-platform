import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
           if (id.includes('node_modules')) {
             if (id.includes('jspdf') || id.includes('html2canvas')) {
               return 'pdf-vendor';
             }
             if (id.includes('xlsx') || id.includes('papaparse') || id.includes('date-fns')) {
               return 'data-utils-vendor';
             }
             if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('cmdk') || id.includes('embla-carousel-react') || id.includes('vaul') || id.includes('sonner')) {
               return 'ui-vendor';
             }
             if (id.includes('recharts')) {
               return 'charts-vendor';
             }
             if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) {
               return 'forms-vendor';
             }
             if (id.includes('@supabase') || id.includes('@tanstack')) {
               return 'data-vendor';
             }
             if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react/')) {
               return 'react-vendor';
             }
           }
         },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
