import React, { useState, useEffect } from "react";
import styles from "./MedicineTimeTable.module.css";
import { Clock, Pill, Calendar, Bell, Droplet, BarChart2, AlertCircle, TestTube, Stethoscope, HeartPulse } from "lucide-react";

const MedicineTimeTable = () => {
  const [schedule, setSchedule] = useState([
    {
      id: 1,
      name: "Aspirin",
      timing: "Before Food",
      dosage: "3x/day",
      daysLeft: 5,
      times: ["08:00 AM", "12:00 PM", "09:00 PM"],
      prescribedDate: "2025-03-01",
      purchaseDate: "2025-03-02",
      pillImage: "https://via.placeholder.com/120?text=Aspirin",
      missedDoses: 1,
      compliance: 85,
      stock: 15,
    },
    {
      id: 2,
      name: "Metformin",
      timing: "After Food",
      dosage: "2x/day",
      daysLeft: 10,
      times: ["12:00 PM", "09:00 PM"],
      prescribedDate: "2025-02-28",
      purchaseDate: "2025-03-01",
      pillImage: "https://via.placeholder.com/120?text=Metformin",
      missedDoses: 0,
      compliance: 95,
      stock: 20,
    },
  ]);

  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleCardClick = (medicine) => {
    setSelectedMedicine(medicine);
  };

  const handleReorder = (medicine) => {
    alert(`Reordering ${medicine.name} from nearby pharmacy`);
    setSelectedMedicine(null);
  };

  const handleSnooze = (medicine) => {
    alert(`Snoozing ${medicine.name} reminder for 15 minutes`);
  };

  const handleWaterReminder = (medicine) => {
    alert(`Reminder: Drink water with ${medicine.name}`);
  };

  const handleViewReport = (medicine) => {
    alert(`Viewing compliance report for ${medicine.name}`);
  };

  const closePopup = () => {
    setSelectedMedicine(null);
  };

  const getMissedDoseSuggestion = (medicine) => {
    if (medicine.missedDoses > 0) {
      const nextTime = medicine.times.find((time) => {
        const [hours, minutes, period] = time.split(/[: ]/);
        let hour = parseInt(hours);
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        const doseTime = new Date();
        doseTime.setHours(hour, parseInt(minutes), 0, 0);
        return doseTime > currentTime;
      });
      return nextTime ? `Take next dose at ${nextTime}` : "Consult your doctor";
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Medicine Timetable</h1>
      </div>

      <div className={styles.labsSection}>
        <h2 className={styles.sectionTitle}>
          <Calendar size={20} /> Today’s Schedule
        </h2>
        <div className={styles.labsGrid}>
          {schedule.map((med) => (
            <div
              key={med.id}
              className={`${styles.labCard} ${med.missedDoses > 0 ? styles.missed : ""}`}
              onClick={() => handleCardClick(med)}
            >
              <div className={styles.iconContainer}>
                <Pill className={styles.purpleIcon} />
              </div>
              <h3 className={styles.labName}>{med.name}</h3>
              <span className={styles.timing}>{med.timing}</span>
              <p className={styles.schedule}>
                <Clock size={16} /> {med.times.join(" - ")}
              </p>
              <span className={styles.dosage}>{med.dosage}</span>
              <span className={styles.daysLeft}>
                {med.daysLeft} days left{" "}
                {med.stock < 10 && (
                  <span className={styles.lowStock}>Low Stock</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {selectedMedicine && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h3 className={styles.popupTitle}>{selectedMedicine.name}</h3>
            <img
              src={selectedMedicine.pillImage}
              alt={selectedMedicine.name}
              className={styles.pillImage}
            />
            <p className={styles.popupDetail}>
              <span>Prescribed</span> <span>{selectedMedicine.prescribedDate}</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Purchased</span> <span>{selectedMedicine.purchaseDate}</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Dosage</span> <span>{selectedMedicine.dosage}</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Timing</span> <span>{selectedMedicine.timing}</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Schedule</span> <span>{selectedMedicine.times.join(", ")}</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Stock</span> <span>{selectedMedicine.stock} pills left</span>
            </p>
            <p className={styles.popupDetail}>
              <span>Compliance</span> <span>{selectedMedicine.compliance}%</span>
            </p>
            {selectedMedicine.missedDoses > 0 && (
              <p className={styles.alert}>
                <AlertCircle size={16} /> Missed {selectedMedicine.missedDoses} dose(s).{" "}
                {getMissedDoseSuggestion(selectedMedicine)}
              </p>
            )}
            {selectedMedicine.compliance < 80 && (
              <p className={styles.alert}>
                <AlertCircle size={16} /> Low compliance detected. Consult your doctor.
              </p>
            )}
            <div className={styles.actionButtons}>
              <button
                className={styles.reorderButton}
                onClick={() => handleReorder(selectedMedicine)}
              >
                <Bell size={16} /> Reorder Now
              </button>
              <button
                className={styles.snoozeButton}
                onClick={() => handleSnooze(selectedMedicine)}
              >
                <Clock size={16} /> Snooze Reminder
              </button>
              <button
                className={styles.waterReminderButton}
                onClick={() => handleWaterReminder(selectedMedicine)}
              >
                <Droplet size={16} /> Water Reminder
              </button>
              <button
                className={styles.viewReportButton}
                onClick={() => handleViewReport(selectedMedicine)}
              >
                <BarChart2 size={16} /> View Report
              </button>
              <button className={styles.closeButton} onClick={closePopup}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className={styles.navbar}>
        <a className={`${styles.navLink} ${window.location.pathname === "/blood-test" ? styles.active : ""}`} href="/blood-test">
          <TestTube className={styles.navIcon} />
          Test
        </a>
        <button className={styles.suusriButton} onClick={() => alert("Suusri clicked!")}>
          Suusri
        </button>
        <a className={`${styles.navLink} ${window.location.pathname === "/doctors" ? styles.active : ""}`} href="/doctors">
          <Stethoscope className={styles.navIcon} />
          Doctor
        </a>
        <a className={`${styles.navLink} ${window.location.pathname === "/medicine" ? styles.active : ""}`} href="/medicine">
          <HeartPulse className={styles.navIcon} />
          Medicine
        </a>
      </nav>
    </div>
  );
};

export default MedicineTimeTable;