import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomeAnimation.css";

const WelcomeAnimation = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem("userName") || "User";
    const userRole = localStorage.getItem("userRole") || "user";

    useEffect(() => {

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
            <div className="welcome-text">
                Welcome, {userName.split(' ')[0]}
            </div>
        </div>
    );
};

export default WelcomeAnimation;
