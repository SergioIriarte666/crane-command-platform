import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import type { BankTransactionInsert } from '@/types/finance';

interface ImportBankStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (transactions: Omit<BankTransactionInsert, 'tenant_id'>[]) => void;
  isImporting?: boolean;
}

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  reference?: string;
  isCredit: boolean;
  isValid: boolean;
  error?: string;
}

const COLUMN_MAPPINGS = {
  date: ['fecha', 'date', 'fecha operación', 'fecha valor'],
  description: ['descripción', 'concepto', 'description', 'detalle', 'movimiento'],
  amount: ['monto', 'importe', 'amount', 'cantidad', 'valor'],
  reference: ['referencia', 'reference', 'folio', 'número'],
  credit: ['abono', 'crédito', 'credit', 'depósito'],
  debit: ['cargo', 'débito', 'debit', 'retiro'],
};

export function ImportBankStatementDialog({ 
  open, 
  onOpenChange, 
  onImport,
  isImporting 
}: ImportBankStatementDialogProps) {
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [bankName, setBankName] = useState('');

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setColumnMap({});
    setParsedRows([]);
    setBankName('');
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('El archivo no contiene suficientes datos');
      }

      const headerRow = (jsonData[0] as string[]).map(h => String(h || '').toLowerCase().trim());
      const dataRows = jsonData.slice(1).filter((row: any) => row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''));

      setHeaders(headerRow);
      setRawData(dataRows);

      // Auto-detect column mappings
      const autoMap: Record<string, string> = {};
      for (const [field, keywords] of Object.entries(COLUMN_MAPPINGS)) {
        const matchedIndex = headerRow.findIndex(h => keywords.some(k => h.includes(k)));
        if (matchedIndex !== -1) {
          autoMap[field] = String(matchedIndex);
        }
      }
      setColumnMap(autoMap);
      setStep('map');
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  };

  const parseRows = useCallback(() => {
    const dateIdx = parseInt(columnMap.date);
    const descIdx = parseInt(columnMap.description);
    const amountIdx = parseInt(columnMap.amount);
    const refIdx = columnMap.reference ? parseInt(columnMap.reference) : null;
    const creditIdx = columnMap.credit ? parseInt(columnMap.credit) : null;
    const debitIdx = columnMap.debit ? parseInt(columnMap.debit) : null;

    const parsed: ParsedRow[] = rawData.map((row) => {
      try {
        const dateValue = row[dateIdx];
        let parsedDate: Date;
        
        if (typeof dateValue === 'number') {
          // Excel serial date
          parsedDate = new Date((dateValue - 25569) * 86400 * 1000);
        } else {
          parsedDate = new Date(dateValue);
        }

        if (isNaN(parsedDate.getTime())) {
          return { date: '', description: '', amount: 0, isCredit: false, isValid: false, error: 'Fecha inválida' };
        }

        const description = String(row[descIdx] || '').trim();
        if (!description) {
          return { date: '', description: '', amount: 0, isCredit: false, isValid: false, error: 'Sin descripción' };
        }

        let amount: number;
        let isCredit: boolean;

        if (creditIdx !== null && debitIdx !== null) {
          const credit = parseFloat(String(row[creditIdx] || 0).replace(/[^0-9.-]/g, '')) || 0;
          const debit = parseFloat(String(row[debitIdx] || 0).replace(/[^0-9.-]/g, '')) || 0;
          amount = credit || debit;
          isCredit = credit > 0;
        } else {
          amount = parseFloat(String(row[amountIdx] || 0).replace(/[^0-9.-]/g, '')) || 0;
          isCredit = amount > 0;
          amount = Math.abs(amount);
        }

        if (amount === 0) {
          return { date: '', description: '', amount: 0, isCredit: false, isValid: false, error: 'Monto cero' };
        }

        return {
          date: parsedDate.toISOString().split('T')[0],
          description,
          amount,
          reference: refIdx !== null ? String(row[refIdx] || '').trim() : undefined,
          isCredit,
          isValid: true,
        };
      } catch {
        return { date: '', description: '', amount: 0, isCredit: false, isValid: false, error: 'Error de parseo' };
      }
    });

    setParsedRows(parsed);
    setStep('preview');
  }, [rawData, columnMap]);

  const handleImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    const transactions: Omit<BankTransactionInsert, 'tenant_id'>[] = validRows.map(row => ({
      transaction_date: row.date,
      description: row.description,
      amount: row.amount,
      reference: row.reference || null,
      is_credit: row.isCredit,
      bank_name: bankName || null,
      status: 'pending',
    }));

    onImport(transactions);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Estado de Cuenta
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube un archivo CSV o Excel con las transacciones bancarias'}
            {step === 'map' && 'Mapea las columnas del archivo a los campos requeridos'}
            {step === 'preview' && 'Revisa las transacciones antes de importar'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Arrastra un archivo o haz clic para seleccionar</p>
              <p className="text-sm text-muted-foreground mb-4">Formatos soportados: CSV, XLS, XLSX</p>
              <Input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileUpload}
                className="max-w-xs"
              />
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre del Banco (opcional)</Label>
                  <Input 
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)} 
                    placeholder="Ej: Banorte, BBVA, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label>Columna de Fecha *</Label>
                  <Select value={columnMap.date} onValueChange={(v) => setColumnMap(prev => ({ ...prev, date: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h || `Columna ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Columna de Descripción *</Label>
                  <Select value={columnMap.description} onValueChange={(v) => setColumnMap(prev => ({ ...prev, description: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h || `Columna ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Columna de Monto *</Label>
                  <Select value={columnMap.amount} onValueChange={(v) => setColumnMap(prev => ({ ...prev, amount: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h || `Columna ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Columna de Referencia</Label>
                  <Select value={columnMap.reference || ''} onValueChange={(v) => setColumnMap(prev => ({ ...prev, reference: v }))}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguna</SelectItem>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h || `Columna ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Columna de Abonos (Créditos)</Label>
                  <Select value={columnMap.credit || ''} onValueChange={(v) => setColumnMap(prev => ({ ...prev, credit: v }))}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguna</SelectItem>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h || `Columna ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Columna de Cargos (Débitos)</Label>
                  <Select value={columnMap.debit || ''} onValueChange={(v) => setColumnMap(prev => ({ ...prev, debit: v }))}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguna</SelectItem>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h || `Columna ${i + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Si tu archivo tiene columnas separadas para abonos y cargos, selecciónalas. 
                  Si solo tiene una columna de monto, los valores negativos serán cargos y positivos abonos.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  {validCount} válidas
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    {invalidCount} con errores
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 100).map((row, i) => (
                      <TableRow key={i} className={!row.isValid ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                        <TableCell>
                          {row.isValid ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <span title={row.error}>
                              <X className="h-4 w-4 text-red-600" />
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{row.date || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.description || row.error}</TableCell>
                        <TableCell>{row.reference || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${row.isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {row.isValid && `${row.isCredit ? '+' : '-'}$${row.amount.toLocaleString('es-MX')}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {parsedRows.length > 100 && (
                <p className="text-sm text-muted-foreground">Mostrando 100 de {parsedRows.length} registros</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          )}
          {step === 'map' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Atrás</Button>
              <Button 
                onClick={parseRows} 
                disabled={!columnMap.date || !columnMap.description || (!columnMap.amount && !columnMap.credit)}
              >
                Vista Previa
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('map')}>Atrás</Button>
              <Button onClick={handleImport} disabled={validCount === 0 || isImporting}>
                {isImporting ? 'Importando...' : `Importar ${validCount} transacciones`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
