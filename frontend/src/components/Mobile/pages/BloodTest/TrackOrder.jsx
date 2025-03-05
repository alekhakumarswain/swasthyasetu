import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Clock, CheckCircle, Truck, FileText, Download } from "lucide-react";

const TrackOrder = () => {
  const [orderStatus, setOrderStatus] = useState("sample-collected"); // Simulated status, can be dynamic

  // Define tracking steps with their statuses
  const trackingSteps = [
    { step: "Order Placed", status: "completed", icon: <Clock size={24} /> },
    { step: "Lab Confirmed", status: "completed", icon: <CheckCircle size={24} /> },
    { step: "Sample Collected", status: "completed", icon: <Truck size={24} /> },
    { step: "Processing", status: orderStatus === "processing" || orderStatus === "report-ready" ? "completed" : "pending", icon: <FileText size={24} /> },
    { step: "Report Ready", status: orderStatus === "report-ready" ? "completed" : "pending", icon: <Download size={24} /> },
  ];

  // Calculate progress percentage based on completed steps
  const completedSteps = trackingSteps.filter(step => step.status === "completed").length;
  const progressPercentage = (completedSteps / trackingSteps.length) * 100;

  const handleDownloadReport = () => {
    if (orderStatus === "report-ready") {
      alert("Downloading report..."); // Replace with actual download logic
    } else {
      alert("Report is not ready yet!");
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "480px" }}>
      <h1 className="text-center mb-4">Track Your Order</h1>

      {/* Order Summary Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Order #12345</h5>
          <p className="card-text">
            <strong>Test:</strong> Complete Blood Count (CBC)<br />
            <strong>Lab:</strong> City Pathology Lab<br />
            <strong>Date:</strong> March 05, 2025<br />
            <strong>Time:</strong> 9:00 AM - 12:00 PM
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <h5>Progress</h5>
        <div className="progress" style={{ height: "20px" }}>
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{ width: `${progressPercentage}%` }}
            aria-valuenow={progressPercentage}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Order Status</h5>
          <ul className="list-group list-group-flush">
            {trackingSteps.map((step, index) => (
              <li
                key={index}
                className={`list-group-item d-flex align-items-center ${step.status === "completed" ? "text-success" : "text-muted"}`}
              >
                <div className="me-3">
                  {step.icon}
                </div>
                <div>
                  <strong>{step.step}</strong>
                  <p className="mb-0 small">
                    {step.status === "completed" ? "Completed" : "Pending"}
                    {step.status === "completed" && (
                      <span className="ms-2">• {new Date().toLocaleTimeString()}</span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      {orderStatus === "report-ready" && (
        <div className="mt-4 text-center">
          <button
            className="btn btn-primary w-100 mb-2"
            onClick={handleDownloadReport}
          >
            <Download className="me-2" size={20} />
            Download Report
          </button>
          <button className="btn btn-outline-secondary w-100">
            Contact Support
          </button>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;