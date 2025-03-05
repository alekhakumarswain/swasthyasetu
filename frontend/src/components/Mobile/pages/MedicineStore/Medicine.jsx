import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Pill, Search, MapPin, FileText, Clock, CreditCard, Truck, CheckCircle, ChevronRight, Star, Droplet, TestTube, Stethoscope, HeartPulse } from "lucide-react";
import styles from "../BloodTest/BloodTest.module.css"; // Reuse BloodTest.module.css for consistency
import medicineStoreData from "../../../assets/Data/medicine_store_list.json"; // Import JSON data

// Leaflet icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PharmacyIcon = (size) => L.icon({
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

// Distance calculation function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get top-rated pharmacies based on proximity (and optionally a rating if added to JSON)
const getTopRatedPharmacies = (stores, userLoc) => {
  if (!userLoc || !stores.length) return [];
  return stores
    .map(store => ({
      ...store,
      distance: calculateDistance(userLoc[0], userLoc[1], store.Latitude, store.Longitude),
    }))
    .sort((a, b) => a.distance - b.distance) // Sort by distance (nearest first)
    .slice(0, 4);
};

// Component to handle map clicks
const MapClickHandler = ({ setPinLocation, setLatitude, setLongitude, setDeliveryAddress }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPinLocation([lat, lng]);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(response => response.json())
        .then(data => setDeliveryAddress(data.display_name || "Unknown location"))
        .catch(() => setDeliveryAddress("Unable to fetch address"));
    },
  });
  return null;
};

const Medicine = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedMedicine = location.state?.selectedMedicine || null;

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stores] = useState(medicineStoreData); // Use JSON data
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(preSelectedMedicine);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [pinLocation, setPinLocation] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Medicine categories
  const categories = [
    { value: "pain-relief", label: "Pain Relief", icon: <Pill size={20} /> },
    { value: "antibiotics", label: "Antibiotics", icon: <Pill size={20} /> },
    { value: "diabetes", label: "Diabetes", icon: <Pill size={20} /> },
    { value: "hypertension", label: "Hypertension", icon: <Pill size={20} /> },
    { value: "otc", label: "OTC Medicines", icon: <Pill size={20} /> },
  ];

  // Load medicines from JSON and get user location
  useEffect(() => {
    const allMedicines = stores.flatMap(store => store.Medicines);
    setMedicines(allMedicines);

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
  }, [stores]);

  // Add to cart with store information
  const addToCart = (medicine) => {
    const existing = cart.find(item => item.MedicineId === medicine.MedicineId);
    if (existing) {
      setCart(cart.map(item => item.MedicineId === medicine.MedicineId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      const store = stores.find(s => s.Medicines.some(m => m.MedicineId === medicine.MedicineId));
      setCart([...cart, { ...medicine, StoreId: store.StoreId, StoreName: store.StoreName, quantity: 1 }]);
    }
    toast.success(`${medicine.Name} added to cart!`);
  };

  // Remove from cart
  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item.MedicineId !== medicineId));
    toast.info("Item removed from cart!");
  };

  // Toggle generic alternative
  const toggleGeneric = (medicine) => {
    const generic = {
      ...medicine,
      Name: medicine.GenericAlternative.Name,
      Price: medicine.GenericAlternative.Price,
      isGeneric: true,
    };
    const existing = cart.find(item => item.MedicineId === medicine.MedicineId);
    if (existing) {
      removeFromCart(medicine.MedicineId);
      addToCart(generic);
      toast.info(`Switched to ${generic.Name} for ₹${generic.Price}`);
    } else {
      addToCart(generic);
    }
  };

  // Handle order confirmation
  const handleConfirmOrder = () => {
    if (!cart.length || !userName || !email || !deliveryAddress || !paymentMethod || !pinLocation) {
      toast.error("Please fill in all required fields, add medicines to cart, and select a delivery location!");
      return;
    }
    setOrderStatus("confirmed");
    toast.success("Order confirmed! Tracking will start soon.");
    setIsOrderPopupOpen(false);
    setTimeout(() => setOrderStatus("delivering"), 3000);
    setTimeout(() => setOrderStatus("delivered"), 6000);
  };

  // Payment methods
  const paymentOptions = [
    { value: "upi", label: "UPI" },
    { value: "credit", label: "Credit/Debit Card" },
    { value: "wallet", label: "Wallet" },
    { value: "cod", label: "Cash on Delivery" },
  ];

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da", boxShadow: "none" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
    option: base => ({ ...base, fontFamily: "Georgia, serif", color: "#2c3e50" }),
    singleValue: base => ({ ...base, color: "#2c3e50", fontFamily: "Georgia, serif" }),
  };

  return (
    <div className={styles.container}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className={styles.header}>
        <h1 className={styles.greeting}>Medicine Ordering</h1>
      </div>

      {/* Home Page 2x2 Grid */}
      <div className={styles.cardGrid}>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => setIsOrderPopupOpen(true)}>
          <div className={styles.iconContainer}>
            <Search className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Search Medicines</h3>
          <p className={styles.cardSubtitle}>Find medicines easily</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => navigate("/medicine-stores", { state: { stores, userLocation } })}>
          <div className={styles.iconContainer}>
            <MapPin className={styles.greenIcon} />
          </div>
          <h3 className={styles.cardTitle}>Nearby Pharmacies</h3>
          <p className={styles.cardSubtitle}>Locate pharmacies</p>
        </div>
        <div className={`${styles.card} ${styles.purpleCard}`} onClick={() => navigate("/medicine-history")}>
          <div className={styles.iconContainer}>
            <FileText className={styles.greenIcon} />
          </div>
          <h3 className={styles.cardTitle}>Order History</h3>
          <p className={styles.cardSubtitle}>View past orders</p>
        </div>
        <div className={`${styles.card} ${styles.greenCard}`} onClick={() => navigate("/track-order")}>
          <div className={styles.iconContainer}>
            <Clock className={styles.purpleIcon} />
          </div>
          <h3 className={styles.cardTitle}>Track Order</h3>
          <p className={styles.cardSubtitle}>Monitor delivery</p>
        </div>
      </div>

      {/* Top Rated Pharmacies */}
      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Top Rated Pharmacies</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigate("/medicine-stores", { state: { stores, userLocation } })}>
            See more <ChevronRight size={16} />
          </button>
        </div>
        <div className={styles.labsGrid}>
          {getTopRatedPharmacies(stores, userLocation).map((store, index) => (
            <div key={index} className={styles.labCard} onClick={() => navigate("/medicine-all", { state: { medicines: store.Medicines, storeName: store.StoreName } })}>
              <div className={styles.labAvatar}>
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt={store.StoreName} />
              </div>
              <h3 className={styles.labName}>{store.StoreName}</h3>
              <p className={styles.labDistance}>Distance: {store.distance.toFixed(2)} km</p>
              {/* Rating could be added to JSON for better sorting */}
              <div className={styles.ratingContainer}>
                <Star className={styles.starIcon} />
                <span className={styles.rating}>N/A</span> {/* Placeholder; add Rating to JSON if available */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Popup */}
      {isOrderPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
              <div className="modal-header" style={{ background: "linear-gradient(45deg, #27ae60, #2ecc71)", color: "#fff" }}>
                <h5 className="modal-title" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>Order Medicine</h5>
                <button type="button" className="btn-close" onClick={() => setIsOrderPopupOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: "20px" }}>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Choose Medicines</label>
                  <Select
                    options={medicines.map(m => ({ value: m.MedicineId, label: `${m.Name} @ ₹${m.Price} (${m.Offers})` }))}
                    value={cart.map(item => ({ value: item.MedicineId, label: `${item.Name} @ ₹${item.Price}` }))}
                    onChange={(selected) => {
                      setCart(selected.map(s => medicines.find(m => m.MedicineId === s.value)));
                    }}
                    placeholder="Select medicines..."
                    isMulti
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Name</label>
                  <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" style={{ borderRadius: "10px" }} />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Delivery Location</label>
                  <MapContainer
                    center={userLocation || [20.333, 85.821]}
                    zoom={15}
                    style={{ height: "200px", borderRadius: "10px", border: "2px solid #27ae60" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                    {userLocation && <Marker position={userLocation} icon={UserIcon} />}
                    {pinLocation && <Marker position={pinLocation} icon={PharmacyIcon([40, 40])} />}
                    <MapClickHandler setPinLocation={setPinLocation} setLatitude={setLatitude} setLongitude={setLongitude} setDeliveryAddress={setDeliveryAddress} />
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
                      placeholder="Delivery Address"
                      value={deliveryAddress}
                      readOnly
                      className="form-control"
                      style={{ borderRadius: "10px" }}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Payment Method</label>
                  <Select
                    options={paymentOptions}
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    placeholder="Choose payment method..."
                    styles={selectStyles}
                  />
                </div>
                {selectedMedicine && (
                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="generic"
                      checked={cart.some(item => item.MedicineId === selectedMedicine.MedicineId && item.isGeneric)}
                      onChange={() => toggleGeneric(selectedMedicine)}
                    />
                    <label className="form-check-label" htmlFor="generic" style={{ color: "#2c3e50" }}>
                      Use Generic Alternative
                    </label>
                  </div>
                )}
                {orderStatus === "delivering" && (
                  <div className="alert alert-info" role="alert">
                    <Truck className="me-2" size={20} /> Your order is being delivered. Track live below:
                    <div className="progress mt-2" style={{ height: "10px" }}>
                      <div className="progress-bar bg-success" style={{ width: "60%" }} role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
                        60%
                      </div>
                    </div>
                  </div>
                )}
                {orderStatus === "delivered" && (
                  <div className="alert alert-success" role="alert">
                    <CheckCircle className="me-2" size={20} /> Order delivered successfully!
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: "none" }}>
                <button
                  className="btn"
                  style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={handleConfirmOrder}
                  disabled={orderStatus === "delivering" || orderStatus === "delivered"}
                >
                  Confirm Order
                </button>
                <button
                  className="btn"
                  style={{ background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={() => setIsOrderPopupOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="navbar fixed-bottom navbar-light bg-light" style={{ boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1)", maxWidth: "480px", margin: "0 auto", width: "100%" }}>
        <div className="container-fluid justify-content-around">
          <a className="nav-link text-muted d-flex flex-column align-items-center" href="/blood-donate-receive">
            <Droplet size={24} />
            <span className="small">Donate</span>
          </a>
          <a className="nav-link text-muted d-flex flex-column align-items-center" href="/blood-test">
            <TestTube size={24} />
            <span className="small">Test</span>
          </a>
          <a className="nav-link text-purple d-flex flex-column align-items-center" href="/suusri" style={{ background: "#9b59b6", borderRadius: "50%", width: "50px", height: "50px", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff", margin: "-10px 0" }}>
            Suusri
          </a>
          <a className="nav-link text-muted d-flex flex-column align-items-center" href="/doctors">
            <Stethoscope size={24} />
            <span className="small">Doctor</span>
          </a>
          <a className="nav-link text-muted d-flex flex-column align-items-center" href="/medicine">
            <HeartPulse size={24} />
            <span className="small">Medicine</span>
          </a>
        </div>
      </nav>

      <ToastContainer />
    </div>
  );
};

export default Medicine;