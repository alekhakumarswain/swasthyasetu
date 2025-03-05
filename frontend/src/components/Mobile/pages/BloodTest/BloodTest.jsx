import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { MapPin, TestTube, FileText, Clock, ChevronRight, Star } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import pathoLabData from "../../../assets/Data/PathoLab_store_list.json";
import styles from "./BloodTest.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const LabIcon = (size) => L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: size,
  iconAnchor: [size[0] / 2, size[1]],
  popupAnchor: [0, -size[1]],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: size,
});

const UserIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="background-color: red; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
  popupAnchor: [0, -10],
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getTopRatedNearestLabs = (labs, userLoc) => {
  if (!userLoc || !labs.length) return [];
  return labs
    .map(lab => ({
      ...lab,
      distance: calculateDistance(userLoc[0], userLoc[1], lab.Latitude, lab.Longitude),
    }))
    .sort((a, b) => b.Rating !== a.Rating ? b.Rating - a.Rating : a.distance - b.distance)
    .slice(0, 4);
};

// Component to handle map clicks
const MapClickHandler = ({ setPinLocation, setLatitude, setLongitude, setLocationName }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPinLocation([lat, lng]);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(response => response.json())
        .then(data => setLocationName(data.display_name || "Unknown location"))
        .catch(() => setLocationName("Unable to fetch location"));
    },
  });
  return null;
};

const BloodTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedLab = location.state?.selectedLab || null;

  const [pathoLabs] = useState(pathoLabData);
  const [selectedLab, setSelectedLab] = useState(preSelectedLab);
  const [selectedTime, setSelectedTime] = useState(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [pinLocation, setPinLocation] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationName, setLocationName] = useState("");

  const tests = [
    { name: "Complete Blood Count (CBC)", price: 299, category: "Basic" },
    { name: "Lipid Profile", price: 599, category: "Basic" },
    { name: "Thyroid Profile", price: 499, category: "Comprehensive" },
    { name: "Diabetic Profile", price: 399, category: "Comprehensive" },
    { name: "Kidney Function Test", price: 449, category: "Comprehensive" },
    { name: "Full Body Checkup", price: 1999, category: "Specialized" },
    { name: "Mini Health Package", price: 799, category: "Specialized" },
    { name: "Fever Panel", price: 599, category: "Basic" },
    { name: "Basic Health Check", price: 499, category: "Basic" },
    { name: "Complete Health Check", price: 1499, category: "Specialized" },
    { name: "Immunity Health Check", price: 899, category: "Specialized" },
    { name: "Self Individual Test", price: 199, category: "Basic" },
  ];

  const timeSlots = [
    { value: "morning", label: "9:00 AM - 12:00 PM" },
    { value: "afternoon", label: "1:00 PM - 4:00 PM" },
    { value: "evening", label: "5:00 PM - 8:00 PM" },
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        err => setError("Failed to get user location"),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by this browser");
    }
  }, []);

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da", boxShadow: "none" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
    option: base => ({ ...base, fontFamily: "Georgia, serif", color: "#2c3e50" }),
    singleValue: base => ({ ...base, color: "#2c3e50", fontFamily: "Georgia, serif" }),
  };

  const handleConfirmOrder = () => {
    if (!selectedTests.length || (!pinLocation && !locationName)) {
      toast.error("Please select tests and provide a location!");
      return;
    }
    toast.success("Order confirmed!");
    setIsBookingPopupOpen(false);
  };

  return (
    <div className={styles.container}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className={styles.header}>
        <h1 className={styles.greeting}>Blood Test</h1>
      </div>

      <div className={styles.cardGrid}>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/all-labs", { state: { userLocation } })}>
          <div className={styles.iconContainer}>
            <MapPin className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Labs Near Me</h3>
          <p className={styles.cardSubtitle}>Find nearby labs</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => setIsBookingPopupOpen(true)}>
          <div className={styles.iconContainer}>
            <TestTube className={styles.greenIcon} />
          </div>
          <h3 className={styles.cardTitle}>Book Appointment</h3>
          <p className={styles.cardSubtitle}>Schedule a test</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => navigate("/check-report")}>
          <div className={styles.iconContainer}>
            <FileText className={styles.greenIcon} />
          </div>
          <h3 className={styles.cardTitle}>Test Records</h3>
          <p className={styles.cardSubtitle}>View past reports</p>
        </div>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/track-order")}>
          <div className={styles.iconContainer}>
            <Clock className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Track Order</h3>
          <p className={styles.cardSubtitle}>Monitor status</p>
        </div>
      </div>

      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Top Rated Labs</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigate("/all-labs", { state: { userLocation } })}>
            See more <ChevronRight size={16} />
          </button>
        </div>
        <div className={styles.labsGrid}>
          {getTopRatedNearestLabs(pathoLabs, userLocation).map((lab, index) => (
            <div key={index} className={styles.labCard} onClick={() => { setSelectedLab(lab); setIsBookingPopupOpen(true); }}>
              <div className={styles.labAvatar}>
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt={lab["Patholab Name"]} />
              </div>
              <h3 className={styles.labName}>{lab["Patholab Name"]}</h3>
              <p className={styles.labDistance}>Distance: {lab.distance.toFixed(2)} km</p>
              <div className={styles.ratingContainer}>
                <Star className={styles.starIcon} />
                <span className={styles.rating}>{lab.Rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isBookingPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
              <div className="modal-header" style={{ background: "linear-gradient(45deg, #27ae60, #2ecc71)", color: "#fff" }}>
                <h5 className="modal-title" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>Book Your Test</h5>
                <button type="button" className="btn-close" onClick={() => setIsBookingPopupOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: "20px" }}>
                <p style={{ fontFamily: "Open Sans, sans-serif" }}>Selected Lab: {selectedLab?.["Patholab Name"] || "Please select a lab"}</p>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Choose Tests</label>
                  <Select
                    options={tests.map(t => ({ value: t.name.toLowerCase().replace(" ", ""), label: `${t.name} @ ₹${t.price}` }))}
                    value={selectedTests}
                    onChange={setSelectedTests}
                    placeholder="Select tests..."
                    isMulti
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Name</label>
                  <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Visit Date</label>
                  <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Time Slot</label>
                  <Select
                    options={timeSlots}
                    value={selectedTime}
                    onChange={setSelectedTime}
                    placeholder="Choose a time slot..."
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Select Location</label>
                  <MapContainer
                    center={userLocation || [20.333, 85.821]}
                    zoom={15}
                    style={{ height: "200px", borderRadius: "10px", border: "2px solid #27ae60" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                    {userLocation && <Marker position={userLocation} icon={UserIcon} />}
                    {pinLocation && <Marker position={pinLocation} icon={LabIcon([40, 40])} />}
                    <MapClickHandler setPinLocation={setPinLocation} setLatitude={setLatitude} setLongitude={setLongitude} setLocationName={setLocationName} />
                  </MapContainer>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Latitude"
                      value={latitude}
                      readOnly
                      className="form-control mb-2"
                      style={{ borderRadius: "10px" }}
                    />
                    <input
                      type="text"
                      placeholder="Longitude"
                      value={longitude}
                      readOnly
                      className="form-control mb-2"
                      style={{ borderRadius: "10px" }}
                    />
                    <input
                      type="text"
                      placeholder="Location Name"
                      value={locationName}
                      readOnly
                      className="form-control"
                      style={{ borderRadius: "10px" }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: "none" }}>
                <button className="btn" style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px 20px" }} onClick={handleConfirmOrder}>Confirm Order</button>
                <button className="btn" style={{ background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "10px 20px" }} onClick={() => setIsBookingPopupOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default BloodTest;