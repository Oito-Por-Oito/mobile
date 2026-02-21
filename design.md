# OitoPorOito Mobile — Design Document

## Brand Identity

A plataforma OitoPorOito é uma plataforma de xadrez brasileira com identidade visual marcante baseada em tons escuros com acentos dourados, transmitindo elegância e sofisticação associadas ao jogo de xadrez.

### Color Palette

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `background` | `#1e1e1e` | `#1e1e1e` | Fundo principal (app sempre escuro) |
| `surface` | `#2c2c2c` | `#2c2c2c` | Cards, painéis |
| `surface-secondary` | `#3a3a3a` | `#3a3a3a` | Elementos secundários |
| `gold` | `#d4a843` | `#d4a843` | Cor primária de destaque |
| `gold-light` | `#e8c060` | `#e8c060` | Hover/pressed states |
| `foreground` | `#f0f0f0` | `#f0f0f0` | Texto principal |
| `muted` | `#9a9a9a` | `#9a9a9a` | Texto secundário |
| `border` | `#4a4a4a` | `#4a4a4a` | Bordas |
| `error` | `#ef4444` | `#f87171` | Erros |
| `success` | `#22c55e` | `#4ade80` | Sucesso |

> O app usa tema escuro por padrão, alinhado com a identidade visual da plataforma web.

---

## Screen List

### Auth Flow
- **SplashScreen** — Logo animado + verificação de sessão
- **LoginScreen** — Email/senha + Google OAuth
- **SignupScreen** — Username, email, senha
- **ForgotPasswordScreen** — Recuperação por email

### Tab Bar (5 abas)
1. **HomeTab** — Home/Dashboard
2. **PlayTab** — Jogar
3. **PuzzlesTab** — Puzzles
4. **LearnTab** — Aprender
5. **MoreTab** — Mais (Social, Notícias, Perfil, etc.)

### Home / Dashboard
- **HomeScreen** (visitante) — Tabuleiro estático, CTA para login/cadastro, top players, notícias
- **DashboardScreen** (logado) — Cards de boas-vindas, stats, progresso, atividade recente

### Play (Jogar)
- **PlayMenuScreen** — Seleção de modo (Online, vs Computador, Treinador)
- **PlayOnlineScreen** — Lobby de matchmaking com seleção de tempo
- **GameRoomScreen** — Tabuleiro interativo, timer, chat, controles
- **PlayComputerScreen** — Seleção de bot + configuração
- **ComputerGameScreen** — Tabuleiro vs Stockfish
- **GameHistoryScreen** — Lista de partidas anteriores
- **GameReplayScreen** — Replay de partida com navegação de lances

### Puzzles
- **PuzzlesMenuScreen** — Hub de puzzles com categorias
- **PuzzleDailyScreen** — Puzzle do dia
- **PuzzleRushScreen** — Modo rush (tempo limitado)
- **PuzzleBattleScreen** — Batalha de puzzles
- **PuzzleCustomScreen** — Puzzles customizados

### Learn (Aprender)
- **LearnMenuScreen** — Hub de aprendizado
- **LessonsScreen** — Lições estruturadas
- **CoursesScreen** — Cursos completos
- **OpeningsScreen** — Estudo de aberturas
- **EndgamesScreen** — Estudo de finais
- **AnalysisScreen** — Análise de posição
- **LibraryScreen** — Biblioteca de recursos

### Social
- **SocialMenuScreen** — Hub social
- **FriendsScreen** — Lista de amigos + busca
- **ClubsScreen** — Clubes de xadrez
- **ForumScreen** — Fórum de discussão
- **MembersScreen** — Membros da plataforma
- **BlogsScreen** — Blogs de xadrez
- **CoachesScreen** — Coaches disponíveis

### News & Events
- **NewsHubScreen** — Hub de notícias
- **NewsArticleScreen** — Artigo individual
- **RankingsScreen** — Rankings de jogadores
- **TopPlayersScreen** — Top jogadores mundiais
- **EventsScreen** — Eventos e torneios

### Profile & Settings
- **ProfileScreen** — Perfil do usuário (editar info, avatar)
- **SettingsScreen** — Configurações (tema de peças, sons, tabuleiro)
- **RankingScreen** — Ranking geral da plataforma
- **DonateScreen** — Tela de doação

---

## Key User Flows

### Flow 1: Novo Usuário
1. SplashScreen → HomeScreen (visitante)
2. Toca "Criar Conta" → SignupScreen
3. Preenche dados → Verificação de email
4. Login → DashboardScreen

### Flow 2: Jogar Online
1. PlayTab → PlayMenuScreen
2. Toca "Jogar Online" → PlayOnlineScreen
3. Seleciona tempo → Entra na fila
4. Partida encontrada → GameRoomScreen
5. Joga a partida → Resultado → Opção de revanche

### Flow 3: Resolver Puzzle
1. PuzzlesTab → PuzzlesMenuScreen
2. Toca "Puzzle Diário" → PuzzleDailyScreen
3. Resolve o puzzle → Feedback animado
4. Próximo puzzle ou voltar ao menu

### Flow 4: Ver Perfil
1. MoreTab → ProfileScreen
2. Edita display name/bio → Salva
3. Toca no avatar → Seleciona foto da galeria → Upload

---

## Layout Principles

- **Bottom Tab Bar** com 5 abas, ícones + labels
- **Stack Navigation** dentro de cada aba para telas secundárias
- **Modal Sheets** para ações rápidas (seleção de tempo, confirmações)
- **Cards** com fundo `surface` e borda sutil dourada
- **Tabuleiro de xadrez** ocupa largura total em portrait, com aspect ratio 1:1
- **Tipografia**: SF Pro (iOS) / Roboto (Android), sem fontes customizadas
- **Ícones**: @expo/vector-icons (Ionicons + MaterialIcons)
- **Animações**: react-native-reanimated para transições suaves
