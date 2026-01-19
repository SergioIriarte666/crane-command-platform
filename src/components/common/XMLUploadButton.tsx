import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

interface XMLUploadButtonProps {
  onFileParsed: (data: any[], fileName: string) => void;
  parser: { parseXMLFile: (file: File) => Promise<{ data: any[]; errors: string[]; warnings: string[] }> };
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export function XMLUploadButton({ 
  onFileParsed, 
  parser, 
  label = 'Importar XML',
  variant = 'outline',
  disabled = false
}: XMLUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await parser.parseXMLFile(file);
      
      if (result.errors.length > 0) {
        console.error('XML Parse Errors:', result.errors);
      }
      
      if (result.warnings.length > 0) {
        console.warn('XML Parse Warnings:', result.warnings);
      }

      onFileParsed(result.data, file.name);
    } catch (error) {
      console.error('Error parsing XML:', error);
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button 
        variant={variant} 
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        {label}
      </Button>
    </>
  );
}
