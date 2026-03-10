import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaMobileAlt, FaDesktop, FaTrash, FaCheckCircle, FaExclamationTriangle, FaClock } from "react-icons/fa";
import { apiUrl } from "../config/api";
import "./AdminDevices.css";

function AdminDevices() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDevices = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(apiUrl("/api/auth/admin/devices"), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDevices(res.data);
        } catch (err) {
            setError("Failed to fetch devices.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleRevoke = async (deviceId) => {
        if (!window.confirm("Are you sure you want to revoke this device? You will be logged out if this is your current device.")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(apiUrl(`/api/auth/admin/devices/${deviceId}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDevices(devices.filter(d => d.deviceId !== deviceId));
        } catch (err) {
            alert("Failed to revoke device.");
        }
    };

    if (loading) return <div className="devices-container">Loading...</div>;

    return (
        <div className="devices-container">
            <div className="devices-header">
                <h1>Device Security</h1>
                <p>Manage your trusted login devices (Max 3). Inactive devices are auto-revoked after 60 days.</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="device-grid">
                {devices.map((device) => (
                    <div key={device.deviceId} className={`device-card ${!device.trusted ? 'untrusted' : ''}`}>
                        <div className="device-icon">
                            {device.userAgent.toLowerCase().includes("mobile") ? <FaMobileAlt /> : <FaDesktop />}
                        </div>

                        <div className="device-info">
                            <h3>{device.deviceName}</h3>
                            <p className="device-id">ID: {device.deviceId.substring(0, 12)}...</p>

                            <div className="device-location">
                                <strong>{device.lastCity}, {device.lastCountry}</strong>
                            </div>

                            <div className="device-meta">
                                <span><FaClock /> Last Used: {new Date(device.lastUsedAt).toLocaleString()}</span>
                                <span>IP: {device.lastLoginIp}</span>
                            </div>

                            <div className="status-badge">
                                {device.trusted ? (
                                    <span className="trusted"><FaCheckCircle /> Trusted</span>
                                ) : (
                                    <span className="untrusted"><FaExclamationTriangle /> Awaiting Verification</span>
                                )}
                            </div>
                        </div>

                        <button
                            className="revoke-btn"
                            onClick={() => handleRevoke(device.deviceId)}
                            title="Revoke Device"
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}

                {devices.length === 0 && <p className="no-devices">No devices tracked yet.</p>}
            </div>
        </div>
    );
}

export default AdminDevices;
