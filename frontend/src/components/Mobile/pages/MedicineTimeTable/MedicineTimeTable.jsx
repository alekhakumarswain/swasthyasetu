import React, { useState } from "react";
import styles from "./MedicineTimeTable.module.css";
import { Clock, Pill } from "lucide-react";

const MedicineSchedule = () => {
  const [schedule, setSchedule] = useState([
    { id: 1, name: "Aspirin", time: "08:00", frequency: "Daily" },
    { id: 2, name: "Metformin", time: "12:00", frequency: "Daily" },
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Medicine Schedule</h1>
      </div>
      
      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>Your Medication Schedule</h2>
        <div className={styles.labsGrid}>
          {schedule.map((med) => (
            <div key={med.id} className={styles.labCard}>
              <div className={styles.iconContainer}>
                <Pill className={styles.purpleIcon} />
              </div>
              <h3 className={styles.labName}>{med.name}</h3>
              <p className={styles.labDistance}>
                <Clock size={16} /> {med.time} - {med.frequency}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MedicineSchedule;