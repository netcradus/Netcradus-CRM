import React from "react";
import "./Services.css";

const Services = () => {
  const services = [
  
  ];

  return (
    <div className="services-container">
      <h2 className="services-title">Our Services</h2>
      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <h3 className="service-name">{service.name}</h3>
            <p className="service-description">{service.description}</p>
            <div className="service-details">
              <span className="service-price">{service.price}</span>
              <span className={`service-status ${service.status === "Active" ? "active" : "inactive"}`}>
                {service.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="add-service-btn">+ Add New Service</button>
    </div>
  );
};

export default Services;
