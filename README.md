# Nexus Voice - Plataforma Web de Voz em Tempo Real

Plataforma moderna de comunicação por voz, vídeo e compartilhamento de tela em tempo real inspirada na dinâmica do Discord, desenvolvida com arquitetura WebRTC Mesh P2P, backend em Express com Socket.IO e persistência em banco SQLite de alta performance.

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** com **TypeScript**
- **Vite** (Build tool rápida)
- **Tailwind CSS** (Tema dark premium customizado)
- **Lucide Icons**
- **Socket.IO Client**
- **Web Audio API** (`AudioContext`, `AnalyserNode` para detecção de voz / VAD)

### Backend
- **Node.js** + **TypeScript**
- **Express**
- **Socket.IO** (Signaling WebRTC, presença e sincronização em tempo real)
- **better-sqlite3** (SQLite de alta performance em `data/app.db`)
- **bcryptjs** (Hash seguro de senhas)
- **jsonwebtoken** & **cookie-parser** (Autenticação via cookies HttpOnly)
- **Helmet** & **express-rate-limit** (Segurança contra brute-force e injeções)
- **Zod** (Validação estrita de schemas)

---

## 📋 Requisitos

- **Node.js** v18.0.0 ou superior (Recomendado v20+ ou v22+)
- **NPM** v9.0.0 ou superior

---

## 🔧 Instalação e Configuração

1. **Instalar dependências de todos os workspaces:**
```bash
npm install
```

2. **Configuração de Variáveis de Ambiente:**
O arquivo `.env` já é preparado automaticamente pelo script. Para customizar, você pode editar `server/.env`:
```env
PORT=3001
CLIENT_URL=http://localhost:5173
JWT_SECRET=super_secret_jwt_key_webrtc_voice_platform_2026

# Credenciais do Administrador Inicial
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@localhost
ADMIN_PASSWORD=change-me

# Banco de Dados
DB_PATH=../data/app.db
```

---

## ▶️ Inicialização

Para rodar frontend e backend simultaneamente em ambiente de desenvolvimento:

```bash
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend:** [http://localhost:3001](http://localhost:3001)

### Scripts Disponíveis:
- `npm run dev`: Inicia servidor e cliente simultaneamente
- `npm run dev:server`: Inicia apenas o backend com live reload (`tsx watch`)
- `npm run dev:client`: Inicia apenas o frontend Vite
- `npm run build`: Compila frontend e backend
- `npm run typecheck`: Executa checagem de tipos estrita no frontend e backend
- `npm start`: Inicia o servidor em produção

---

## 🎙️ Funcionalidades

1. **Autenticação & Controle de Acesso:**
   - Registro de contas com validação em tempo real (`role = USER`).
   - Login com cookies seguros `HttpOnly`.
   - Administrador inicial criado automaticamente com credenciais do `.env` (`admin@localhost`).
   - Somente administradores possuem permissão de criar, editar e excluir canais de voz (`403 Forbidden` para usuários comuns no backend).

2. **Canais de Voz & Presença:**
   - Lista de canais dinâmicos ("Geral", "Lounge", "Games", "Madrugada").
   - Exibição em tempo real de participantes conectados a cada canal.
   - Sincronização instantânea de novos canais, edições e exclusões para todos os clientes via WebSocket.

3. **Comunicação WebRTC Mesh:**
   - Comunicação P2P para 2–6 participantes por canal.
   - Áudio de alta fidelidade com microfone (mutar/desmutar e atalhos de teclado).
   - Detecção de atividade de voz (borda verde pulsante quando alguém estiver falando).
   - Ensurdecer áudio (muta áudio remoto e microfone local simultaneamente).
   - Câmera Web (ligar/desligar com grid responsivo dinâmico).
   - Compartilhamento de tela em HD (`getDisplayMedia`) com destaque automático e detecção de encerramento.
   - Seleção de dispositivos de áudio/vídeo e medidor de teste de microfone em tempo real.

4. **Limpeza e Desconexão:**
   - Encerramento completo de tracks de microfone/câmera ao sair da sala ou fechar a aba.
   - Fechamento seguro de instâncias `RTCPeerConnection` e `AudioContext`.

---

## 🔒 Segurança

- Proteção contra Cross-Site Scripting (XSS) e injeção de parâmetros com queries parametrizadas no SQLite (`better-sqlite3`).
- Rate limiting específico para rotas de autenticação (`/login` e `/register`).
- Conexão Socket.IO restrita a usuários autenticados via JWT em cookies.
- Mídia transmitida diretamente de peer para peer sem gravação ou retenção no servidor.

---

Desenvolvido com foco em performance, simplicidade e experiência de usuário premium.
