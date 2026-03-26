// --- STEP 1: Firebase Configuration ---
// REPLACE these values with the ones from your Firebase Console Settings
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let map;
let userMarker;

// --- STEP 2: Initialize Map & Load Real-time Data ---
window.onload = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            
            document.getElementById('location-display').innerText = 
                `📍 Live Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            // Initialize Map
            map = L.map('map').setView([latitude, longitude], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            // Add Blue Marker for User
            userMarker = L.marker([latitude, longitude]).addTo(map)
                .bindPopup('<b>You are here</b>').openPopup();

            // START LISTENING TO FIREBASE CLOUD
            listenForCloudReports();
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// --- STEP 3: Listen for Cloud Updates (The "Magic" Part) ---
function listenForCloudReports() {
    const reportRef = database.ref('reports');
    
    // This triggers automatically whenever the database changes
    reportRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const alertList = document.getElementById('alert-list');
        alertList.innerHTML = ""; // Clear list before redrawing

        // Clear existing markers (except user marker)
        map.eachLayer((layer) => {
            if (layer instanceof L.Circle) map.removeLayer(layer);
        });

        if (data) {
            Object.keys(data).reverse().forEach(key => {
                const report = data[key];
                
                // 1. Add to HTML List
                const isResolved = report.status === "Resolved";
                const card = `
                    <div class="alert-item" style="border-left: 5px solid ${isResolved ? '#28a745' : '#d9534f'}">
                        <strong>${report.type}</strong> <small>${report.time}</small>
                        <p>${report.desc}</p>
                        <small>Location: ${report.lat.toFixed(3)}, ${report.lon.toFixed(3)}</small>
                        <br>
                        ${!isResolved ? `<button onclick="resolveReport('${key}')">Mark as Resolved</button>` : '<b>✅ Resolved</b>'}
                    </div>
                `;
                alertList.innerHTML += card;

                // 2. Add Red/Green Circle to Map
                const color = isResolved ? "green" : "red";
                L.circle([report.lat, report.lon], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.4,
                    radius: 400
                }).addTo(map).bindPopup(`${report.type}: ${report.status}`);
            });
        }
    });
}

// --- STEP 4: Submit Report to Cloud ---
document.getElementById('disaster-form').addEventListener('submit', (e) => {
    e.preventDefault();

    navigator.geolocation.getCurrentPosition(position => {
        const newReport = {
            type: document.getElementById('disaster-type').value,
            desc: document.getElementById('description').value,
            time: new Date().toLocaleTimeString(),
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            status: "Pending"
        };

        // PUSH TO FIREBASE
        database.ref('reports').push(newReport);
        
        alert("Report synced with Central Command!");
        document.getElementById('disaster-form').reset();
    });
});

// --- STEP 5: SOS Button (Corrected Link) ---
document.getElementById('sos-btn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const msg = `EMERGENCY! I need help at: https://www.google.com/maps?q=${lat},${lon}`;
        
        alert("🚨 SOS SIGNAL SENT!");
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    });
});

// --- STEP 6: Update Status in Cloud ---
function resolveReport(reportId) {
    database.ref('reports/' + reportId).update({
        status: "Resolved"
    });
}
