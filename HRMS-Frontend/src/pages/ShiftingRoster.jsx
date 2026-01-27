import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ShiftManagement from './ShiftManagement';
import RosterManagement from './ShiftManagement/RosterManagement';
import WFHRequests from './ShiftManagement/WFHRequests';
import OutsideWorkRequests from './ShiftManagement/OutsideWorkRequests';
import '../styles/ShiftingRoster.css';

const ShiftingRoster = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('shifts');

    const isAuthorized = ['HR Manager', 'Super Admin', 'Company Admin'].includes(user?.role);

    if (!isAuthorized) {
        return <div className="shifting-roster-error">Access Denied - You do not have permission to access this page.</div>;
    }

    return (
        <div className="shifting-roster-container">
            <div className="shifting-roster-header">
                <h1 className="shifting-roster-title">Shifting Roster Management</h1>
            </div>

            <div className="shifting-roster-tabs">
                <button
                    className={`tab-button ${activeTab === 'shifts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('shifts')}
                >
                    Shift Management
                </button>
                <button
                    className={`tab-button ${activeTab === 'roster' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roster')}
                >
                    Roster Management
                </button>
                <button
                    className={`tab-button ${activeTab === 'wfh' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wfh')}
                >
                    WFH Requests
                </button>
                <button
                    className={`tab-button ${activeTab === 'outside-work' ? 'active' : ''}`}
                    onClick={() => setActiveTab('outside-work')}
                >
                    Outside Work Requests
                </button>
            </div>

            <div className="shifting-roster-content">
                {activeTab === 'shifts' && <ShiftManagement />}
                {activeTab === 'roster' && <RosterManagement />}
                {activeTab === 'wfh' && <WFHRequests />}
                {activeTab === 'outside-work' && <OutsideWorkRequests />}
            </div>
        </div>
    );
};

export default ShiftingRoster;
