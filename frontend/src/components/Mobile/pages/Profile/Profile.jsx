import { useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";
import userIcon from "../../../assets/user1.png"; // Assuming the same user icon is used
import {
  User as PersonIcon,
  Mail as EmailIcon,
  Phone as PhoneIcon,
  MapPin,
  Lock as LockIcon,
  Bell as NotificationIcon,
  ShieldCheck as PrivacyIcon,
  Globe as LanguageIcon,
  Calendar as CalendarIcon,
  FileText as MedicalRecordIcon,
  HeartPulse as HealthIcon,
  Pill,
  Droplet as BloodIcon,
  Ambulance as AmbulanceIcon,
  PhoneCall as EmergencyIcon,
  Clock as AppointmentIcon,
  Video as VideoIcon,
  Package as DeliveryIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  Stethoscope, // Added Stethoscope icon
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();

  const handleEdit = (field) => {
    console.log(`Editing ${field}`);
    navigate(`/edit-${field.toLowerCase()}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Profile</h1>
        <div className={styles.avatar}>
          <img src={userIcon} alt="User Profile" />
        </div>
      </div>

      <div className={styles.content}>
        {/* Personal Information */}
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <div className={styles.infoGrid}>
          <ProfileInfoCard
            icon={<PersonIcon />}
            title="Full Name"
            subtitle="Raja"
            onEdit={() => handleEdit("Name")}
          />
          <ProfileInfoCard
            icon={<CalendarIcon />}
            title="Date of Birth & Gender"
            subtitle="Jan 15, 1990 | Male"
            onEdit={() => handleEdit("DateOfBirthGender")}
          />
          <ProfileInfoCard
            icon={<BloodIcon />}
            title="Blood Group & Rh Factor"
            subtitle="O+"
            onEdit={() => handleEdit("BloodGroup")}
          />
          <ProfileInfoCard
            icon={<PhoneIcon />}
            title="Phone Number"
            subtitle="+1 123 456 7890"
            onEdit={() => handleEdit("Phone")}
          />
          <ProfileInfoCard
            icon={<EmailIcon />}
            title="Email"
            subtitle="raja@example.com"
            onEdit={() => handleEdit("Email")}
          />
          <ProfileInfoCard
            icon={<MapPin />}
            title="Address"
            subtitle="123 Street, City, Country (Current & Permanent)"
            onEdit={() => handleEdit("Address")}
          />
        </div>

        {/* Account Settings */}
        <h2 className={styles.sectionTitle}>Account Settings</h2>
        <div className={styles.settingsGrid}>
          <SettingsCard
            icon={<LockIcon />}
            iconColor="#E74C3C" // Red
            backgroundColor="#F1948A"
            title="Change Password"
            onClick={() => navigate("/change-password")}
          />
          <SettingsCard
            icon={<NotificationIcon />}
            iconColor="#3498DB" // Blue
            backgroundColor="#85C1E9"
            title="Notification Preferences"
            onClick={() => navigate("/notification-preferences")}
          />
          <SettingsCard
            icon={<PrivacyIcon />}
            iconColor="#27AE60" // Green
            backgroundColor="#A9DFBF"
            title="Privacy Settings"
            onClick={() => navigate("/privacy-settings")}
          />
          <SettingsCard
            icon={<LanguageIcon />}
            iconColor="#F39C12" // Orange
            backgroundColor="#F8C471"
            title="Language Preferences"
            onClick={() => navigate("/language-preferences")}
          />
        </div>

        {/* Health & Medical Records */}
        <h2 className={styles.sectionTitle}>Health & Medical Records</h2>
        <div className={styles.settingsGrid}>
          <SettingsCard
            icon={<HealthIcon />}
            iconColor="#8E44AD" // Purple
            backgroundColor="#9B59B6"
            title="Digital Health ID (ABHA)"
            onClick={() => handleEdit("DigitalHealthID")}
          />
          <SettingsCard
            icon={<MedicalRecordIcon />}
            iconColor="#2ECC71" // Green
            backgroundColor="#27AE60"
            title="Medical History & Conditions"
            onClick={() => navigate("/medical-history")}
          />
          <SettingsCard
            icon={<Pill />}
            iconColor="#E67E22" // Orange
            backgroundColor="#D35400"
            title="Ongoing Medications & Allergies"
            onClick={() => navigate("/medications-allergies")}
          />
          <SettingsCard
            icon={<MedicalRecordIcon />}
            iconColor="#3498DB" // Blue
            backgroundColor="#2980B9"
            title="Previous Lab Test Reports"
            onClick={() => navigate("/lab-reports")}
          />
          <SettingsCard
            icon={<Stethoscope />} // Updated to use the imported Stethoscope icon
            iconColor="#C0392B" // Red
            backgroundColor="#E74C3C"
            title="Doctor Consultations History"
            onClick={() => navigate("/consultations-history")}
          />
        </div>

        {/* Emergency Settings */}
        <h2 className={styles.sectionTitle}>Emergency Settings</h2>
        <div className={styles.settingsGrid}>
          <SettingsCard
            icon={<EmergencyIcon />}
            iconColor="#D35400" // Orange
            backgroundColor="#E67E22"
            title="Emergency Contact Details"
            onClick={() => navigate("/emergency-contacts")}
          />
          <SettingsCard
            icon={<AmbulanceIcon />}
            iconColor="#2980B9" // Blue
            backgroundColor="#3498DB"
            title="Quick Access to SOS Button"
            onClick={() => navigate("/sos-button")}
          />
          <SettingsCard
            icon={<AmbulanceIcon />}
            iconColor="#16A085" // Turquoise
            backgroundColor="#1ABC9C"
            title="Ambulance & First Responder Preferences"
            onClick={() => navigate("/ambulance-preferences")}
          />
        </div>

        {/* Blood Donation & Requests */}
        <h2 className={styles.sectionTitle}>Blood Donation & Requests</h2>
        <div className={styles.settingsGrid}>
          <SettingsCard
            icon={<AppointmentIcon />}
            iconColor="#9B59B6" // Purple
            backgroundColor="#8E44AD"
            title="Last Blood Donation Date"
            onClick={() => navigate("/last-donation-date")}
          />
          <SettingsCard
            icon={<BloodIcon />}
            iconColor="#27AE60" // Green
            backgroundColor="#2ECC71"
            title="Blood Donor Status"
            onClick={() => navigate("/donor-status")}
          />
          <SettingsCard
            icon={<BloodIcon />}
            iconColor="#E74C3C" // Red
            backgroundColor="#C0392B"
            title="Urgent Blood Request History"
            onClick={() => navigate("/blood-request-history")}
          />
        </div>

        {/* Appointments & Consultations */}
        <h2 className={styles.sectionTitle}>Appointments & Consultations</h2>
        <div className={styles.settingsGrid}>
          <SettingsCard
            icon={<AppointmentIcon />}
            iconColor="#F1C40F" // Yellow
            backgroundColor="#F39C12"
            title="Upcoming & Past Appointments"
            onClick={() => navigate("/appointments")}
          />
          <SettingsCard
            icon={<VideoIcon />}
            iconColor="#3498DB" // Blue
            backgroundColor="#2980B9"
            title="Chat & Video Consultation History"
            onClick={() => navigate("/consultation-history")}
          />
          <SettingsCard
            icon={<MedicalRecordIcon />}
            iconColor="#27AE60" // Green
            backgroundColor="#2ECC71"
            title="Prescription & Treatment Plans"
            onClick={() => navigate("/prescriptions-treatment")}
          />
        </div>

        {/* Medicine & Pharmacy */}
        <h2 className={styles.sectionTitle}>Medicine & Pharmacy</h2>
        <div className={styles.settingsGrid}>
          <SettingsCard
            icon={<DeliveryIcon />}
            iconColor="#E67E22" // Orange
            backgroundColor="#D35400"
            title="Medicine Orders & Delivery Status"
            onClick={() => navigate("/medicine-orders")}
          />
          <SettingsCard
            icon={<MedicalRecordIcon />}
            iconColor="#C0392B" // Red
            backgroundColor="#E74C3C"
            title="Digital Prescriptions"
            onClick={() => navigate("/digital-prescriptions")}
          />
          <SettingsCard
            icon={<Pill />}
            iconColor="#16A085" // Turquoise
            backgroundColor="#1ABC9C"
            title="Subscription for Regular Medicine"
            onClick={() => navigate("/medicine-subscription")}
          />
        </div>

        {/* Additional Feature (Suggested by Grok) */}
        <h2 className={styles.sectionTitle}>Preferences & Feedback</h2>
        <div className={styles.settingsGrid}>
          <SettingsCard
            icon={<StarIcon />}
            iconColor="#F1C40F" // Yellow
            backgroundColor="#F39C12"
            title="Provide Feedback"
            onClick={() => navigate("/feedback")}
          />
          <SettingsCard
            icon={<SettingsIcon />}
            iconColor="#9B59B6" // Purple
            backgroundColor="#8E44AD"
            title="App Preferences"
            onClick={() => navigate("/app-preferences")}
          />
        </div>
      </div>
    </div>
  );
};

const ProfileInfoCard = ({ icon, title, subtitle, onEdit }) => {
  return (
    <div className={styles.infoCard}>
      <div className={styles.iconContainer}>{icon}</div>
      <div className={styles.infoContent}>
        <h3 className={styles.infoTitle}>{title}</h3>
        <p className={styles.infoSubtitle}>{subtitle}</p>
      </div>
      <button className={styles.editButton} onClick={onEdit}>
        Edit
      </button>
    </div>
  );
};

const SettingsCard = ({ icon, iconColor, backgroundColor, title, onClick }) => {
  return (
    <div
      className={styles.settingsCard}
      style={{ backgroundColor }}
      onClick={onClick}
    >
      <div className={styles.settingsIconContainer}>
        <span className={styles.settingsIcon} style={{ color: iconColor }}>
          {icon}
        </span>
      </div>
      <h3 className={styles.settingsTitle}>{title}</h3>
    </div>
  );
};

export default Profile;