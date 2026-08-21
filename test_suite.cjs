const { io } = require('socket.io-client');

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

async function request(endpoint, options = {}, cookie = '') {
  const headers = {
    'Content-Type': 'application/json',
    ...(cookie ? { Cookie: cookie } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const setCookie = res.headers.get('set-cookie');
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, setCookie };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 INICIANDO SUÍTE DE TESTES AUTOMATIZADOS FULL-STACK');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // --- 1. TESTE DE ADMIN INICIAL ---
  console.log('\n--- 1. Autenticação do ADMIN Inicial ---');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@localhost', password: 'change-me' }),
  });
  assert(adminLogin.status === 200, 'Login do ADMIN inicial retorna 200');
  assert(adminLogin.data.user?.role === 'ADMIN', 'Usuário logado possui role = ADMIN');
  const adminCookie = adminLogin.setCookie ? adminLogin.setCookie.split(';')[0] : '';
  const adminToken = adminLogin.data.token;

  // --- 2. TESTE DE CADASTRO DE NOVO USUÁRIO ---
  console.log('\n--- 2. Cadastro e Autenticação de Usuário Comum ---');
  const testUser1 = {
    username: 'joaotester',
    email: 'joao@test.com',
    password: 'password123',
    confirmPassword: 'password123'
  };

  const registerRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser1),
  });
  assert(registerRes.status === 201 || (registerRes.status === 400 && registerRes.data.error?.includes('já está')), 'Registro de usuário comum');
  
  // Login do Usuário Comum 1
  const user1Login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser1.email, password: testUser1.password }),
  });
  assert(user1Login.status === 200, 'Login do usuário comum retorna 200');
  assert(user1Login.data.user?.role === 'USER', 'Usuário comum possui role = USER (não pode ser ADMIN)');
  const user1Cookie = user1Login.setCookie ? user1Login.setCookie.split(';')[0] : '';
  const user1Token = user1Login.data.token;
  const user1Id = user1Login.data.user.id;

  // --- 3. TESTE DE VALIDAÇÃO / SENHA INCORRETA / DUPLICADA ---
  console.log('\n--- 3. Validações de Segurança e Erros de Autenticação ---');
  const wrongPassRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@localhost', password: 'wrong-password' }),
  });
  assert(wrongPassRes.status === 400, 'Login com senha incorreta é rejeitado (400)');

  const dupRegister = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser1),
  });
  assert(dupRegister.status === 400, 'Cadastro duplicado é rejeitado (400)');

  // Teste GET /api/auth/me
  const meRes = await request('/auth/me', {}, user1Cookie);
  assert(meRes.status === 200 && meRes.data.user.username === testUser1.username, 'GET /api/auth/me recupera usuário autenticado via cookie');

  // --- 4. TESTE DE CANAIS E CONTROLE DE ACESSO (RBAC) ---
  console.log('\n--- 4. Listagem e Regras de Canais (Admin vs User) ---');
  const listChannelsRes = await request('/channels', {}, user1Cookie);
  assert(listChannelsRes.status === 200 && Array.isArray(listChannelsRes.data.channels), 'Usuário comum pode visualizar lista de canais');
  assert(listChannelsRes.data.channels.length >= 4, 'Canais padrão foram inicializados no banco');

  const defaultChannelId = listChannelsRes.data.channels[0].id;

  // Tentativa de criar canal como USER comum -> DEVE RETORNAR 403
  const userCreateChannelRes = await request('/channels', {
    method: 'POST',
    body: JSON.stringify({ name: 'Canal Não Autorizado', description: 'Tentativa hacker' }),
  }, user1Cookie);
  assert(userCreateChannelRes.status === 403, 'Usuário comum tentando POST /api/channels recebe 403 FORBIDDEN');

  // Criação de canal como ADMIN -> DEVE FUNCIONAR (201)
  const adminCreateChannelRes = await request('/channels', {
    method: 'POST',
    body: JSON.stringify({ name: 'Canal Teste Admin', description: 'Criado pelo teste automatizado' }),
  }, adminCookie);
  assert(adminCreateChannelRes.status === 201, 'ADMIN criando canal recebe 201 Created');
  const createdChannelId = adminCreateChannelRes.data.channel?.id;

  // Edição como ADMIN -> DEVE FUNCIONAR
  const adminUpdateChannelRes = await request(`/channels/${createdChannelId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Canal Teste Admin Renomeado' }),
  }, adminCookie);
  assert(adminUpdateChannelRes.status === 200 && adminUpdateChannelRes.data.channel.name === 'Canal Teste Admin Renomeado', 'ADMIN atualizando canal');

  // Exclusão como ADMIN -> DEVE FUNCIONAR
  const adminDeleteChannelRes = await request(`/channels/${createdChannelId}`, {
    method: 'DELETE',
  }, adminCookie);
  assert(adminDeleteChannelRes.status === 200, 'ADMIN excluindo canal recebe 200 OK');

  // --- 5. CADASTRO DE USUÁRIO 2 PARA TESTE WEBSOCKET / WEBRTC ---
  console.log('\n--- 5. Testes de Tempo Real Socket.IO & WebRTC com 2 Clientes Simultâneos ---');
  const testUser2 = {
    username: 'mariatester',
    email: 'maria@test.com',
    password: 'password123',
    confirmPassword: 'password123'
  };
  await request('/auth/register', { method: 'POST', body: JSON.stringify(testUser2) });
  const user2Login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testUser2.email, password: testUser2.password }),
  });
  const user2Token = user2Login.data.token;
  const user2Id = user2Login.data.user.id;

  // Conectar 2 Sockets com autenticação JWT
  const socket1 = io(SOCKET_URL, {
    auth: { token: user1Token },
    transports: ['websocket'],
    forceNew: true
  });

  const socket2 = io(SOCKET_URL, {
    auth: { token: user2Token },
    transports: ['websocket'],
    forceNew: true
  });

  await new Promise((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    socket1.on('connect', check);
    socket2.on('connect', check);
  });
  assert(socket1.connected && socket2.connected, 'Dois clientes conectados e autenticados no Socket.IO');

  // Teste de Entrada no Canal
  let user1ReceivedJoined = false;
  let user1ReceivedUser2Join = false;
  let user2ReceivedOffer = false;
  let user1ReceivedAnswer = false;

  await new Promise((resolve) => {
    // 1. Usuário 1 entra no canal
    socket1.emit('voice:join', { channelId: defaultChannelId, mediaState: { isMuted: false } });

    socket1.on('voice:joined', (data) => {
      user1ReceivedJoined = true;
      assert(data.channelId === defaultChannelId, 'Usuário 1 recebeu evento voice:joined');

      // 2. Usuário 2 entra no mesmo canal
      socket2.emit('voice:join', { channelId: defaultChannelId, mediaState: { isMuted: true } });
    });

    // Usuário 1 recebe notificação de entrada do Usuário 2
    socket1.on('voice:user_joined', (data) => {
      if (data.participant.userId === user2Id) {
        user1ReceivedUser2Join = true;
        assert(true, 'Usuário 1 recebeu notificação voice:user_joined com dados do Usuário 2');

        // Usuário 1 envia WebRTC Offer simulada para Usuário 2
        socket1.emit('webrtc:offer', {
          targetSocketId: data.participant.socketId,
          offer: { type: 'offer', sdp: 'v=0\r\no=mock 1 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' }
        });
      }
    });

    // Usuário 2 recebe a Offer e responde com Answer
    socket2.on('webrtc:offer', (data) => {
      user2ReceivedOffer = true;
      assert(data.fromUserId === user1Id, 'Usuário 2 recebeu webrtc:offer do Usuário 1');

      socket2.emit('webrtc:answer', {
        targetSocketId: data.fromSocketId,
        answer: { type: 'answer', sdp: 'v=0\r\no=mock 2 3 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' }
      });
    });

    // Usuário 1 recebe a Answer
    socket1.on('webrtc:answer', (data) => {
      user1ReceivedAnswer = true;
      assert(data.fromSocketId === socket2.id, 'Usuário 1 recebeu webrtc:answer do Usuário 2');
      resolve();
    });
  });

  // Teste de Estado de Mídia e Fala
  await new Promise((resolve) => {
    socket2.on('media:speaking', (data) => {
      if (data.userId === user1Id && data.isSpeaking === true) {
        assert(true, 'Detecção de fala (media:speaking) sincronizada entre peers');
        resolve();
      }
    });

    socket1.emit('media:speaking', { isSpeaking: true });
  });

  // Teste de Saída do Canal
  await new Promise((resolve) => {
    socket2.on('voice:user_left', (data) => {
      if (data.userId === user1Id) {
        assert(true, 'Usuário 2 notificado que Usuário 1 saiu da chamada (voice:user_left)');
        resolve();
      }
    });

    socket1.emit('voice:leave');
  });

  socket1.disconnect();
  socket2.disconnect();

  console.log('\n====================================================');
  console.log(`🎉 TESTES CONCLUÍDOS: ${passed} PASSOU | ${failed} FALHOU`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
