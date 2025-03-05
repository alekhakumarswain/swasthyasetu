import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Pill, ChevronRight, Star, Truck, CheckCircle } from "lucide-react";
import styles from "../BloodTest/BloodTest.module.css"; // Reuse BloodTest.module.css for consistency

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

// Map click handler for delivery location
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

const MedicineAll = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { medicines: initialMedicines = [], storeName = "All Stores" } = location.state || {};

  // State management
  const [medicines, setMedicines] = useState(initialMedicines);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [userLocation, setUserLocation] = useState(null);
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

  // Payment methods
  const paymentOptions = [
    { value: "upi", label: "UPI" },
    { value: "credit", label: "Credit/Debit Card" },
    { value: "wallet", label: "Wallet" },
    { value: "cod", label: "Cash on Delivery" },
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

  // Filter medicines based on search query and category
  const filteredMedicines = medicines
    .filter(medicine => 
      medicine.Name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedCategory || medicine.Category === selectedCategory.value)
    )
    .sort((a, b) => a.Name.localeCompare(b.Name));

  // Add to cart
  const addToCart = (medicine) => {
    const existing = cart.find(item => item.MedicineId === medicine.MedicineId);
    if (existing) {
      setCart(cart.map(item => 
        item.MedicineId === medicine.MedicineId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: 1, StoreName: storeName }]);
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
        <h1 className={styles.greeting}>Medicines at {storeName}</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-4">
        <div className="row">
          <div className="col-md-6 mb-2">
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ borderRadius: "10px", padding: "10px" }}
            />
          </div>
          <div className="col-md-6 mb-2">
            <Select
              options={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Filter by category..."
              styles={selectStyles}
              isClearable
            />
          </div>
        </div>
      </div>

      {/* Medicines List */}
      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Available Medicines</h2>
          <button
            className={styles.seeMoreBtn}
            onClick={() => navigate("/medicine-stores")}
          >
            Back to Pharmacies <ChevronRight size={16} />
          </button>
        </div>
        <div className={styles.labsGrid}>
          {filteredMedicines.length > 0 ? (
            filteredMedicines.map((medicine, index) => (
              <div key={index} className={styles.labCard}>
                <div className={styles.labAvatar}>
                  <Pill size={24} />
                </div>
                <h3 className={styles.labName}>{medicine.Name}</h3>
                <p className={styles.labDistance}>Price: ₹{medicine.Price}</p>
                <p style={{ fontSize: "0.9rem", color: "#2c3e50" }}>
                  Dosage: {medicine.Dosage}
                </p>
                <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>
                  {medicine.Offers}
                </p>
                <div className="d-flex justify-content-between mt-2">
                  <button
                    className="btn btn-sm"
                    style={{ background: "#27ae60", color: "#fff", borderRadius: "10px" }}
                    onClick={() => addToCart(medicine)}
                  >
                    Add to Cart
                  </button>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={`generic-${medicine.MedicineId}`}
                      checked={cart.some(item => item.MedicineId === medicine.MedicineId && item.isGeneric)}
                      onChange={() => toggleGeneric(medicine)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`generic-${medicine.MedicineId}`}
                      style={{ color: "#2c3e50", fontSize: "0.8rem" }}
                    >
                      Generic
                    </label>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No medicines found matching your criteria.</p>
          )}
        </div>
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className={styles.labsSection}>
          <h2 className={styles.sectionTitle}>Cart</h2>
          <div className="list-group">
            {cart.map((item, index) => (
              <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>{item.Name}</strong> (x{item.quantity}) - ₹{item.Price * item.quantity}
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => removeFromCart(item.MedicineId)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn mt-3"
            style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
            onClick={() => setIsOrderPopupOpen(true)}
          >
            Proceed to Order
          </button>
        </div>
      )}

      {/* Order Confirmation Popup */}
      {isOrderPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
              <div className="modal-header" style={{ background: "linear-gradient(45deg, #27ae60, #2ecc71)", color: "#fff" }}>
                <h5 className="modal-title" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>
                  Confirm Order at {storeName}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsOrderPopupOpen(false)}></button>
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
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Delivery Location</label>
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
                    {pinLocation && <Marker position={pinLocation} icon={PharmacyIcon([40, 40])} />}
                    <MapClickHandler
                      setPinLocation={setPinLocation}
                      setLatitude={setLatitude}
                      setLongitude={setLongitude}
                      setDeliveryAddress={setDeliveryAddress}
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

      <ToastContainer />
    </div>
  );
};

export default MedicineAll;