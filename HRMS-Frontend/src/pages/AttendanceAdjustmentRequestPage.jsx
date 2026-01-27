import React, { useState, useContext } from 'react';
import AttendanceAdjustmentRequestForm from '../components/AttendanceAdjustmentRequestForm';
import AttendanceAdjustmentRequestList from '../components/AttendanceAdjustmentRequestList';
import { AuthContext } from '../context/AuthContext';
import '../styles/Attendance.css';

const AttendanceAdjustmentRequestPage = () => {
  const { user } = useContext(AuthContext);
  const [refreshList, setRefreshList] = useState(false);

  const handleFormSubmit = () => {
    setRefreshList(prev => !prev);
  };

  return (
    <div className="attendance-adjustment-page">
      {/* <h2>Attendance Adjustment</h2> */}
      {(user?.role === 'Employee' || user?.role === 'Manager') && (
        <AttendanceAdjustmentRequestForm onFormSubmit={handleFormSubmit} />
      )}
      <AttendanceAdjustmentRequestList refreshTrigger={refreshList} />
    </div>
  );
};

export default AttendanceAdjustmentRequestPage;