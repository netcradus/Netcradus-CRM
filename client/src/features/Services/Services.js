import React from "react";
import { FaBriefcase } from "react-icons/fa";
import "./Services.css";

const Services = () => {
  const services = [
    {
      name: "Website Development",
      description: "Modern and responsive website development services.",
      price: "₹15,000",
      status: "Active",
    },
    {
      name: "SEO Optimization",
      description: "Improve your website ranking on search engines.",
      price: "₹8,000",
      status: "Active",
    },
    {
      name: "Social Media Marketing",
      description: "Boost your brand presence on social platforms.",
      price: "₹12,000",
      status: "Inactive",
    },
  ];

  return (
    <div className="services-container">
      <h2 className="services-title">
        <FaBriefcase /> Our Services
      </h2>

      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <h3 className="service-name">{service.name}</h3>
            <p className="service-description">{service.description}</p>

            <div className="service-details">
              <span className="service-price">{service.price}</span>
              <span
                className={`service-status ${
                  service.status === "Active" ? "active" : "inactive"
                }`}
              >
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