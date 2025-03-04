import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BloodDonateReceive.module.css";
import {
  Droplet as BloodIcon,
  User as PersonIcon,
  MapPin as LocationIcon,
  Phone as PhoneIcon,
  AlertTriangle as UrgencyIcon,
  Hospital as RequestIcon,
  Search as SearchIcon,
  Bell as NotificationIcon,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
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

// Custom component to handle map clicks and pin location
const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const [position, setPosition] = useState(initialLocation || null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        Pinned Location: Lat {position.lat}, Lng {position.lng}
        <br />
        Click "OK" in the popup to confirm.
      </Popup>
    </Marker>
  );
};

// Function to fetch location details using OpenStreetMap Nominatim API (simplified)
const fetchLocationDetails = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name || `Lat: ${lat}, Lng: ${lng}`;
  } catch (error) {
    console.error("Error fetching location details:", error);
    return `Lat: ${lat}, Lng: ${lng}`;
  }
};

// Custom marker for highlighting on hover (now green when highlighted)
const CustomMarker = ({ position, isHighlighted, onClick, children }) => {
  const icon = L.icon({
    iconUrl: isHighlighted
      ? "https://cdn-icons-png.flaticon.com/512/149/149059.png" // Green pin for highlight (example green pin)
      : "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Default blue pin
    iconSize: isHighlighted ? [48, 48] : [38, 38], // Larger on highlight
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });

  return (
    <Marker position={position} icon={icon} onClick={onClick}>
      {children}
    </Marker>
  );
};

const BloodRequestCard = ({ request, onHover, onLeave, isHighlighted }) => {
  const bloodGroupColor = {
    "O+": "#4CAF50", // Green
    "O-": "#F44336", // Red
    "A+": "#2196F3", // Blue
    "A-": "#3F51B5", // Indigo
    "B+": "#FF9800", // Orange
    "B-": "#E91E63", // Pink
    "AB+": "#9C27B0", // Purple
    "AB-": "#673AB7", // Deep Purple
  };

  return (
    <div
      className={`${styles.requestCard} ${isHighlighted ? styles.highlighted : ""}`}
      style={{ borderLeft: `5px solid ${bloodGroupColor[request.bloodGroup] || "#757575"}` }}
      onMouseEnter={() => onHover(request.id)}
      onMouseLeave={onLeave}
    >
      <h3>{request.hospital}</h3>
      <p>
        <strong>Blood Group:</strong> {request.bloodGroup} <span style={{ color: bloodGroupColor[request.bloodGroup] || "#757575" }}>●</span>
      </p>
      <p>
        <strong>Units Needed:</strong> {request.unitsNeeded}
      </p>
      <p>
        <strong>Urgency:</strong> {request.urgency}
      </p>
      <p>
        <strong>Location:</strong> {request.distance} away
      </p>
      <button
        className={styles.actionButton}
        onClick={() => alert(`Contacting ${request.hospital} for ${request.bloodGroup} blood...`)}
      >
        Help Now
      </button>
    </div>
  );
};

const BloodDonateReceive = () => {
  const navigate = useNavigate();

  // Dummy user data (replace with real user data from auth/context)
  const user = {
    name: "John Doe",
    bloodCoins: 500, // Example BloodCoin balance
    lastDonationDate: new Date("2024-12-01"), // Last donation date
    donationsCount: 5, // Number of donations
  };

  // Dummy data for active blood donation requests within 4.3 km
  const bloodRequests = [
    {
      id: 1,
      location: { lat: 20.296071, lng: 85.824539 }, // Example: Bhubaneswar
      bloodGroup: "O+",
      unitsNeeded: 2,
      hospital: "St. Thomas Hospital",
      urgency: "Critical",
      distance: "3.5km",
    },
    {
      id: 2,
      location: { lat: 20.301071, lng: 85.819539 }, // Example: Nearby Bhubaneswar
      bloodGroup: "A-",
      unitsNeeded: 1,
      hospital: "Royal London Hospital",
      urgency: "Urgent",
      distance: "4.2km",
    },
    {
      id: 3,
      location: { lat: 20.298071, lng: 85.822539 },
      bloodGroup: "B+",
      unitsNeeded: 3,
      hospital: "City Blood Center",
      urgency: "Normal",
      distance: "4.0km",
    },
  ];

  // Dummy data for donors (replace with real data from API)
  const donors = [
    { id: 1, name: "John Doe", bloodGroup: "O+", phone: "+91 1234567890" },
    { id: 2, name: "Jane Smith", bloodGroup: "A-", phone: "+91 9876543210" },
    { id: 3, name: "Mike Johnson", bloodGroup: "B+", phone: "+91 5555555555" },
  ];

  const [userLocation, setUserLocation] = useState({ lat: 20.296071, lng: 85.824539 }); // Default location for Bhubaneswar, will be updated by GPS
  const radius = 4300; // 4.3 km in meters
  const [selectedUrgency, setSelectedUrgency] = useState("All");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("All");
  const [highlightedRequestId, setHighlightedRequestId] = useState(null);
  const [requestLocation, setRequestLocation] = useState("");
  const [requestLocationDetails, setRequestLocationDetails] = useState("");
  const [exactLocation, setExactLocation] = useState(""); // New state for exact location
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);

  // Fetch current location using GPS on component mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchLocationDetails(latitude, longitude).then((details) => {
          setRequestLocation(`Lat: ${latitude}, Lng: ${longitude}`);
          setRequestLocationDetails(details);
          setExactLocation(details); // Pre-fill exact location
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to fetch your location. Please pin your location manually.");
      }
    );
  }, []);

  // Filter requests based on urgency and blood group
  const filteredRequests = bloodRequests.filter((request) => {
    const matchesUrgency = selectedUrgency === "All" || request.urgency === selectedUrgency;
    const matchesBloodGroup = selectedBloodGroup === "All" || request.bloodGroup === selectedBloodGroup;
    return matchesUrgency && matchesBloodGroup;
  });

  // Filter donors based on blood group (for table)
  const filteredDonors = selectedBloodGroup === "All"
    ? donors
    : donors.filter(donor => donor.bloodGroup === selectedBloodGroup);

  const handleAction = (action) => {
    console.log(`Performing ${action} action`);
    navigate(`/${action.toLowerCase().replace(" ", "-")}`);
  };

  // Handle profile view (simplified for demo)
  const handleShowProfile = (donor) => {
    alert(`Full Profile for ${donor.name}:\nName: ${donor.name}\nBlood Group: ${donor.bloodGroup}\nPhone: ${donor.phone}\nLocation: ${donor.location || "Not specified"}`);
  };

  // Determine user badge based on donations
  const getBadge = (donations) => {
    if (donations >= 10) return "Super Donor";
    if (donations >= 5) return "Regular Donor";
    if (donations >= 1) return "New Donor";
    return "Potential Donor";
  };

  // Handle location pinning and auto-fill
  const handleLocationPin = async (latlng) => {
    setPinnedLocation(latlng);
    const details = await fetchLocationDetails(latlng.lat, latlng.lng);
    setRequestLocation(`Lat: ${latlng.lat}, Lng: ${latlng.lng}`);
    setRequestLocationDetails(details);
    setExactLocation(details); // Update exact location with geocoded details
  };

  const handleLocationConfirm = () => {
    if (pinnedLocation) {
      setIsLocationPickerOpen(false);
      setPinnedLocation(null); // Reset after confirmation
    }
  };

  // Handle file upload for blood request receipt
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      alert(`File ${file.name} uploaded successfully!`);
    }
  };

  return (
    <div className={styles.appContainer}>
      {/* Fixed Header (Super Stylish Design) */}
      <header className={styles.fixedHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.appTitle}>Swasthya Setu</h1>
          <div className={styles.userProfile}>
            <span className={styles.bloodCoinsHeader}>BloodCoins: {user.bloodCoins}</span>
          </div>
        </div>
      </header>

      <div className={styles.stylishContainer}>
        <div className={styles.stylishContent}>
          {/* Map at the Top with Blood Donation Requests */}
          <h2 className={styles.sectionTitle}>Nearby Blood Donation Requests (4.3 km)</h2>
          <div className={styles.urgencyFilter}>
            <button
              className={`${styles.filterButton} ${selectedUrgency === "All" ? styles.active : ""}`}
              onClick={() => setSelectedUrgency("All")}
            >
              All
            </button>
            <button
              className={`${styles.filterButton} ${selectedUrgency === "Critical" ? styles.active : ""}`}
              onClick={() => setSelectedUrgency("Critical")}
            >
              Critical
            </button>
            <button
              className={`${styles.filterButton} ${selectedUrgency === "Urgent" ? styles.active : ""}`}
              onClick={() => setSelectedUrgency("Urgent")}
            >
              Urgent
            </button>
            <button
              className={`${styles.filterButton} ${selectedUrgency === "Normal" ? styles.active : ""}`}
              onClick={() => setSelectedUrgency("Normal")}
            >
              Normal
            </button>
          </div>
          <div className={styles.mapContainer}>
            <MapContainer
              center={userLocation}
              zoom={13}
              zoomControl={false} // Disable default zoom control completely
              className={styles.stylishMap}
              style={{ height: "300px", width: "100%", borderRadius: "15px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* 4.3 km Radius Circle with Stylish Effect */}
              <Circle
                center={userLocation}
                radius={radius}
                pathOptions={{
                  color: "#d4a017",
                  fillColor: "#f5e7bc",
                  fillOpacity: 0.5,
                  weight: 3,
                  dashArray: "5, 5",
                }}
              />
              {/* Markers for Filtered Blood Requests */}
              {filteredRequests.map((request) => (
                <CustomMarker
                  key={request.id}
                  position={request.location}
                  isHighlighted={highlightedRequestId === request.id}
                  onClick={() => setHighlightedRequestId(request.id)}
                >
                  <Popup className={styles.stylishPopup}>
                    <strong>{request.hospital}</strong>
                    <br />
                    Blood Group: {request.bloodGroup}
                    <br />
                    Units Needed: {request.unitsNeeded}
                    <br />
                    Urgency: {request.urgency}
                    <br />
                    Distance: {request.distance}
                  </Popup>
                </CustomMarker>
              ))}
            </MapContainer>
          </div>

          {/* Blood Request Cards Below Map (Super Stylish) */}
          <div className={styles.requestList}>
            {filteredRequests.map((request) => (
              <BloodRequestCard
                key={request.id}
                request={request}
                onHover={() => setHighlightedRequestId(request.id)}
                onLeave={() => setHighlightedRequestId(null)}
                isHighlighted={highlightedRequestId === request.id}
              />
            ))}
          </div>

          {/* Donor Section with Blood Group Filter Above Table */}
          <h2 className={styles.sectionTitle}>Available Donors</h2>
          <div className={styles.bloodGroupFilter}>
            <button
              className={`${styles.filterButton} ${selectedBloodGroup === "All" ? styles.active : ""}`}
              onClick={() => setSelectedBloodGroup("All")}
            >
              All Blood Groups
            </button>
            <button
              className={`${styles.filterButton} ${selectedBloodGroup === "O+" ? styles.active : ""}`}
              onClick={() => setSelectedBloodGroup("O+")}
            >
              O+
            </button>
            <button
              className={`${styles.filterButton} ${selectedBloodGroup === "O-" ? styles.active : ""}`}
              onClick={() => setSelectedBloodGroup("O-")}
            >
              O-
            </button>
            <button
              className={`${styles.filterButton} ${selectedBloodGroup === "A+" ? styles.active : ""}`}
              onClick={() => setSelectedBloodGroup("A+")}
            >
              A+
            </button>
            <button
              className={`${styles.filterButton} ${selectedBloodGroup === "A-" ? styles.active : ""}`}
              onClick={() => setSelectedBloodGroup("A-")}
            >
              A-
            </button>
            <button
              className={`${styles.filterButton} ${selectedBloodGroup === "B+" ? styles.active : ""}`}
              onClick={() => setSelectedBloodGroup("B+")}
            >
              B+
            </button>
            <button
              className={`${styles.filterButton} ${selectedBloodGroup === "B-" ? styles.active : ""}`}
              onClick={() => setSelectedBloodGroup("B-")}
            >
              B-
            </button>
            <button
              className={`${styles.filterButton} ${selectedBloodGroup === "AB+" ? styles.active : ""}`}
              onClick={() => setSelectedBloodGroup("AB+")}
            >
              AB+
            </button>
            <button
              className={`${styles.filterButton} ${selectedBloodGroup === "AB-" ? styles.active : ""}`}
              onClick={() => setSelectedBloodGroup("AB-")}
            >
              AB-
            </button>
          </div>
          <div className={styles.donorTableContainer}>
            <table className={styles.stylishDonorTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Blood Group</th>
                  <th>Number</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonors.map((donor) => (
                  <tr key={donor.id} className={styles.stylishTableRow}>
                    <td>{donor.name}</td>
                    <td>{donor.bloodGroup}</td>
                    <td>{donor.phone}</td>
                    <td>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleShowProfile(donor)}
                      >
                        Show Full Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Receive Blood Section (Super Stylish) */}
          <h2 className={styles.sectionTitle}>Request Blood</h2>
          <div className={styles.stylishInputGrid}>
            <InputField
              icon={<PersonIcon />}
              label="Patient Name"
              placeholder="Enter patient name"
              onChange={(e) => console.log(e.target.value)}
            />
            <div className={styles.inputField}>
              <div className={styles.inputIcon}>
                <BloodIcon />
              </div>
              <select
                className={styles.selectInput}
                value={selectedBloodGroup}
                onChange={(e) => console.log(e.target.value)}
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div className={styles.locationField}>
              <div className={styles.inputIcon}>
                <LocationIcon />
              </div>
              <input
                type="text"
                placeholder="Enter or pin hospital location"
                value={requestLocation}
                onChange={(e) => setRequestLocation(e.target.value)}
                className={styles.input}
                readOnly
              />
              <button
                className={styles.pinButton}
                onClick={() => setIsLocationPickerOpen("request")}
              >
                Pin Location
              </button>
            </div>
            <InputField
              icon={<LocationIcon />}
              label="Location Details"
              value={requestLocationDetails}
              placeholder="Detailed address will appear here"
              readOnly
            />
            <InputField
              icon={<LocationIcon />}
              label="Exact Location"
              value={exactLocation}
              placeholder="Enter exact address or landmark"
              onChange={(e) => setExactLocation(e.target.value)}
            />
            <InputField
              icon={<UrgencyIcon />}
              label="Urgency Level"
              placeholder="e.g., Critical, Urgent, Normal"
              onChange={(e) => console.log(e.target.value)}
            />
            <InputField
              icon={<BloodIcon />}
              label="Required Units"
              placeholder="e.g., 1 Unit (~450ml)"
              onChange={(e) => console.log(e.target.value)}
            />
            <div className={styles.inputField}>
              <div className={styles.inputIcon}>
                <PersonIcon />
              </div>
              <label className={styles.fileLabel}>
                Upload Hospital Receipt
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                  accept="image/*,application/pdf"
                />
              </label>
            </div>
            <button
              className={styles.actionButton}
              onClick={() => handleAction("Request Blood")}
            >
              <RequestIcon className={styles.buttonIcon} />
              Request Blood
            </button>
          </div>

          {/* Search Available Blood Section (Super Stylish) */}
          <h2 className={styles.sectionTitle}>Search Blood Availability</h2>
          <button
            className={`${styles.actionButton} ${styles.searchButton}`}
            onClick={() => handleAction("Search Available Blood")}
          >
            <SearchIcon className={styles.buttonIcon} />
            Search Available Blood
          </button>

          {/* Customized Rewards & Benefits Section (Classic Look) */}
          <h2 className={styles.sectionTitle}>Rewards & Benefits</h2>
          <div className={styles.rewardsSection}>
            <div className={styles.rewardsBadge}>
              <span className={styles.badgeText}>You have</span>
              <span className={styles.bloodCoins}>500 BloodCoins</span>
              <span className={styles.badgeText}>Earn 100 BloodCoins per donation!</span>
            </div>
            <p className={styles.rewardsDescription}>
              Redeem for discounts on medicines, doctor consultations, or health services.
            </p>
            <div className={styles.badgeContainer}>
              <span className={styles.badge}>Current Badge:</span>
              <span className={styles.badgeValue}>Regular Donor</span>
            </div>
            <button
              className={`${styles.actionButton} ${styles.redeemButton}`}
              onClick={() => navigate("/redeem-rewards")}
            >
              Redeem Rewards
            </button>
          </div>

          {/* Emergency Donor Mode Toggle (Super Stylish) */}
          <h2 className={styles.sectionTitle}>Emergency Volunteering</h2>
          <button
            className={styles.actionButton}
            onClick={() =>
              alert(
                "Emergency Donor Mode Enabled! You'll receive urgent blood need notifications."
              )
            }
          >
            <NotificationIcon className={styles.buttonIcon} />
            Enable Emergency Donor Mode
          </button>

          {/* Location Picker Popup (Super Stylish) */}
          {isLocationPickerOpen && (
            <div className={styles.modalOverlay}>
              <div className={styles.stylishModalContent}>
                <h3 className={styles.modalTitle}>Pin Your Location</h3>
                <MapContainer
                  center={userLocation}
                  zoom={13}
                  zoomControl={false} // Disable default zoom control completely
                  className={styles.stylishMap}
                  style={{ height: "300px", width: "100%", borderRadius: "15px" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationPicker
                    onLocationSelect={handleLocationPin}
                    initialLocation={userLocation}
                  />
                </MapContainer>
                <div className={styles.modalButtons}>
                  <button
                    className={styles.actionButton}
                    onClick={handleLocationConfirm}
                  >
                    OK
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setIsLocationPickerOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InputField = ({ icon, label, value, placeholder, readOnly, onChange }) => {
  return (
    <div className={styles.inputField}>
      <div className={styles.inputIcon}>{icon}</div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.input}
        readOnly={readOnly}
      />
    </div>
  );
};

export default BloodDonateReceive;