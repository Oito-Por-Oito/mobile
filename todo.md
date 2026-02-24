# OitoPorOito Mobile - TODO

## Setup & Configuração
- [x] Configurar tema de cores (dourado/escuro igual ao web)
- [x] Instalar e configurar @supabase/supabase-js
- [x] Instalar chess.js para lógica de xadrez
- [x] Instalar react-native-chessboard para tabuleiro nativo
- [x] Configurar variáveis de ambiente Supabase (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)

## Autenticação
- [x] Tela de Login (email/senha)
- [x] Tela de Cadastro (username, email, senha)
- [x] Tela de Recuperação de Senha
- [x] AuthContext com Supabase
- [x] Persistência de sessão com SecureStore

## Navegação
- [x] Tab bar principal (Home, Jogar, Puzzles, Aprender, Mais)
- [x] Stack navigation para telas secundárias
- [x] Proteção de rotas autenticadas

## Home / Dashboard
- [x] Tela Home para visitantes (tabuleiro estático + CTA)
- [x] Dashboard para usuários logados (stats, progresso, atividade)
- [x] WelcomeCard com streak
- [x] QuickActionsCard
- [x] PlayerStatsCard (rating blitz/rapid/clássico)
- [x] RecentActivityCard
- [x] DailyGoalsCard

## Jogar
- [x] Tela de seleção de modo (Online, vs Computador)
- [x] Jogar Online - Matchmaking lobby
- [x] Jogar Online - GameRoom com tabuleiro interativo
- [x] Jogar Online - Controles (oferecer empate, resignar, revanche)
- [x] Jogar vs Computador - Seleção de bot e tempo
- [x] Jogar vs Computador - Tabuleiro com bot local
- [ ] Histórico de Partidas
- [ ] Replay de Partidas

## Puzzles
- [x] Tela principal de Puzzles
- [x] Puzzle Diário (modo)
- [x] Puzzle Rush (modo)
- [x] Puzzle Battle (modo)
- [x] Puzzle Customizado (modo)
- [x] Puzzles por tema

## Aprender
- [x] Tela principal de Aprender
- [x] Lições (lista de cursos)
- [x] Aberturas
- [x] Finais
- [x] Análise
- [x] Vídeos

## Social
- [x] Tela principal Mais (com links para comunidade)
- [x] Amigos (link)
- [x] Clubes (link)
- [x] Fórum (link)
- [x] Coaches (link)

## Notícias & Eventos
- [x] Hub de Notícias com categorias e filtros
- [x] Artigos com preview

## Perfil & Configurações
- [x] Tela de Perfil (editar nome, bio)
- [x] Tela de Configurações (tema de tabuleiro, sons, animações)
- [x] Sair da conta

## Branding
- [x] Gerar logo do app (rei de xadrez dourado com "8 8")
- [x] Configurar splash screen
- [x] Atualizar app.config.ts com nome e logo

## Ranking
- [x] Hook useRanking com busca paginada do Supabase por modalidade
- [x] Tela de Ranking com filtros (Blitz, Rápido, Clássico)
- [x] Card de posição do usuário logado no ranking
- [x] Lista paginada com avatar, nome, rating e estatísticas
- [x] Tier badge por faixa de rating (Novato → Mestre Internacional)
- [x] Busca por nome de jogador
- [x] Pull-to-refresh para atualizar o ranking

## Perfil Público
- [x] Hook usePublicProfile para buscar dados do jogador por user_id
- [x] Hook usePlayerGames para buscar histórico de partidas paginado
- [x] Tela de perfil público com cabeçalho (avatar, nome, tier, streak)
- [x] Seção de ratings por modalidade (Blitz, Rápido, Clássico) com seleção interativa
- [x] Seção de estatísticas gerais (partidas, vitórias, derrotas, empates)
- [x] Barra de distribuição de resultados com legenda
- [x] Histórico de partidas com resultado, adversário, tempo e data
- [x] Rota dinâmica /player/[userId] acessível a partir do ranking
- [x] Integração do onPress nos cards do ranking para abrir perfil público

## Sistema de Amizades
- [x] Criar tabela friendships no Supabase com RLS e índices
- [x] Hook useFriendship para gerenciar estado de amizade entre dois usuários
- [x] Hook useFriends para listar amigos e solicitações pendentes
- [x] Botão dinâmico no perfil público (Adicionar / Pendente / Amigos / Remover)
- [x] Tela de Amigos com abas: Amigos, Solicitações Recebidas, Enviadas
- [x] Aceitar / Recusar solicitações de amizade
- [x] Remover amigo existente com confirmação
- [x] Cancelar solicitação enviada
- [x] Navegar para perfil público a partir da lista de amigos
- [x] Badge de solicitações pendentes na aba Mais

## Replay de Partidas
- [x] Verificar estrutura das tabelas game_moves e games
- [x] Hook useGameReplay para carregar partida e lançes ordenados
- [x] Tela de replay com tabuleiro interativo (react-native-chessboard)
- [x] Controles: Primeiro, Anterior, Próximo, Último lance
- [x] Barra de progresso visual com percentual de avanço
- [x] Painel de lançes em notação algébrica com destaque do lance atual
- [x] Informações da partida: jogadores, resultado, duração, motivo
- [x] Reprodução automática (play/pause) com velocidade ajustável (0.5x, 1x, 2x, 3x)
- [x] Destaque visual dos quadrados de origem e destino do lance atual
- [x] Integrar botão de replay no histórico do perfil público

## Telas Complementares
- [x] Tela de Clubes com filtros e função de entrar/sair
- [x] Tela de Fórum com categorias e lista de posts
- [x] Tela de Coaches com perfis e agendamento
- [x] Tela de Torneios com status ao vivo, em breve e encerrados
- [x] Tela de Estatísticas detalhadas com gráficos e aberturas
- [x] Tela de Metas com progresso visual por objetivo

## Auditoria Final
- [x] Remover rotas fantasmas do _layout.tsx (game/[id], game-history, game-replay/[id])
- [x] Registrar todas as novas rotas no _layout.tsx
- [x] TypeScript sem erros (0 erros)
- [x] Todos os 46 testes passando (1 skipped por design)

## Análise de Precisão por Lance
- [x] Instalar Stockfish no servidor backend (via npm + apt)
- [x] Endpoint tRPC chess.analyzeMove com Stockfish (profundidade configurável)
- [x] Endpoint tRPC chess.analyzeGame para análise completa de partida
- [x] Classificador de lançes: Brilhante (!!) / Excelente (!) / Bom / Imprecisão (?!) / Erro (?) / Blunder (??)
- [x] Hook useMoveAnalysis: analisa todos os lançes em background via tRPC
- [x] Fórmula de precisão (0-100%) baseada na perda média de centipeões
- [x] Barra de avaliação lateral no tabuleiro (brancas/pretas) sincronizada
- [x] Badge de classificação no indicador de posição (cor + símbolo + label)
- [x] Destaque colorido das casas de origem/destino com a cor da classificação
- [x] Símbolo de classificação (!!, !, ?!, ?, ??) na lista de lançes
- [x] Resumo de análise: precisão por jogador e contagem de cada classificação
- [x] Botão de análise no header (ativar/desativar)
- [x] Precisão exibida nos cards de jogadores (brancas/pretas)
- [x] Banner de progresso durante a análise com Stockfish

## Desafiar Amigo
- [x] Criar tabela `challenges` no Supabase com RLS, índices e expiry automático
- [x] Hook `useChallenge` (mobile) para enviar, cancelar e escutar desafio entre dois jogadores
- [x] Hook `usePendingChallenges` (mobile) para escutar todos os desafios recebidos em tempo real
- [x] Hook `useChallenge` (web) para enviar, aceitar, recusar e cancelar desafios
- [x] Modal de configuração do desafio (10 opções de tempo + cor das peças) - mobile
- [x] ChallengeModal no frontend web com opções de tempo e cor
- [x] Botão ♟ Desafiar nos cards de amigos na tela de Amigos (mobile)
- [x] Botão Desafiar nos cards de amigos na página ChessFriends (web)
- [x] ChallengeBanner global no app mobile (desafio recebido com aceitar/recusar animado)
- [x] Aceitar desafio cria partida no Supabase e navega para play-online (mobile)
- [x] Aceitar desafio cria partida no Supabase e redireciona para jogo (web)
- [x] Paridade total: Ranking, Perfil Público e Amizades reais também implementados no web
- [x] 52 testes passando (6 novos de challenge, 0 erros TypeScript)

## Puzzle Diário
- [x] Migração SQL: tabelas puzzles, daily_puzzles, daily_puzzle_attempts
- [x] Hook useDailyPuzzle: buscar puzzle do dia, registrar tentativa, calcular streak
- [x] Tela de Puzzle Diário com tabuleiro interativo real (react-native-chessboard)
- [x] Validação de solução multi-lance com feedback visual (correto/errado)
- [x] Sistema de dicas (até 3 por puzzle)
- [x] Timer de tempo gasto na resolução
- [x] Card de streak na tela de puzzles (dias consecutivos)
- [x] Histórico semanal (7 dias) com indicadores visuais
- [x] Compartilhar resultado (emoji grid)
- [x] Integração com a tela de Puzzles existente (modo Puzzle Diário funcional)

## Problemas de Xadrez
- [x] Tabela puzzle_attempts no Supabase com RLS
- [x] Funções SQL: get_puzzles_list, get_next_puzzle, get_user_puzzle_stats
- [x] Hook usePuzzleProblems: listar, filtrar, buscar próximo, registrar tentativa
- [x] Tela puzzle-problems: lista de puzzles com filtros (dificuldade, tema)
- [x] Tela puzzle-solve: tabuleiro interativo com validação multi-lance, dicas, timer
- [x] Card de estatísticas do usuário (resolvidos, precisão, rating de puzzles)
- [x] Indicadores visuais de progresso (resolvido/não resolvido) na lista
- [x] Integração com a aba Puzzles (modo "Puzzles Personalizados" funcional)

## Paridade de Funcionalidades (Mobile - faltando)
- [ ] Tela Watch: assistir partidas ao vivo
- [ ] Tela Variantes de xadrez (Chess960, Bughouse, etc.)
- [ ] Tela Treinador interativo (/play/trainer)
- [ ] Tela Histórico de Partidas (/history)
- [ ] Tela Rankings Mundiais por país (/ratings-players)
- [ ] Tela Doações (/donate)
- [ ] Subseções de Aprender: Cursos, Análise, Sala de Aula, Prática, Biblioteca, Ideias Críticas
- [ ] Subseções de Notícias: Chess Today, Artigos, Rankings, Top Players
- [ ] Subseções de Mais: Aberturas, Apps, Explorador, Xadrez Solo

## Paridade de Funcionalidades (Web - faltando)
- [ ] Página Estatísticas detalhadas (/stats)
- [ ] Página Metas do jogador (/goals)
