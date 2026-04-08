import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomeAnimation.css";

const WelcomeAnimation = () => {
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = React.useState(false);
    const userName = localStorage.getItem("userName") || "User";
    const userRole = localStorage.getItem("userRole") || "user";

    useEffect(() => {
        const token = localStorage.getItem("token");
        const warning = localStorage.getItem("passwordExpiryWarning");
        if (warning === "true") {
            setShowWarning(true);
            localStorage.removeItem("passwordExpiryWarning");
        }

        if (!token) {
            navigate("/login", { replace: true });
            return undefined;
        }

        const timer = setTimeout(() => {
            navigate("/dashboard", { replace: true });
        }, 2800);

        return () => clearTimeout(timer);
    }, [navigate, userRole]);

    return (
        <div className="welcome-container">
            <div className="welcome-card">
                <div className="welcome-text">
                    Welcome, {userName}
                </div>
                {showWarning && (
                    <div className="expiry-warning-box">
                        <div className="warning-icon">⚠️</div>
                        <div className="warning-content">
                            <h3>Security Action Required</h3>
                            <p>Your password will expire soon.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeAnimation;
