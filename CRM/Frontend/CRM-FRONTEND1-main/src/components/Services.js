import React from "react";
import "./Services.css";

const Services = () => {
  const services = [
    { name: "Consulting", description: "Professional advice services", price: "₹2000/hour", status: "Active" },
    { name: "Web Development", description: "Full-stack website solutions", price: "₹50000/project", status: "Active" },
    { name: "SEO Optimization", description: "Boost your online presence", price: "₹10000/month", status: "Inactive" },
    { name: "Graphic Design", description: "Branding, UI/UX & marketing visuals", price: "₹1500/hour", status: "Active" },
    { name: "Cloud Deployment", description: "AWS, Azure, and GCP services", price: "₹25000/project", status: "Active" },
    { name: "Mobile App Development", description: "Android/iOS app creation", price: "₹70000/project", status: "Inactive" },
    { name: "Training & Workshops", description: "Tech & non-tech training modules", price: "₹3000/session", status: "Active" },
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
