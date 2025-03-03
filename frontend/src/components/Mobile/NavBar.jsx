"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";
import {
  Droplet,
  TestTube,
  Bot,
  Stethoscope, // For Doctor (representing medical professionals)
  HeartPulse as MedicalServices,
} from "lucide-react";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which tab is active based on the current path, default to no selection (-1)
  const getActiveIndex = () => {
    const path = location.pathname;
    if (path.includes("/blood-donate-receive")) return 0; // Donate
    if (path.includes("/blood-test")) return 1; // Test
    if (path.includes("/suusri")) return 2; // SuuSri
    if (path.includes("/specialists") || path.includes("/doctors")) return 3; // Doctor
    if (path.includes("/medicine")) return 4; // Medicine
    return -1; // No tab selected by default (e.g., on home page or unmatched path)
  };

  const [selectedIndex, setSelectedIndex] = useState(getActiveIndex());

  const screens = [
    "/blood-donate-receive", // Donate screen
    "/blood-test", // Test screen
    "/suusri", // SuuSri (AI Chat Bot) screen
    "/specialists", // Doctor screen (redirecting to specialists or doctors)
    "/medicine", // Medicine screen
  ];

  const handleNavigation = (index) => {
    setSelectedIndex(index);
    navigate(screens[index]);
  };

  return (
    <div className={styles.navBarContainer}>
      <div className={styles.navBar}>
        <div
          className={`${styles.navItem} ${selectedIndex === 0 ? styles.selected : ""}`}
          onClick={() => handleNavigation(0)}
        >
          <Droplet className={styles.navIcon} />
          <span className={styles.navLabel}>Donate</span>
        </div>

        <div
          className={`${styles.navItem} ${selectedIndex === 1 ? styles.selected : ""}`}
          onClick={() => handleNavigation(1)}
        >
          <TestTube className={styles.navIcon} />
          <span className={styles.navLabel}>Test</span>
        </div>

        <div
          className={`${styles.navItem} ${selectedIndex === 2 ? styles.selected : ""}`}
          onClick={() => handleNavigation(2)}
        >
          <Bot className={styles.navIcon} />
          <span className={styles.navLabel}>SuuSri</span>
        </div>

        <div
          className={`${styles.navItem} ${selectedIndex === 3 ? styles.selected : ""}`}
          onClick={() => handleNavigation(3)}
        >
          <Stethoscope className={styles.navIcon} />
          <span className={styles.navLabel}>Doctor</span>
        </div>

        <div
          className={`${styles.navItem} ${selectedIndex === 4 ? styles.selected : ""}`}
          onClick={() => handleNavigation(4)}
        >
          <MedicalServices className={styles.navIcon} />
          <span className={styles.navLabel}>Medicine</span>
        </div>
      </div>
    </div>
  );
};

export default NavBar;