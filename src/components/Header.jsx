import React from "react";
import "./Header.css";

function Header() {
    const currentYear = new Date().getFullYear();

    return (
        <header className="app-header">
            {/* Tagline */}
            <div className="header-left">
                <span className="header-tagline">
                    Where Intelligence Shapes Smarter Media Planning.
                </span>
            </div>

            {/* Center: Logo + Name */}
            <div className="header-center">
                <img src="/company-logo.png" alt="Third Shift Media Logo" className="header-logo" />
                <h1 className="header-title">Third Shift Media (PVT) LTD</h1>
            </div>

            {/* Right: Intelligence Dashboard & Year */}
            <div className="header-right">
                <span className="header-badge">Intelligence Dashboard</span>
                <span className="header-year">{currentYear}</span>
            </div>
        </header>
    );
}

export default Header;
