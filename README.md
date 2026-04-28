# SECOP Radar

Sistema de inteligencia competitiva que monitorea el SECOP II automáticamente, clasifica oportunidades con IA y notifica al equipo comercial de **C&M Consultores S.A.S.**

## ¿Qué hace?

- Ingesta procesos de contratación desde la API pública de datos.gov.co cada 30 minutos
- Clasifica cada proceso con Claude API contra el perfil histórico de C&M (3,554 procesos)
- Genera un score de relevancia 0–100 y alerta por email/WhatsApp/Teams cuando score ≥ 80
- Dashboard web con pipeline visual de oportunidades

## Stack

- **Backend:** Node.js + Express + MySQL 8
- **Frontend:** React 18 + Tailwind CSS
- **IA:** Claude API (claude-sonnet-4-5)
- **Orquestación:** n8n
- **Infra:** Azure VM Ubuntu 24.04, Nginx, PM2

## Estructura

```
secop-radar/
├── backend/          # API REST
├── frontend/         # SPA React
├── data/             # Dataset histórico C&M (xlsx)
├── n8n/              # Workflows de ingesta
├── scripts/          # Migrate, seed, test
├── CLAUDE.md         # Contexto del proyecto para Claude Code
└── SPEC.md           # Especificación técnica completa
```

## Inicio rápido

```bash
cp .env.example .env   # Completar variables
cd backend && npm install && npm run dev
cd ../frontend && npm install && npm run dev
```

Ver [SPEC.md](SPEC.md) para la especificación técnica completa.
