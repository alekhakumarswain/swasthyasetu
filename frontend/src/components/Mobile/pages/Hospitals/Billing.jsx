import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DollarSign } from "lucide-react";
import styles from "./Hospital.module.css";

const sampleBills = [
  {
    id: 1,
    hospital: "Apollo Hospitals",
    date: "2025-02-15",
    amount: 1500,
    status: "Pending",
    service: "Cardiology Consultation",
  },
  {
    id: 2,
    hospital: "KIMS",
    date: "2025-01-10",
    amount: 500,
    status: "Paid",
    service: "Pediatric Checkup",
  },
];

const Billing = () => {
  const [bills] = useState(sampleBills);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const paymentOptions = [
    { value: "upi", label: "UPI" },
    { value: "card", label: "Credit/Debit Card" },
    { value: "netbanking", label: "Net Banking" },
    { value: "insurance", label: "Insurance" },
  ];

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
  };

  const handlePay = (billId) => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method!");
      return;
    }
    toast.success(`Payment of ₹${bills.find(b => b.id === billId).amount} completed via ${selectedPaymentMethod.label}!`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Billing & Payments</h1>
      </div>

      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>Your Bills</h2>
        <div className={styles.labsGrid}>
          {bills.map((bill) => (
            <div key={bill.id} className={styles.labCard}>
              <div className={styles.iconContainer}>
                <DollarSign className={styles.greenIcon} />
              </div>
              <h3 className={styles.labName}>{bill.hospital}</h3>
              <p className={styles.labDistance}>Date: {bill.date}</p>
              <p style={{ color: "#3498db", fontSize: "0.8rem", textAlign: "center" }}>
                Service: {bill.service}
              </p>
              <p style={{ fontSize: "0.8rem", textAlign: "center" }}>
                Amount: ₹{bill.amount}
              </p>
              <p style={{ fontSize: "0.8rem", textAlign: "center", color: bill.status === "Paid" ? "#27ae60" : "#e74c3c" }}>
                Status: {bill.status}
              </p>
              {bill.status === "Pending" && (
                <>
                  <Select
                    options={paymentOptions}
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                    placeholder="Select Payment Method"
                    styles={selectStyles}
                    className="mt-2"
                  />
                  <button
                    className="btn"
                    style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "8px", width: "100%", marginTop: "10px" }}
                    onClick={() => handlePay(bill.id)}
                  >
                    Pay Now
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Billing;