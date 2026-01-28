import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, ListTree, CheckCircle2, AlertTriangle, BookOpen, Search, Database, Users, Truck, ClipboardList } from 'lucide-react';
import jsPDF from 'jspdf';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { addCompanyHeader, addPageNumbers, mapTenantToCompanyInfo } from '@/lib/pdfUtils';
import { useTenant } from '@/hooks/useSettings';

export function UserManual() {
  const [exporting, setExporting] = useState(false);
  const { data: tenant } = useTenant();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sections = [
    {
      id: 'intro',
      title: 'Introducción y Objetivo',
      content: [
        'El sistema centraliza la operación de grúas, servicios, clientes, operadores e inventario.',
        'Este manual está dirigido a administradores y operadores que gestionan procesos diarios.',
        'Objetivo: ofrecer procedimientos claros, consistentes y auditables para todas las áreas.',
      ],
    },
    {
      id: 'access',
      title: 'Acceso al Sistema',
      content: [
        'Requisitos: conexión a internet y navegador actualizado.',
        'Inicio de sesión: ingresar correo y contraseña proporcionados por la empresa.',
        'Interfaz principal: navegación por pestañas y módulos en Configuración y Operación.',
        'Recuperación de acceso: usar la opción de restablecer contraseña si es necesario.',
      ],
    },
    {
      id: 'catalogs',
      title: 'Gestión de Catálogos',
      content: [
        'Agregar: Configuración → Catálogos, elegir tipo, completar código y nombre.',
        'Editar: abrir elemento, actualizar nombre o estado y guardar cambios.',
        'Eliminar: confirmar eliminación del elemento, revisar impactos en formularios.',
        'Consulta: usar búsqueda por texto, revisar estado activo e inactivo.',
        'Buenas prácticas: mantener códigos estandarizados y orden por prioridad.',
      ],
    },
    {
      id: 'operations',
      title: 'Procesos Operativos',
      content: [
        'Servicios: alta, asignación, avance de estados, costos, cierre y facturación.',
        'Grúas: registro de unidades, estados operativos, mantenimiento y documentación.',
        'Operadores: datos personales, licencias, asignaciones y vencimientos.',
        'Clientes: creación, contactos, requisitos de facturación y descuento por defecto.',
      ],
    },
    {
      id: 'reports',
      title: 'Reportes y Consultas',
      content: [
        'Filtrar información por estado, fecha y tipo.',
        'Exportar información a PDF y Excel desde las vistas habilitadas.',
        'Usar búsquedas para localizar registros específicos.',
        'Verificar consistencia de datos antes de exportar y compartir.',
      ],
    },
    {
      id: 'settings',
      title: 'Configuración y Mantenimiento',
      content: [
        'Empresa: datos fiscales, folios de servicio, preferencias visuales.',
        'Usuarios y Roles: alta de usuarios, asignación de permisos y revisiones periódicas.',
        'Respaldos: generación y resguardo por administradores con permisos.',
        'Parámetros: definir estados de servicio y catálogos críticos según operación.',
      ],
    },
    {
      id: 'troubleshooting',
      title: 'Solución de Problemas Comunes',
      content: [
        'No veo datos: verificar que el usuario pertenece a la empresa correcta.',
        'No puedo editar: revisar permisos del rol asignado.',
        'Catálogo no se actualiza: refrescar vista y validar estado activo.',
        'Errores de sincronización: revisar conexión de red y reintentar la operación.',
        'Estados inconsistentes: usar transiciones válidas definidas por la operación.',
      ],
    },
    {
      id: 'glossary',
      title: 'Glosario y Recursos Adicionales',
      content: [
        'Servicio: registro operativo con estados y costos.',
        'Catálogo: listas configurables por empresa.',
        'Soporte: contactar al administrador de la empresa.',
        'Operador: persona asignada a servicios de grúa.',
        'Grúa: unidad operativa con documentación y mantenimiento.',
      ],
    },
  ];

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const companyInfo = mapTenantToCompanyInfo(tenant);
      let y = await addCompanyHeader(doc, 'Manual de Usuario', companyInfo);
      doc.setFontSize(12);
      sections.forEach((sec, index) => {
        if (y > 760) {
          doc.addPage();
          y = await addCompanyHeader(doc, 'Manual de Usuario', companyInfo);
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
              y = await addCompanyHeader(doc, 'Manual de Usuario', companyInfo);
            }
            doc.text(lineWrapped, 60, y);
            y += 18;
          });
          y += 6;
        });
        y += 6;
      });
      addPageNumbers(doc, companyInfo);
      doc.save('manual_usuario.pdf');
    } finally {
      setExporting(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <ListTree className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Tabla de Contenido</CardTitle>
              <CardDescription>Navega rápidamente a cada sección</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sections.map((sec) => (
              <Button key={sec.id} variant="outline" size="sm" onClick={() => scrollTo(sec.id)}>
                {sec.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[680px] p-6" ref={containerRef}>
            <div className="space-y-8">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  ref={(el) => {
                    sectionRefs.current[sec.id] = el;
                  }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium">{idx + 1}</span>
                      </div>
                      <h2 className="text-xl font-semibold">{sec.title}</h2>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      {sec.content.map((line) => (
                        <li key={line} className="text-sm">{line}</li>
                      ))}
                    </ul>
                    {sec.id === 'operations' && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="services">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <ClipboardList className="h-4 w-4" />
                              Servicios
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-6 space-y-1 text-sm">
                              <li>Crear servicio nuevo y definir prioridad.</li>
                              <li>Asignar operador y grúa disponible.</li>
                              <li>Avanzar estados según operación.</li>
                              <li>Registrar costos y confirmar cierre.</li>
                              <li>Generar facturación si aplica.</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="cranes">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Grúas
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-6 space-y-1 text-sm">
                              <li>Registrar unidad y tipo.</li>
                              <li>Actualizar estado operativo.</li>
                              <li>Programar y registrar mantenimiento.</li>
                              <li>Subir documentos y verificar vencimientos.</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="operators">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Operadores
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc pl-6 space-y-1 text-sm">
                              <li>Registrar datos personales y licencia.</li>
                              <li>Asignar a servicios y grúas.</li>
                              <li>Monitorear vencimientos y estados.</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                    {sec.id === 'catalogs' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              <CardTitle className="text-base">Catálogos por Módulo</CardTitle>
                            </div>
                            <CardDescription>Tipos de cliente, vehículos, estados, costos</CardDescription>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4" />
                              <CardTitle className="text-base">Búsqueda y Orden</CardTitle>
                            </div>
                            <CardDescription>Usar filtros y ordenar por prioridad</CardDescription>
                          </CardHeader>
                        </Card>
                      </div>
                    )}
                    {sec.id === 'troubleshooting' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <CardTitle className="text-base">Verificaciones</CardTitle>
                            </div>
                            <CardDescription>Revisar rol, empresa y estado</CardDescription>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              <CardTitle className="text-base">Incidencias</CardTitle>
                            </div>
                            <CardDescription>Reintentar y revisar conexión</CardDescription>
                          </CardHeader>
                        </Card>
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <CardTitle className="text-base">Procedimientos</CardTitle>
                            </div>
                            <CardDescription>Usar flujos aprobados por operación</CardDescription>
                          </CardHeader>
                        </Card>
                      </div>
                    )}
                  </div>
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
