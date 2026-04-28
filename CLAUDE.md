# SECOP Radar — Contexto del Proyecto

## Qué es esto

**SECOP Radar** es un sistema de inteligencia competitiva para **C&M Consultores S.A.S.** que monitorea automáticamente las oportunidades de contratación pública en Colombia (SECOP II) y utiliza IA para clasificar, puntuar y notificar las oportunidades que encajan con el perfil de la firma.

El cliente es Diego (consultor independiente vía Tecnofactory S.A.S.) quien desarrolla este producto para C&M Consultores.

## Sobre C&M Consultores S.A.S.

- Firma colombiana de consultoría gerencial fundada en 1999, +25 años de experiencia
- Sede: Carrera 13 No. 96-67 Of. 309, Bogotá. También presencia en Lima, Perú
- Sectores: infraestructura, educación, bienestar social, TIC
- Servicios: interventoría, gerencia de proyectos (PMI), BIM, asesoría jurídica en contratación estatal, estructuración de APP
- Patrimonio: ~$26,000M COP. Ventas 2024: entre $20,000M y $100,000M COP
- Proyecto destacado: estructuración Troncal del Magdalena (5G)
- Web: cmconsultores.com.co

## Perfil de adjudicación (basado en 3,554 procesos históricos)

### Métricas clave
- **395 procesos adjudicados** a C&M de 1,128 decididos = **35% win rate**
- **733 adjudicados a otros** (oportunidades perdidas a analizar)
- **977 descartados** (no cumplían requisitos habilitantes)
- Mediana de valor adjudicado: ~$1,200M COP
- Rango de datos: agosto 2014 – abril 2026

### Sectores donde C&M gana (top 6)
1. TIC (90 adjudicados)
2. Infraestructura / obras y transporte (82)
3. Educación (44)
4. Nutrición / alimentación (38)
5. Bienestar social + combinaciones (27)
6. Financiero-fiscal (10)

### Entidades donde más gana (top 8)
1. Ministerio de Educación Nacional (46)
2. ICBF (42)
3. FONADE / Fondo de Proyectos de Desarrollo (24)
4. TransMilenio S.A. (20)
5. Fondo TIC (14)
6. Secretaría de Educación Distrital (13)
7. Secretaría Distrital de Integración Social (12)
8. Aeronáutica Civil (10)

### Razones de descarte (por qué NO participan)
1. Experiencia de la firma (386 casos, 40%)
2. Sin razón registrada (188)
3. Otros (165)
4. Falta de garantías (156, 16%)
5. Indicadores financieros (32)
6. Perfiles profesionales (30)
7. Requisitos jurídicos (19)

### Forma de participación en procesos ganados
- Individual: 164 (41.5%)
- Consorcio: 157 (39.7%)
- Sin información: 66
- Unión Temporal: 7

### Keywords dominantes en objetos adjudicados
interventoría, técnica, administrativa, financiera, integral, contrato(s), sistema, desarrollo, mantenimiento, asistencia, jurídica, educación, diseño, soporte, digitales, tecnologías, consultoría, control, comunicaciones, concesión, gestión, infraestructura, implementación

### Origen de oportunidades
- Comercial: 2,121 (60%)
- Nuevos Negocios: 899 (25%)
- Sucursal Perú: 411 (12%)
- Tecnofactory: 79 (2%)

## Arquitectura del sistema

```
┌─────────────────────────────────────────────┐
│         FUENTES DE DATOS (SODA API)         │
│  SECOP II Procesos  │  SECOP Integrado  │   │
│  (p6dx-8zbt)        │  (rpmr-utcd)      │   │
└──────────────────┬──────────────────────────┘
                   │ JSON cada 30 min
┌──────────────────▼──────────────────────────┐
│         MOTOR DE INGESTA (n8n + cron)       │
│  Polling → Deduplicación → Normalización    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              BASE DE DATOS                  │
│           MySQL / PostgreSQL                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         MOTOR DE IA (Claude API)            │
│  Clasificación → Scoring → Inteligencia     │
│  ¿Es nicho C&M?   Fit+viabilidad  Competit.│
└───────┬─────────────────────┬───────────────┘
        │                     │
┌───────▼───────┐   ┌────────▼────────────────┐
│  DASHBOARD    │   │   NOTIFICACIONES        │
│  React SPA    │   │  Email·WhatsApp·Teams    │
│  Pipeline     │   │  Alertas score > 80      │
│  KPIs/Reportes│   │  Resumen diario          │
└───────────────┘   └─────────────────────────┘
```

## Stack tecnológico

- **Backend**: Node.js + Express
- **Frontend**: React 18 + Tailwind CSS
- **Base de datos**: MySQL 8 (o PostgreSQL)
- **Orquestación**: n8n (ya desplegado en n8n.tecnofactory.com.co)
- **IA**: Claude API (claude-sonnet-4-20250514) para clasificación y scoring
- **Infraestructura**: Azure VM Ubuntu 24.04, Nginx, PM2, Let's Encrypt SSL, UFW
- **Notificaciones**: Nodemailer (email), Twilio/API WhatsApp, Microsoft Teams webhooks

## Fuentes de datos SECOP

### API SODA (datos.gov.co) — Endpoints principales

1. **SECOP II - Procesos de Contratación**
   - Dataset ID: `p6dx-8zbt`
   - URL: `https://www.datos.gov.co/resource/p6dx-8zbt.json`
   - Campos clave: Entidad, Descripción del Procedimiento, Modalidad de Contratacion, Precio Base, Fecha de Publicacion del Proceso, Estado, URL del proceso
   
2. **SECOP II - Contratos Electrónicos**
   - Dataset ID: `jbjy-vk9h`
   - URL: `https://www.datos.gov.co/resource/jbjy-vk9h.json`
   
3. **SECOP Integrado**
   - Dataset ID: `rpmr-utcd`
   - URL: `https://www.datos.gov.co/resource/rpmr-utcd.json`

### Campos del dataset de Procesos (p6dx-8zbt)
Entidad, Nit Entidad, Departamento Entidad, Ciudad Entidad, OrdenEntidad, Entidad Centralizada, ID del Proceso, Referencia del Proceso, PCI, ID del Portafolio, Nombre del Procedimiento, Descripción del Procedimiento, Fase, Fecha de Publicacion del Proceso, Fecha de Ultima Publicación, Fecha de Publicacion (Fase Borrador), Fecha de Publicacion (Fase Seleccion), Precio Base, Modalidad de Contratacion, Justificación Modalidad de Contratación, Duracion, Unidad de Duracion, Fecha de Recepcion de Respuestas, Ciudad de la Unidad de Contratación, Nombre de la Unidad de Contratación, Proveedores Invitados, Estado del Proceso, URL del proceso

### Ejemplo de consulta SODA
```bash
# Últimos 100 procesos de consultoría publicados hoy
curl "https://www.datos.gov.co/resource/p6dx-8zbt.json?\$where=fecha_de_publicacion_del_proceso>'2026-04-27'&\$limit=100&\$order=fecha_de_publicacion_del_proceso DESC"
```

## Datos de entrenamiento

El archivo `data/procesos_historicos.xlsx` contiene 3,554 procesos históricos de C&M con las siguientes columnas:
- Enlace (URL SECOP)
- Titulo del proceso
- Objeto (descripción completa del contrato)
- Entidad
- Valor estimado
- Tipo moneda
- Presupuesto ofertado
- Estado inicial del proceso (Registrado, Aprobado para viabilizar, Descartado gerencial)
- Estado Asignación (Asignado, Sin asignar)
- Estado proceso (Adjudicado a C & M, Adjudicado a Otros, Descartado, Abierto, Desierto, etc.)
- Razón descarte
- Origen (Comercial, Nuevos Negocios, Sucursal Perú, Tecnofactory)
- Fecha registro / Fecha cierre
- Tipo plazo ejecución / Tiempo plazo ejecución
- Sectores
- Forma participación (Individual, Consorcio, Unión Temporal)
- Integrantes
- Grupo Empresarial
- Responsable comercial / Co-responsable comercial
- Responsable técnico / Co-responsable técnico
- Viabilidad técnica / Viabilidad (Viable, No viable, Sin viabilizar)

## Módulos del sistema (prioridad de desarrollo)

### Fase 1 — Motor de ingesta + Clasificador IA (MVP)
1. Schema de base de datos (procesos, clasificaciones, scores, alertas)
2. Importador de datos históricos desde Excel
3. Servicio de ingesta SECOP (polling API SODA cada 30 min)
4. Clasificador de relevancia con Claude API
5. API REST básica para consultar procesos clasificados

### Fase 2 — Dashboard web
1. Dashboard React con pipeline visual (Kanban)
2. Tarjetas de oportunidad con score, monto, entidad, deadline, enlace SECOP
3. Filtros (monto, entidad, modalidad, departamento, score)
4. Vista de detalle con análisis IA del proceso

### Fase 3 — Notificaciones + Inteligencia avanzada
1. Alertas por email (resumen diario + instantáneas score > 80)
2. Integración WhatsApp (Twilio)
3. Webhook Microsoft Teams
4. Scoring de viabilidad (requisitos habilitantes vs perfil C&M)
5. Análisis competitivo (histórico de adjudicaciones)

### Fase 4 — Optimización
1. Dashboard de KPIs y reportes
2. Tracking de propuestas presentadas
3. Análisis de win rate por categoría
4. Recomendaciones de consorcios

## Convenciones de código

- Idioma de código: inglés (variables, funciones, clases)
- Idioma de UI y contenido: español
- Comentarios: español cuando aclaran lógica de negocio, inglés para documentación técnica
- Estructura de proyecto: monorepo con `/backend`, `/frontend`, `/data`, `/scripts`
- Variables de entorno: `.env` con prefijo `SECOP_RADAR_`
- Formato de fechas: ISO 8601 en BD y API, DD/MM/YYYY en UI
- Moneda: COP, formato con separador de miles (punto) y sin decimales
