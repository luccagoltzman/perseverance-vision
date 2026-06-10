# Mars Telemetry PWA

Centro de Comando para telemetria espacial e exploração visual do planeta Marte. Consome dados meteorológicos e fotográficos das APIs oficiais da NASA com experiência offline-first e otimizada para mobile.

## Stack

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** — UI responsiva com tema escuro
- **TanStack Query** — cache inteligente das requisições NASA
- **vite-plugin-pwa** — Service Worker e manifesto web

## Funcionalidades

- Dashboard com clima de Marte (InSight) e gráfico dos últimos 7 Sols
- Galeria de fotos com Perseverance, Curiosity, Opportunity e Spirit
- Filtro por câmera com contadores dinâmicos
- Conversão Terrestre → Sol marciano
- Infinite scroll e visualizador com metadados
- PWA com cache Stale-While-Revalidate (API) e Cache-First (imagens)

## Início rápido

```bash
npm install
node scripts/generate-pwa-icons.mjs
npm run dev
```

Configure as chaves no `.env`:

```env
# Clima (dashboard)
VITE_NASA_API_KEY=sua_chave_nasa

# Fotos dos rovers (obrigatório)
VITE_MARSVISTA_API_KEY=sua_chave_marsvista
```

> **Importante:** A API Mars Photos da NASA (`api.nasa.gov/mars-photos`) está indisponível — o backend Heroku foi descontinuado. As fotos dos rovers usam o [Mars Vista API](https://marsvista.dev/signin) (chave gratuita).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |

## Estrutura

```
src/
├── components/   # UI reutilizável e layout
├── features/     # dashboard e rovers (domain-driven)
├── hooks/        # useMarsWeather, useRoverPhotos, usePWAStatus
├── services/     # Integração NASA API
└── utils/        # Conversor Sol, matriz de câmeras
```
