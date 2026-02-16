import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Users, Calendar, FileText, Lock, LogOut, Menu, X, Briefcase, LayoutDashboard, ClipboardList, ChevronDown } from 'lucide-react';
import '../styles/Sidebar.css';

const defaultAvatar = '/default-avatar.png';

const Sidebar = ({ isSidebarOpen, toggleSidebar, isDesktop }) => {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isActiveExact = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  // Safety check: if context is not available or still loading, don't render
  if (!authContext) {
    console.warn('AuthContext is not available in Sidebar');
    return null;
  }

  const { user, logout, loading } = authContext;

  // Show loading state or return null if user is not available
  if (loading) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (!isDesktop && isSidebarOpen) {
      toggleSidebar(); // Close sidebar on link click for mobile
    }
  };

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const profileImage = user?.profileImage || defaultAvatar;

  return (
    <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-inner">
      <div className="sidebar-header">
        <Link to="/dashboard" onClick={handleLinkClick}>
          <img src="/Kloud_Technologies_Logo.svg" alt="Kloud Technologies Logo" className="sidebar-logo" />
        </Link>
        {!isDesktop && (
          <button className="close-sidebar" onClick={toggleSidebar}>
            <X className="nav-icon" />
          </button>
        )}
      </div>
      <ul className="sidebar-links">
        <li>
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={handleLinkClick}>
            <LayoutDashboard className="nav-icon" />
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/company-policies" className={`sidebar-link ${isActive('/company-policies') ? 'active' : ''}`} onClick={handleLinkClick}>
            <FileText className="nav-icon" />
            Company Policies
          </Link>
        </li>
        {/* <li>
          <Link to="/documents/common" className="sidebar-link" onClick={handleLinkClick}>
            <FileText className="nav-icon" />
            Company Documents
          </Link>
        </li> */}
        {(user?.role === 'Super Admin' || user?.role === 'HR Manager' || user?.role === 'Company Admin' || user?.role === 'C-Level Executive') && (
          <li>
            <Link to="/employees" className={`sidebar-link ${isActive('/employees') ? 'active' : ''}`} onClick={handleLinkClick}>
              <Users className="nav-icon" />
              Employees
            </Link>
          </li>
        )}
        <li>
          <Link to="/attendance" className="sidebar-link" onClick={handleLinkClick}>
            <Calendar className="nav-icon" />
            Attendance
          </Link>
        </li>
        {(user?.role === 'Employee' || user?.role === 'Manager' || user?.role === 'HR Manager' || user?.role === 'Super Admin' || user?.role === 'Company Admin' || user?.role === 'C-Level Executive') && (
          <li>
            <Link to="/attendance/adjustments" className={`sidebar-link ${isActive('/attendance/adjustments') ? 'active' : ''}`} onClick={handleLinkClick}>
              <Calendar className="nav-icon" />
              Manual Attendance
            </Link>
          </li>
        )}
        {(user?.role === 'Super Admin' || user?.role === 'HR Manager' || user?.role === 'Company Admin' || user?.role === 'C-Level Executive') && (
          <li>
            <Link to="/company" className={`sidebar-link ${isActive('/company') ? 'active' : ''}`} onClick={handleLinkClick}>
              <Briefcase className="nav-icon" />
              Company
            </Link>
          </li>
        )}
        {(user?.role === 'Super Admin' || user?.role === 'HR Manager' || user?.role === 'Company Admin') && (
          <li className="dropdown">
            <div className="sidebar-link dropdown-toggle" onClick={() => toggleDropdown('admin')}>
              <Briefcase className="nav-icon" />
              HR Tools
              <ChevronDown className="dropdown-chevron" size={18} />
            </div>
            {openDropdown === 'admin' && (
              <ul className="dropdown-menu">
                {/* <li>
                  <Link to="/departments/create" className="dropdown-item" onClick={handleLinkClick}>
                    Create Department
                  </Link>
                </li> */}
                {/* <li>
                  <Link to="/designations/create" className="dropdown-item" onClick={handleLinkClick}>
                    Create Designation
                  </Link>
                </li> */}
                <li>
                  <Link to="/departments" className={`dropdown-item ${isActive('/departments') ? 'active' : ''}`} onClick={handleLinkClick}>
                    Departments
                  </Link>
                </li>
                <li>
                  <Link to="/designations" className={`dropdown-item ${isActive('/designations') ? 'active' : ''}`} onClick={handleLinkClick}>
                    Designations
                  </Link>
                </li>
                <li>
                  <Link to="/shifts" className={`dropdown-item ${isActive('/shifts') ? 'active' : ''}`} onClick={handleLinkClick}>
                    Shifts
                  </Link>
                </li>
                {/* <li>
                  <Link to="/shift-templates" className="dropdown-item" onClick={handleLinkClick}>
                    Shift Roster Templates
                  </Link>
                </li> */}
                {(user?.role === 'Super Admin' || user?.role === 'HR Manager') && (
                  <li>
                    <Link to="/holidays" className={`dropdown-item ${isActive('/holidays') ? 'active' : ''}`} onClick={handleLinkClick}>
                      Holiday Calendar
                    </Link>
                  </li>
                )}
                  {(user?.role === 'Super Admin' || user?.role === 'Company Admin' || user?.role === 'HR Manager' || user?.role === 'C-Level Executive') && (
                <>
                  <li>
                    <Link to="/leave/policy" className={`dropdown-item ${isActive('/leave/policy') ? 'active' : ''}`} onClick={handleLinkClick}>
                      Leave Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/leave/entitlements" className={`dropdown-item ${isActive('/leave/entitlements') ? 'active' : ''}`} onClick={handleLinkClick}>
                      Leave Entitlements
                    </Link>
                  </li>
                  <li>
                    <Link to="/leave/history" className={`dropdown-item ${isActive('/leave/history') ? 'active' : ''}`} onClick={handleLinkClick}>
                      Leave History
                    </Link>
                  </li>
                  </>
              )}
              </ul>
            )}
          </li>
        )}
        {(user?.role === 'Super Admin' || user?.role === 'HR Manager' || user?.role === 'Company Admin' || user?.department?.name?.toLowerCase().includes('noc')) && (
            <li className="dropdown">
                <div className="sidebar-link dropdown-toggle" onClick={() => toggleDropdown('shiftingRoster')}>
                    <ClipboardList className="nav-icon" />
                    Shifting Roster
                    <ChevronDown className="dropdown-chevron" size={18} />
                </div>
                {openDropdown === 'shiftingRoster' && (
                    <ul className="dropdown-menu">
                        <li>
                            <Link to="/shift-management/shifts" className={`dropdown-item ${isActive('/shift-management/shifts') ? 'active' : ''}`} onClick={handleLinkClick}>
                                Shift Management
                            </Link>
                        </li>
                        <li>
                            <Link to="/shift-management/roster" className={`dropdown-item ${isActive('/shift-management/roster') ? 'active' : ''}`} onClick={handleLinkClick}>
                                Roster Management
                            </Link>
                        </li>
                        <li>
                            <Link to="/shift-management/attendance" className={`dropdown-item ${isActive('/shift-management/attendance') ? 'active' : ''}`} onClick={handleLinkClick}>
                                Roster Attendance
                            </Link>
                        </li>
                        <li>
                            <Link to="/shift-management/wfh" className={`dropdown-item ${isActive('/shift-management/wfh') ? 'active' : ''}`} onClick={handleLinkClick}>
                                WFH Requests
                            </Link>
                        </li>
                        <li>
                            <Link to="/shift-management/outside-work" className={`dropdown-item ${isActive('/shift-management/outside-work') ? 'active' : ''}`} onClick={handleLinkClick}>
                                Outside Work Requests
                            </Link>
                        </li>
                        {/* <li>
                            <Link to="/shifting-roster/employee-roster" className="dropdown-item" onClick={handleLinkClick}>
                                Employee Roster
                            </Link>
                        </li> */}
                    </ul>
                )}
            </li>
        )}
        
        <li className="dropdown">
          <div className="sidebar-link dropdown-toggle" onClick={() => toggleDropdown('requests')}>
            <Briefcase className="nav-icon" />
            Requests
            <ChevronDown className="dropdown-chevron" size={18} />
          </div>
          {openDropdown === 'requests' && (
            <ul className="dropdown-menu">
              <li>
                <Link to="/leave" className={`dropdown-item ${isActiveExact('/leave') ? 'active' : ''}`} onClick={handleLinkClick}>
                  Leave Requests
                </Link>
              </li>
              <li>
                <Link to="/remote" className={`dropdown-item ${isActiveExact('/remote') ? 'active' : ''}`} onClick={handleLinkClick}>
                  Remote Requests
                </Link>
              </li>
              {/* {user?.role === 'HR Manager' && (
                <li>
                  <Link to="/leave/all" className="dropdown-item" onClick={handleLinkClick}>
                    All Requests
                  </Link>
                </li>
              )} */}
              {/* <li>
                <Link to="/leave/summary" className="dropdown-item" onClick={handleLinkClick}>
                  Leave Summary
                </Link>
              </li> */}
              {(user?.role === 'Super Admin' || user?.role === 'Company Admin' || user?.role === 'HR Manager' || user?.role === 'C-Level Executive') && (
                <>
                  
                  {(user?.role === 'HR Manager') && (
                    <li>
                      <Link to="/leave/balance" className={`dropdown-item ${isActiveExact('/leave/balance') ? 'active' : ''}`} onClick={handleLinkClick}>
                        All Employee Leave Balance
                      </Link>
                    </li>
                  )}
                </>
              )}
              {(user?.role === 'Employee' || user?.role === 'Manager' || user?.role === 'HR Manager' || user?.role === 'Super Admin' || user?.role === 'Company Admin' || user?.role === 'C-Level Executive') && (
                <li>
                  <Link to="/my-leave-balance" className={`dropdown-item ${isActiveExact('/my-leave-balance') ? 'active' : ''}`} onClick={handleLinkClick}>
                    My Leave Balance
                  </Link>
                </li>
              )}
            </ul>
          )}
          
        </li>

        {(user?.role === 'Super Admin' || user?.role === 'HR Manager' || user?.role === 'Company Admin' || user?.role === 'C-Level Executive') && (
          <li>
            <Link to="/documents" className={`sidebar-link ${isActive('/documents') ? 'active' : ''}`} onClick={handleLinkClick}>
              <FileText className="nav-icon" />
              Documents
            </Link>
          </li>
        )}
      </ul>
      <div className="sidebar-footer">
        <div className="sidebar-user-dropdown">
          <div className="sidebar-user-toggle" onClick={() => toggleDropdown('user')}>
            <img
              src={profileImage}
              alt="User"
              className="sidebar-user-image"
              onError={(e) => {
                if (e.target.src !== defaultAvatar) {
                  e.target.src = defaultAvatar;
                }
              }}
            />
            <span className="sidebar-user-name">{user?.fullName || 'User'}</span>
            <ChevronDown className="sidebar-user-chevron" size={18} />
          </div>
          {openDropdown === 'user' && (
            <ul className="sidebar-footer-dropdown">
              <li>
                <Link to="/profile" className={`dropdown-item ${isActive('/profile') ? 'active' : ''}`} onClick={handleLinkClick}>
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/change-password" className={`dropdown-item ${isActive('/change-password') ? 'active' : ''}`} onClick={handleLinkClick}>
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
        </div>
      </div>
      </div>
    </div>
  );
};

export default Sidebar;
