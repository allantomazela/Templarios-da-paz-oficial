# Templários da Paz - Sistema de Gestão

Sistema completo de gestão para a Augusta e Respeitável Loja Simbólica Templários da Paz, desenvolvido com tecnologias modernas e melhores práticas.

## 🚀 Stack Tecnológica

- **React 19** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool extremamente rápida
- **TypeScript** - Superset tipado do JavaScript
- **Shadcn UI** - Componentes reutilizáveis e acessíveis
- **Tailwind CSS** - Framework CSS utility-first
- **React Router v7** - Roteamento para aplicações React
- **React Hook Form** - Gerenciamento de formulários performático
- **Zod** - Validação de schemas TypeScript-first
- **Recharts** - Biblioteca de gráficos para React
- **Zustand** - Gerenciamento de estado leve e performático
- **Supabase** - Backend como serviço (autenticação, banco de dados, storage)
- **Vitest** - Framework de testes rápido

## 📋 Pré-requisitos

- Node.js 18+ (recomendado: Node.js 20+)
- npm ou yarn ou pnpm
- Conta Supabase (para banco de dados e autenticação)

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <repository-url>
cd Templarios-da-paz-oficial
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

**Nota:** Se houver conflitos de peer dependencies, use:
```bash
npm install --legacy-peer-deps
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase
```

**Para diferentes ambientes:**
- `.env-dev` - Desenvolvimento
- `.env-homolog` - Homologação
- `.env-prod` - Produção

### 4. Configure o Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Crie um novo projeto ou use um existente
3. Aplique as migrações em `supabase/migrations/` na ordem cronológica
4. Configure o bucket de storage `site-assets` com as políticas apropriadas
5. Copie a URL e a chave pública do projeto para o arquivo `.env`

### 5. Execute as migrações do banco de dados

As migrações estão localizadas em `supabase/migrations/`. Aplique-as na ordem:

1. `20251218203000_create_site_settings_and_venerables.sql`
2. `20251219100000_news_events_and_settings.sql`
3. ... (e assim por diante, na ordem cronológica)

Você pode aplicar as migrações via:
- Supabase Dashboard (SQL Editor)
- Supabase CLI: `supabase db push`

## 💻 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm start
# ou
npm run dev
```

Abre a aplicação em modo de desenvolvimento em [http://localhost:5173](http://localhost:5173).

**Primeira execução:**
1. Certifique-se de que o arquivo `.env` está configurado
2. Verifique se as migrações do Supabase foram aplicadas
3. Execute `npm start` e acesse a aplicação

### Build

```bash
# Build para produção
npm run build

# Build para desenvolvimento
npm run build:dev
```

Gera os arquivos otimizados para produção na pasta `dist/`.

### Preview

```bash
# Visualizar build de produção localmente
npm run preview
```

Permite visualizar a build de produção localmente antes do deploy.

### Testes

```bash
# Executar testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com UI
npm run test:ui

# Executar testes com coverage
npm run test:coverage
```

### Linting e Formatação

```bash
# Executar linter
npm run lint

# Executar linter e corrigir problemas automaticamente
npm run lint:fix

# Formatar código com Prettier
npm run format
```

## 🔐 Configuração de Autenticação

O sistema utiliza Supabase Auth para autenticação. O usuário master admin é configurado automaticamente:

- **Email:** `allantomazela@gmail.com`
- **Role:** `admin`
- **Status:** `approved`

## 📦 Estrutura do Projeto

```
.
├── src/
│   ├── components/      # Componentes React organizados por módulo
│   │   ├── admin/       # Componentes administrativos
│   │   ├── agenda/      # Componentes de agenda/calendário
│   │   ├── chancellor/  # Componentes da chancelaria
│   │   ├── financial/   # Componentes financeiros
│   │   ├── home/        # Componentes da página inicial
│   │   ├── secretariat/ # Componentes da secretaria
│   │   ├── settings/    # Componentes de configurações
│   │   └── ui/          # Componentes Shadcn UI
│   ├── pages/           # Páginas principais da aplicação
│   ├── stores/          # Stores Zustand para gerenciamento de estado
│   ├── lib/             # Utilitários e helpers
│   ├── hooks/           # Custom hooks React
│   └── test/            # Configuração e utilitários de testes
├── supabase/
│   ├── migrations/      # Migrações do banco de dados
│   └── functions/        # Edge Functions do Supabase
├── public/              # Arquivos estáticos
└── dist/                # Build de produção (gerado)
```

## 🎯 Funcionalidades Principais

### Módulos Implementados

- ✅ **Dashboard** - Visão geral do sistema
- ✅ **Secretaria** - Gestão de irmãos, documentos, mensagens, avisos, atas
- ✅ **Financeiro** - Receitas, despesas, categorias, contas bancárias, orçamentos
- ✅ **Chancelaria** - Eventos, sólidos, frequência, graduações
- ✅ **Agenda** - Calendário de eventos com check-in
- ✅ **Relatórios** - Analytics e relatórios customizados
- ✅ **Admin** - Gestão de usuários, auditoria, mídia, notícias
- ✅ **Configurações** - Tema, tipografia, SEO, logo, instituição

### Recursos Adicionais

- 🔐 Autenticação e autorização baseada em roles (RBAC)
- 📱 PWA (Progressive Web App) com Service Worker
- 🎨 Sistema de temas customizável
- 🔍 SEO dinâmico
- 📊 Sistema de auditoria completo
- 🔔 Notificações push
- 🖼️ Otimização automática de imagens
- 📄 Sistema de redirecionamentos
- ⚡ Cache de queries para melhor performance
- 📈 Métricas de performance
- 🧪 Estrutura de testes com Vitest

## 🛠️ Desenvolvimento

### Workflow Recomendado

1. Instale as dependências: `npm install`
2. Configure o `.env` com as credenciais do Supabase
3. Aplique as migrações do banco de dados
4. Inicie o servidor: `npm start`
5. Faça suas alterações
6. Execute os testes: `npm test`
7. Verifique o código: `npm run lint`
8. Formate o código: `npm run format`
9. Teste localmente: `npm run preview` (após build)

### Boas Práticas

- ✅ Use TypeScript para tipagem estática
- ✅ Siga os padrões de código estabelecidos
- ✅ Execute `npm run lint` antes de commitar
- ✅ Mantenha componentes pequenos e focados (< 300 linhas)
- ✅ Use o sistema de logging (`src/lib/logger.ts`) ao invés de `console.log`
- ✅ Documente funções complexas com JSDoc
- ✅ Escreva testes para novas funcionalidades
- ✅ Use os hooks customizados (`useDialog`, `useImageUpload`, `useAsyncOperation`)

### Hooks Customizados Disponíveis

- **`useDialog`** - Gerencia estado de abertura/fechamento de dialogs
- **`useImageUpload`** - Gerencia upload de imagens com compressão
- **`useAsyncOperation`** - Gerencia operações assíncronas com loading/error
- **`useQueryCache`** - Gerencia cache de queries com TTL
- **`useCachedQuery`** - Hook para queries com cache automático
- **`usePerformance`** - Mede e monitora performance de operações

## 🚀 Deploy

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/` e estarão prontos para deploy.

### Opções de Deploy

- **Vercel** - Recomendado para aplicações React/Vite
- **Netlify** - Alternativa popular
- **Supabase Hosting** - Integração nativa com Supabase
- **Servidor próprio** - Use um servidor web (nginx, Apache) para servir a pasta `dist/`

### Variáveis de Ambiente em Produção

Certifique-se de configurar as variáveis de ambiente no seu provedor de hosting:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 🐛 Troubleshooting

### Problemas Comuns

**Erro: "Cannot find module"**
- Execute `npm install` novamente
- Verifique se todas as dependências estão instaladas

**Erro de conexão com Supabase**
- Verifique se o arquivo `.env` está configurado corretamente
- Confirme que as credenciais do Supabase estão corretas
- Verifique se o projeto Supabase está ativo

**Erro ao aplicar migrações**
- Verifique se está aplicando as migrações na ordem correta
- Confirme que não há conflitos com dados existentes
- Verifique os logs do Supabase para mais detalhes

**Testes falhando**
- Execute `npm install` para garantir que todas as dependências de teste estão instaladas
- Verifique se o ambiente de testes está configurado corretamente

## 📚 Documentação Adicional

- [Documentação do React](https://react.dev)
- [Documentação do Vite](https://vitejs.dev)
- [Documentação do Supabase](https://supabase.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com)
- [Vitest Documentation](https://vitest.dev)

## 📝 Licença

Este projeto é privado e de uso exclusivo da ARLS Templários da Paz.

## 👥 Contribuição

Para contribuir com o projeto, siga o workflow de desenvolvimento e as boas práticas estabelecidas.
