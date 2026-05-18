/* ─── Config ─────────────────────────────────────────── */
const API = 'http://localhost:3000/api';

/* ─── State ──────────────────────────────────────────── */
let state = {
  user: null, token: null,
  songs: [], playlists: [], albums: [], likedSongs: [],
  queue: [], queueIndex: -1,
  isPlaying: false, shuffle: false, repeat: false,
  currentSong: null, searchTimer: null,
};

/* ─── API Helper ──────────────────────────────────────── */
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) },
    ...opts,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

/* ─── Auth ────────────────────────────────────────────── */
async function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    saveSession(data); initApp();
  } catch (e) {
    errEl.textContent = e.error || 'Login failed';
    errEl.classList.remove('hidden');
  }
}

async function register() {
  const name = document.getElementById('regName').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('registerError');
  errEl.classList.add('hidden');
  try {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, username, email, password }) });
    saveSession(data); initApp();
  } catch (e) {
    errEl.textContent = e.error || 'Registration failed';
    errEl.classList.remove('hidden');
  }
}

function saveSession({ token, user }) {
  state.token = token; state.user = user;
  localStorage.setItem('spotify_token', token);
  localStorage.setItem('spotify_user', JSON.stringify(user));
}

function logout() {
  state = { ...state, user: null, token: null, currentSong: null, isPlaying: false };
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_user');
  document.getElementById('app').classList.add('hidden');
  showLogin();
}

function showLogin() {
  document.getElementById('registerScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}
function showRegister() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('registerScreen').classList.remove('hidden');
}

/* ─── App Init ────────────────────────────────────────── */
async function initApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('registerScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('userName').textContent = state.user.name;
  document.getElementById('userAvatar').textContent = state.user.name[0].toUpperCase();
  const [songs, playlists, albums, liked] = await Promise.all([
    api('/songs'), api('/playlists'), api('/albums'), api('/user/liked')
  ]);
  state.songs = songs; state.playlists = playlists;
  state.albums = albums; state.likedSongs = liked.map(s => s.id);
  renderSidebar(); navigate('home'); initPlayer();
}

window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('spotify_token');
  const user = localStorage.getItem('spotify_user');
  if (token && user) { state.token = token; state.user = JSON.parse(user); initApp(); }
});

/* ─── Navigation ──────────────────────────────────────── */
function navigate(view, id = null) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const searchBar = document.getElementById('searchBar');
  searchBar.style.display = view === 'search' ? 'flex' : 'none';
  if (view === 'home') {
    document.getElementById('homeView').classList.add('active');
    document.querySelector('[onclick="navigate(\'home\')"]').classList.add('active');
    loadHome();
  } else if (view === 'search') {
    document.getElementById('searchView').classList.add('active');
    document.querySelector('[onclick="navigate(\'search\')"]').classList.add('active');
    loadSearch();
    setTimeout(() => document.getElementById('searchInput').focus(), 100);
  } else if (view === 'library') {
    document.getElementById('libraryView').classList.add('active');
    document.querySelector('[onclick="navigate(\'library\')"]').classList.add('active');
    loadLibrary();
  } else if (view === 'playlist') {
    document.getElementById('playlistView').classList.add('active');
    loadPlaylist(id);
  } else if (view === 'album') {
    document.getElementById('albumView').classList.add('active');
    loadAlbum(id);
  }
}

/* ─── Home ────────────────────────────────────────────── */
async function loadHome() {
  const trending = await api('/songs/trending');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '☀️ Good morning' : hour < 17 ? '👋 Good afternoon' : '🌙 Good evening';
  document.querySelector('.gradient-header h1').textContent = greeting;
  document.getElementById('trendingGrid').innerHTML = trending.map(s => songCard(s)).join('');
  document.getElementById('featuredPlaylists').innerHTML = state.playlists.slice(0, 6).map(p => playlistCard(p)).join('');
  document.getElementById('albumsGrid').innerHTML = state.albums.map(a => albumCard(a)).join('');
}

/* ─── Search ──────────────────────────────────────────── */
function loadSearch() {
  const input = document.getElementById('searchInput');
  if (!input.value) { renderBrowse(); return; }
  performSearch(input.value);
}

function debounceSearch(val) {
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(() => {
    if (val.trim()) performSearch(val); else renderBrowse();
  }, 300);
}

async function performSearch(q) {
  const results = await api(`/search?q=${encodeURIComponent(q)}`);
  const container = document.getElementById('searchResults');
  let html = '';
  if (results.songs.length) {
    html += `<div class="section-header"><h2>Songs</h2></div>`;
    html += `<div class="song-table-header"><span>#</span><span>TITLE</span><span>ALBUM</span><span>⏱</span><span></span></div>`;
    html += results.songs.map((s, i) => songRow(s, i + 1)).join('');
  }
  if (results.playlists.length) {
    html += `<div class="section-header" style="margin-top:24px"><h2>Playlists</h2></div>`;
    html += `<div class="grid-4">${results.playlists.map(p => playlistCard(p)).join('')}</div>`;
  }
  if (results.albums.length) {
    html += `<div class="section-header" style="margin-top:24px"><h2>Albums</h2></div>`;
    html += `<div class="grid-4">${results.albums.map(a => albumCard(a)).join('')}</div>`;
  }
  if (!results.songs.length && !results.playlists.length && !results.albums.length) {
    html = `<div class="empty-state">No results for "${q}"</div>`;
  }
  container.innerHTML = html;
}

function renderBrowse() {
  const genres = [
    { label: 'Pop', color: '#1e3264' }, { label: 'Hip-Hop', color: '#8d67ab' },
    { label: 'R&B', color: '#e8115b' }, { label: 'Rock', color: '#ba5d07' },
    { label: 'K-Pop', color: '#148a08' }, { label: 'Indie', color: '#0d73ec' },
    { label: 'Electronic', color: '#1e3264' }, { label: 'Latin', color: '#e91429' },
  ];
  document.getElementById('searchResults').innerHTML = `
    <div class="section-header"><h2>Browse all</h2></div>
    <div class="browse-grid">
      ${genres.map(g => `<div class="browse-card" style="background:${g.color}" onclick="searchGenre('${g.label}')"><div class="browse-card-title">${g.label}</div></div>`).join('')}
    </div>`;
}

async function searchGenre(genre) {
  document.getElementById('searchInput').value = genre;
  const songs = await api(`/songs?genre=${genre}`);
  const container = document.getElementById('searchResults');
  let html = `<div class="section-header"><h2>${genre}</h2></div>`;
  if (songs.length) {
    html += `<div class="song-table-header"><span>#</span><span>TITLE</span><span>ALBUM</span><span>⏱</span><span></span></div>`;
    html += songs.map((s, i) => songRow(s, i + 1)).join('');
  }
  container.innerHTML = html;
}

/* ─── Library ─────────────────────────────────────────── */
async function loadLibrary() {
  const liked = await api('/user/liked');
  state.likedSongs = liked.map(s => s.id);
  document.getElementById('likedCount').textContent = liked.length;
  const likedList = document.getElementById('likedSongsList');
  if (liked.length) {
    likedList.innerHTML = `<div class="song-table-header"><span>#</span><span>TITLE</span><span>ALBUM</span><span>⏱</span><span></span></div>`;
    likedList.innerHTML += liked.map((s, i) => songRow(s, i + 1)).join('');
  } else {
    likedList.innerHTML = `<div class="empty-state">No liked songs yet.</div>`;
  }
  const userPlaylists = state.playlists.filter(p => p.owner === 'You');
  document.getElementById('userPlaylists').innerHTML = userPlaylists.map(p => playlistCard(p)).join('');
}

/* ─── Playlist / Album ────────────────────────────────── */
async function loadPlaylist(id) {
  const pl = await api(`/playlists/${id}`);
  document.getElementById('playlistHeader').innerHTML = `
    <img class="playlist-cover" src="${pl.cover}" alt="${pl.name}" />
    <div class="playlist-meta">
      <div class="playlist-type">Playlist</div>
      <div class="playlist-name">${pl.name}</div>
      <div class="playlist-desc">${pl.description}</div>
      <div class="playlist-stats">${pl.owner} • ${pl.songs.length} songs</div>
      <div class="playlist-actions">
        <button class="play-all-btn" onclick="playAll(${JSON.stringify(pl.songs).replace(/"/g, '&quot;')})">▶ Play</button>
      </div>
    </div>`;
  const body = document.getElementById('playlistSongs');
  body.innerHTML = `<div class="song-table-header"><span>#</span><span>TITLE</span><span>ALBUM</span><span>⏱</span><span></span></div>`;
  body.innerHTML += pl.songs.map((s, i) => songRow(s, i + 1)).join('');
}

async function loadAlbum(id) {
  const alb = await api(`/albums/${id}`);
  document.getElementById('albumHeader').innerHTML = `
    <img class="playlist-cover" src="${alb.cover}" alt="${alb.name}" />
    <div class="playlist-meta">
      <div class="playlist-type">Album</div>
      <div class="playlist-name">${alb.name}</div>
      <div class="playlist-desc">${alb.artist}</div>
      <div class="playlist-stats">${alb.year} • ${alb.songs.length} songs</div>
      <div class="playlist-actions">
        <button class="play-all-btn" onclick="playAll(${JSON.stringify(alb.songs).replace(/"/g, '&quot;')})">▶ Play</button>
      </div>
    </div>`;
  const body = document.getElementById('albumSongs');
  body.innerHTML = `<div class="song-table-header"><span>#</span><span>TITLE</span><span>ALBUM</span><span>⏱</span><span></span></div>`;
  body.innerHTML += alb.songs.map((s, i) => songRow(s, i + 1)).join('');
}

/* ─── Sidebar ─────────────────────────────────────────── */
function renderSidebar() {
  document.getElementById('sidebarPlaylists').innerHTML = state.playlists.map(p =>
    `<div class="sidebar-playlist-item" onclick="navigate('playlist', ${p.id})">${p.name}</div>`
  ).join('');
}

/* ─── Cards & Rows ────────────────────────────────────── */
function songCard(s) {
  return `<div class="card" onclick="playSong(${s.id})">
    <div class="card-cover-wrap">
      <img class="card-cover" src="${s.cover}" alt="${s.title}" loading="lazy" />
      <div class="card-play-btn"><svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg></div>
    </div>
    <div class="card-title">${s.title}</div>
    <div class="card-sub">${s.artist}</div>
  </div>`;
}

function playlistCard(p) {
  return `<div class="card" onclick="navigate('playlist', ${p.id})">
    <div class="card-cover-wrap">
      <img class="card-cover" src="${p.cover}" alt="${p.name}" loading="lazy" />
      <div class="card-play-btn"><svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg></div>
    </div>
    <div class="card-title">${p.name}</div>
    <div class="card-sub">${p.description || p.owner}</div>
  </div>`;
}

function albumCard(a) {
  return `<div class="card" onclick="navigate('album', ${a.id})">
    <div class="card-cover-wrap">
      <img class="card-cover" src="${a.cover}" alt="${a.name}" loading="lazy" />
      <div class="card-play-btn"><svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg></div>
    </div>
    <div class="card-title">${a.name}</div>
    <div class="card-sub">${a.artist} • ${a.year}</div>
  </div>`;
}

function songRow(s, num) {
  const liked = state.likedSongs.includes(s.id);
  const isPlaying = state.currentSong && state.currentSong.id === s.id;
  return `<div class="song-row ${isPlaying ? 'playing' : ''}" id="row-${s.id}" ondblclick="playSong(${s.id})">
    <div class="song-num">${isPlaying ? '♪' : num}</div>
    <div class="song-info">
      <img class="song-thumb" src="${s.cover}" alt="${s.title}" loading="lazy" />
      <div class="song-meta">
        <div class="song-name">${s.title}</div>
        <div class="song-artist">${s.artist}</div>
      </div>
    </div>
    <div class="song-album">${s.album}</div>
    <div class="song-duration">${formatDuration(s.duration)}</div>
    <button class="song-like ${liked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLikeSong(${s.id})">
      <svg viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    </button>
  </div>`;
}

/* ─── Player ──────────────────────────────────────────── */
const audio = document.getElementById('audioPlayer');

function initPlayer() {
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', onSongEnd);
  audio.volume = 0.8;
}

function playSong(id) {
  const song = state.songs.find(s => s.id === id);
  if (!song) return;
  state.queue = [song]; state.queueIndex = 0;
  loadSong(song);
}

function playAll(songs) {
  if (!songs || !songs.length) return;
  state.queue = songs; state.queueIndex = 0;
  loadSong(songs[0]);
}

function loadSong(song) {
  state.currentSong = song;
  audio.src = '';
  document.getElementById('playerTitle').textContent = song.title;
  document.getElementById('playerArtist').textContent = song.artist;
  document.getElementById('playerCover').src = song.cover;
  document.title = `${song.title} – ${song.artist} | Soundify`;
  const liked = state.likedSongs.includes(song.id);
  const likeBtn = document.getElementById('playerLikeBtn');
  likeBtn.classList.toggle('liked', liked);
  likeBtn.querySelector('svg').setAttribute('fill', liked ? 'currentColor' : 'none');
  state.isPlaying = true;
  updatePlayPauseIcon();
  simulatePlayback(song.duration);
  document.querySelectorAll('.song-row').forEach(r => r.classList.remove('playing'));
  const row = document.getElementById(`row-${song.id}`);
  if (row) { row.classList.add('playing'); row.querySelector('.song-num').textContent = '♪'; }
}

let simulationTimer = null, simulationStart = null, simulationDuration = 0, simulationElapsed = 0;

function simulatePlayback(duration) {
  clearInterval(simulationTimer);
  simulationDuration = duration;
  simulationStart = Date.now();
  simulationElapsed = 0;
  simulationTimer = setInterval(() => {
    if (!state.isPlaying) return;
    simulationElapsed = (Date.now() - simulationStart) / 1000;
    if (simulationElapsed >= simulationDuration) { clearInterval(simulationTimer); onSongEnd(); return; }
    updateProgressUI(simulationElapsed, simulationDuration);
  }, 500);
}

function updateProgressUI(current, total) {
  const pct = (current / total) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressThumb').style.left = pct + '%';
  document.getElementById('currentTime').textContent = formatDuration(Math.floor(current));
  document.getElementById('totalTime').textContent = formatDuration(total);
}

function updateProgress() {
  if (audio.duration) updateProgressUI(audio.currentTime, audio.duration);
}

function togglePlay() {
  if (!state.currentSong) return;
  state.isPlaying = !state.isPlaying;
  updatePlayPauseIcon();
  if (state.isPlaying) simulationStart = Date.now() - simulationElapsed * 1000;
}

function updatePlayPauseIcon() {
  document.getElementById('playIcon').style.display = state.isPlaying ? 'none' : 'block';
  document.getElementById('pauseIcon').style.display = state.isPlaying ? 'block' : 'none';
}

function seek(e) {
  if (!state.currentSong) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  simulationElapsed = pct * simulationDuration;
  simulationStart = Date.now() - simulationElapsed * 1000;
  updateProgressUI(simulationElapsed, simulationDuration);
}

function nextSong() {
  if (!state.queue.length) return;
  if (state.shuffle) state.queueIndex = Math.floor(Math.random() * state.queue.length);
  else state.queueIndex = (state.queueIndex + 1) % state.queue.length;
  loadSong(state.queue[state.queueIndex]);
}

function prevSong() {
  if (!state.queue.length) return;
  state.queueIndex = (state.queueIndex - 1 + state.queue.length) % state.queue.length;
  loadSong(state.queue[state.queueIndex]);
}

function onSongEnd() {
  if (state.repeat) { simulationElapsed = 0; simulatePlayback(simulationDuration); return; }
  nextSong();
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  document.getElementById('shuffleBtn').classList.toggle('active', state.shuffle);
}

function toggleRepeat() {
  state.repeat = !state.repeat;
  document.getElementById('repeatBtn').classList.toggle('active', state.repeat);
}

function setVolume(val) { audio.volume = val / 100; }

/* ─── Like ────────────────────────────────────────────── */
async function toggleLikeSong(id) {
  const data = await api(`/user/liked/${id}`, { method: 'POST' });
  state.likedSongs = data.likedSongs;
  document.querySelectorAll('.song-like').forEach(btn => {
    const songId = parseInt(btn.getAttribute('onclick')?.match(/\d+/)?.[0]);
    if (!songId) return;
    const liked = state.likedSongs.includes(songId);
    btn.classList.toggle('liked', liked);
    btn.querySelector('svg').setAttribute('fill', liked ? 'currentColor' : 'none');
  });
  if (state.currentSong && state.currentSong.id === id) {
    const liked = state.likedSongs.includes(id);
    const likeBtn = document.getElementById('playerLikeBtn');
    likeBtn.classList.toggle('liked', liked);
    likeBtn.querySelector('svg').setAttribute('fill', liked ? 'currentColor' : 'none');
  }
}

async function toggleLike() {
  if (!state.currentSong) return;
  toggleLikeSong(state.currentSong.id);
}

/* ─── Create Playlist ─────────────────────────────────── */
async function createPlaylist() {
  const name = prompt('Playlist name:');
  if (!name) return;
  const pl = await api('/playlists', { method: 'POST', body: JSON.stringify({ name }) });
  state.playlists.push(pl);
  renderSidebar();
  navigate('playlist', pl.id);
}

/* ─── Utils ───────────────────────────────────────────── */
function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') nextSong();
  if (e.code === 'ArrowLeft') prevSong();
});