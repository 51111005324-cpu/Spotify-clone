const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Mock Data ───────────────────────────────────────────────────────────────

const songs = [
  { id: 1, title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: 200, genre: "Pop", cover: "https://picsum.photos/seed/song1/300/300", plays: 3200000 },
  { id: 2, title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", duration: 203, genre: "Pop", cover: "https://picsum.photos/seed/song2/300/300", plays: 2900000 },
  { id: 3, title: "Stay", artist: "Kid LAROI", album: "Stay", duration: 141, genre: "Hip-Hop", cover: "https://picsum.photos/seed/song3/300/300", plays: 3100000 },
  { id: 4, title: "Montero", artist: "Lil Nas X", album: "Montero", duration: 137, genre: "Pop", cover: "https://picsum.photos/seed/song4/300/300", plays: 2400000 },
  { id: 5, title: "Good 4 U", artist: "Olivia Rodrigo", album: "SOUR", duration: 178, genre: "Pop Rock", cover: "https://picsum.photos/seed/song5/300/300", plays: 2700000 },
  { id: 6, title: "Peaches", artist: "Justin Bieber", album: "Justice", duration: 198, genre: "R&B", cover: "https://picsum.photos/seed/song6/300/300", plays: 2100000 },
  { id: 7, title: "drivers license", artist: "Olivia Rodrigo", album: "SOUR", duration: 242, genre: "Pop", cover: "https://picsum.photos/seed/song7/300/300", plays: 3400000 },
  { id: 8, title: "Kiss Me More", artist: "Doja Cat", album: "Planet Her", duration: 208, genre: "R&B", cover: "https://picsum.photos/seed/song8/300/300", plays: 1900000 },
  { id: 9, title: "Butter", artist: "BTS", album: "Butter", duration: 164, genre: "K-Pop", cover: "https://picsum.photos/seed/song9/300/300", plays: 4100000 },
  { id: 10, title: "Permission to Dance", artist: "BTS", album: "Butter", duration: 187, genre: "K-Pop", cover: "https://picsum.photos/seed/song10/300/300", plays: 3600000 },
  { id: 11, title: "Bad Habits", artist: "Ed Sheeran", album: "=", duration: 231, genre: "Pop", cover: "https://picsum.photos/seed/song11/300/300", plays: 2800000 },
  { id: 12, title: "Heat Waves", artist: "Glass Animals", album: "Dreamland", duration: 238, genre: "Indie Pop", cover: "https://picsum.photos/seed/song12/300/300", plays: 2600000 },
  { id: 13, title: "Industry Baby", artist: "Lil Nas X", album: "Montero", duration: 212, genre: "Hip-Hop", cover: "https://picsum.photos/seed/song13/300/300", plays: 2500000 },
  { id: 14, title: "Shivers", artist: "Ed Sheeran", album: "=", duration: 207, genre: "Pop", cover: "https://picsum.photos/seed/song14/300/300", plays: 1800000 },
  { id: 15, title: "Watermelon Sugar", artist: "Harry Styles", album: "Fine Line", duration: 174, genre: "Pop", cover: "https://picsum.photos/seed/song15/300/300", plays: 3000000 },
  { id: 16, title: "As It Was", artist: "Harry Styles", album: "Harry's House", duration: 167, genre: "Pop", cover: "https://picsum.photos/seed/song16/300/300", plays: 4500000 },
];

const playlists = [
  { id: 1, name: "Today's Top Hits", description: "The hottest songs right now", cover: "https://picsum.photos/seed/pl1/300/300", songs: [1,2,3,4,5], owner: "Spotify" },
  { id: 2, name: "Chill Vibes", description: "Relax and unwind", cover: "https://picsum.photos/seed/pl2/300/300", songs: [12,15,6,8,14], owner: "Spotify" },
  { id: 3, name: "Pop Rising", description: "The best new pop music", cover: "https://picsum.photos/seed/pl3/300/300", songs: [7,16,5,11,2], owner: "Spotify" },
  { id: 4, name: "Hip-Hop Essentials", description: "Hip-hop bangers all day", cover: "https://picsum.photos/seed/pl4/300/300", songs: [3,13,4,9,1], owner: "Spotify" },
  { id: 5, name: "K-Pop Corner", description: "Best of K-Pop", cover: "https://picsum.photos/seed/pl5/300/300", songs: [9,10,2,5,8], owner: "Spotify" },
  { id: 6, name: "My Favorites", description: "Songs I love", cover: "https://picsum.photos/seed/pl6/300/300", songs: [16,7,11,12,15], owner: "You" },
];

const albums = [
  { id: 1, name: "After Hours", artist: "The Weeknd", year: 2020, cover: "https://picsum.photos/seed/alb1/300/300", songs: [1] },
  { id: 2, name: "Future Nostalgia", artist: "Dua Lipa", year: 2020, cover: "https://picsum.photos/seed/alb2/300/300", songs: [2,8] },
  { id: 3, name: "SOUR", artist: "Olivia Rodrigo", year: 2021, cover: "https://picsum.photos/seed/alb3/300/300", songs: [5,7] },
  { id: 4, name: "Montero", artist: "Lil Nas X", year: 2021, cover: "https://picsum.photos/seed/alb4/300/300", songs: [4,13] },
  { id: 5, name: "=", artist: "Ed Sheeran", year: 2021, cover: "https://picsum.photos/seed/alb5/300/300", songs: [11,14] },
  { id: 6, name: "Harry's House", artist: "Harry Styles", year: 2022, cover: "https://picsum.photos/seed/alb6/300/300", songs: [16,15] },
];

const users = [
  { id: 1, username: "demo", password: "demo123", name: "Demo User", email: "demo@example.com", likedSongs: [1,3,7,16], playlists: [6] }
];

// ─── Auth Routes ──────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _, ...safeUser } = user;
  res.json({ token: `fake-jwt-${user.id}`, user: safeUser });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, name } = req.body;
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'Username taken' });
  const newUser = { id: users.length + 1, username, email, password, name, likedSongs: [], playlists: [] };
  users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  res.json({ token: `fake-jwt-${newUser.id}`, user: safeUser });
});

// ─── Songs Routes ─────────────────────────────────────────────────────────────

app.get('/api/songs', (req, res) => {
  const { q, genre } = req.query;
  let results = songs;
  if (q) results = results.filter(s => s.title.toLowerCase().includes(q.toLowerCase()) || s.artist.toLowerCase().includes(q.toLowerCase()));
  if (genre) results = results.filter(s => s.genre === genre);
  res.json(results);
});

app.get('/api/songs/trending', (req, res) => {
  const trending = [...songs].sort((a, b) => b.plays - a.plays).slice(0, 8);
  res.json(trending);
});

app.get('/api/songs/:id', (req, res) => {
  const song = songs.find(s => s.id === parseInt(req.params.id));
  if (!song) return res.status(404).json({ error: 'Song not found' });
  res.json(song);
});

// ─── Playlists Routes ─────────────────────────────────────────────────────────

app.get('/api/playlists', (req, res) => res.json(playlists));

app.get('/api/playlists/:id', (req, res) => {
  const playlist = playlists.find(p => p.id === parseInt(req.params.id));
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
  const playlistSongs = playlist.songs.map(id => songs.find(s => s.id === id)).filter(Boolean);
  res.json({ ...playlist, songs: playlistSongs });
});

app.post('/api/playlists', (req, res) => {
  const { name, description } = req.body;
  const newPlaylist = {
    id: playlists.length + 1, name, description: description || '',
    cover: `https://picsum.photos/seed/pl${playlists.length + 1}/300/300`,
    songs: [], owner: "You"
  };
  playlists.push(newPlaylist);
  res.json(newPlaylist);
});

app.post('/api/playlists/:id/songs', (req, res) => {
  const playlist = playlists.find(p => p.id === parseInt(req.params.id));
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
  const { songId } = req.body;
  if (!playlist.songs.includes(songId)) playlist.songs.push(songId);
  res.json(playlist);
});

// ─── Albums Routes ────────────────────────────────────────────────────────────

app.get('/api/albums', (req, res) => res.json(albums));

app.get('/api/albums/:id', (req, res) => {
  const album = albums.find(a => a.id === parseInt(req.params.id));
  if (!album) return res.status(404).json({ error: 'Album not found' });
  const albumSongs = album.songs.map(id => songs.find(s => s.id === id)).filter(Boolean);
  res.json({ ...album, songs: albumSongs });
});

// ─── Search Route ─────────────────────────────────────────────────────────────

app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ songs: [], playlists: [], albums: [] });
  const q_lower = q.toLowerCase();
  res.json({
    songs: songs.filter(s => s.title.toLowerCase().includes(q_lower) || s.artist.toLowerCase().includes(q_lower)),
    playlists: playlists.filter(p => p.name.toLowerCase().includes(q_lower)),
    albums: albums.filter(a => a.name.toLowerCase().includes(q_lower) || a.artist.toLowerCase().includes(q_lower)),
  });
});

// ─── Liked Songs ──────────────────────────────────────────────────────────────

app.get('/api/user/liked', (req, res) => {
  const user = users[0];
  const likedSongs = user.likedSongs.map(id => songs.find(s => s.id === id)).filter(Boolean);
  res.json(likedSongs);
});

app.post('/api/user/liked/:songId', (req, res) => {
  const user = users[0];
  const songId = parseInt(req.params.songId);
  const idx = user.likedSongs.indexOf(songId);
  if (idx === -1) user.likedSongs.push(songId);
  else user.likedSongs.splice(idx, 1);
  res.json({ liked: idx === -1, likedSongs: user.likedSongs });
});

// ─── Serve Frontend ───────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎵 Spotify Clone running at http://localhost:${PORT}\n`);
})