import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, CheckCircle, AlertTriangle,
  Loader2, Code, X
} from 'lucide-react';
import { XMLCostParser, XMLCostData, XMLParseResult } from '@/utils/xmlParser/xmlCostParser';
import { useCatalogs } from '@/hooks/useCatalogs';
import { useCosts } from '@/hooks/useCosts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AnimatedProgress, AnimatedStatCard } from '@/components/services/batch';

interface XMLCostUploadProps {
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

export const XMLCostUpload = ({ isOpen, onClose, onSuccess }: XMLCostUploadProps) => {
  const { createCost } = useCosts();
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<XMLParseResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categoryMappings, setCategoryMappings] = useState<Record<number, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  
  const { catalogs: categories = [] } = useCatalogs('cost_category');
  const parser = new XMLCostParser();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/xml' || selectedFile.name.endsWith('.xml'))) {
      setFile(selectedFile);
      setParseResult(null);
      setCategoryMappings({});
    } else {
      toast.error('Por favor seleccione un archivo XML válido');
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/xml' || droppedFile.name.endsWith('.xml'))) {
      setFile(droppedFile);
      setParseResult(null);
      setCategoryMappings({});
    } else {
      toast.error('Por favor seleccione un archivo XML válido');
    }
  }, []);

  const handleAnalyzeFile = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    try {
      const result = await parser.parseXMLFile(file);
      setParseResult(result);
      
      // Initialize category mappings with auto-detected categories
      const initialMappings: Record<number, string> = {};
      result.data.forEach((item, index) => {
        initialMappings[index] = getDefaultCategoryId(item.categoria);
      });
      setCategoryMappings(initialMappings);
      
      if (result.success) {
        toast.success(`XML analizado: ${result.validRows} gastos encontrados`);
      } else {
        toast.error(`Error: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      toast.error('Error procesando el archivo XML');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDefaultCategoryId = (categoria?: string): string => {
    if (!categoria || categories.length === 0) return categories[0]?.id || '';
    
    const normalized = categoria.toLowerCase();
    
    if (normalized.includes('combustible') || normalized.includes('gasolina')) {
      return categories.find(c => c.name.toLowerCase().includes('combustible'))?.id || categories[0]?.id || '';
    }
    if (normalized.includes('mantenimiento') || normalized.includes('reparacion')) {
      return categories.find(c => c.name.toLowerCase().includes('mantenimiento'))?.id || categories[0]?.id || '';
    }
    if (normalized.includes('seguro')) {
      return categories.find(c => c.name.toLowerCase().includes('seguro'))?.id || categories[0]?.id || '';
    }
    if (normalized.includes('peaje')) {
      return categories.find(c => c.name.toLowerCase().includes('peaje'))?.id || categories[0]?.id || '';
    }
    
    return categories[0]?.id || '';
  };

  const handleUploadCosts = async () => {
    if (!parseResult?.success) return;
    
    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < parseResult.data.length; i++) {
        const xmlCost = parseResult.data[i];
        setUploadProgress(Math.round(((i + 1) / parseResult.data.length) * 100));
        
        const categoryId = categoryMappings[i] || getDefaultCategoryId(xmlCost.categoria);
        
        const fecha = typeof xmlCost.fecha === 'string' 
          ? xmlCost.fecha 
          : xmlCost.fecha.toISOString().split('T')[0];

        const notes = [
          xmlCost.proveedor ? `Proveedor: ${xmlCost.proveedor}` : '',
          xmlCost.numeroFactura ? `Factura: ${xmlCost.numeroFactura}` : '',
          xmlCost.rut ? `RUT: ${xmlCost.rut}` : ''
        ].filter(Boolean).join(' | ') || undefined;

        const costCode = `XML-${Date.now()}-${i}`;

        try {
          await createCost.mutateAsync({
            code: costCode,
            cost_date: fecha,
            description: xmlCost.descripcion,
            unit_value: xmlCost.monto,
            quantity: 1,
            subtotal: xmlCost.monto,
            tax_rate: 0,
            tax_amount: 0,
            discount: 0,
            total: xmlCost.monto,
            catalog_category_id: categoryId || undefined,
            notes,
            status: 'draft',
            supplier_name: xmlCost.proveedor || undefined,
          });
          successCount++;
        } catch (error) {
          console.error('Error inserting cost:', error);
          errorCount++;
        }
        
        // Small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (errorCount === 0) {
        toast.success(`${successCount} gastos cargados exitosamente`);
        onSuccess?.(successCount);
        handleClose();
      } else {
        toast.warning(`${successCount} cargados, ${errorCount} con error`);
      }
    } catch (error) {
      console.error('Error uploading costs:', error);
      toast.error('Error al cargar gastos');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setCategoryMappings({});
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Cargar Gastos desde XML
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Upload Area */}
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
                  onClick={() => document.getElementById('xml-upload')?.click()}
                >
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="mb-4 text-muted-foreground">Arrastra tu archivo XML aquí</p>
                  <input 
                    type="file" 
                    accept=".xml" 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    id="xml-upload" 
                  />
                  <Button variant="outline" onClick={(e) => e.stopPropagation()}>
                    <label htmlFor="xml-upload" className="cursor-pointer">Seleccionar XML</label>
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
                      <Button onClick={handleAnalyzeFile} disabled={isAnalyzing}>
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Code className="w-4 h-4 mr-2" />}
                        Analizar XML
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setFile(null); setParseResult(null); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            {isUploading && (
              <Card>
                <CardContent className="pt-6">
                  <AnimatedProgress value={uploadProgress} showPulse />
                  <p className="text-sm mt-2 text-muted-foreground text-center">
                    Cargando gastos...
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {parseResult && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <AnimatedStatCard label="Total" value={parseResult.totalRows} variant="total" />
                    <AnimatedStatCard label="Válidos" value={parseResult.validRows} variant="valid" />
                    <AnimatedStatCard label="Errores" value={parseResult.errors.length} variant="error" />
                    <AnimatedStatCard label="Advertencias" value={parseResult.warnings.length} variant="warning" />
                  </div>

                  {/* Errors/Warnings */}
                  {(parseResult.errors.length > 0 || parseResult.warnings.length > 0) && (
                    <div className="space-y-2">
                      {parseResult.errors.map((error, i) => (
                        <Badge key={`error-${i}`} variant="destructive" className="mr-2">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {error}
                        </Badge>
                      ))}
                      {parseResult.warnings.map((warning, i) => (
                        <Badge key={`warning-${i}`} variant="secondary" className="mr-2">
                          {warning}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Data Table */}
                  {parseResult.success && parseResult.data.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Categoría</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parseResult.data.slice(0, 15).map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="whitespace-nowrap">
                                {typeof item.fecha === 'string' 
                                  ? new Date(item.fecha).toLocaleDateString('es-CL')
                                  : item.fecha.toLocaleDateString('es-CL')}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">{item.descripcion}</TableCell>
                              <TableCell className="text-right font-medium">
                                ${item.monto.toLocaleString('es-CL')}
                              </TableCell>
                              <TableCell>{item.proveedor || '-'}</TableCell>
                              <TableCell>
                                <Select
                                  value={categoryMappings[index] || ''}
                                  onValueChange={(value) => setCategoryMappings(prev => ({...prev, [index]: value}))}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Categoría" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(cat => (
                                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {parseResult.data.length > 15 && (
                        <div className="p-2 text-center text-sm text-muted-foreground border-t">
                          ... y {parseResult.data.length - 15} registros más
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Button */}
                  {parseResult.validRows > 0 && (
                    <Button 
                      onClick={handleUploadCosts} 
                      disabled={isUploading}
                      className="w-full"
                      size="lg"
                    >
                      {isUploading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                      Cargar {parseResult.validRows} Gastos
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
