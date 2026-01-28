import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';

export function UserManual() {
  const [exporting, setExporting] = useState(false);

  const sections = [
    {
      title: 'Introducción y Objetivo',
      content: [
        'El sistema centraliza la operación de grúas, servicios, clientes, operadores e inventario.',
        'Este manual está dirigido a administradores y operadores que gestionan procesos diarios.',
      ],
    },
    {
      title: 'Acceso al Sistema',
      content: [
        'Requisitos: conexión a internet y navegador actualizado.',
        'Inicio de sesión: ingresar correo y contraseña proporcionados por la empresa.',
        'Interfaz principal: barra superior con navegación y módulos organizados por pestañas.',
      ],
    },
    {
      title: 'Gestión de Catálogos',
      content: [
        'Agregar: ir a Configuración → Catálogos, seleccionar tipo y crear elemento.',
        'Editar: seleccionar elemento y usar la opción de edición.',
        'Eliminar: usar la papelera en el elemento correspondiente.',
        'Consulta: filtrar por texto y revisar el estado activo.',
      ],
    },
    {
      title: 'Procesos Operativos',
      content: [
        'Servicios: crear, asignar, cambiar estados, revisar costos y cierre.',
        'Grúas: registrar unidades, estados, mantenimiento y documentos.',
        'Operadores: registrar datos, licencias y asignaciones.',
        'Clientes: alta de información, contactos y requisitos de facturación.',
      ],
    },
    {
      title: 'Reportes y Consultas',
      content: [
        'Filtrar información por estado, fecha y tipo.',
        'Exportar información desde las vistas con acciones disponibles.',
        'Usar búsquedas para localizar registros específicos.',
      ],
    },
    {
      title: 'Configuración y Mantenimiento',
      content: [
        'Ajustar parámetros de empresa y apariencia en Configuración.',
        'Gestionar usuarios y roles con permisos adecuados.',
        'Respaldos disponibles para administradores autorizados.',
      ],
    },
    {
      title: 'Solución de Problemas Comunes',
      content: [
        'No veo datos: verificar que el usuario pertenece a la empresa correcta.',
        'No puedo editar: revisar permisos del rol asignado.',
        'Catálogo no se actualiza: refrescar vista y validar estado activo.',
      ],
    },
    {
      title: 'Glosario y Recursos Adicionales',
      content: [
        'Servicio: registro operativo con estados y costos.',
        'Catálogo: listas configurables por empresa.',
        'Soporte: contactar al administrador de la empresa.',
      ],
    },
  ];

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      let y = 60;
      doc.setFontSize(18);
      doc.text('Manual de Usuario', 40, y);
      y += 30;
      doc.setFontSize(12);
      sections.forEach((sec, index) => {
        if (y > 760) {
          doc.addPage();
          y = 60;
        }
        doc.setFontSize(14);
        doc.text(`${index + 1}. ${sec.title}`, 40, y);
        y += 22;
        doc.setFontSize(11);
        sec.content.forEach((line) => {
          const wrapped = doc.splitTextToSize(`• ${line}`, 520);
          wrapped.forEach((lineWrapped: string) => {
            if (y > 780) {
              doc.addPage();
              y = 60;
            }
            doc.text(lineWrapped, 60, y);
            y += 18;
          });
          y += 6;
        });
        y += 6;
      });
      doc.save('manual_usuario.pdf');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Manual de Usuario</CardTitle>
            <CardDescription>Guía completa de uso del sistema</CardDescription>
          </div>
        </div>
        <Button onClick={handleExportPDF} disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exportando...' : 'Exportar PDF'}
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] p-6">
            <div className="space-y-8">
              {sections.map((sec, idx) => (
                <div key={sec.title} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium">{idx + 1}</span>
                      </div>
                      <h2 className="text-xl font-semibold">{sec.title}</h2>
                    </div>
                  </div>
                  <Separator />
                  <ul className="list-disc pl-6 space-y-2">
                    {sec.content.map((line) => (
                      <li key={line} className="text-sm">{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Mejores Prácticas</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Usar estados consistentes en servicios.</li>
                  <li>Mantener catálogos actualizados y activos.</li>
                  <li>Revisar permisos antes de operaciones críticas.</li>
                  <li>Realizar respaldos periódicos según políticas.</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
