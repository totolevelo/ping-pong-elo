import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const MEDALS = ['🥇', '🥈', '🥉'];

async function loadLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('rank', { ascending: true });

  const section = document.getElementById('leaderboard');

  if (error || !data) {
    section.innerHTML = '<p class="loading">Erreur de chargement.</p>';
    return;
  }

  document.getElementById('total-matches').textContent =
    `${data.reduce((s, p) => s + p.total_matches, 0) / 2 | 0} matchs joués`;

  section.innerHTML = data.map(p => {
    const medal = MEDALS[p.rank - 1] ?? `<span style="color:#555">${p.rank}</span>`;
    const cls   = p.rank <= 3 ? `player-row rank-${p.rank}` : 'player-row';
    return `
      <div class="${cls}">
        <span class="rank">${medal}</span>
        <span class="player-name">${p.display_name}</span>
        <span class="winrate">${p.winrate}%</span>
        <span class="record">${p.wins}V / ${p.losses}D</span>
        <span class="elo">${p.elo}</span>
      </div>`;
  }).join('');
}

async function loadRecentMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, format, winner_delta, played_at,
      winner:players!matches_winner_id_fkey(display_name),
      loser:players!matches_loser_id_fkey(display_name)
    `)
    .order('played_at', { ascending: false })
    .limit(10);

  const section = document.querySelector('#recent-matches div');

  if (error || !data) {
    section.innerHTML = '<p class="loading">Erreur de chargement.</p>';
    return;
  }

  if (data.length === 0) {
    section.innerHTML = '<p class="loading">Aucun match enregistré.</p>';
    return;
  }

  section.innerHTML = data.map(m => {
    const date = new Date(m.played_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="match-row">
        <span class="match-winner">🏆 ${m.winner.display_name}</span>
        <span class="match-delta">+${m.winner_delta}</span>
        <span class="match-loser">vs ${m.loser.display_name}</span>
        <span class="match-format">${m.format} pts</span>
        <span class="match-delta">${date}</span>
      </div>`;
  }).join('');
}

// Chargement initial
loadLeaderboard();
loadRecentMatches();

// Rafraîchissement auto toutes les 30s
setInterval(() => {
  loadLeaderboard();
  loadRecentMatches();
}, 30_000);
