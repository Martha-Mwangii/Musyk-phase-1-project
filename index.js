// Defines the client ID for the Jamendo API 
const clientId = '88543d7c'; 

// Defines the base URL for the Jamendo API
const apiUrl = 'https://api.jamendo.com/v3.0/';

// Initialize an array to store playlists, starting with a default  playlist named 'Recents'
let playlists = [{ name: 'Recents', songs: [] }]; // Default  playlist named Recents
let currentSongIndex = 0;// Set initial index for the current song
let currentPlaylist = [];// Placeholder for the current playlist (set as an empty array initially)
let audioPlayer = null;// Initialize the audio player (meaning no audio is currently playing)

// Event Listeners
window.onload = () => {// Executes when the window loads
    fetchPublicPlaylists(); // Fetch public playlists from the API
    displayPlaylists(); // Display the local playlists
};

//Enter key press Event listener for the search input field to trigger search on pressing enter
document.getElementById('search-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') { // If Enter key is pressed
        searchSongs(); // Call the searchSongs function to initiate search
    }
});

// click event listener for the search button 
document.getElementById('search-button').addEventListener('click', searchSongs);

// Event listener to create a new playlist when the create button is clicked
document.getElementById('create-playlist-button').addEventListener('click', createPlaylist);

//CHANGE  event listener to play a selected public playlist when the dropdown changesi.e if you choose a different playlist
document.getElementById('public-playlist-dropdown').addEventListener('change', playPublicPlaylist);

//click  event listeners for the play/pause/next/previous buttons
document.getElementById('play-button').addEventListener('click', playCurrentSong);
document.getElementById('pause-button').addEventListener('click', pauseCurrentSong);
document.getElementById('next-button').addEventListener('click', playNextSong);
document.getElementById('previous-button').addEventListener('click', playPreviousSong);

// PATCH method to edit the current Playlist Name
function editPlaylistName(index) {
    // Get the playlist ID (local or from the server)
    const playlistId = playlists[index].id || `local-${index}`; // Use a local ID or server ID
    // Prompt the user for a new playlist name
    const newName = prompt("Enter the new playlist name:");

    // If the user doesn't provide a valid name
    if (!newName || !newName.trim()) {
        alert("Playlist name cannot be empty!");//they get this as the alert message
        return;
    }

    // Constructing  the API URL for updating the playlist
    const url = `${apiUrl}playlists/${playlistId}`; 

    // Payload for the PATCH request (new playlist name)
    const payload = { name: newName };

    // Send a PATCH request to update the playlist name
    fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json', // Set request headers
        },
        body: JSON.stringify(payload), // Convert the payload to JSON
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update playlist name.');
            }
            return response.json(); // Parse the response if successful
        })
        .then(updatedPlaylist => {
            playlists[index].name = updatedPlaylist.name || newName; // Update the playlist name locally
            alert(`Playlist updated to "${playlists[index].name}"!`); // Alerts the user that the platylist name is  changed to what has been types
            displayPlaylists(); // Re-render playlists
        })
        .catch(error => console.error('Error:', error)); // Handle errors
}

// Search Songs
function searchSongs() {
    // Get the query string from the search input
    const query = document.getElementById('search-input').value.trim();
    // If the query is empty, return early
    if (!query) return;

    // Fetch the search results from the Jamendo API
    fetch(`${apiUrl}tracks/?client_id=${clientId}&search=${query}&limit=3`) // Limit search results to 3 since some have many results
        .then(response => response.json()) // Parse the response as JSON
        .then(data => displaySearchResults(data.results)); // Call displaySearchResults with the results
}

// Display Search Results
function displaySearchResults(tracks) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = ''; // Clear previous results

    // Loop through each track and display it
    tracks.forEach(track => {
        const trackDiv = document.createElement('div'); // Create a div for each track
        trackDiv.id = track.name; // Set an ID based on the track name
        trackDiv.innerHTML = `
            <p>${track.name} - ${track.artist_name}</p>
            <button onclick="playSongImmediately('${track.audio}', '${track.name}', '${track.artist_name}', '${track.image}')">Play</button>
            <select id="playlist-select">
                ${playlists.map((pl, index) => `<option value="${index}">${pl.name}</option>`).join('')}
            </select>
            <button onclick="addToPlaylist(${playlists.length - 1}, '${track.audio}', '${track.name}', '${track.artist_name}', '${track.image}')">Add</button>
        `;
        resultsDiv.appendChild(trackDiv); // Append the track div to the results container
    });
}

// Play Song Immediately
function playSongImmediately(audio, name, artist, image) {
    if (audioPlayer) audioPlayer.pause(); // If a song is already playing, pause it
    audioPlayer = new Audio(audio); // Create a new Audio object
    audioPlayer.play(); // Play the song immediately

    // Update the UI to show the current song's details
    document.getElementById('current-song-title').innerText = name;
    document.getElementById('current-song-artist').innerText = artist;
    document.getElementById('current-song-image').src = image || 'default-image.png'; // Show album image
}

// Add Song to Playlist
function addToPlaylist(playlistIndex, audio, name, artist, image) {
    // Add the song to the specified playlist
    playlists[playlistIndex].songs.push({ audio, name, artist, image });
    alert(`${name} added to ${playlists[playlistIndex].name}`); // Alert the user
    displayPlaylists(); // Re-render the playlists
}

// Create a New Playlist
function createPlaylist() {
    const playlistName = document.getElementById('playlist-name-input').value.trim(); // Get playlist name from input
    if (playlistName) {
        playlists.push({ name: playlistName, songs: [] }); // Add a new playlist
        displayPlaylists(); // Re-render the playlists
    }
}

// Display all Playlists
function displayPlaylists() {
    const container = document.getElementById('my-playlists');
    container.innerHTML = ''; // Clear previous playlist display

    // Loop through each playlist and display it
    playlists.forEach((playlist, index) => {
        const playlistDiv = document.createElement('div');
        playlistDiv.innerHTML = `
            <h3>${playlist.name}</h3>
            <button onclick="playPlaylist(${index})">Play</button>
            <button onclick="deletePlaylist(${index})">Delete</button>
            <button onclick="editPlaylistName(${index})">Edit</button> <!-- Edit button -->
            <button onclick="sharePlaylist(${index})">Share</button>
        `;
        container.appendChild(playlistDiv); // Adds the playlist div to the container
    });
}

// Play a Playlist
function playPlaylist(index) {
    currentPlaylist = playlists[index].songs; // Set the current playlist
    currentSongIndex = 0; // Start with the first song
    if (currentPlaylist.length > 0) playSong(currentPlaylist[0]); // Play the first song if the playlist is not empty
}

// Delete Playlist
function deletePlaylist(index) {
    playlists.splice(index, 1); // Remove the playlist at the given index
    displayPlaylists(); // Re-render the playlists
}

// Fetch Public Playlists
function fetchPublicPlaylists() {
    fetch(`${apiUrl}playlists/?client_id=${clientId}`) // Fetch public playlists from the API
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            const dropdown = document.getElementById('public-playlist-dropdown');
            dropdown.innerHTML = '<option value="">Select a Public Playlist</option>'; // Clear previous options
            // Add each public playlist as an option in the dropdown
            data.results.forEach(playlist => {
                const option = document.createElement('option');
                option.value = playlist.id;
                option.textContent = playlist.name;
                dropdown.appendChild(option);
            });
        });
}

// Play a Selected Public Playlist
function playPublicPlaylist(event) {
    const playlistId = event.target.value; // Get the selected playlist ID
    if (playlistId) {
        fetch(`${apiUrl}playlists/tracks/?client_id=${clientId}&id=${playlistId}`) // Fetch tracks from the selected public playlist
            .then(response => response.json()) // Parse the response as JSON
            .then(data => {
                // Map tracks to a format that includes audio, name, artist, and image
                currentPlaylist = data.results[0]?.tracks.map(track => ({
                    audio: track.audio,
                    name: track.name,
                    artist: track.artist_name,
                    image: track.album_image,
                })) || [];

                currentSongIndex = 0; // Start from the first song
                playSong(currentPlaylist[0]); // Play the first song
            });
    }
}

// Play Song from Playlist or Public Playlist
function playSong(song) {
    if (!song || !song.audio) return; // If no song or audio URL, return

    if (audioPlayer) audioPlayer.pause(); // Pause the current song if any
    audioPlayer = new Audio(song.audio); // Create a new Audio object
    audioPlayer.play(); // Play the song

    // Update the UI with song details
    document.getElementById('current-song-title').innerText = song.name;
    document.getElementById('current-song-artist').innerText = song.artist || 'Unknown';
    document.getElementById('current-song-image').src = song.image || 'default-image.png';
}

// Share Playlist
function sharePlaylist(index) {
    const playlist = playlists[index]; // Get the selected playlist
    const playlistId = playlist.name; // Use playlist name as ID (replace with actual ID if available)

    const shareableLink = `${window.location.href}?playlist=${playlistId}`; // Create a shareable link
    const shareContainer = document.getElementById('share-container');
    const shareLinkInput = document.getElementById('share-link');
    shareLinkInput.value = shareableLink; // Set the share link input value
    shareContainer.style.display = 'block'; // Display the share container

    const twitterShareButton = document.querySelector('#share-container a');
    if (twitterShareButton) {
        twitterShareButton.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableLink)}`; // Set Twitter share button URL
    }
}

// Play Current Song
function playCurrentSong() {
    if (currentPlaylist.length > 0) {
        const song = currentPlaylist[currentSongIndex];
        playSong(song); // Play the song at the current index
    }
}

// Pause Current Song
function pauseCurrentSong() {
    if (audioPlayer) {
        audioPlayer.pause(); // Pause the audio player
    }
}

// Play Next Song
function playNextSong() {
    if (currentSongIndex < currentPlaylist.length - 1) {
        currentSongIndex++; // Move to the next song
        playSong(currentPlaylist[currentSongIndex]); // Play the next song
    }
}

// Play Previous Song
function playPreviousSong() {
    if (currentSongIndex > 0) {
        currentSongIndex--; // Move to the previous song
        playSong(currentPlaylist[currentSongIndex]); // Play the previous song
    }
}




/*const clientId = '88543d7c'; // Replace with your valid Jamendo API key
const apiUrl = 'https://api.jamendo.com/v3.0/';
let playlists = [{ name: 'Recents', songs: [] }]; // Default Recents playlist
let currentSongIndex = 0;
let currentPlaylist = [];
let audioPlayer = null;

// Event Listeners
window.onload = () => {
    fetchPublicPlaylists();
    displayPlaylists();
};

// Trigger search on pressing Enter
document.getElementById('search-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        searchSongs(); // Call the searchSongs function
    }
});

document.getElementById('search-button').addEventListener('click', searchSongs);
document.getElementById('create-playlist-button').addEventListener('click', createPlaylist);
document.getElementById('public-playlist-dropdown').addEventListener('change', playPublicPlaylist);
document.getElementById('play-button').addEventListener('click', playCurrentSong);
document.getElementById('pause-button').addEventListener('click', pauseCurrentSong);
document.getElementById('next-button').addEventListener('click', playNextSong);
document.getElementById('previous-button').addEventListener('click', playPreviousSong);

// PATCH Method: Edit Playlist Name
function editPlaylistName(index) {
    const playlistId = playlists[index].id || `local-${index}`; // Use a local ID or server ID
    const newName = prompt("Enter the new playlist name:");

    if (!newName || !newName.trim()) {
        alert("Playlist name cannot be empty!");
        return;
    }

    const url = `${apiUrl}playlists/${playlistId}`; // Adjust this based on your actual API endpoint
    const payload = { name: newName };

    fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update playlist name.');
            }
            return response.json();
        })
        .then(updatedPlaylist => {
            playlists[index].name = updatedPlaylist.name || newName; // Update locally
            alert(`Playlist updated to "${playlists[index].name}"!`);
            displayPlaylists();
        })
        .catch(error => console.error('Error:', error));
}

// Search Songs
function searchSongs() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    fetch(`${apiUrl}tracks/?client_id=${clientId}&search=${query}&limit=3`) // Limit search results to 3
        .then(response => response.json())
        .then(data => displaySearchResults(data.results));
}

function displaySearchResults(tracks) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';

    tracks.forEach(track => {
        const trackDiv = document.createElement('div');
        trackDiv.id = track.name; // Set an ID to target the selected song
        trackDiv.innerHTML = `
            <p>${track.name} - ${track.artist_name}</p>
            <button onclick="playSongImmediately('${track.audio}', '${track.name}', '${track.artist_name}', '${track.image}')">Play</button>
            <select id="playlist-select">
                ${playlists.map((pl, index) => `<option value="${index}">${pl.name}</option>`).join('')}
            </select>
            <button onclick="addToPlaylist(${playlists.length - 1}, '${track.audio}', '${track.name}', '${track.artist_name}', '${track.image}')">Add</button>
        `;
        resultsDiv.appendChild(trackDiv);
    });
}

// Play Song Immediately
function playSongImmediately(audio, name, artist, image) {
    if (audioPlayer) audioPlayer.pause();
    audioPlayer = new Audio(audio);
    audioPlayer.play();

    document.getElementById('current-song-title').innerText = name;
    document.getElementById('current-song-artist').innerText = artist;
    document.getElementById('current-song-image').src = image || 'default-image.png';
}

// Add to Playlist
function addToPlaylist(playlistIndex, audio, name, artist, image) {
    playlists[playlistIndex].songs.push({ audio, name, artist, image });
    alert(`${name} added to ${playlists[playlistIndex].name}`);
    displayPlaylists();
}

// Create Playlist
function createPlaylist() {
    const playlistName = document.getElementById('playlist-name-input').value.trim();
    if (playlistName) {
        playlists.push({ name: playlistName, songs: [] });
        displayPlaylists();
    }
}

function displayPlaylists() {
    const container = document.getElementById('my-playlists');
    container.innerHTML = '';
    playlists.forEach((playlist, index) => {
        const playlistDiv = document.createElement('div');
        playlistDiv.innerHTML = `
            <h3>${playlist.name}</h3>
            <button onclick="playPlaylist(${index})">Play</button>
            <button onclick="deletePlaylist(${index})">Delete</button>
            <button onclick="editPlaylistName(${index})">Edit</button> <!-- Edit button -->
            <button onclick="sharePlaylist(${index})">Share</button>
        `;
        container.appendChild(playlistDiv);
    });
}

// Play Playlist
function playPlaylist(index) {
    currentPlaylist = playlists[index].songs;
    currentSongIndex = 0;
    if (currentPlaylist.length > 0) playSong(currentPlaylist[0]);
}

function deletePlaylist(index) {
    playlists.splice(index, 1);
    displayPlaylists();
}

// Public Playlists
function fetchPublicPlaylists() {
    fetch(`${apiUrl}playlists/?client_id=${clientId}`)
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById('public-playlist-dropdown');
            dropdown.innerHTML = '<option value="">Select a Public Playlist</option>';
            data.results.forEach(playlist => {
                const option = document.createElement('option');
                option.value = playlist.id;
                option.textContent = playlist.name;
                dropdown.appendChild(option);
            });
        });
}

function playPublicPlaylist(event) {
    const playlistId = event.target.value;
    if (playlistId) {
        fetch(`${apiUrl}playlists/tracks/?client_id=${clientId}&id=${playlistId}`)
            .then(response => response.json())
            .then(data => {
                currentPlaylist = data.results[0]?.tracks.map(track => ({
                    audio: track.audio,
                    name: track.name,
                    artist: track.artist_name,
                    image: track.album_image,
                })) || [];

                currentSongIndex = 0;
                playSong(currentPlaylist[0]);
            });
    }
}

// Play Song (from playlist or public)
function playSong(song) {
    if (!song || !song.audio) return;

    if (audioPlayer) audioPlayer.pause();
    audioPlayer = new Audio(song.audio);
    audioPlayer.play();

    document.getElementById('current-song-title').innerText = song.name;
    document.getElementById('current-song-artist').innerText = song.artist || 'Unknown';
    document.getElementById('current-song-image').src = song.image || 'default-image.png';
}

// Share Playlist
function sharePlaylist(index) {
    const playlist = playlists[index];
    const playlistId = playlist.name; // You can replace this with a unique ID if you have one

    const shareableLink = `${window.location.href}?playlist=${playlistId}`;
    const shareContainer = document.getElementById('share-container');
    const shareLinkInput = document.getElementById('share-link');
    shareLinkInput.value = shareableLink;
    shareContainer.style.display = 'block';

    const twitterShareButton = document.querySelector('#share-container a');
    if (twitterShareButton) {
        twitterShareButton.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableLink)}`;
    }
}

function playCurrentSong() {
    if (currentPlaylist.length > 0) {
        const song = currentPlaylist[currentSongIndex];
        playSong(song);
    }
}

function pauseCurrentSong() {
    if (audioPlayer) {
        audioPlayer.pause();
    }
}

function playNextSong() {
    if (currentSongIndex < currentPlaylist.length - 1) {
        currentSongIndex++;
        playSong(currentPlaylist[currentSongIndex]);
    }
}

function playPreviousSong() {
    if (currentSongIndex > 0) {
        currentSongIndex--;
        playSong(currentPlaylist[currentSongIndex]);
    }
}*/





