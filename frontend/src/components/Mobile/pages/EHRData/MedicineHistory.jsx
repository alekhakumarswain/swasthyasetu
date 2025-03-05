import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FileText, ChevronRight } from "lucide-react";
import styles from "../BloodTest/BloodTest.module.css";

// Simulated EHR data
const mockEHR = [
  { id: 1, date: "2025-03-01", doctor: "Dr. John Doe", summary: "Prescribed Paracetamol for fever.", prescription: "Paracetamol 500mg" },
  { id: 2, date: "2025-03-02", doctor: "Dr. Jane Smith", summary: "Recommended skin cream.", prescription: "Hydrocortisone" },
];

const MedicalHistory = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Medical History</h1>
      </div>
      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Consultations</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigate("/doctors")}>
            Back to Doctors <ChevronRight size={16} />
          </button>
        </div>
        <div className="list-group">
          {mockEHR.map(record => (
            <div key={record.id} className="list-group-item">
              <h5>{record.date} - {record.doctor}</h5>
              <p>{record.summary}</p>
              <p><strong>Prescription:</strong> {record.prescription}</p>
              <button
                className="btn btn-sm"
                style={{ background: "#27ae60", color: "#fff", borderRadius: "10px" }}
                onClick={() => navigate("/medicine", { state: { cart: [{ Name: record.prescription, Price: 50 }] } })}
              >
                Order Medicine
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;