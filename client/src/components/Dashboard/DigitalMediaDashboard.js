import React from "react";
import "./DigitalMediaDashboard.css";
import {
  Megaphone,
  BarChart3,
  DollarSign,
  Users,
  Globe,
  BadgeCheck,
} from "lucide-react";

function DigitalMediaDashboard() {
  return (
    <div className="nc-page digital-page">
      <div className="nc-hero">
        <div>
          <div className="nc-badge">
            <Megaphone size={14} />
            <span>Netcradus Digital Media</span>
          </div>
          <h1 className="nc-hero-title">
            Growth <span className="nc-gradient-text">Performance</span> Dashboard
          </h1>
          <p className="nc-hero-subtitle">
            Track social impact, spend efficiency, and campaign delivery in one premium control panel.
          </p>
        </div>

        <div className="nc-hero-actions">
          <span className="nc-pill">
            <BadgeCheck size={16} />
            Campaigns Healthy
          </span>
        </div>
      </div>

      {/* Stats Section */}
      <div className="nc-grid digital-metrics">
        <div className="nc-card">
          <div className="digital-metric-head">
            <div className="digital-metric-icon">
              <Users size={18} />
            </div>
            <div className="nc-card-title">Total Followers</div>
          </div>
          <div className="nc-card-value">125,430</div>
        </div>

        <div className="nc-card">
          <div className="digital-metric-head">
            <div className="digital-metric-icon">
              <BarChart3 size={18} />
            </div>
            <div className="nc-card-title">Total Engagement</div>
          </div>
          <div className="nc-card-value">78,210</div>
        </div>

        <div className="nc-card">
          <div className="digital-metric-head">
            <div className="digital-metric-icon">
              <DollarSign size={18} />
            </div>
            <div className="nc-card-title">Ad Spend</div>
          </div>
          <div className="nc-card-value">$12,450</div>
        </div>

        <div className="nc-card">
          <div className="digital-metric-head">
            <div className="digital-metric-icon">
              <Globe size={18} />
            </div>
            <div className="nc-card-title">Revenue Generated</div>
          </div>
          <div className="nc-card-value">$38,920</div>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="digital-platforms">
        <div className="digital-platform nc-card">
          <div className="digital-platform-title">Facebook</div>
          <div className="digital-platform-meta">Followers: 45,000</div>
          <div className="digital-platform-meta">Engagement: 12,340</div>
          <span className="nc-status nc-status--done">Completed</span>
        </div>

        <div className="digital-platform nc-card">
          <div className="digital-platform-title">Instagram</div>
          <div className="digital-platform-meta">Followers: 60,200</div>
          <div className="digital-platform-meta">Engagement: 34,120</div>
          <span className="nc-status nc-status--ok">Active</span>
        </div>

        <div className="digital-platform nc-card">
          <div className="digital-platform-title">YouTube</div>
          <div className="digital-platform-meta">Subscribers: 15,000</div>
          <div className="digital-platform-meta">Views: 120,000</div>
          <span className="nc-status nc-status--pending">Pending</span>
        </div>

        <div className="digital-platform nc-card">
          <div className="digital-platform-title">Twitter</div>
          <div className="digital-platform-meta">Followers: 5,230</div>
          <div className="digital-platform-meta">Engagement: 2,450</div>
          <span className="nc-status nc-status--ok">Active</span>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="nc-panel nc-section">
        <div className="digital-table-head">
          <h2 className="digital-table-title">Recent Campaigns</h2>
          <button className="nc-btn nc-btn--primary">
            <Megaphone size={16} />
            New Campaign
          </button>
        </div>

        <div className="nc-table-wrap">
          <table className="nc-table">
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
              <td><span className="nc-status nc-status--done">Completed</span></td>
            </tr>
            <tr>
              <td>Brand Awareness</td>
              <td>YouTube</td>
              <td>$4,500</td>
              <td><span className="nc-status nc-status--pending">Pending</span></td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export default DigitalMediaDashboard;