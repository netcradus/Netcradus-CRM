import React from "react";
import "./DigitalMediaDashboard.css";
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";

function DigitalMediaDashboard() {
  return (
    <div className="digital-dashboard">
      <h1 className="dashboard-title">Digital Media Dashboard</h1>

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Followers</h3>
          <p>125,430</p>
        </div>

        <div className="stat-card">
          <h3>Total Engagement</h3>
          <p>78,210</p>
        </div>

        <div className="stat-card">
          <h3>Ad Spend</h3>
          <p>$12,450</p>
        </div>

        <div className="stat-card">
          <h3>Revenue Generated</h3>
          <p>$38,920</p>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="platform-grid">
        <div className="platform-card facebook">
          <FaFacebook size={30} />
          <h3>Facebook</h3>
          <p>Followers: 45,000</p>
          <p>Engagement: 12,340</p>
        </div>

        <div className="platform-card instagram">
          <FaInstagram size={30} />
          <h3>Instagram</h3>
          <p>Followers: 60,200</p>
          <p>Engagement: 34,120</p>
        </div>

        <div className="platform-card youtube">
          <FaYoutube size={30} />
          <h3>YouTube</h3>
          <p>Subscribers: 15,000</p>
          <p>Views: 120,000</p>
        </div>

        <div className="platform-card twitter">
          <FaTwitter size={30} />
          <h3>Twitter</h3>
          <p>Followers: 5,230</p>
          <p>Engagement: 2,450</p>
        </div>
      </div>

      {/* Recent Campaigns */}
     <div className="table-wrapper">
        <h2>Recent Campaigns</h2>
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Platform</th>
              <th>Budget</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Product Launch</td>
              <td>Facebook</td>
              <td>$5,000</td>
              <td className="completed">Completed</td>
            </tr>
            <tr>
              <td>Brand Awareness</td>
              <td>YouTube</td>
              <td>$4,500</td>
              <td className="pending">Pending</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DigitalMediaDashboard;