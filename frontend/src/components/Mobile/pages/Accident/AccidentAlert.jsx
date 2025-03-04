import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AccidentAlert.module.css";
import {
  AlertTriangle as WarningIcon,
  MapPin as LocationIcon,
  Phone as PhoneIcon,
  Droplet as BloodIcon,
  Clock as ClockIcon,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for Leaflet's default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom marker for accident location (red with gold outline for style)
const CustomMarker = ({ position, isHighlighted, children }) => {
  const icon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png", // Red pin for accident (example red pin)
    iconSize: isHighlighted ? [48, 48] : [38, 38], // Larger on highlight
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
    className: styles.accidentMarker, // Add custom styling for gold outline
  });

  return (
    <Marker position={position} icon={icon}>
      {children}
    </Marker>
  );
};

const AccidentAlert = () => {
  const navigate = useNavigate();

  // Dummy user data for Swasthya Setu (replace with real user data from auth/context)
  const user = {
    name: "Alekha Kumar Swain",
    emergencyContacts: ["+91 1234567890", "+91 9876543210"],
    bloodGroup: "A+",
    location: { lat: 20.296071, lng: 85.824539 }, // Default Bhubaneswar location
  };

  // State for accident detection, UI, and recent accidents
  const [isAccidentDetected, setIsAccidentDetected] = useState(false);
  const [needsHelp, setNeedsHelp] = useState(null); // null, "safe", or "help"
  const [countdown, setCountdown] = useState(10);
  const [liveLocation, setLiveLocation] = useState(user.location);
  const [bloodRequired, setBloodRequired] = useState(false);
  const [recentAccidents, setRecentAccidents] = useState([
    {
      id: "gsd",
      date: "21 Dec 2024, 06:18:59 pm",
      status: "Pending",
      location: "Jaydev Vihar, Agra, Odisha",
      coordinates: { lat: 27.1767, lng: 78.0081 }, // Example Agra coordinates
    },
    {
      id: "njvv",
      date: "22 Dec 2024, 06:02:15 pm",
      status: "Checked Out",
      location: "Jaydev Vihar, Bhubaneswar, Odisha",
      coordinates: { lat: 20.296071, lng: 85.824539 }, // Bhubaneswar coordinates
    },
    {
      id: "ewqfav",
      date: "26 Jan 2025, 05:31:37 am",
      status: "Pending",
      location: "Jaydev Vihar, Ahmedabad, Gujarat", // Corrected to Gujarat for Ahmedabad
      coordinates: { lat: 23.0225, lng: 72.5714 }, // Ahmedabad coordinates
    },
    {
      id: "sadc",
      date: "26 Jan 2025, 05:32:25 am",
      status: "Pending",
      location: "Jaydev Vihar, Ahmedabad, Gujarat", // Corrected to Gujarat for Ahmedabad
      coordinates: { lat: 23.0225, lng: 72.5714 }, // Ahmedabad coordinates
    },
  ]);
  const [newAccident, setNewAccident] = useState({
    city: "",
    state: "",
    description: "",
  });

  // Fetch current location using GPS on component mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLiveLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error getting location:", error);
        // alert("Unable to fetch your location. Using default location.");
      }
    );
  }, []);

  // Simulate accident detection using phone sensors (placeholder for real implementation)
  useEffect(() => {
    const simulateAccident = () => {
      // Hypothetical sensor data (accelerometer, GPS, gyroscope)
      const impactDetected = Math.random() > 0.7; // 30% chance of detecting an accident
      if (impactDetected) {
        setIsAccidentDetected(true);
        let timer = 10;
        const countdownInterval = setInterval(() => {
          timer--;
          setCountdown(timer);
          if (timer <= 0) {
            clearInterval(countdownInterval);
            if (needsHelp === null) setNeedsHelp("help"); // Auto-trigger help if no response
          }
        }, 1000);
        return () => clearInterval(countdownInterval);
      }
    };

    // Simulate real-time sensor check every 5 seconds
    const sensorCheck = setInterval(simulateAccident, 5000);
    return () => clearInterval(sensorCheck);
  }, [needsHelp]);

  // Handle emergency response based on user action
  useEffect(() => {
    if (needsHelp === "help" || (needsHelp === null && countdown <= 0)) {
      // Auto-send SOS to emergency services, contacts, and hospitals
    //   alert("SOS Alert Sent to Emergency Services, Contacts, and Hospitals!");
      // Simulate sending live location and blood request
      if (bloodRequired) {
        // alert(`URGENT! Accident Victim Needs Blood. ${user.bloodGroup} Required at Nearby Hospital.`);
        // Notify nearby blood donors (simulated)
        const nearbyDonors = recentAccidents.filter(
          (accident) =>
            calculateDistance(
              { lat: liveLocation.lat, lng: liveLocation.lng },
              accident.coordinates
            ) < 5 // 5 km radius (example)
        );
        if (nearbyDonors.length > 0) {
        //   alert("Blood Donation Request Sent to Nearby Donors!");
        }
      }
      // Call emergency contacts (simulated)
      user.emergencyContacts.forEach((contact) => {
        // alert(`Calling ${contact} with live location...`);
      });
    }
  }, [needsHelp, bloodRequired, user, liveLocation, recentAccidents]);

  // Handle user input for safety confirmation
  const handleSafetyResponse = (response) => {
    setNeedsHelp(response);
    if (response === "safe") {
    //   alert("Accident alert canceled. You’re safe!");
      setIsAccidentDetected(false);
      setCountdown(0);
    } else if (response === "help") {
      setBloodRequired(window.confirm("Is blood required for the victim?"));
    }
  };

  // Handle blood requirement toggle
  const toggleBloodRequest = () => {
    setBloodRequired(!bloodRequired);
  };

  // Handle new accident report submission
  const handleReportAccident = (e) => {
    e.preventDefault();
    const newAccidentEntry = {
      id: `acc_${Date.now()}`,
      date: new Date().toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      status: "Pending",
      location: `${newAccident.city}, ${newAccident.state}`,
      coordinates: liveLocation, // Use current location
      description: newAccident.description,
    };
    setRecentAccidents([...recentAccidents, newAccidentEntry]);
    setNewAccident({ city: "", state: "", description: "" });
    alert("New accident reported successfully!");
  };

  // Calculate distance between two coordinates (simplified Haversine formula in km)
  const calculateDistance = (loc1, loc2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Navigate to safety dashboard or other Swasthya Setu sections
  const handleViewHistory = () => {
    navigate("/accident-history");
  };

  return (
    <div className={styles.stylishContainer}>
      <div className={styles.stylishContent}>
        {/* Recent Accidents Near Me */}
        <h2 className={styles.sectionTitle}>Recent Accidents Near Me</h2>
        <div className={styles.accidentList}>
          {recentAccidents
            .filter((accident) =>
              calculateDistance(liveLocation, accident.coordinates) < 10 // Show accidents within 10 km
            )
            .map((accident) => (
              <div key={accident.id} className={styles.accidentItem}>
                <p>
                  <ClockIcon className={styles.icon} /> {accident.date}
                </p>
                <p>
                  <LocationIcon className={styles.icon} /> {accident.location} (
                  {accident.status})
                </p>
                {accident.description && (
                  <p className={styles.accidentDescription}>
                    {accident.description}
                  </p>
                )}
              </div>
            ))}
        </div>

        {/* Live Location Map (Always Visible) */}
        <h2 className={styles.sectionTitle}>Live Location & Accident Map 📍</h2>
        <div className={styles.mapContainer}>
          <MapContainer
            center={liveLocation}
            zoom={13}
            zoomControl={false}
            className={styles.stylishMap}
            style={{ height: "300px", width: "100%", borderRadius: "15px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <CustomMarker position={liveLocation} isHighlighted={true}>
              <Popup className={styles.stylishPopup}>
                Your Location: Lat {liveLocation.lat}, Lng {liveLocation.lng}
              </Popup>
            </CustomMarker>
            {recentAccidents
              .filter((accident) =>
                calculateDistance(liveLocation, accident.coordinates) < 10
              )
              .map((accident) => (
                <CustomMarker
                  key={accident.id}
                  position={accident.coordinates}
                  isHighlighted={false}
                >
                  <Popup className={styles.stylishPopup}>
                    Accident: {accident.location}, {accident.date} ({accident.status})
                  </Popup>
                </CustomMarker>
              ))}
          </MapContainer>
        </div>

        {/* Accident Detection & Emergency Screen (If Accident Detected) */}
        {isAccidentDetected && (
          <div className={styles.emergencyScreen}>
            <h2 className={styles.emergencyTitle}>
              <WarningIcon className={styles.warningIcon} /> Accident Detected – Need Help? 🚨
            </h2>
            <p className={styles.countdown}>Respond in {countdown} seconds...</p>
            <div className={styles.responseButtons}>
              <button
                className={styles.actionButton}
                onClick={() => handleSafetyResponse("safe")}
              >
                I’m Safe
              </button>
              <button
                className={styles.actionButton}
                onClick={() => handleSafetyResponse("help")}
              >
                Need Help
              </button>
            </div>
          </div>
        )}

        {/* Emergency Notification & Actions (If Help Needed) */}
        {needsHelp === "help" && (
          <div className={styles.emergencyNotification}>
            <h3 className={styles.notificationTitle}>
              <WarningIcon className={styles.warningIcon} /> SOS Alert Sent to Emergency Services & Contacts
            </h3>
            <p>
              <LocationIcon className={styles.icon} /> Live Location Shared: [Google Maps Link]
            </p>
            <p>
              <PhoneIcon className={styles.icon} /> Emergency Call Options:
              <button
                className={styles.emergencyCallButton}
                onClick={() => alert("Calling 999...")}
              >
                999
              </button>
              <button
                className={styles.emergencyCallButton}
                onClick={() => alert("Calling Police...")}
              >
                Police
              </button>
              <button
                className={styles.emergencyCallButton}
                onClick={() => alert("Calling Ambulance...")}
              >
                Ambulance
              </button>
              {user.emergencyContacts.map((contact, index) => (
                <button
                  key={index}
                  className={styles.emergencyCallButton}
                  onClick={() => alert(`Calling ${contact}...`)}
                >
                  Family #{index + 1}
                </button>
              ))}
            </p>
            <p>
              <WarningIcon className={styles.icon} /> Nearest Hospital Notified: St. Thomas Hospital, ETA: 10 min, Contact: +91 1111111111
            </p>
            <div className={styles.bloodRequest}>
              <p>
                <BloodIcon className={styles.icon} /> Blood Required?
              </p>
              <button
                className={`${styles.actionButton} ${bloodRequired ? styles.active : ""}`}
                onClick={toggleBloodRequest}
              >
                {bloodRequired ? "Yes (Request Sent)" : "No"}
              </button>
              {bloodRequired && (
                <p className={styles.bloodMessage}>
                  URGENT! Accident Victim Needs Blood. {user.bloodGroup} Required at St. Thomas Hospital.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Report New Accident Form */}
        <h2 className={styles.sectionTitle}>Report New Accident</h2>
        <form className={styles.accidentForm} onSubmit={handleReportAccident}>
          <InputField
            icon={<LocationIcon />}
            label="City"
            value={newAccident.city}
            placeholder="Enter city"
            onChange={(e) => setNewAccident({ ...newAccident, city: e.target.value })}
          />
          <InputField
            icon={<LocationIcon />}
            label="State"
            value={newAccident.state}
            placeholder="Enter state"
            onChange={(e) => setNewAccident({ ...newAccident, state: e.target.value })}
          />
          <InputField
            icon={<WarningIcon />}
            label="Description"
            value={newAccident.description}
            placeholder="Describe the accident"
            onChange={(e) => setNewAccident({ ...newAccident, description: e.target.value })}
          />
          <button type="submit" className={styles.actionButton}>
            Submit Accident Report
          </button>
        </form>

        {/* Accident History & Safety Dashboard */}
        <h2 className={styles.sectionTitle}>Accident History</h2>
        <div className={styles.historyDashboard}>
          <div className={styles.historyItem}>
            <ClockIcon className={styles.icon} /> Past Incidents:
            {recentAccidents.map((incident, index) => (
              <p key={index}>
                {incident.date} – {incident.location} ({incident.status})
              </p>
            ))}
          </div>
          <button
            className={styles.actionButton}
            onClick={handleViewHistory}
          >
            View Full History
          </button>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ icon, label, value, placeholder, onChange }) => {
  return (
    <div className={styles.inputField}>
      <div className={styles.inputIcon}>{icon}</div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.input}
      />
    </div>
  );
};

export default AccidentAlert;