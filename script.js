let map;

// 1. Initialize Map and Load Alerts
window.onload = () => {
    displayAlerts(); // Show existing alerts on start

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            
            document.getElementById('location-display').innerText = 
                `Your Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            // Initialize Map
            map = L.map('map').setView([latitude, longitude], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            L.marker([latitude, longitude]).addTo(map)
                .bindPopup('You are here').openPopup();

            // Load markers for previous reports
            loadMapMarkers();
        });
    }
};

// 2. SOS Button with WhatsApp Integration
document.getElementById('sos-btn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const msg = `EMERGENCY SOS! I need help at: https://www.google.com/maps?q=${lat},${lon}`;
        
        alert("EMERGENCY SOS SENT!");
        // Optional: Uncomment below to open WhatsApp automatically
        // window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    });
});

// 3. Save Report with Coordinates and Status
const disasterForm = document.getElementById('disaster-form');
disasterForm.addEventListener('submit', (e) => {
    e.preventDefault();

    navigator.geolocation.getCurrentPosition(position => {
        const report = {
            type: document.getElementById('disaster-type').value,
            desc: document.getElementById('description').value,
            time: new Date().toLocaleString(),
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            status: "Pending" // Default status
        };

        let reports = JSON.parse(localStorage.getItem('disasterReports')) || [];
        reports.push(report);
        localStorage.setItem('disasterReports', JSON.stringify(reports));

        displayAlerts(); 
        addMarkerToMap(report); // Put a new red dot on the map
        
        alert("Report submitted to authorities!");
        disasterForm.reset();
    });
});

// 4. Display Alerts with "Resolve" Button
function displayAlerts() {
    const alertList = document.getElementById('alert-list');
    const reports = JSON.parse(localStorage.getItem('disasterReports')) || [];
    
    // We reverse a copy so we don't mess up the original indexes
    const displayArray = [...reports].reverse();

    alertList.innerHTML = displayArray.map((r, i) => {
        // Find the actual index in the original reports array
        const originalIndex = reports.length - 1 - i;
        const isResolved = r.status === "Resolved";
        
        return `
            <div style="background: #fff; border-left: 5px solid ${isResolved ? '#28a745' : '#d9534f'}; margin: 10px; padding: 15px; text-align: left; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-radius: 4px;">
                <strong style="color: ${isResolved ? '#28a745' : '#d9534f'};">${r.type}</strong> 
                <span style="font-size: 0.8em; color: #666;"> - ${r.time}</span>
                <p style="margin: 5px 0;">${r.desc}</p>
                <small>Location: ${r.lat.toFixed(2)}, ${r.lon.toFixed(2)}</small><br>
                ${!isResolved ? `<button onclick="resolveReport(${originalIndex})" style="margin-top:10px; cursor:pointer;">Mark as Resolved</button>` : '<strong>✓ Resolved</strong>'}
            </div>
        `;
    }).join('');
}

// 5. Status Management
function resolveReport(index) {
    let reports = JSON.parse(localStorage.getItem('disasterReports'));
    reports[index].status = "Resolved";
    localStorage.setItem('disasterReports', JSON.stringify(reports));
    displayAlerts();
    location.reload(); // Refresh to update map colors
}

// 6. Helper: Add Markers to Map
function addMarkerToMap(report) {
    const color = report.status === "Resolved" ? "green" : "red";
    L.circle([report.lat, report.lon], {
        color: color,
        fillColor: color,
        fillOpacity: 0.5,
        radius: 500
    }).addTo(map).bindPopup(`${report.type}: ${report.status}`);
}

function loadMapMarkers() {
    const reports = JSON.parse(localStorage.getItem('disasterReports')) || [];
    reports.forEach(report => addMarkerToMap(report));
}
