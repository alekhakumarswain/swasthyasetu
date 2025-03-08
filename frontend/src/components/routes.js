import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Accidents from './Doctorspecificscreen/Accidents';
import DrBloodDonation from './Doctorspecificscreen/BloodDonation';
import DrBloodrequests from './Doctorspecificscreen/DrBloodRequests';
import AccidentDetection from './Features/AccidentDetection';
import BloodDonation from './Features/BloodDonation';
import FetchDonors from "./Features/FetchDonors";
import FetchRequest from './Features/Fetchrequest';
import Doctorheader from './RegisterasDoctor/Doctorheader';
import DoctorLogin from './RegisterasDoctor/DoctorLogin';
import DoctorRegister from './RegisterasDoctor/DoctorRegister';
import Login from './RegisterasUser/Login';
import Register from './RegisterasUser/Register';
import Authpage from './Screens/Authpage';
import Dashboard from './Screens/Dashboard';
import Doctorpage from './Screens/Doctorpage';
import Header from './Screens/Header'; // Regular header for all pages except doctor
import LandingPage from './Screens/landingpage';
import PatientsData from './Patientdata/PatientsData';
import PatientProfile from './PatientProfile/PatientProfile';
import DoctorsData from './DoctorsData/DoctorsData';
import MedicineStore from './Map/MedicineStore';
import Home from './Mobile/Home';
import NavBar from './Mobile/NavBar';
import ChatBot from './Chat/Chatbot';
import Welcome from './Mobile/Welcome';
import Profile from './Mobile/pages/Profile/Profile';
import BloodDonateReceive from './Mobile/pages/BloodDonateReceive/BloodDonateReceive';
import AccidentAlert from './Mobile/pages/Accident/AccidentAlert';
import BloodTest from './Mobile/pages/BloodTest/BloodTest';
import AllLabs from './Mobile/pages/BloodTest/AllLabs';
import CheckReport from './Mobile/pages/BloodTest/CheckReport';
import DownloadReport from './Mobile/pages/BloodTest/DownloadReport';
import FollowUp from './Mobile/pages/BloodTest/FollowUp';
import NotFound from './Mobile/pages/Error/404';
import TrackOrder from './Mobile/pages/BloodTest/TrackOrder';
import Medicine from './Mobile/pages/MedicineStore/Medicine';
import { Navbar } from 'react-bootstrap';
import AllMedicineStore from './Mobile/pages/MedicineStore/AllMedicineStore';
import MedicineAll from './Mobile/pages/MedicineStore/MedicineAll';
import Doctors from './Mobile/pages/Doctors/Doctors';
import MedicalHistory from './Mobile/pages/EHRData/MedicineHistory';
import MedicineSchedule from './Mobile/pages/MedicineTimeTable/MedicineTimeTable';
import Nutrition from './Mobile/pages/DietChart/Nutrition';
import EHRHealthData from './Mobile/pages/EHRData/EHRHealthData';
import Ambulance from './Mobile/pages/Ambulance/Ambulance';
import Chat from './Chat/SuuSri/SuuSri';
import HospitalDashboard from './Mobile/pages/Hospitals/Hospital';
import MedicalRecords from './Mobile/pages/Hospitals/MedicalRecords';
import EmergencyServices from './Mobile/pages/Hospitals/EmergencyServices';
import Billing from './Mobile/pages/Hospitals/Billing';
import AllHospitals from './Mobile/pages/Hospitals/AllHospitals';
import AppointmentDetails from './Mobile/pages/Hospitals/AppointmentDetails';

function RoutesOfThePage() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Home and common header */}
                    <Route path='/Landingpage' element={<><Header /><LandingPage /></>} />
                    <Route path='/' element={<><Header /><Authpage /></>} />

                    {/* Auth routes */}
                    <Route path="/login-as-user" element={<><Header /><Login /></>} />
                    <Route path="/register-as-user" element={<><Header /><Register /></>} />
                    <Route path="/login-as-doctor" element={<><Header /><DoctorLogin /></>} />
                    <Route path="/register-as-doctor" element={<><Header /><DoctorRegister /></>} />

                    {/* User routes */}
                    <Route path="/dashboard" element={<><Header /><Dashboard /><ChatBot/></>} />
                    <Route path="/blood-donation" element={<><Header /><BloodDonation /><ChatBot/></>} />
                    <Route path="/blood-donation-check" element={<><Header /><FetchDonors /><ChatBot/></>} />

                    <Route path="/accident-detection" element={<><Header /><AccidentDetection /><ChatBot/></>} />
                    <Route path='/blood-request-check' element={<><Header /><FetchRequest /><ChatBot/></>} />

                    {/* MAP */}
                    <Route path="/map" element={<><Header /><MedicineStore /><ChatBot/></>} />

                    {/* Doctor page routes */}
                    <Route path='/blood-donations-dr-page' element={<><Doctorheader /><DrBloodDonation /></>} />
                    <Route path='/blood-requests-dr-page' element={<><Doctorheader /><DrBloodrequests /></>} />
                    <Route path='/accident-dr-page' element={<><Doctorheader /><Accidents /></>} />

                    {/* {Patient Data} */}
                    <Route path='/PatientsData' element={<><Header/><PatientsData/></>} />
                    <Route path='/Patient' element={<><Header/><PatientProfile patientId="67c35f1c8b405ef1defec414"/></>} />
                    {/* Doctor page with its specific header */}
                    <Route
                        path='/doctor-screen'
                        element={
                            <>
                                <Doctorheader /> {/* Render the DoctorHeader only for the doctor page */}
                                <div className="container mt-4">
                                    <Doctorpage />
                                </div>
                            </>
                        }
                    />

                    {/* {Patient Data} */}
                    <Route path='/DoctorsData' element={<><Doctorheader/><DoctorsData/></>} />
                    <Route path='/Doctor' element={<><Doctorheader/><PatientProfile patientId="67c35f1c8b405ef1defec414"/></>} />

                    {/* 404 page */}
                    <Route path='*' element={<NotFound/>} />

                    {/* Mobile Routes */}
                    <Route path='/Welcome' element={<><Welcome /></>} />
                    <Route path='/home' element={<><Home /><NavBar/><ChatBot/></>} />
                    <Route path='/profile' element={<><Profile/><NavBar/></>} />
                    <Route path='/blood-donate-receive' element={<><BloodDonateReceive/><NavBar/></>} />
                    <Route path='/accident-alert' element={<><AccidentAlert/><NavBar/></>} />
                    <Route path='/blood-test' element={<><BloodTest/><NavBar/></>} />
                    <Route path="/all-labs" element={<><AllLabs /><NavBar/></>} />
                    <Route path='/medicine' element={<><Medicine/><Navbar/></>} />
                    <Route path='/medicine-stores' element={<><AllMedicineStore/><NavBar/></>} />
                    <Route path='/medicine-all' element={<><MedicineAll/><NavBar/></>}/>
                    <Route path="/doctors" element={<Doctors />} />
                    <Route path="/medicine-history" element={<MedicalHistory />} />

                    <Route path="/check-report" element={<><CheckReport /><NavBar/></>} />
                    <Route path="/download-report" element={<><DownloadReport /><NavBar/></>} />
                    <Route path="/follow-up" element={<><FollowUp /><NavBar/></>} />
                    <Route path="/track-order" element={<><TrackOrder/></>} />
                    <Route path="/medicine-schedule" element={<><MedicineSchedule /><NavBar/></>} />
                    <Route path="/nutrition" element={<><Nutrition /><NavBar/></>} />
                    <Route path="/EHRHealthData" element={<><EHRHealthData patientId="67c35f1c8b405ef1defec414"/><NavBar/></>} />
                    <Route path='/ambulance' element={<><Ambulance/><NavBar/></>} />
                    <Route path='/suusri' element={<><Chat/><NavBar/></>}/>
                    <Route path='/hospitals' element={<><HospitalDashboard/><NavBar/></>} />
                    <Route path="/all-hospitals" element={<><AllHospitals/><NavBar/></>} />
                    <Route path="/medical-records" element={<><MedicalRecords /><NavBar/></>} />    
                    <Route path="/emergency-services" element={<><EmergencyServices/><NavBar/></>} />
                    <Route path="/billing" element={<><Billing/><NavBar/></>} />
                    <Route path="/appointment/:bookingId" element={<AppointmentDetails />} />

                </Routes>
            </div>
        </Router>
    );
}

export default RoutesOfThePage;