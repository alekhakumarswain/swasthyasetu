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
  Bell as NotificationIcon,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for Leaflet's default marker icon and remove default square/shadow
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: null, // Remove default retina icon
  iconUrl: null, // Remove default icon
  shadowUrl: null, // Remove default shadow
});

// Custom marker for accident location with alert type styling (using a simple dot)
const CustomMarker = ({ position, isHighlighted, alertType, children }) => {
  const alertColors = {
    Critical: "#F44336", // Red
    Urgent: "#FF9800", // Orange
    Normal: "#4CAF50", // Green
  };

  // Use a small dot as the marker icon (black dot by default, colored based on alert type)
  const dotIcon = L.divIcon({
    html: `<div style="width: 10px; height: 10px; background-color: ${
      alertType ? alertColors[alertType] : "#000"
    }; border-radius: 50%; border: 2px solid ${
      alertType ? alertColors[alertType] : "#000"
    };"></div>`,
    className: "custom-dot-marker",
    iconSize: [10, 10], // Size of the dot
    iconAnchor: [5, 5], // Center the dot on the position
    popupAnchor: [0, -5], // Adjust popup position relative to dot
  });

  return (
    <Marker position={position} icon={dotIcon}>
      {children}
    </Marker>
  );
};

// Enhanced PortalSelect component with absolute positioning and higher z-index
const PortalSelect = ({
  options,
  value,
  onChange,
  placeholder,
  className,
  styles: customStyles,
}) => {
  return (
    <Select
      options={options}
      value={options.find((opt) => opt.value === value) || null}
      onChange={(selected) => onChange(selected)}
      placeholder={placeholder}
      className={className}
      menuPosition="fixed" // Forces the menu to be positioned relative to the viewport
      menuPortalTarget={document.body} // Ensures the menu is appended to the body, avoiding z-index conflicts with parent elements
      styles={{
        ...customStyles,
        menu: (base) => ({
          ...base,
          zIndex: 999999, // Extremely high z-index to ensure it appears above everything
          position: "fixed", // Ensures the menu is fixed to the viewport, not relative to the select
          top: "auto",
          left: "auto",
          width: "100%",
          maxWidth: "480px", // Match the container width for consistency
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          background: "#fff",
          border: "1px solid #d4a017",
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
        singleValue: (base) => ({
          ...base,
          color: "#5c4033",
          fontFamily: "Georgia, serif",
        }),
      }}
    />
  );
};

// Location picker for pinning accident location with lat/long
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

// Function to create a hexagon overlay for a 5 km radius
const createHexagon = (center, radiusKm) => {
  const latlng = L.latLng(center);
  const points = [];

  // Earth radius in kilometers
  const earthRadius = 6371;

  // Convert radius from km to degrees (approximate)
  const radiusDeg = (radiusKm / earthRadius) * (180 / Math.PI);

  // Create hexagon points (6 sides, 60 degrees apart)
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180; // Convert to radians
    const lat = latlng.lat + radiusDeg * Math.cos(angle);
    const lng = latlng.lng + (radiusDeg * Math.sin(angle)) / Math.cos((latlng.lat * Math.PI) / 180);
    points.push([lat, lng]);
  }

  return points;
};

// Function to fetch location details using OpenStreetMap Nominatim API
const fetchLocationDetails = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return { displayName: data.display_name || `Lat: ${lat}, Lng: ${lng}`, lat, lng };
  } catch (error) {
    console.error("Error fetching location details:", error);
    return { displayName: `Lat: ${lat}, Lng: ${lng}`, lat, lng };
  }
};

const AccidentAlert = () => {
  const user = {
    name: "Alekha Kumar Swain",
    emergencyContacts: ["+91 1234567890", "+91 9876543210"],
    bloodGroup: "A+",
    defaultLocation: { lat: 20.296071, lng: 85.824539 }, // Bhubaneswar
  };

  const [liveLocation, setLiveLocation] = useState(user.defaultLocation);
  const [accidents, setAccidents] = useState([]);
  const [newAccident, setNewAccident] = useState({
    location: "",
    district: "",
    state: "Odisha",
    description: "",
    pinnedLocation: null,
    manualDistrict: "",
    manualCity: "",
    alertType: "Normal",
    city: "",
  });
  const [isReporting, setIsReporting] = useState(false);
  const [bloodRequired, setBloodRequired] = useState(false);
  const [nearestDoctors, setNearestDoctors] = useState([]);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [pinnedLocationDetails, setPinnedLocationDetails] = useState({
    displayName: "",
    lat: null,
    lng: null,
  });
  const [manualCityVisible, setManualCityVisible] = useState(false);
  const [manualDistrictVisible, setManualDistrictVisible] = useState(false);
  const [isEmergencyAlertEnabled, setIsEmergencyAlertEnabled] = useState(false);

  // Odisha districts and major cities
  const odishaDistricts = [
    { value: "Angul", label: "Angul" },
    { value: "Balangir", label: "Balangir" },
    { value: "Baleshwar", label: "Baleshwar" },
    { value: "Bargarh", label: "Bargarh" },
    { value: "Bhadrak", label: "Bhadrak" },
    { value: "Boudh", label: "Boudh" },
    { value: "Cuttack", label: "Cuttack" },
    { value: "Debagarh", label: "Debagarh" },
    { value: "Dhenkanal", label: "Dhenkanal" },
    { value: "Gajapati", label: "Gajapati" },
    { value: "Ganjam", label: "Ganjam" },
    { value: "Jagatsinghpur", label: "Jagatsinghpur" },
    { value: "Jajpur", label: "Jajpur" },
    { value: "Jharsuguda", label: "Jharsuguda" },
    { value: "Kalahandi", label: "Kalahandi" },
    { value: "Kandhamal", label: "Kandhamal" },
    { value: "Kendrapara", label: "Kendrapara" },
    { value: "Keonjhar", label: "Keonjhar" },
    { value: "Khordha", label: "Khordha" },
    { value: "Koraput", label: "Koraput" },
    { value: "Malkangiri", label: "Malkangiri" },
    { value: "Mayurbhanj", label: "Mayurbhanj" },
    { value: "Nabarangpur", label: "Nabarangpur" },
    { value: "Nayagarh", label: "Nayagarh" },
    { value: "Nuapada", label: "Nuapada" },
    { value: "Puri", label: "Puri" },
    { value: "Rayagada", label: "Rayagada" },
    { value: "Sambalpur", label: "Sambalpur" },
    { value: "Sonepur", label: "Sonepur" },
    { value: "Sundargarh", label: "Sundargarh" },
    { value: "Other", label: "Other (Enter Manually)" },
  ];

  const districtCities = {
    Angul: ["Angul", "Talcher", "Athmallik", "Kaniha"],
    Balangir: ["Balangir", "Titlagarh", "Patnagarh", "Kantabanji"],
    Baleshwar: ["Baleshwar", "Jaleswar", "Chandipur", "Soro"],
    Bargarh: ["Bargarh", "Padampur", "Sohela", "Attabira"],
    Bhadrak: ["Bhadrak", "Basudevpur", "Bant", "Dhamnagar"],
    Boudh: ["Boudh", "Harbhanga", "Manamunda"],
    Cuttack: ["Cuttack", "Choudwar", "Athagarh", "Banki"],
    Debagarh: ["Debagarh", "Kundheigola", "Barkot"],
    Dhenkanal: ["Dhenkanal", "Kamakhyanagar", "Hindol", "Palahada"],
    Gajapati: ["Paralakhemundi", "Rayagada", "Gudari"],
    Ganjam: ["Berhampur", "Chhatrapur", "Hinjilicut", "Asika"],
    Jagatsinghpur: ["Jagatsinghpur", "Paradip", "Kujang", "Naugaon"],
    Jajpur: ["Jajpur Town", "Kalinganagar", "Chandikhol", "Vyasanagar"],
    Jharsuguda: ["Jharsuguda", "Belpahar", "Brajrajnagar"],
    Kalahandi: ["Bhawanipatna", "Junagarh", "Kesinga", "Narayanpatna"],
    Kandhamal: ["Phulbani", "Baliguda", "G.Udayagiri"],
    Kendrapara: ["Kendrapara", "Pattamundai", "Rajkanika", "Aul"],
    Keonjhar: ["Keonjhar", "Barbil", "Champua", "Anandpur"],
    Khordha: ["Bhubaneswar", "Khordha", "Balugaon", "Jatani"],
    Koraput: ["Koraput", "Jeypore", "Sunabeda", "Malkangiri"],
    Malkangiri: ["Malkangiri", "Motu", "Kalimela"],
    Mayurbhanj: ["Baripada", "Rairangpur", "Karanjia", "Udala"],
    Nabarangpur: ["Nabarangpur", "Umarkote", "Papadahandi"],
    Nayagarh: ["Nayagarh", "Daspalla", "Khandapada", "Ranpur"],
    Nuapada: ["Nuapada", "Khariar", "Komna"],
    Puri: ["Puri", "Konark", "Pipili", "Nimapara"],
    Rayagada: ["Rayagada", "Gunupur", "Padmapur", "Chandrapur"],
    Sambalpur: ["Sambalpur", "Burla", "Hirakud", "Rairakhol"],
    Sonepur: ["Sonepur", "Binika", "Tarabha"],
    Sundargarh: ["Sundargarh", "Rourkela", "Rajgangpur", "Bonai"],
  };

  // Alert types for accidents
  const alertOptions = [
    { value: "Critical", label: "Critical" },
    { value: "Urgent", label: "Urgent" },
    { value: "Normal", label: "Normal" },
  ];

  // Custom styles for react-select
  const selectStyles = {
    container: (base) => ({
      ...base,
      width: "100%",
      zIndex: 1000,
      position: "relative",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 999999, // Extremely high z-index to ensure it appears above everything
      position: "fixed", // Ensures the menu is fixed to the viewport
      top: "auto",
      left: "auto",
      width: "100%",
      maxWidth: "480px", // Match the container width for consistency
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      background: "#fff",
      border: "1px solid #d4a017",
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
    singleValue: (base) => ({
      ...base,
      color: "#5c4033",
      fontFamily: "Georgia, serif",
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
        toast.error("Unable to fetch your location. Using default location.");
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
          const doctorLocation =
            doctor.clinicDetails?.[0]?.coordinates || user.defaultLocation;
          const distance = calculateDistance(accidentLocation, doctorLocation);
          return { ...doctor, distance };
        })
        .filter((doctor) => doctor.distance < 5)
        .sort((a, b) => a.distance - b.distance);
      setNearestDoctors(nearbyDoctors);
      if (nearbyDoctors.length > 0) {
        notifyDoctors(nearbyDoctors, accidentLocation);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to fetch nearby doctors.");
    }
  };

  const notifyDoctors = (doctors, accidentLocation) => {
    doctors.forEach((doctor) => {
      console.log(
        `Notifying Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}) at ${doctor.distance.toFixed(
          2
        )} km`
      );
    });
    toast.success(`Notified ${doctors.length} nearby doctor(s)!`);
  };

  const handleReportAccident = async (e) => {
    e.preventDefault();
    const accidentData = {
      location:
        pinnedLocationDetails.displayName ||
        `Lat: ${newAccident.pinnedLocation?.lat}, Lng: ${newAccident.pinnedLocation?.lng}`,
      district:
        newAccident.district === "Other"
          ? newAccident.manualDistrict
          : newAccident.district,
      state: newAccident.state,
      description: newAccident.description || "No description provided",
      coordinates: newAccident.pinnedLocation || liveLocation,
      alertType: newAccident.alertType,
      lat:
        pinnedLocationDetails.lat ||
        newAccident.pinnedLocation?.lat ||
        liveLocation.lat,
      lng:
        pinnedLocationDetails.lng ||
        newAccident.pinnedLocation?.lng ||
        liveLocation.lng,
    };

    try {
      const response = await axios.post(
        "http://localhost:2000/api/accidents",
        accidentData
      );
      setAccidents([...accidents, response.data]);
      setNewAccident({
        location: "",
        district: "",
        state: "Odisha",
        description: "",
        pinnedLocation: null,
        manualDistrict: "",
        manualCity: "",
        alertType: "Normal",
        city: "",
      });
      setIsReporting(true);
      fetchNearestDoctors(accidentData.coordinates);
      toast.success("Accident reported successfully!");
      setIsLocationPickerOpen(false);
      setPinnedLocation(null);
      setManualCityVisible(false);
      setManualDistrictVisible(false);
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
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const convertToIST = (time) => {
    const date = new Date(time);
    const options = {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleString("en-IN", options);
  };

  const toggleBloodRequest = () => {
    setBloodRequired(!bloodRequired);
    if (!bloodRequired) {
      toast.success(`Blood request for ${user.bloodGroup} sent!`);
      console.log(
        `EHR Log: Blood request for ${
          user.bloodGroup
        } triggered on ${new Date().toISOString()} at ${liveLocation.lat}, ${
          liveLocation.lng
        }`
      );
    } else {
      toast.info("Blood request canceled.");
    }
  };

  const handleLocationPin = async (latlng) => {
    const details = await fetchLocationDetails(latlng.lat, latlng.lng);
    setPinnedLocation(latlng);
    setPinnedLocationDetails(details);
    setNewAccident({
      ...newAccident,
      pinnedLocation: latlng,
      location: details.displayName,
    });
  };

  const handleLocationConfirm = () => {
    if (pinnedLocation) {
      setIsLocationPickerOpen(false);
    }
  };

  const handleDistrictChange = (selectedOption) => {
    setNewAccident({
      ...newAccident,
      district: selectedOption ? selectedOption.value : "",
      manualDistrict: "",
      city: "", // Reset city when district changes
      manualCity: "",
    });
    setManualDistrictVisible(selectedOption?.value === "Other");
    setManualCityVisible(false);
  };

  const handleCityChange = (selectedOption) => {
    setNewAccident({
      ...newAccident,
      city: selectedOption ? selectedOption.value : "",
      manualCity: "",
    });
    setManualCityVisible(selectedOption?.value === "Other");
  };

  const districtCityOptions =
    newAccident.district && newAccident.district !== "Other"
      ? districtCities[newAccident.district]?.map((city) => ({
          value: city,
          label: city,
        })) || []
      : [{ value: "Other", label: "Other (Enter Manually)" }];

  const handleEmergencyAlertToggle = () => {
    setIsEmergencyAlertEnabled(!isEmergencyAlertEnabled);
    if (!isEmergencyAlertEnabled) {
      toast.success(
        "Emergency Alert for Yourself Enabled! You'll receive urgent notifications."
      );
      console.log(
        `Emergency Alert Enabled for ${user.name} on ${new Date().toISOString()} at ${
          liveLocation.lat
        }, ${liveLocation.lng}`
      );
    } else {
      toast.info("Emergency Alert for Yourself Disabled.");
    }
  };

  // Determine the center for the hexagon (use pinned location if available, otherwise live location)
  const hexagonCenter = pinnedLocation || liveLocation;
  const hexagonRadiusKm = 5; // 5 km radius
  const hexagonPoints = createHexagon(hexagonCenter, hexagonRadiusKm);

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
            <Polygon
              positions={hexagonPoints}
              pathOptions={{
                color: "red", // Border color
                fillColor: "rgba(255, 0, 0, 0.3)", // Semi-transparent red fill (RGBA)
                fillOpacity: 0.3, // Transparency level
                weight: 2, // Border thickness
              }}
            />
            <CustomMarker position={liveLocation} isHighlighted={true}>
              <Popup className={styles.stylishPopup}>
                Your Location: Lat {liveLocation.lat}, Lng {liveLocation.lng}
              </Popup>
            </CustomMarker>
            {accidents
              .filter(
                (accident) =>
                  calculateDistance(
                    liveLocation,
                    accident.coordinates || user.defaultLocation
                  ) < 10
              )
              .map((accident) => (
                <CustomMarker
                  key={accident._id}
                  position={accident.coordinates || user.defaultLocation}
                  isHighlighted={false}
                  alertType={accident.alertType || "Normal"}
                >
                  <Popup className={styles.stylishPopup}>
                    Accident: {accident.location}, {accident.district},{" "}
                    {accident.state} - {convertToIST(accident.time)} (
                    {accident.alertType})
                    <br />
                    Lat: {accident.lat}, Lng: {accident.lng}
                    <br />
                    {accident.description}
                  </Popup>
                </CustomMarker>
              ))}
          </MapContainer>
        </div>

        <h2 className={styles.sectionTitle}>Recent Accidents Near Me</h2>
        <div className={styles.accidentList}>
          {accidents
            .filter(
              (accident) =>
                calculateDistance(
                  liveLocation,
                  accident.coordinates || user.defaultLocation
                ) < 10
            )
            .map((accident) => (
              <div key={accident._id} className={styles.accidentItem}>
                <p>
                  <ClockIcon className={styles.icon} />{" "}
                  {convertToIST(accident.time)}
                </p>
                <p>
                  <LocationIcon className={styles.icon} /> {accident.location},{" "}
                  {accident.district}, {accident.state} ({accident.alertType})
                </p>
                {accident.description && (
                  <p className={styles.accidentDescription}>
                    {accident.description}
                  </p>
                )}
              </div>
            ))}
        </div>

        {isReporting && (
          <div className={styles.emergencyNotification}>
            <h3 className={styles.notificationTitle}>
              <WarningIcon className={styles.warningIcon} /> Accident Reported
              - Emergency Actions
            </h3>
            <p>
              <LocationIcon className={styles.icon} /> Live Location Shared:
              [Google Maps Link]
            </p>
            <p>
              <PhoneIcon className={styles.icon} /> Emergency Call Options:
              <button
                className={styles.emergencyCallButton}
                onClick={() => console.log("Calling 999...")}
              >
                999
              </button>
              <button
                className={styles.emergencyCallButton}
                onClick={() => console.log("Calling Police...")}
              >
                Police
              </button>
              <button
                className={styles.emergencyCallButton}
                onClick={() => console.log("Calling Ambulance...")}
              >
                Ambulance
              </button>
              {user.emergencyContacts.map((contact, index) => (
                <button
                  key={index}
                  className={styles.emergencyCallButton}
                  onClick={() => console.log(`Calling ${contact}...`)}
                >
                  Family #{index + 1}
                </button>
              ))}
            </p>
            {nearestDoctors.length > 0 && (
              <div>
                <p>
                  <WarningIcon className={styles.icon} /> Nearest Doctors
                  Notified:
                </p>
                {nearestDoctors.map((doctor) => (
                  <p key={doctor._id}>
                    Dr. {doctor.firstName} {doctor.lastName} (
                    {doctor.specialization}) - {doctor.distance.toFixed(2)} km
                  </p>
                ))}
              </div>
            )}
            <div className={styles.bloodRequest}>
              <p>
                <BloodIcon className={styles.icon} /> Blood Required?
              </p>
              <button
                className={`${styles.actionButton} ${
                  bloodRequired ? styles.active : ""
                }`}
                onClick={toggleBloodRequest}
              >
                {bloodRequired ? "Yes (Request Sent)" : "No"}
              </button>
              {bloodRequired && (
                <p className={styles.bloodMessage}>
                  URGENT! Accident Victim Needs Blood. {user.bloodGroup}{" "}
                  Required at Nearest Hospital.
                </p>
              )}
            </div>
            <button
              className={styles.actionButton}
              onClick={() => setIsReporting(false)}
            >
              Close Emergency Actions
            </button>
          </div>
        )}

        <h2 className={styles.sectionTitle}>Report New Accident</h2>
        <form className={styles.accidentForm} onSubmit={handleReportAccident}>
          <div className={styles.locationField}>
            <div className={styles.inputIcon}>
              <LocationIcon />
            </div>
            <input
              type="text"
              placeholder="Pin accident location on map"
              value={pinnedLocationDetails.displayName || ""}
              onChange={(e) =>
                setPinnedLocationDetails({
                  ...pinnedLocationDetails,
                  displayName: e.target.value,
                })
              }
              className={styles.input}
              readOnly
            />
            <button
              className={styles.pinButton}
              onClick={() => setIsLocationPickerOpen(true)}
              type="button"
            >
              Pin Location
            </button>
          </div>

          {/* Show Latitude and Longitude immediately after pinning */}
          {pinnedLocationDetails.lat && pinnedLocationDetails.lng && (
            <>
              <div className={styles.inputField}>
                <div className={styles.inputIcon}>
                  <LocationIcon />
                </div>
                <input
                  type="text"
                  value={`Latitude: ${pinnedLocationDetails.lat}`}
                  className={styles.input}
                  readOnly
                />
              </div>
              <div className={styles.inputField}>
                <div className={styles.inputIcon}>
                  <LocationIcon />
                </div>
                <input
                  type="text"
                  value={`Longitude: ${pinnedLocationDetails.lng}`}
                  className={styles.input}
                  readOnly
                />
              </div>
            </>
          )}

          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <LocationIcon />
            </div>
            <PortalSelect
              options={[{ value: "Odisha", label: "Odisha" }]}
              value={newAccident.state}
              onChange={() => {}}
              placeholder="State"
              className={`${styles.input} react-select-container`}
              styles={selectStyles}
            />
          </div>

          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <LocationIcon />
            </div>
            <PortalSelect
              options={odishaDistricts}
              value={newAccident.district}
              onChange={(selected) => handleDistrictChange(selected)}
              placeholder="Select District"
              className={`${styles.input} react-select-container`}
              styles={selectStyles}
            />
          </div>
          {manualDistrictVisible && (
            <div className={styles.inputField}>
              <div className={styles.inputIcon}>
                <LocationIcon />
              </div>
              <input
                type="text"
                placeholder="Enter district manually"
                value={newAccident.manualDistrict}
                onChange={(e) =>
                  setNewAccident({
                    ...newAccident,
                    manualDistrict: e.target.value,
                    district: "Other",
                  })
                }
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <LocationIcon />
            </div>
            <PortalSelect
              options={districtCityOptions}
              value={newAccident.city}
              onChange={(selected) => handleCityChange(selected)}
              placeholder="Select City"
              className={`${styles.input} react-select-container`}
              styles={selectStyles}
            />
          </div>
          {manualCityVisible && (
            <div className={styles.inputField}>
              <div className={styles.inputIcon}>
                <LocationIcon />
              </div>
              <input
                type="text"
                placeholder="Enter city manually"
                value={newAccident.manualCity}
                onChange={(e) =>
                  setNewAccident({
                    ...newAccident,
                    manualCity: e.target.value,
                    city: "Other",
                  })
                }
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <WarningIcon />
            </div>
            <PortalSelect
              options={alertOptions}
              value={newAccident.alertType}
              onChange={(selected) =>
                setNewAccident({
                  ...newAccident,
                  alertType: selected ? selected.value : "Normal",
                })
              }
              placeholder="Select Alert Type"
              className={`${styles.input} react-select-container`}
              styles={selectStyles}
            />
          </div>

          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <WarningIcon />
            </div>
            <textarea
              value={newAccident.description}
              onChange={(e) =>
                setNewAccident({ ...newAccident, description: e.target.value })
              }
              placeholder="Describe the accident (optional)"
              className={styles.input}
              rows="3"
            />
          </div>
          <button type="submit" className={styles.actionButton}>
            Report Accident
          </button>
        </form>

        <h2 className={styles.sectionTitle}>Emergency Settings</h2>
        <button
          className={styles.actionButton}
          onClick={handleEmergencyAlertToggle}
        >
          <NotificationIcon className={styles.buttonIcon} />
          {isEmergencyAlertEnabled
            ? "Disable Emergency Alert for Yourself"
            : "Enable Emergency Alert for Yourself"}
        </button>

        {isLocationPickerOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.stylishModalContent}>
              <h3 className={styles.modalTitle}>Pin Accident Location</h3>
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
                <LocationPicker
                  onLocationSelect={handleLocationPin}
                  initialLocation={liveLocation}
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
      <ToastContainer />
    </div>
  );
};

export default AccidentAlert;