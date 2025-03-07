import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Ambulance, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import hospitalData from "../../../assets/Data/Hospitallist.json";
import styles from "./Hospital.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const HospitalIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/33/33426.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const UserIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="background-color: red; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
});

const AmbulanceIcon = L.divIcon({
  className: "ambulance-marker",
  html: '<div style="background-color: blue; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const EmergencyServices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userLocation = location.state?.userLocation || [20.2961, 85.8245];
  const [hospitals] = useState(hospitalData);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        // Simulate ambulance movement towards user location
        setAmbulanceLocation([
          userLocation[0] + (Math.random() - 0.5) * 0.01,
          userLocation[1] + (Math.random() - 0.5) * 0.01,
        ]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isTracking, userLocation]);

  const getNearestEmergencyHospitals = () => {
    return hospitals
      .filter(h => h.emergencyServices.available)
      .map(hospital => ({
        ...hospital,
        distance: calculateDistance(userLocation[0], userLocation[1], hospital.latitude, hospital.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  };

  const handleBookAmbulance = () => {
    setIsTracking(true);
    toast.success("Ambulance booked! Tracking started.");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Emergency Services</h1>
      </div>

      <div className={styles.cardGrid}>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={handleBookAmbulance}>
          <div className={styles.iconContainer}>
            <Ambulance className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Book Ambulance</h3>
          <p className={styles.cardSubtitle}>Request emergency transport</p>
        </div>
      </div>

      {isTracking && (
        <div className={styles.labsSection}>
          <h2 className={styles.sectionTitle}>Live Ambulance Tracking</h2>
          <MapContainer center={userLocation} zoom={13} style={{ height: "300px", borderRadius: "15px" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={userLocation} icon={UserIcon} />
            {ambulanceLocation && <Marker position={ambulanceLocation} icon={AmbulanceIcon} />}
          </MapContainer>
        </div>
      )}

      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>Nearest Emergency Hospitals</h2>
        <div className={styles.labsGrid}>
          {getNearestEmergencyHospitals().map((hospital, index) => (
            <div key={index} className={styles.labCard}>
              <div className={styles.labAvatar}>
                <img src={hospital.imageUrl} alt={hospital.name} />
              </div>
              <h3 className={styles.labName}>{hospital.name}</h3>
              <p className={styles.labDistance}>Distance: {hospital.distance.toFixed(2)} km</p>
              <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>
                Response Time: {hospital.emergencyServices.estimatedResponseTime}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default EmergencyServices;