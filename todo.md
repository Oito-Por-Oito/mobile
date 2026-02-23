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
