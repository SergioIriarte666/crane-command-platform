import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, Download, Eye, CheckCircle, XCircle, AlertTriangle,
  FileText, Loader2, AlertCircle, X
} from 'lucide-react';
import { useEnhancedCSVUpload } from '@/hooks/useEnhancedCSVUpload';
import { AnimatedProgress, AnimatedStatCard, BatchUploadAnimations } from './batch';
import { cn } from '@/lib/utils';

interface EnhancedCSVUploadServicesProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const EnhancedCSVUploadServices = ({ isOpen, onClose, onSuccess }: EnhancedCSVUploadServicesProps) => {
  const {
    file, validationResult, isInitialized, isValidating, isUploading,
    uploadProgress, setFile, parseFile, validateData,
    uploadServices, downloadTemplate, downloadExcelTemplate, reset, initializeUploader
  } = useEnhancedCSVUpload();

  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initializeUploader();
    }
  }, [isOpen, initializeUploader]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    
    if (selectedFile && (allowedTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
    }
  }, [setFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, [setFile]);

  const handlePreview = async () => {
    if (isValidating) return;
    const parsedData = await parseFile();
    if (parsedData && parsedData.length > 0) {
      await validateData(parsedData);
    }
  };

  const handleUpload = async () => {
    const result = await uploadServices();
    if (result?.success && onSuccess) {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        onSuccess(result.processed);
        handleClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Carga Masiva de Servicios
          </DialogTitle>
        </DialogHeader>

        <BatchUploadAnimations
          isActive={isUploading}
          onComplete={showConfetti}
          sourceRef={uploadButtonRef}
          targetRef={progressBarRef}
        />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Templates */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Plantilla CSV
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcelTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Plantilla Excel
              </Button>
            </div>

            {/* Drag & Drop Zone */}
            <Card>
              <CardContent className="pt-6">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary"
                  )}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">Arrastra tu archivo CSV o Excel aquí</p>
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" id="csv-upload" />
                  <Button variant="outline" onClick={(e) => e.stopPropagation()}>
                    <label htmlFor="csv-upload" className="cursor-pointer">Seleccionar Archivo</label>
                  </Button>
                </div>

                {file && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePreview} disabled={isValidating || !isInitialized}>
                        {isValidating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        Analizar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={reset}><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            {uploadProgress && (
              <Card ref={progressBarRef}>
                <CardContent className="pt-6">
                  <AnimatedProgress value={uploadProgress.percentage} showPulse />
                  <p className="text-sm mt-2 text-muted-foreground">
                    {uploadProgress.stage === 'uploading' 
                      ? `Lote ${uploadProgress.currentBatch} de ${uploadProgress.totalBatches} - ${uploadProgress.processed}/${uploadProgress.total}`
                      : 'Procesando...'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Validation Results */}
            {validationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {validationResult.isValid 
                      ? <CheckCircle className="w-5 h-5 text-green-500" />
                      : <AlertCircle className="w-5 h-5 text-orange-500" />}
                    Resultado del Análisis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <AnimatedStatCard label="Total" value={validationResult.totalRows} variant="total" />
                    <AnimatedStatCard label="Válidas" value={validationResult.validCount} variant="valid" />
                    <AnimatedStatCard label="Errores" value={validationResult.errorCount} variant="error" />
                    <AnimatedStatCard label="Advertencias" value={validationResult.warningCount} variant="warning" />
                  </div>

                  {validationResult.errors.length > 0 && (
                    <div className="max-h-40 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Fila</TableHead>
                            <TableHead>Mensaje</TableHead>
                            <TableHead className="w-24">Tipo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.errors.slice(0, 10).map((error, i) => (
                            <TableRow key={i}>
                              <TableCell>{error.row >= 0 ? error.row + 1 : '-'}</TableCell>
                              <TableCell className="text-sm">{error.message}</TableCell>
                              <TableCell>
                                <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                                  {error.severity === 'error' ? <XCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                                  {error.severity}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {validationResult.validCount > 0 && (
                    <Button 
                      ref={uploadButtonRef}
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full"
                      size="lg"
                    >
                      {isUploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                      Cargar {validationResult.validCount} Servicios
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
