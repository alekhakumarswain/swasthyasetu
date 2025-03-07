// HospitalDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapPin, Clock, FileText, DollarSign, Bell, Lock, Ambulance } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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

const MapClickHandler = ({ setPinLocation }) => {
  useMapEvents({
    click(e) {
      setPinLocation([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [hospitals] = useState(hospitalData);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => toast.error("Failed to get location")
    );
  }, []);

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
  };

  const specialties = [
    { value: "cardiology", label: "Cardiology" },
    { value: "orthopedics", label: "Orthopedics" },
    { value: "neurology", label: "Neurology" },
    // Add more specialties as needed
  ];

  const paymentOptions = [
    { value: "upi", label: "UPI" },
    { value: "card", label: "Credit/Debit Card" },
    { value: "insurance", label: "Insurance" },
  ];

  const getNearestHospitals = () => {
    if (!userLocation) return [];
    return hospitals
      .map(hospital => ({
        ...hospital,
        distance: calculateDistance(userLocation[0], userLocation[1], hospital.latitude, hospital.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
  };

  const handleEmergencyAdmission = (hospital) => {
    toast.success(`Emergency admission requested at ${hospital.name}`);
    // Add API call for emergency admission
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.greeting}>Hospital Dashboard</h1>

      {/* Summary Cards */}
      <div className={styles.cardGrid}>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/all-hospitals", { state: { userLocation } })}>
          <MapPin /> <h3>Find Hospitals</h3>
          <p>Search & book appointments</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => navigate("/medical-records")}>
          <FileText /> <h3>Medical Records</h3>
          <p>Access your EHR</p>
        </div>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/emergency-services")}>
          <Ambulance /> <h3>Emergency</h3>
          <p>One-click emergency support</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => navigate("/billing")}>
          <DollarSign /> <h3>Billing</h3>
          <p>Manage payments & insurance</p>
        </div>
      </div>

      {/* Nearby Hospitals */}
      <div className={styles.hospitalsSection}>
        <h2>Nearby Hospitals</h2>
        <div className={styles.hospitalsGrid}>
          {getNearestHospitals().map((hospital, index) => (
            <div key={index} className={styles.hospitalCard} onClick={() => { setSelectedHospital(hospital); setIsBookingPopupOpen(true); }}>
              <img src={hospital.imageUrl} alt={hospital.name} className={styles.hospitalImage} />
              <h3>{hospital.name}</h3>
              <p>Distance: {hospital.distance.toFixed(2)} km</p>
              <p>Available Beds: {hospital.bedAvailability.general}</p>
              <button 
                className={styles.emergencyBtn}
                onClick={(e) => { e.stopPropagation(); handleEmergencyAdmission(hospital); }}
              >
                Emergency
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Popup */}
      {isBookingPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ background: "#27ae60", color: "#fff" }}>
                <h5>Book Appointment</h5>
                <button className="btn-close" onClick={() => setIsBookingPopupOpen(false)}></button>
              </div>
              <div className="modal-body">
                <p>Selected Hospital: {selectedHospital?.name}</p>
                <Select
                  options={specialties}
                  value={selectedSpecialty}
                  onChange={setSelectedSpecialty}
                  placeholder="Select Specialty"
                  styles={selectStyles}
                />
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={e => setAppointmentDate(e.target.value)}
                  className="form-control mt-3"
                />
                <Select
                  options={paymentOptions}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  placeholder="Payment Method"
                  styles={selectStyles}
                  className="mt-3"
                />
                <div className="mt-3">
                  <MapContainer center={userLocation || [20.5937, 78.9629]} zoom={13} style={{ height: "200px" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {userLocation && <Marker position={userLocation} icon={UserIcon} />}
                    {pinLocation && <Marker position={pinLocation} icon={HospitalIcon} />}
                    <MapClickHandler setPinLocation={setPinLocation} />
                  </MapContainer>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={() => toast.success("Appointment booked!")}>Book Now</button>
                <button className="btn btn-danger" onClick={() => setIsBookingPopupOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default HospitalDashboard;