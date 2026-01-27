import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Users, Calendar, FileText, Briefcase, LayoutDashboard, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import '../styles/Header.css';

const Header = ({ toggleSidebar, isDesktop, isSidebarOpen }) => {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);

  // Safety check: if context is not available, don't render
  if (!authContext) {
    console.warn('AuthContext is not available in Header');
    return null;
  }

  const { user, logout, loading } = authContext;

  // Show loading state or return null if user is not available
  if (loading) {
    return null;
  }

  const handleLinkClick = () => {
    // Close dropdowns when a link is clicked
    setOpenDropdown(null);
  };

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };
  
  const handleLogout = () => {
    logout();
  };

  return (
    <header className={`header ${isDesktop && isSidebarOpen ? 'header-shifted' : 'header-expanded'}`}>
      <div className="header-content">
        <button className="hamburger-menu" onClick={toggleSidebar}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
        <div className="header-logo">
          <h1>HRMS</h1>
        </div>
      </div>
      <div className="header-right">
        {/*
        <div className="user-menu">
          <div className="user-profile" onClick={toggleDropdown}>
            <img
              src={user?.profileImage || '/default-avatar.png'}
              alt="User"
              className="user-image"
            />
            <span className="user-name">{user?.firstName || 'User'}</span>
          </div>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <a href="#profile" className="dropdown-item">Profile</a>
              <a href="#settings" className="dropdown-item">Settings</a>
              <button onClick={handleLogout} className="dropdown-item">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
        */}
        <nav className="header-nav">
          <ul className="header-nav-list">
            
            
            
            
             <li className="dropdown">
          <div className="header-nav-link dropdown-toggle" onClick={() => toggleDropdown('user')}>
            <img src={user?.profileImage || '/default-avatar.png'} alt="User" className="user-image" />
            <span>{user?.fullName || 'User'}</span>
            <ChevronDown size={16} />
          </div>
          {openDropdown === 'user' && (
            <ul className="dropdown-menu">
              <li>
                <Link to="/profile" className="dropdown-item" onClick={handleLinkClick}>
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/change-password" className="dropdown-item" onClick={handleLinkClick}>
                  Change Password
                </Link>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => { handleLogout(); handleLinkClick(); }}>
                  Logout
                </button>
              </li>
            </ul>
          )}
        </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;