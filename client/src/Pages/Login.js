import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  KeyRound,
  SunMedium,
  MoonStar,
  ArrowLeft,
  Sparkles,
  Stars,
} from "lucide-react";
import { apiUrl } from "../config/api";
import "./Login.css";

/* ══════════════════════════════════════════════════════════════
   LUXURY DAY BACKGROUND
   ══════════════════════════════════════════════════════════════ */
function DayBackground() {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className="lp-scene-svg"
    >
      <defs>
        <linearGradient id="v2DaySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#69cfff" />
          <stop offset="28%" stopColor="#9de2ff" />
          <stop offset="58%" stopColor="#ffd7b8" />
          <stop offset="82%" stopColor="#ffb8a6" />
          <stop offset="100%" stopColor="#ff9d97" />
        </linearGradient>

        <radialGradient id="v2DaySunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8d6" stopOpacity="1" />
          <stop offset="45%" stopColor="#ffe38b" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#ffd54f" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="v2DayHaze" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff1d6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff1d6" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="v2Cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#d9f0ff" stopOpacity="0.78" />
        </linearGradient>

        <linearGradient id="v2MountainFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8cb7ff" />
          <stop offset="100%" stopColor="#4c72d4" />
        </linearGradient>

        <linearGradient id="v2MountainMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ce3bb" />
          <stop offset="100%" stopColor="#259f75" />
        </linearGradient>

        <linearGradient id="v2Forest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34c97b" />
          <stop offset="100%" stopColor="#114f33" />
        </linearGradient>

        <linearGradient id="v2Lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bbf3ff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1488b7" stopOpacity="0.66" />
        </linearGradient>

        <filter id="v2Blur8">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="v2Blur18">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="v2Blur30">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>

      <rect width="1440" height="900" fill="url(#v2DaySky)" />

      {/* ambient light */}
      <ellipse
        cx="1080"
        cy="180"
        rx="420"
        ry="170"
        fill="#fff3cf"
        opacity="0.2"
        filter="url(#v2Blur30)"
      />
      <ellipse
        cx="340"
        cy="700"
        rx="420"
        ry="125"
        fill="#ffd6bc"
        opacity="0.16"
        filter="url(#v2Blur30)"
      />
      <ellipse
        cx="760"
        cy="640"
        rx="760"
        ry="180"
        fill="url(#v2DayHaze)"
        opacity="0.22"
        filter="url(#v2Blur18)"
      />

      {/* sun */}
      <circle cx="248" cy="140" r="190" fill="url(#v2DaySunGlow)" filter="url(#v2Blur18)">
        <animate attributeName="opacity" values="0.88;1;0.88" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle cx="248" cy="140" r="58" fill="#fff8df" />
      <circle cx="248" cy="140" r="44" fill="#fffdf5" />

      {/* dreamy clouds */}
      <g className="lp-cloud lp-cloud-a">
        <ellipse cx="710" cy="160" rx="235" ry="66" fill="url(#v2Cloud)" />
        <ellipse cx="625" cy="140" rx="118" ry="74" fill="url(#v2Cloud)" />
        <ellipse cx="716" cy="130" rx="130" ry="78" fill="url(#v2Cloud)" />
        <ellipse cx="806" cy="148" rx="114" ry="66" fill="url(#v2Cloud)" />
        <ellipse cx="710" cy="192" rx="200" ry="28" fill="#d7edff" opacity="0.45" />
      </g>

      <g className="lp-cloud lp-cloud-b" opacity="0.92">
        <ellipse cx="1118" cy="108" rx="175" ry="48" fill="url(#v2Cloud)" />
        <ellipse cx="1058" cy="92" rx="82" ry="56" fill="url(#v2Cloud)" />
        <ellipse cx="1122" cy="84" rx="94" ry="60" fill="url(#v2Cloud)" />
        <ellipse cx="1192" cy="97" rx="76" ry="48" fill="url(#v2Cloud)" />
        <ellipse cx="1118" cy="130" rx="150" ry="22" fill="#d7edff" opacity="0.34" />
      </g>

      {/* birds */}
      {[["420 230"], ["450 212"], ["478 233"], ["874 180"], ["900 164"], ["928 183"]].map(
        ([p], i) => {
          const [x, y] = p.split(" ").map(Number);
          return (
            <path
              key={i}
              d={`M${x - 11},${y} Q${x},${y - 8} ${x + 11},${y}`}
              fill="none"
              stroke="#334155"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.68"
            />
          );
        }
      )}

      {/* mountains */}
      <path
        d="M0,618 L0,900 L1440,900 L1440,618 L1366,448 L1248,534 L1126,388 L1002,514 L862,332 L734,480 L608,316 L480,468 L332,342 L176,500 L0,362 Z"
        fill="url(#v2MountainFar)"
        opacity="0.66"
      />

      <path
        d="M0,702 L0,900 L1440,900 L1440,702 L1366,634 L1246,676 L1114,616 L986,680 L854,620 L722,684 L586,624 L452,688 L314,628 L166,692 L0,646 Z"
        fill="url(#v2MountainMid)"
        opacity="0.88"
      />

      {/* lake */}
      <ellipse cx="754" cy="765" rx="334" ry="54" fill="url(#v2Lake)" opacity="0.82" />
      <ellipse cx="754" cy="785" rx="282" ry="18" fill="#ffffff" opacity="0.1" />
      {[620, 684, 748, 812, 878].map((x, i) => (
        <line
          key={i}
          x1={x}
          y1={757 + i * 3}
          x2={x + 32}
          y2={757 + i * 3}
          stroke="white"
          strokeWidth="1.2"
          opacity="0.36"
          strokeLinecap="round"
        />
      ))}

      {/* foreground forest */}
      <path
        d="M0,792 L0,900 L1440,900 L1440,792 L1348,736 L1228,778 L1114,736 L1002,784 L882,742 L756,792 L626,746 L498,792 L360,744 L224,784 L100,748 L0,772 Z"
        fill="url(#v2Forest)"
      />

      {/* flowers */}
      {[130, 270, 430, 590, 760, 950, 1140, 1300].map((x, i) => (
        <g key={i}>
          <line x1={x} y1={875} x2={x} y2={888} stroke="#2f8d52" strokeWidth="1.2" />
          <circle
            cx={x}
            cy={873}
            r="3.3"
            fill={i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#f472b6" : "#a78bfa"}
          />
        </g>
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   LUXURY NIGHT BACKGROUND
   ══════════════════════════════════════════════════════════════ */
function NightBackground() {
  const stars = Array.from({ length: 54 }, (_, i) => ({
    x: 40 + (i * 37) % 1360,
    y: 22 + (i * 53) % 330,
    r: i % 5 === 0 ? 2.1 : i % 3 === 0 ? 1.45 : 1,
    op: i % 4 === 0 ? 0.95 : 0.72,
    dur: 2.2 + (i % 6) * 0.6,
  }));

  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className="lp-scene-svg"
    >
      <defs>
        <linearGradient id="v2NightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="24%" stopColor="#0a1030" />
          <stop offset="56%" stopColor="#10193d" />
          <stop offset="100%" stopColor="#1a123e" />
        </linearGradient>

        <radialGradient id="v2MoonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#eef2ff" stopOpacity="1" />
          <stop offset="38%" stopColor="#c7d2fe" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="v2AuroraA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="42%" stopColor="#67e8f9" stopOpacity="0.26" />
          <stop offset="72%" stopColor="#c084fc" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="v2AuroraB" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
          <stop offset="48%" stopColor="#86efac" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="v2NightFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#314d9e" />
          <stop offset="100%" stopColor="#17244f" />
        </linearGradient>

        <linearGradient id="v2NightMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#18243e" />
          <stop offset="100%" stopColor="#080f1f" />
        </linearGradient>

        <linearGradient id="v2NightFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1817" />
          <stop offset="100%" stopColor="#020807" />
        </linearGradient>

        <linearGradient id="v2NightLake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#436ed3" stopOpacity="0.56" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
        </linearGradient>

        <filter id="v2NBlur8">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="v2NBlur18">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="v2NBlur30">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>

      <rect width="1440" height="900" fill="url(#v2NightSky)" />

      {/* galaxy haze */}
      <ellipse
        cx="720"
        cy="170"
        rx="860"
        ry="180"
        fill="#7c3aed"
        opacity="0.06"
        filter="url(#v2NBlur30)"
      />
      <ellipse
        cx="980"
        cy="220"
        rx="640"
        ry="130"
        fill="#2563eb"
        opacity="0.05"
        filter="url(#v2NBlur30)"
      />

      {/* aurora */}
      <ellipse cx="420" cy="176" rx="640" ry="175" fill="url(#v2AuroraA)" className="lp-aurora-a" />
      <ellipse cx="1088" cy="248" rx="530" ry="160" fill="url(#v2AuroraB)" className="lp-aurora-b" />

      {/* moon */}
      <circle cx="1160" cy="138" r="178" fill="url(#v2MoonGlow)" filter="url(#v2NBlur30)" />
      <circle cx="1160" cy="138" r="64" fill="#eef2ff" />
      <circle cx="1138" cy="121" r="10" fill="#c7d2fe" opacity="0.55" />
      <circle cx="1180" cy="156" r="8" fill="#c7d2fe" opacity="0.48" />
      <circle cx="1188" cy="128" r="5.8" fill="#c7d2fe" opacity="0.4" />

      {/* stars */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.op}>
          <animate
            attributeName="opacity"
            values={`${s.op};${Math.max(0.16, s.op * 0.25)};${s.op}`}
            dur={`${s.dur}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* shooting star */}
      <g opacity="0">
        <line x1="180" y1="76" x2="345" y2="156" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <animate attributeName="opacity" values="0;0;1;0;0" dur="8s" begin="2s" repeatCount="indefinite" />
      </g>

      {/* clouds */}
      <g opacity="0.52">
        <ellipse cx="330" cy="295" rx="170" ry="48" fill="#22306f" />
        <ellipse cx="265" cy="280" rx="82" ry="54" fill="#22306f" />
        <ellipse cx="340" cy="272" rx="92" ry="58" fill="#22306f" />
        <ellipse cx="404" cy="286" rx="75" ry="48" fill="#22306f" />
      </g>

      {/* mountains */}
      <path
        d="M0,620 L0,900 L1440,900 L1440,620 L1366,450 L1248,536 L1126,388 L1000,514 L862,334 L734,480 L606,318 L478,470 L330,344 L176,500 L0,364 Z"
        fill="url(#v2NightFar)"
        opacity="0.72"
      />
      <path
        d="M0,706 L0,900 L1440,900 L1440,706 L1364,638 L1246,678 L1112,618 L984,682 L854,622 L722,686 L586,626 L450,690 L314,630 L166,694 L0,648 Z"
        fill="url(#v2NightMid)"
        opacity="0.93"
      />

      {/* lake */}
      <ellipse cx="754" cy="770" rx="336" ry="54" fill="url(#v2NightLake)" opacity="0.84" />
      {[620, 700, 770, 842, 918].map((x, i) => (
        <circle key={i} cx={x} cy={766 + (i % 2) * 6} r="1.7" fill="white" opacity="0.26">
          <animate attributeName="opacity" values="0.14;0.52;0.14" dur={`${2 + i * 0.45}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* forest front */}
      <path
        d="M0,794 L0,900 L1440,900 L1440,794 L1348,738 L1228,780 L1112,738 L1000,784 L880,742 L756,792 L624,746 L498,792 L360,744 L222,784 L100,748 L0,772 Z"
        fill="url(#v2NightFront)"
      />

      {/* mist */}
      <ellipse
        cx="720"
        cy="876"
        rx="910"
        ry="56"
        fill="#dbeafe"
        opacity="0.06"
        filter="url(#v2NBlur18)"
      />

      {/* fireflies */}
      {[150, 280, 430, 590, 760, 940, 1120, 1290].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={822 + (i % 3) * 10} r="2.8" fill="#a7f3d0" opacity="0.85">
            <animate attributeName="opacity" values="0;0.9;0.2;0.9;0" dur={`${1.9 + i * 0.22}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={x} cy={822 + (i % 3) * 10} r="6" fill="#a7f3d0" opacity="0.12" filter="url(#v2NBlur8)">
            <animate attributeName="opacity" values="0;0.2;0.06;0.2;0" dur={`${1.9 + i * 0.22}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   FLOATING PREMIUM PARTICLES
   ══════════════════════════════════════════════════════════════ */
function FloatingParticles({ isDay }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    left: `${5 + (i * 5.2) % 90}%`,
    top: `${8 + (i * 4.8) % 82}%`,
    size: i % 3 === 0 ? 5 : i % 2 === 0 ? 3.5 : 2.5,
    delay: `${i * 0.4}s`,
    duration: `${7 + (i % 5) * 1.3}s`,
  }));

  return (
    <div className="lp-particles">
      {particles.map((p, i) => (
        <span
          key={i}
          className={`lp-particle ${isDay ? "lp-particle-day" : "lp-particle-night"}`}
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN LOGIN
   ══════════════════════════════════════════════════════════════ */
function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [securityAction, setSecurityAction] = useState(null);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [deviceId, setDeviceId] = useState(null);
  const [isDay, setIsDay] = useState(() => {
    const h = new Date().getHours();
    return h >= 6 && h < 19;
  });
  const [greeting, setGreeting] = useState("");

  const sceneRef = useRef(null);
  const cardRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, cx: 0, cy: 0 });
  const rafRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = new Date().getHours();
    if (!isDay) setGreeting("Good night");
    else if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, [isDay]);

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", onMove);

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      const m = mouseRef.current;
      m.cx = lerp(m.cx || 0, m.x, 0.045);
      m.cy = lerp(m.cy || 0, m.y, 0.045);

      if (sceneRef.current) {
        sceneRef.current.style.transform = `translate(${m.cx * -22}px, ${m.cy * -14}px) scale(1.03)`;
      }

      if (cardRef.current) {
        cardRef.current.style.transform = `translate(-50%, -50%) rotateY(${m.cx * 4.3}deg) rotateX(${-m.cy * 2.8}deg)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    let t;
    if (securityAction && timeLeft > 0) {
      t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0 && securityAction) {
      setError("OTP expired. Please log in again.");
      setSecurityAction(null);
    }
    return () => clearInterval(t);
  }, [securityAction, timeLeft]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fp = {
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };

      const res = await axios.post(apiUrl("/api/auth/login"), {
        ...form,
        fingerprintData: fp,
      });

      const { token, user, passwordExpiryWarning } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);

      if (passwordExpiryWarning) {
        localStorage.setItem("passwordExpiryWarning", "true");
      } else {
        localStorage.removeItem("passwordExpiryWarning");
      }

      navigate("/welcome");
    } catch (err) {
      const data = err.response?.data;

      if (err.response?.status === 403 && data?.action) {
        setSecurityAction(data.action);
        setUserId(data.userId);
        if (data.deviceId) setDeviceId(data.deviceId);
        setTimeLeft(data.action === "REQUIRE_ADMIN_DEVICE_VERIFICATION" ? 300 : 600);
      } else if (data?.action === "DEVICE_LIMIT_REACHED") {
        setError(data.message);
      } else if (data?.action === "SHOW_FORGOT_PASSWORD_LINK") {
        setError(
          <span>
            {data.message}{" "}
            <button
              type="button"
              className="lp-inline-btn"
              onClick={handleRequestForgotPassword}
            >
              Reset password?
            </button>
          </span>
        );
      } else {
        setError(data?.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestForgotPassword = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(apiUrl("/api/auth/password/forgot-request"), {
        email: form.email,
      });
      setSecurityAction("FORGOT_PASSWORD");
      setUserId(res.data.userId);
      setTimeLeft(600);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      (securityAction === "FORCE_PASSWORD_CHANGE" ||
        securityAction === "FORGOT_PASSWORD") &&
      newPassword !== confirmPassword
    ) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      let endpoint = "/api/auth/otp/verify-security";
      const payload = { userId, otp };

      if (securityAction === "FORCE_PASSWORD_CHANGE") {
        endpoint = "/api/auth/otp/verify-password";
        payload.newPassword = newPassword;
      } else if (securityAction === "FORGOT_PASSWORD") {
        endpoint = "/api/auth/password/forgot-reset";
        payload.newPassword = newPassword;
      } else if (securityAction === "REQUIRE_ADMIN_DEVICE_VERIFICATION") {
        endpoint = "/api/auth/otp/verify-admin-device";
        payload.deviceId = deviceId;
      }

      const res = await axios.post(apiUrl(endpoint), payload);

      if (securityAction === "FORGOT_PASSWORD") {
        setSecurityAction(null);
        setError("Password reset! Please login.");
      } else {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userRole", res.data.user.role);
        setSecurityAction(null);
        navigate("/welcome");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const timerDisplay = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
    .toString()
    .padStart(2, "0")}`;

  const secMeta = {
    FORCE_PASSWORD_CHANGE: {
      title: "Update Password",
      sub: "Your password expired. Verify OTP and set a new one.",
      icon: <KeyRound size={22} />,
      showPw: true,
    },
    FORGOT_PASSWORD: {
      title: "Reset Password",
      sub: "Enter the OTP sent to your email to reset your password.",
      icon: <Mail size={22} />,
      showPw: true,
    },
    REQUIRE_ADMIN_DEVICE_VERIFICATION: {
      title: "Device Verification",
      sub: "New device detected. Enter the OTP sent to your admin email.",
      icon: <ShieldCheck size={22} />,
      showPw: false,
    },
    default: {
      title: "Security Check",
      sub: "Weekly security check. Enter the OTP sent to your IT admin.",
      icon: <ShieldCheck size={22} />,
      showPw: false,
    },
  };

  const meta = secMeta[securityAction] || secMeta.default;

  return (
    <div className={`lp-root ${isDay ? "lp-day" : "lp-night"}`}>
      <div className="lp-scene-wrap" ref={sceneRef}>
        {isDay ? <DayBackground /> : <NightBackground />}
    <div className="login-page-container">
      <button 
        className="explore-acis-btn" 
        onClick={() => window.open(process.env.REACT_APP_EXPLORE_ACIS_LINK, "_blank")}
      >
        Explore ACIS
      </button>
      {/* Cosmic Background Layer */}
      <div className="background-glow" />

      {/* Right-side Dashboard Illustration */}
      <div className="illustration-container">
        <img
          src="/heroimg2.png"
          alt="Dashboard Preview"
          className="hero-image"
        />
      </div>

      <FloatingParticles isDay={isDay} />

      <div className="lp-vignette" />
      <div className="lp-noise" />
      <div className="lp-orb lp-orb-a" />
      <div className="lp-orb lp-orb-b" />

      <button className="lp-theme-btn" onClick={() => setIsDay((d) => !d)}>
        {isDay ? <MoonStar size={17} /> : <SunMedium size={17} />}
      </button>

      <div className="lp-card-wrap" ref={cardRef}>
        <div className="lp-card">
          <div className="lp-card-shine" />
          <div className="lp-card-glow" />

          <div className="lp-logo-row">
            <img src="/sidebar-logo.jpeg" alt="Netcradus" className="lp-logo-img" />
            <img src="/netcradus.png" alt="Netcradus" className="lp-logo-text" />
          </div>

          <div className="lp-badge">
            <span className="lp-badge-dot" />
            <span>{greeting}</span>
            <Stars size={12} />
          </div>

          {!securityAction ? (
            <form onSubmit={handleLogin} className="lp-form">
              <h1 className="lp-title">Welcome back</h1>
              <p className="lp-tagline">Securely sign in to your dashboard</p>

              {error && <div className="lp-error">{error}</div>}

              <div className="lp-field">
                <label className="lp-label">Email Address</label>
                <div className="lp-input-wrap">
                  <Mail size={16} className="lp-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="lp-input"
                  />
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label">Password</label>
                <div className="lp-input-wrap">
                  <Lock size={16} className="lp-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="lp-input lp-input-pr"
                  />
                  <button
                    type="button"
                    className="lp-eye"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="lp-form-meta">
               
                <div className="lp-forgot" onClick={handleRequestForgotPassword}>
                  Forgot Password?
                </div>
              </div>

              <button type="submit" disabled={loading} className="lp-btn">
                {loading && <span className="lp-spinner" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <div className="lp-security">
              <div className="lp-sec-icon-wrap">{meta.icon}</div>
              <h2 className="lp-sec-title">{meta.title}</h2>
              <p className="lp-sec-sub">{meta.sub}</p>

              <form onSubmit={handleVerifyOTP} className="lp-form">
                {error && <div className="lp-error">{error}</div>}

                <div className="lp-field">
                  <label className="lp-label">OTP Code</label>
                  <div className="lp-input-wrap">
                    <ShieldCheck size={16} className="lp-icon" />
                    <input
                      type="text"
                      placeholder="6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength="6"
                      className="lp-input"
                    />
                  </div>
                  <div className="lp-timer">Expires in: {timerDisplay}</div>
                </div>

                {meta.showPw && (
                  <>
                    <div className="lp-field">
                      <label className="lp-label">New Password</label>
                      <div className="lp-input-wrap">
                        <Lock size={16} className="lp-icon" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="lp-input lp-input-pr"
                        />
                        <button
                          type="button"
                          className="lp-eye"
                          onClick={() => setShowNewPassword((p) => !p)}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="lp-field">
                      <label className="lp-label">Confirm Password</label>
                      <div className="lp-input-wrap">
                        <Lock size={16} className="lp-icon" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="lp-input lp-input-pr"
                        />
                        <button
                          type="button"
                          className="lp-eye"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" disabled={loading} className="lp-btn">
                  {loading && <span className="lp-spinner" />}
                  {loading ? "Verifying..." : "Confirm & Continue"}
                </button>

                <button
                  type="button"
                  className="lp-back"
                  onClick={() => setSecurityAction(null)}
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
              </form>
            </div>
          )}


          <p className="lp-copy">© 2026 Netcradus. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;