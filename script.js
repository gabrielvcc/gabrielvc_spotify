document.addEventListener('DOMContentLoaded', () => {
    const playerContainer = document.getElementById('player-container');
    const offlineContainer = document.getElementById('offline-container');
    const albumArt = document.getElementById('album-art');
    const songName = document.getElementById('song-name');
    const songNameClone = document.querySelector('#song-name + span');
    const artistName = document.getElementById('artist-name');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const shareButton = document.getElementById('share-button');
    const playlistSection = document.getElementById('playlist-section');
    const mainHeader = document.querySelector('.main-header');
    const topTrackHighlightContainer = document.getElementById('top-track-highlight-container');
    const topTracksGridContainer = document.getElementById('top-tracks-grid-container');
    const topTracksLoader = document.getElementById('top-tracks-loader');
    const modalOverlay = document.getElementById('track-modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    const API_BASE_URL = "https://api.calculoperfil.gabrielvc.com.br";

    // --- Funções Auxiliares ---
    function formatTime(ms) {
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s/60)}:${('0'+s%60).slice(-2)}`;
    }

    function applyMarquee(element) {
        if (!element) return;
        if (element.scrollWidth > element.offsetWidth) {
            const text = element.textContent;
            element.innerHTML = `<span class="marquee-wrapper"><span>${text}</span><span>${text}</span></span>`;
        }
    }

    // --- LÓGICA DO MODAL ---
    async function openModal(track) {
        modalOverlay.classList.remove('hidden');
        modalBody.innerHTML = '<div class="skeleton-loader large" style="width: 100%; height: 250px;"></div>';

        try {
            const releaseDate = new Date(track.album.release_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            modalBody.innerHTML = `
                <div>
                    <img src="${track.album.images[0].url}" alt="Capa do Álbum" class="modal-art">
                </div>
                <div class="modal-info">
                    <h2>${track.name}</h2>
                    <p>${track.artists.map(a => a.name).join(', ')}</p>
                    <p><strong>Álbum:</strong> ${track.album.name}</p>
                    <p><strong>Lançamento:</strong> ${releaseDate}</p>
                    <p><strong>Popularidade:</strong> ${track.popularity} / 100</p>
                    <button class="modal-copy-btn" data-link="${track.external_urls.spotify}">Copiar Link da Música</button>
                </div>`;
        } catch (error) {
            modalBody.innerHTML = '<p>Não foi possível carregar os detalhes da música.</p>';
            console.error("Erro ao construir o modal:", error);
        }
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    // --- FUNÇÕES DE FETCH ---
    async function fetchUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/me`);
            const user = await response.json();
            if (user.images && user.images.length > 0) {
                const profileLink = document.createElement('a');
                profileLink.href = user.external_urls.spotify;
                profileLink.target = '_blank';
                profileLink.rel = 'noopener noreferrer';
                const profileImg = document.createElement('img');
                profileImg.src = user.images[0].url;
                profileImg.alt = user.display_name;
                profileImg.className = 'profile-picture';
                profileLink.appendChild(profileImg);
                mainHeader.insertBefore(profileLink, mainHeader.firstChild);
            }
        } catch (error) {
            console.error("Erro ao buscar perfil do utilizador:", error);
        }
    }

    async function updateNowPlaying() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/now-playing`);
            if (response.status === 401) {
                window.location.href = (await response.json()).login_url;
                return;
            }
            const data = await response.json();
            if (data.is_playing) {
                playerContainer.classList.remove('hidden');
                offlineContainer.classList.add('hidden');
                albumArt.src = data.album_art_url;
                songName.textContent = data.song_name;
                songNameClone.textContent = data.song_name;
                artistName.textContent = data.artist_name;
                currentTimeEl.textContent = formatTime(data.progress_ms);
                totalTimeEl.textContent = formatTime(data.duration_ms);
                progressBar.style.width = `${(data.progress_ms / data.duration_ms) * 100}%`;
                shareButton.dataset.songUrl = data.song_url;
            } else {
                playerContainer.classList.add('hidden');
                offlineContainer.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Erro ao buscar 'a tocar agora':", error);
        }
    }

    async function fetchTopTracks(timeRange = 'short_term') {
    try {
        const response = await fetch(`${API_BASE_URL}/api/top-tracks?time_range=${timeRange}`);
        // Verificação de erro na resposta
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tracks = await response.json();
        
        topTrackHighlightContainer.innerHTML = '';
        topTracksGridContainer.innerHTML = '';
        
        if (tracks.length > 0) {
            const highlightTrack = tracks[0];
            const highlightElement = document.createElement('div');
            highlightElement.className = 'top-track-highlight';
            highlightElement.innerHTML = `
                <img src="${highlightTrack.album.images[1].url}" alt="${highlightTrack.album.name}" class="item-art">
                <div class="item-info">
                    <div class="item-name">${highlightTrack.name}</div>
                    <div class="item-artist">${highlightTrack.artists.map(a => a.name).join(', ')}</div>
                </div>`;
            highlightElement.addEventListener('click', () => openModal(highlightTrack));
            topTrackHighlightContainer.appendChild(highlightElement);
            applyMarquee(highlightElement.querySelector('.item-name'));
            applyMarquee(highlightElement.querySelector('.item-artist'));

            tracks.slice(1).forEach((track, index) => {
                const gridElement = document.createElement('div');
                gridElement.className = 'top-track-grid-item';
                gridElement.innerHTML = `
                    <span class="item-rank">${index + 2}</span>
                    <img src="${track.album.images[2].url}" alt="${track.album.name}" class="item-art">
                    <div class="item-info">
                        <div class="item-name">${track.name}</div>
                        <div class="item-artist">${track.artists.map(a => a.name).join(', ')}</div>
                    </div>`;
                gridElement.addEventListener('click', () => openModal(track));
                topTracksGridContainer.appendChild(gridElement);
                applyMarquee(gridElement.querySelector('.item-name'));
                applyMarquee(gridElement.querySelector('.item-artist'));
            });
        }
        topTracksLoader.style.display = 'none';
    } catch (error) {
        topTrackHighlightContainer.innerHTML = '<p>Não foi possível carregar as músicas mais tocadas.</p>';
        topTracksLoader.style.display = 'none';
        console.error("Erro ao buscar top tracks:", error);
    }
}
    
    async function fetchPlaylists() {
        const playlistsContainer = document.getElementById('playlist-container');
        try {
            const response = await fetch(`${API_BASE_URL}/api/playlists`);
            const playlists = await response.json();

            playlistsContainer.innerHTML = ''; 

            playlists.forEach(playlistData => {
                const container = document.createElement('div');
                container.className = 'playlist-instance-container';

                const headerElement = document.createElement('div');
                headerElement.className = 'playlist-header';
                headerElement.innerHTML = `
                    <img class="playlist-cover" src="${playlistData.images[0].url}" alt="${playlistData.name}">
                    <div class="playlist-info">
                        <h3>${playlistData.name}</h3>
                        <p>${playlistData.tracks.total} músicas</p>
                    </div>`;
                
                const tracksContainer = document.createElement('div');
                tracksContainer.className = 'playlist-tracks list-container';

                playlistData.tracks.items.forEach((item, index) => {
                    const track = item.track;
                    if (!track) return;
                    const dateAdded = new Date(item.added_at).toLocaleDateString('pt-BR');
                    const trackElement = document.createElement('div');
                    trackElement.className = 'list-item';
                    trackElement.innerHTML = `
                        <span class="item-count">${index + 1}</span>
                        <img src="${track.album.images[2]?.url || ''}" alt="${track.album.name}" class="item-art">
                        <div class="item-info">
                            <div class="item-name">${track.name}</div>
                            <div class="item-artist">${track.artists.map(a => a.name).join(', ')}</div>
                        </div>
                        <div class="item-album">${track.album.name}</div>
                        <div class="item-date-added">${dateAdded}</div>`;
                    
                    trackElement.addEventListener('click', () => openModal(track));
                    tracksContainer.appendChild(trackElement);
                    applyMarquee(trackElement.querySelector('.item-name'));
                    applyMarquee(trackElement.querySelector('.item-artist'));
                    applyMarquee(trackElement.querySelector('.item-album'));
                });

                headerElement.addEventListener('click', () => {
                    tracksContainer.classList.toggle('visible');
                });

                container.appendChild(headerElement);
                container.appendChild(tracksContainer);
                playlistsContainer.appendChild(container); 
            });
        } catch (error) {
            if(initialContainer) initialContainer.innerHTML = '<p>Não foi possível carregar as playlists.</p>';
            console.error("Erro ao buscar playlists:", error);
        }
    }

    // --- EVENT LISTENERS ---
    shareButton.addEventListener('click', () => {
        const url = shareButton.dataset.songUrl;
        if (url) {
            navigator.clipboard.writeText(url).then(() => {
                const originalText = shareButton.innerHTML;
                shareButton.innerHTML = 'Copiado!';
                setTimeout(() => { shareButton.innerHTML = originalText; }, 2000);
            }).catch(err => console.error('Erro ao copiar:', err));
        }
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('click', (e) => {
        if (e.target.matches('.modal-copy-btn')) {
            const link = e.target.dataset.link;
            navigator.clipboard.writeText(link).then(() => {
                e.target.textContent = 'Copiado!';
                setTimeout(() => { e.target.textContent = 'Copiar Link da Música'; }, 2000);
            });
        }
    });

const timeRangeDisplay = document.getElementById('time-range-display');
const timeRangeText = document.getElementById('time-range-text');
const timeRangeMenu = document.getElementById('time-range-menu');

if (timeRangeDisplay) {
    timeRangeDisplay.addEventListener('click', (event) => {
        event.stopPropagation();
        timeRangeMenu.classList.toggle('active');
        timeRangeDisplay.classList.toggle('active');
    });

    timeRangeMenu.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const selectedRange = event.target.dataset.range;
            const selectedText = event.target.dataset.text;

            timeRangeMenu.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            timeRangeText.textContent = selectedText;
            
            topTracksLoader.style.display = 'block';
            topTrackHighlightContainer.innerHTML = '';
            topTracksGridContainer.innerHTML = '';
            
            fetchTopTracks(selectedRange);
        }
    });
}

document.addEventListener('click', () => {
    if (timeRangeMenu && timeRangeMenu.classList.contains('active')) {
        timeRangeMenu.classList.remove('active');
        timeRangeDisplay.classList.remove('active');
    }
});

    const timeRangeButtons = document.querySelectorAll('.time-range-selector button');
    if (timeRangeButtons.length > 0) {
        const topTracksTitle = document.getElementById('top-tracks-title');
        timeRangeButtons.forEach(button => {
            button.addEventListener('click', () => {
                timeRangeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const range = button.dataset.range;
                const rangeText = button.textContent;
                topTracksTitle.textContent = `Mais Tocadas (${rangeText})`;
                
                topTracksLoader.style.display = 'block';
                topTrackHighlightContainer.innerHTML = '';
                topTracksGridContainer.innerHTML = '';
                fetchTopTracks(range);
            });
        });
    }

    // --- INICIALIZAÇÃO ---
    function init() {
        fetchUserProfile();
        fetchTopTracks();
        fetchPlaylists();
        updateNowPlaying();
        setInterval(updateNowPlaying, 2000); 
    }

    init();
});