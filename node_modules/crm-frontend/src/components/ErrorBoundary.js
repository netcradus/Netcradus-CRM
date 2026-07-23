import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0f0f1a",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#9ca3af", marginBottom: "1.5rem", maxWidth: "480px" }}>
            An unexpected error occurred. The team has been notified. Please return to the dashboard.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: "#ff7a18",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.6rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
