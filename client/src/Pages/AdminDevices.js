import React, { useState, useEffect } from "react";
import axios from "axios";
import { Monitor, Smartphone, Trash2, ShieldCheck, ShieldAlert, Clock, MapPin, Globe } from "lucide-react";
import { apiUrl } from "../config/api";

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

    if (loading) return <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}><div className="skeleton" style={{ height: '200px' }}></div></div>;

    return (
        <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="title">Device Security</h1>
                    <p className="subtitle">Manage your trusted login devices (Max 3). Inactive devices are auto-revoked after 60 days.</p>
                </div>
            </div>

            {error && <div className="badge badge-error" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-3) var(--space-4)', width: '100%' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
                {devices.map((device) => (
                    <div key={device.deviceId} className="nc-card" style={{ position: 'relative', display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                        <div style={{ 
                            background: 'var(--color-bg-elevated)', 
                            padding: 'var(--space-3)', 
                            borderRadius: 'var(--radius-lg)',
                            color: 'var(--color-accent)'
                        }}>
                            {device.userAgent.toLowerCase().includes("mobile") ? <Smartphone size={24} /> : <Monitor size={24} />}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)' }}>{device.deviceName}</h3>
                                <button
                                    className="btn btn-ghost"
                                    style={{ color: 'var(--color-error)', padding: 'var(--space-1)' }}
                                    onClick={() => handleRevoke(device.deviceId)}
                                    title="Revoke Device"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                                ID: {device.deviceId.substring(0, 16)}...
                            </p>

                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: 'var(--space-2)', 
                                fontSize: 'var(--text-xs)', 
                                background: 'var(--color-bg-base)', 
                                padding: '4px 10px', 
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-4)',
                                border: '1px solid var(--color-border)'
                            }}>
                                <MapPin size={12} color="var(--color-accent)" />
                                <span>{device.lastCity}, {device.lastCountry}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                    <Clock size={12} />
                                    <span>Last Used: {new Date(device.lastUsedAt).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                    <Globe size={12} />
                                    <span>IP Address: {device.lastLoginIp}</span>
                                </div>
                            </div>

                            <div className={`badge badge-${device.trusted ? 'success' : 'warning'}`}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    {device.trusted ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                    <span>{device.trusted ? 'Trusted Device' : 'Verification Required'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {devices.length === 0 && (
                    <div className="nc-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
                        No devices tracked yet.
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDevices;
