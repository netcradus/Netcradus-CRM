import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomeAnimation.css";

const WelcomeAnimation = () => {
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = React.useState(false);
    const userName = localStorage.getItem("name") || "User";
    const userRole = localStorage.getItem("userRole") || "user";

    useEffect(() => {
        const warning = localStorage.getItem("passwordExpiryWarning");
        if (warning === "true") {
            setShowWarning(true);
            localStorage.removeItem("passwordExpiryWarning");
        }

        const timer = setTimeout(() => {
            if (userRole === "admin") navigate("/admin-dashboard");
            else if (userRole === "support") navigate("/support-dashboard");
            else if (userRole === "sales") navigate("/sales-dashboard");
            else if (userRole === "it") navigate("/tech-dashboard");
            else if (userRole === "hr") navigate("/hr-dashboard");
            else if (userRole === "digital-media") navigate("/digital-media-dashboard");
            else navigate("/dashboard");
        }, 2800);

        return () => clearTimeout(timer);
    }, [navigate, userRole]);

    return (
        <div className="welcome-container">
            <div className="welcome-card">
                <div className="welcome-text">
                    Welcome, {userName.split(' ')[0]}
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
