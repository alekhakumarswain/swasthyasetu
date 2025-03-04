import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./AccidentAlert.module.css";
import {
  AlertTriangle as WarningIcon,
  MapPin as LocationIcon,
  Phone as PhoneIcon,
  Droplet as BloodIcon,
  Clock as ClockIcon,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for Leaflet's default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom marker for accident location
const CustomMarker = ({ position, isHighlighted, children }) => {
  const icon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
    iconSize: isHighlighted ? [48, 48] : [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
    className: styles.accidentMarker,
  });

  return (
    <Marker position={position} icon={icon}>
      {children}
    </Marker>
  );
};

const AccidentAlert = () => {
  const user = {
    name: "Alekha Kumar Swain",
    emergencyContacts: ["+91 1234567890", "+91 9876543210"],
    bloodGroup: "A+",
    defaultLocation: { lat: 20.296071, lng: 85.824539 },
  };

  const [liveLocation, setLiveLocation] = useState(user.defaultLocation);
  const [accidents, setAccidents] = useState([]);
  const [newAccident, setNewAccident] = useState({ location: "", city: "", state: "", description: "" });
  const [isReporting, setIsReporting] = useState(false);
  const [bloodRequired, setBloodRequired] = useState(false);
  const [nearestDoctors, setNearestDoctors] = useState([]);

  const locationOptions = [
    { value: "Jaydev Vihar", label: "Jaydev Vihar" },
    { value: "Patia", label: "Patia" },
    { value: "Buxi Bazar", label: "Buxi Bazar" },
    { value: "Jajpur Town", label: "Jajpur Town" },
    { value: "Grand Road", label: "Grand Road" },
    { value: "Bhadrak Town", label: "Bhadrak Town" },
  ];

  const cityOptions = [
    { value: "Bhubaneswar", label: "Bhubaneswar" },
    { value: "Cuttack", label: "Cuttack" },
    { value: "Jajpur-Town", label: "Jajpur-Town" },
    { value: "Puri", label: "Puri" },
    { value: "Bhadrak", label: "Bhadrak" },
    { value: "Delhi", label: "Delhi" },
  ];

  const stateOptions = [
    { value: "Odisha", label: "Odisha" },
    { value: "Gujarat", label: "Gujarat" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Delhi", label: "Delhi" },
  ];

  // Enhanced custom styles for react-select to ensure dropdowns appear above
  const selectStyles = {
    container: (base) => ({
      ...base,
      width: "100%",
      zIndex: 1000, // Base z-index for the container to establish stacking context
      position: "relative", // Ensure the container has its own stacking context
    }),
    menu: (base) => ({
      ...base,
      zIndex: 99999, // Extremely high z-index for dropdown menu
      position: "absolute",
      top: "100%",
      left: 0,
      width: "100%",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      background: "#fff",
      border: "1px solid #d4a017",
      marginTop: "4px", // Slight offset to prevent clipping
    }),
    control: (base) => ({
      ...base,
      border: "none",
      boxShadow: "none",
      background: "transparent",
      minHeight: "40px",
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0",
    }),
    option: (base) => ({
      ...base,
      fontFamily: "Georgia, serif",
      color: "#5c4033",
    }),
    optionFocused: (base) => ({
      ...base,
      background: "#f4c430",
      color: "#fff",
    }),
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLiveLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to fetch your location. Using default.");
      }
    );
  }, []);

  useEffect(() => {
    const fetchAccidents = async () => {
      try {
        const response = await axios.get("http://localhost:2000/api/accidents");
        setAccidents(response.data.accidents || []);
      } catch (error) {
        console.error("Error fetching accidents:", error);
        toast.error("Failed to fetch accidents.");
      }
    };
    fetchAccidents();
  }, []);

  const fetchNearestDoctors = async (accidentLocation) => {
    try {
      const response = await axios.get("http://localhost:2000/api/doctors");
      const doctors = response.data;
      const nearbyDoctors = doctors
        .map((doctor) => {
          const doctorLocation = doctor.clinicDetails?.[0]?.coordinates || user.defaultLocation;
          const distance = calculateDistance(accidentLocation, doctorLocation);
          return { ...doctor, distance };
        })
        .filter((doctor) => doctor.distance < 5)
        .sort((a, b) => a.distance - b.distance);
      setNearestDoctors(nearbyDoctors);
      if (nearbyDoctors.length > 0) {
        notifyDoctors(nearbyDoctors, accidentLocation);
      } else {
        toast.info("No doctors found within 5km.");
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to fetch nearby doctors.");
    }
  };

  const notifyDoctors = (doctors, accidentLocation) => {
    doctors.forEach((doctor) => {
      console.log(`Notifying Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}) at ${doctor.distance.toFixed(2)} km`);
    });
    toast.success(`Notified ${doctors.length} nearby doctor(s)!`);
  };

  const handleReportAccident = async (e) => {
    e.preventDefault();
    if (!newAccident.location || !newAccident.city || !newAccident.state || !newAccident.description) {
      toast.error("All fields are required!");
      return;
    }

    const accidentData = {
      location: newAccident.location,
      city: newAccident.city,
      state: newAccident.state,
      description: newAccident.description,
      coordinates: liveLocation,
    };

    try {
      const response = await axios.post("http://localhost:2000/api/accidents", accidentData);
      setAccidents([...accidents, response.data]);
      setNewAccident({ location: "", city: "", state: "", description: "" });
      setIsReporting(true);
      fetchNearestDoctors(liveLocation);
      toast.success("Accident reported successfully!");
    } catch (error) {
      console.error("Error reporting accident:", error);
      toast.error("Failed to report accident.");
    }
  };

  const calculateDistance = (loc1, loc2) => {
    const R = 6371;
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) * Math.cos((loc2.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const convertToIST = (time) => {
    const date = new Date(time);
    const options = { timeZone: "Asia/Kolkata", hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit", day: "numeric", month: "short", year: "numeric" };
    return date.toLocaleString("en-IN", options);
  };

  const toggleBloodRequest = () => {
    setBloodRequired(!bloodRequired);
    if (!bloodRequired) {
      toast.success(`Blood request for ${user.bloodGroup} sent!`);
      console.log(`EHR Log: Blood request for ${user.bloodGroup} triggered on ${new Date().toISOString()} at ${liveLocation.lat}, ${liveLocation.lng}`);
    } else {
      toast.info("Blood request canceled.");
    }
  };

  return (
    <div className={styles.stylishContainer}>
      <div className={styles.stylishContent}>
        <h2 className={styles.sectionTitle}>Live Location & Accident Map 📍</h2>
        <div className={styles.mapContainer}>
          <MapContainer
            center={liveLocation}
            zoom={13}
            zoomControl={false}
            className={styles.stylishMap}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <CustomMarker position={liveLocation} isHighlighted={true}>
              <Popup className={styles.stylishPopup}>Your Location: Lat {liveLocation.lat}, Lng {liveLocation.lng}</Popup>
            </CustomMarker>
            {accidents
              .filter((accident) => calculateDistance(liveLocation, accident.coordinates || user.defaultLocation) < 10)
              .map((accident) => (
                <CustomMarker key={accident._id} position={accident.coordinates || user.defaultLocation} isHighlighted={false}>
                  <Popup className={styles.stylishPopup}>
                    Accident: {accident.location}, {accident.city}, {accident.state} - {convertToIST(accident.time)} ({accident.status})
                  </Popup>
                </CustomMarker>
              ))}
          </MapContainer>
        </div>

        <h2 className={styles.sectionTitle}>Recent Accidents Near Me</h2>
        <div className={styles.accidentList}>
          {accidents
            .filter((accident) => calculateDistance(liveLocation, accident.coordinates || user.defaultLocation) < 10)
            .map((accident) => (
              <div key={accident._id} className={styles.accidentItem}>
                <p><ClockIcon className={styles.icon} /> {convertToIST(accident.time)}</p>
                <p><LocationIcon className={styles.icon} /> {accident.location}, {accident.city}, {accident.state} ({accident.status})</p>
                {accident.description && <p className={styles.accidentDescription}>{accident.description}</p>}
              </div>
            ))}
        </div>

        {isReporting && (
          <div className={styles.emergencyNotification}>
            <h3 className={styles.notificationTitle}><WarningIcon className={styles.warningIcon} /> Accident Reported - Emergency Actions</h3>
            <p><LocationIcon className={styles.icon} /> Live Location Shared: [Google Maps Link]</p>
            <p><PhoneIcon className={styles.icon} /> Emergency Call Options:
              <button className={styles.emergencyCallButton} onClick={() => console.log("Calling 999...")}>999</button>
              <button className={styles.emergencyCallButton} onClick={() => console.log("Calling Police...")}>Police</button>
              <button className={styles.emergencyCallButton} onClick={() => console.log("Calling Ambulance...")}>Ambulance</button>
              {user.emergencyContacts.map((contact, index) => (
                <button key={index} className={styles.emergencyCallButton} onClick={() => console.log(`Calling ${contact}...`)}>
                  Family #{index + 1}
                </button>
              ))}
            </p>
            {nearestDoctors.length > 0 && (
              <div>
                <p><WarningIcon className={styles.icon} /> Nearest Doctors Notified:</p>
                {nearestDoctors.map((doctor) => (
                  <p key={doctor._id}>
                    Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization}) - {doctor.distance.toFixed(2)} km
                  </p>
                ))}
              </div>
            )}
            <div className={styles.bloodRequest}>
              <p><BloodIcon className={styles.icon} /> Blood Required?</p>
              <button
                className={`${styles.actionButton} ${bloodRequired ? styles.active : ""}`}
                onClick={toggleBloodRequest}
              >
                {bloodRequired ? "Yes (Request Sent)" : "No"}
              </button>
              {bloodRequired && (
                <p className={styles.bloodMessage}>
                  URGENT! Accident Victim Needs Blood. {user.bloodGroup} Required at Nearest Hospital.
                </p>
              )}
            </div>
            <button className={styles.actionButton} onClick={() => setIsReporting(false)}>Close Emergency Actions</button>
          </div>
        )}

        <h2 className={styles.sectionTitle}>Report New Accident</h2>
        <form className={styles.accidentForm} onSubmit={handleReportAccident}>
          <div className={styles.inputField}>
            <LocationIcon className={styles.inputIcon} />
            <Select
              options={locationOptions}
              value={locationOptions.find((opt) => opt.value === newAccident.location)}
              onChange={(opt) => setNewAccident({ ...newAccident, location: opt ? opt.value : "" })}
              placeholder="Select Location"
              className={`${styles.input} react-select-container`}
              styles={selectStyles}
            />
          </div>
          <div className={styles.inputField}>
            <LocationIcon className={styles.inputIcon} />
            <Select
              options={cityOptions}
              value={cityOptions.find((opt) => opt.value === newAccident.city)}
              onChange={(opt) => setNewAccident({ ...newAccident, city: opt ? opt.value : "" })}
              placeholder="Select City"
              className={`${styles.input} react-select-container`}
              styles={selectStyles}
            />
          </div>
          <div className={styles.inputField}>
            <LocationIcon className={styles.inputIcon} />
            <Select
              options={stateOptions}
              value={stateOptions.find((opt) => opt.value === newAccident.state)}
              onChange={(opt) => setNewAccident({ ...newAccident, state: opt ? opt.value : "" })}
              placeholder="Select State"
              className={`${styles.input} react-select-container`}
              styles={selectStyles}
            />
          </div>
          <div className={styles.inputField}>
            <WarningIcon className={styles.inputIcon} />
            <textarea
              value={newAccident.description}
              onChange={(e) => setNewAccident({ ...newAccident, description: e.target.value })}
              placeholder="Describe the accident"
              className={styles.input}
              rows="3"
            />
          </div>
          <button type="submit" className={styles.actionButton}>Report Accident</button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AccidentAlert;