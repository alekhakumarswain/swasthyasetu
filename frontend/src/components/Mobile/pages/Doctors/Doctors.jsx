import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Stethoscope, ChevronRight, Star, Video, MapPin, Clock } from "lucide-react";
import styles from "../BloodTest/BloodTest.module.css"; // Reuse BloodTest.module.css for consistency

// Simulated doctor data (replace with API/JSON in production)
const mockDoctors = [
  { id: 1, name: "Dr. John Doe", specialty: "Cardiologist", experience: "10 years", hospital: "Apollo Hospital", address: "Bhubaneswar, Odisha", rating: 4.8, availableNow: true, lat: 20.333, lng: 85.821 },
  { id: 2, name: "Dr. Jane Smith", specialty: "Dermatologist", experience: "8 years", hospital: "KIMS Hospital", address: "Patia, Bhubaneswar", rating: 4.5, availableNow: false, nextSlot: "Tomorrow, 10 AM", lat: 20.354, lng: 85.822 },
  { id: 3, name: "Dr. Anil Kumar", specialty: "Neurologist", experience: "15 years", hospital: "AIIMS Bhubaneswar", address: "Infocity, Bhubaneswar", rating: 4.9, availableNow: true, lat: 20.334, lng: 85.810 },
];

// Leaflet icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DoctorIcon = (size) => L.icon({
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

// Map click handler for location selection
const MapClickHandler = ({ setPinLocation, setLatitude, setLongitude, setAddress }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPinLocation([lat, lng]);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(response => response.json())
        .then(data => setAddress(data.display_name || "Unknown location"))
        .catch(() => setAddress("Unable to fetch address"));
    },
  });
  return null;
};

const Doctors = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [doctors, setDoctors] = useState(mockDoctors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [availabilityFilter, setAvailabilityFilter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentType, setAppointmentType] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pinLocation, setPinLocation] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Specialty and availability options
  const specialties = [
    { value: "Cardiologist", label: "Cardiologist" },
    { value: "Dermatologist", label: "Dermatologist" },
    { value: "Neurologist", label: "Neurologist" },
  ];

  const availabilityOptions = [
    { value: "availableNow", label: "Available Now" },
    { value: "nextSlot", label: "Next Available Slot" },
  ];

  const timeSlots = [
    { value: "morning", label: "9:00 AM - 12:00 PM" },
    { value: "afternoon", label: "1:00 PM - 4:00 PM" },
    { value: "evening", label: "5:00 PM - 8:00 PM" },
  ];

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        err => console.warn("Failed to get user location"),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // Filter doctors
  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedSpecialty || doctor.specialty === selectedSpecialty.value) &&
    (!availabilityFilter || 
      (availabilityFilter.value === "availableNow" && doctor.availableNow) ||
      (availabilityFilter.value === "nextSlot" && !doctor.availableNow))
  );

  // Handle appointment booking
  const handleBookAppointment = () => {
    if (!userName || !email || !appointmentType || !appointmentDate || !appointmentTime || (appointmentType.value === "inPerson" && !pinLocation)) {
      toast.error("Please fill in all required fields!");
      return;
    }
    toast.success(`Appointment booked with ${selectedDoctor.name}!`);
    setIsBookingPopupOpen(false);
    // Here you could integrate with EHR, pharmacy, or other services
  };

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da", boxShadow: "none" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
    option: base => ({ ...base, fontFamily: "Georgia, serif", color: "#2c3e50" }),
    singleValue: base => ({ ...base, color: "#2c3e50", fontFamily: "Georgia, serif" }),
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Doctor Consultation</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-4">
        <div className="row">
          <div className="col-md-4 mb-2">
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ borderRadius: "10px", padding: "10px" }}
            />
          </div>
          <div className="col-md-4 mb-2">
            <Select
              options={specialties}
              value={selectedSpecialty}
              onChange={setSelectedSpecialty}
              placeholder="Filter by specialty..."
              styles={selectStyles}
              isClearable
            />
          </div>
          <div className="col-md-4 mb-2">
            <Select
              options={availabilityOptions}
              value={availabilityFilter}
              onChange={setAvailabilityFilter}
              placeholder="Filter by availability..."
              styles={selectStyles}
              isClearable
            />
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Available Doctors</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigate("/medicine")}>
            Go to Medicine <ChevronRight size={16} />
          </button>
        </div>
        <div className={styles.labsGrid}>
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className={styles.labCard}
                onClick={() => {
                  setSelectedDoctor(doctor);
                  setIsBookingPopupOpen(true);
                }}
              >
                <div className={styles.labAvatar}>
                  <Stethoscope size={24} />
                </div>
                <h3 className={styles.labName}>{doctor.name}</h3>
                <p className={styles.labDistance}>{doctor.specialty} - {doctor.experience}</p>
                <p style={{ fontSize: "0.9rem", color: "#2c3e50" }}>{doctor.hospital}, {doctor.address}</p>
                <div className={styles.ratingContainer}>
                  <Star className={styles.starIcon} />
                  <span className={styles.rating}>{doctor.rating}</span>
                </div>
                <p style={{ color: doctor.availableNow ? "#27ae60" : "#e74c3c", fontSize: "0.8rem" }}>
                  {doctor.availableNow ? "Available Now" : `Next: ${doctor.nextSlot}`}
                </p>
              </div>
            ))
          ) : (
            <p>No doctors found matching your criteria.</p>
          )}
        </div>
      </div>

      {/* Booking Popup */}
      {isBookingPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
              <div className="modal-header" style={{ background: "linear-gradient(45deg, #27ae60, #2ecc71)", color: "#fff" }}>
                <h5 className="modal-title" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>
                  Book Appointment with {selectedDoctor?.name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsBookingPopupOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: "20px" }}>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Appointment Type</label>
                  <Select
                    options={[
                      { value: "video", label: "Video Consultation" },
                      { value: "inPerson", label: "In-Person Consultation" },
                    ]}
                    value={appointmentType}
                    onChange={setAppointmentType}
                    placeholder="Choose appointment type..."
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Time Slot</label>
                  <Select
                    options={timeSlots}
                    value={appointmentTime}
                    onChange={setAppointmentTime}
                    placeholder="Choose a time slot..."
                    styles={selectStyles}
                  />
                </div>
                {appointmentType?.value === "inPerson" && (
                  <div className="mb-3">
                    <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Your Location</label>
                    <MapContainer
                      center={userLocation || [20.333, 85.821]}
                      zoom={15}
                      style={{ height: "200px", borderRadius: "10px", border: "2px solid #27ae60" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {userLocation && <Marker position={userLocation} icon={UserIcon} />}
                      {pinLocation && <Marker position={pinLocation} icon={DoctorIcon([40, 40])} />}
                      <MapClickHandler
                        setPinLocation={setPinLocation}
                        setLatitude={setLatitude}
                        setLongitude={setLongitude}
                        setAddress={setAddress}
                      />
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
                        placeholder="Address"
                        value={address}
                        readOnly
                        className="form-control"
                        style={{ borderRadius: "10px" }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: "none" }}>
                <button
                  className="btn"
                  style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={handleBookAppointment}
                >
                  Book Appointment
                </button>
                <button
                  className="btn"
                  style={{ background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={() => setIsBookingPopupOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default Doctors;