// --- STEP 1: Firebase Configuration ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let map;
let userMarker;

// --- STEP 2: Initialize Map & Load Data ---
window.onload = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            
            document.getElementById('location-display').innerText = 
                `📍 Live Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            map = L.map('map').setView([latitude, longitude], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            userMarker = L.marker([latitude, longitude]).addTo(map)
                .bindPopup('<b>You are here</b>').openPopup();

            // NEW: Load Safe Zones (Shelters)
            loadSafeZones();

            // NEW: Check for Weather Alerts
            checkWeatherAlerts(latitude, longitude);

            listenForCloudReports();
        });
    } else {
        alert("Geolocation is not supported.");
    }
};

// --- STEP 3: Safe Zones (Green Markers) ---
function loadSafeZones() {
    // You can add real coordinates for your local city here
    const shelters = [
        { name: "Emergency Shelter A (School)", lat: 0.001, lon: 0.001 }, 
        { name: "Government Hospital", lat: -0.001, lon: -0.001 }
    ];

    const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    shelters.forEach(s => {
        // This adds the shelter relative to the user's current position for the demo
        navigator.geolocation.getCurrentPosition(pos => {
            L.marker([pos.coords.latitude + s.lat, pos.coords.longitude + s.lon], {icon: greenIcon})
            .addTo(map)
            .bindPopup(`<b>SAFE ZONE:</b> ${s.name}`);
        });
    });
}

// --- STEP 4: Real-time Weather Warning ---
async function checkWeatherAlerts(lat, lon) {
    const alertBox = document.createElement('div');
    alertBox.style = "background: #ff4d4d; color: white; padding: 15px; font-weight: bold; position: sticky; top: 0; z-index: 9999; display: none;";
    alertBox.id = "weather-warning";
    document.body.prepend(alertBox);

    // For Hackathon Demo: We simulate a warning. 
    // In production, you would fetch(api.openweathermap.org...)
    setTimeout(() => {
        alertBox.innerHTML = "⚠️ RED ALERT: Heavy Rainfall & Flood Warning in your area! Evacuate to nearest Green Marker.";
        alertBox.style.display = "block";
    }, 3000); 
}

// --- STEP 5: Cloud Listeners ---
function listenForCloudReports() {
    const reportRef = database.ref('reports');
    reportRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const alertList = document.getElementById('alert-list');
        alertList.innerHTML = ""; 

        map.eachLayer((layer) => {
            if (layer instanceof L.Circle) map.removeLayer(layer);
        });

        if (data) {
            Object.keys(data).reverse().forEach(key => {
                const report = data[key];
                const isResolved = report.status === "Resolved";
                
                alertList.innerHTML += `
                    <div class="alert-item" style="border-left: 5px solid ${isResolved ? '#28a745' : '#d9534f'}; background: white; margin: 10px; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: left;">
                        <strong style="color: ${isResolved ? '#28a745' : '#d9534f'}">${report.type.toUpperCase()}</strong>
                        <p style="margin: 5px 0;">${report.desc}</p>
                        <small>${report.time} | Status: ${report.status}</small>
                        ${!isResolved ? `<br><button onclick="resolveReport('${key}')" style="margin-top: 10px; cursor: pointer;">Resolve</button>` : ''}
                    </div>
                `;

                const color = isResolved ? "green" : "red";
                L.circle([report.lat, report.lon], {
                    color: color, fillColor: color, fillOpacity: 0.4, radius: 400
                }).addTo(map).bindPopup(`${report.type}: ${report.status}`);
            });
        }
    });
}

// --- STEP 6: Form Submission ---
document.getElementById('disaster-form').addEventListener('submit', (e) => {
    e.preventDefault();
    navigator.geolocation.getCurrentPosition(position => {
        const newReport = {
            type: document.getElementById('disaster-type').value,
            desc: document.getElementById('description').value,
            time: new Date().toLocaleString(),
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            status: "Pending"
        };
        database.ref('reports').push(newReport);
        alert("Report synced with Central Command!");
        document.getElementById('disaster-form').reset();
    });
});

// --- STEP 7: SOS Logic ---
document.getElementById('sos-btn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const msg = `🚨 EMERGENCY SOS! I need help at: https://www.google.com/maps?q=${latitude},${longitude}`;
        alert("🚨 SOS SIGNAL SENT TO AUTHORITIES!");
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    });
});

function resolveReport(reportId) {
    database.ref('reports/' + reportId).update({ status: "Resolved" });
}
