import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

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
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate, userRole]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: 'var(--space-6)',
            background: 'var(--color-bg-base)',
            textAlign: 'center',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-8)',
                width: '100%',
                maxWidth: '600px'
            }}>
                <h1 style={{
                    fontSize: 'clamp(2rem, 8vw, 4rem)',
                    fontWeight: 'var(--font-bold)',
                    background: 'linear-gradient(to right, var(--color-accent), var(--color-accent-muted))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'welcomeFadeIn 1s ease-out'
                }}>
                    Welcome, {userName}
                </h1>
                
                {showWarning && (
                    <div className="badge badge-warning" style={{ 
                        padding: 'var(--space-4) var(--space-6)', 
                        borderRadius: 'var(--radius-xl)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-4)',
                        animation: 'welcomeSlideUp 0.6s ease-out'
                    }}>
                        <ShieldAlert size={24} />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-base)' }}>Security Action Required</div>
                            <div style={{ fontSize: 'var(--text-sm)', opacity: 0.8 }}>Your password will expire soon. Please update it in settings.</div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes welcomeFadeIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
                }
                @keyframes welcomeSlideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default WelcomeAnimation;
