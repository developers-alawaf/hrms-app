import React, { useState, useEffect, useContext } from 'react';
import { getAllShifts, deleteShift, createShift, updateShift } from '../api/shift';
import ShiftForm from '../components/ShiftForm';
import { AuthContext } from '../context/AuthContext';
import '../styles/List.css'; // Import the List.css file

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const { data: shiftsData } = await getAllShifts();
      setShifts(shiftsData.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteShift(id);
      setShifts(shifts.filter((shift) => shift._id !== id));
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const handleAdd = () => {
    setSelectedShift(null);
    setIsModalOpen(true);
  };

  const handleEdit = (shift) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (shiftData) => {
    try {
      if (selectedShift && selectedShift._id) {
        await updateShift(selectedShift._id, shiftData);
      } else {
        await createShift(shiftData);
      }
      fetchShifts();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving shift:', error);
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h1 className="list-title">Shift Management</h1>
        <button
          onClick={handleAdd}
          className="create-button"
        >
          Add Shift
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="list-table">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Company</th>
              <th className="py-2 px-4 border-b">Start Time</th>
              <th className="py-2 px-4 border-b">End Time</th>
              <th className="py-2 px-4 border-b">Working Hours</th>
              <th className="py-2 px-4 border-b">Grace Period</th>
              <th className="py-2 px-4 border-b">Overtime Threshold</th>
              {user?.role === 'Super Admin' && <th className="py-2 px-4 border-b">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift._id}>
                <td className="list-table-td text-center">{shift.name}</td>
                <td className="list-table-td text-center">{shift.companyId.name}</td>
                <td className="list-table-td text-center">{shift.startTime}</td>
                <td className="list-table-td text-center">{shift.endTime}</td>
                <td className="list-table-td text-center">{shift.workingHours}</td>
                <td className="list-table-td text-center">{shift.gracePeriod}</td>
                <td className="list-table-td text-center">{shift.overtimeThreshold}</td>
                {/* {user?.role === 'Super Admin' && ( */}
                {(user?.role === 'Super Admin' || user?.role === 'HR Manager') && (
                  <td className="list-table-td text-center">
                    <button
                      onClick={() => handleEdit(shift)}
                      className="list-action-button edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(shift._id)}
                      className="list-action-button delete"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <ShiftForm
          shift={selectedShift}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ShiftManagement;
