import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center district-shell">
      <div className="text-center district-panel px-8 py-10 rounded-2xl border border-[var(--district-border)] shadow-xl">
        <h1 className="text-5xl font-black mb-3">404</h1>
        <p className="text-xl text-[var(--district-muted)] mb-4">Oops! Page not found</p>
        <a href="/" className="district-button-primary inline-flex items-center justify-center px-5 py-3 rounded-full">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
