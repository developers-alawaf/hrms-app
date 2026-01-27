// import React, { useState, useEffect } from 'react';
// import { getEmployees } from '../api/employee';
// import { assignShiftToEmployees, removeEmployeeFromShift } from '../api/shift';
// import Select from 'react-select';

// const ShiftAssignmentModal = ({ shift, onClose, onSave }) => {
//   const [allEmployees, setAllEmployees] = useState([]);
//   const [selectedEmployees, setSelectedEmployees] = useState([]);
//   const [assignedEmployees, setAssignedEmployees] = useState([]);

//   useEffect(() => {
//     const fetchEmployees = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const { data } = await getEmployees(token);
//         setAllEmployees(data.data);
//       } catch (error) {
//         console.error('Error fetching employees:', error);
//       }
//     };

//     const fetchAssignedEmployees = async () => {
//         try {
//             const { data } = await getEmployees({ shiftId: shift._id });
//             setAssignedEmployees(data.data);
//         } catch (error) {
//             console.error('Error fetching employees:', error);
//         }
//     }

//     fetchEmployees();
//     fetchAssignedEmployees();
//   }, [shift]);

//   const handleAssign = async () => {
//     try {
//       const employeeIds = selectedEmployees.map((employee) => employee.value);
//       await assignShiftToEmployees(shift._id, employeeIds, shift.companyId);
//       onSave();
//       onClose();
//     } catch (error) {
//       console.error('Error assigning employees:', error);
//     }
//   };

//   const handleRemove = async (employeeId) => {
//     try {
//       await removeEmployeeFromShift(employeeId);
//       onSave();
//     } catch (error) {
//       console.error('Error removing employee:', error);
//     }
//   };

//   const employeeOptions = allEmployees
//     .filter(employee => employee.companyId === shift.companyId)
//     .map((employee) => ({
//         value: employee._id,
//         label: `${employee.fullName} (${employee.newEmployeeCode})`,
//     }));

//   return (
//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
//       <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
//         <div className="mt-3">
//           <h3 className="text-lg leading-6 font-medium text-gray-900">Assign Employees to {shift.name}</h3>
//           <div className="mt-2">
//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700">Add Employees</label>
//               <Select
//                 isMulti
//                 options={employeeOptions}
//                 onChange={setSelectedEmployees}
//                 className="mt-1"
//               />
//               <button
//                 onClick={handleAssign}
//                 className="mt-2 px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 Assign
//               </button>
//             </div>
//             <div>
//               <h4 className="text-md font-medium text-gray-900">Assigned Employees</h4>
//               <ul className="mt-2">
//                 {assignedEmployees.map((employee) => (
//                   <li key={employee._id} className="flex justify-between items-center py-1">
//                     <span>{employee.fullName} ({employee.newEmployeeCode})</span>
//                     <button
//                       onClick={() => handleRemove(employee._id)}
//                       className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
//                     >
//                       Remove
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//           <div className="items-center px-4 py-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="mt-3 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ShiftAssignmentModal;



import React, { useState, useEffect } from 'react';
import { getEmployees } from '../api/employee';
import { assignShiftToEmployees, removeEmployeeFromShift } from '../api/shift';
import Select from 'react-select';

const ShiftAssignmentModal = ({ shift, onClose, onSave }) => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!shift) return;

    const fetchEmployees = async () => {
      try {
        // fetch all employees for the company
        const companyId = typeof shift.companyId === 'object' ? shift.companyId._id : shift.companyId;
        const resAll = await getEmployees(token, { companyId });
        // handle different response shapes:
        const all = resAll?.success ? resAll.data : resAll?.data?.data || resAll?.data || [];
        setAllEmployees(Array.isArray(all) ? all : []);

        // fetch assigned employees (filter by shiftId)
        const resAssigned = await getEmployees(token, { shiftId: shift._id });
        const assigned = resAssigned?.success ? resAssigned.data : resAssigned?.data?.data || resAssigned?.data || [];
        setAssignedEmployees(Array.isArray(assigned) ? assigned : []);
      } catch (error) {
        console.error('Error fetching employees or assigned employees:', error);
      }
    };

    fetchEmployees();
  }, [shift]); // re-run when shift changes

  const handleAssign = async () => {
    try {
      if (!shift) return;
      const companyId = typeof shift.companyId === 'object' ? shift.companyId._id : shift.companyId;
      const employeeIds = (selectedEmployees || []).map((e) => e.value);
      if (!employeeIds.length) return;

      await assignShiftToEmployees({ shiftId: shift._id, employeeIds, companyId }, token);
      // refresh assigned list
      const resAssigned = await getEmployees(token, { shiftId: shift._id });
      const assigned = resAssigned?.success ? resAssigned.data : resAssigned?.data?.data || resAssigned?.data || [];
      setAssignedEmployees(Array.isArray(assigned) ? assigned : []);
      setSelectedEmployees([]);
      onSave?.();
      onClose?.();
    } catch (error) {
      console.error('Error assigning employees:', error);
    }
  };

  const handleRemove = async (employeeId) => {
    try {
      await removeEmployeeFromShift(employeeId, token);
      // refresh assigned list
      const resAssigned = await getEmployees(token, { shiftId: shift._id });
      const assigned = resAssigned?.success ? resAssigned.data : resAssigned?.data?.data || resAssigned?.data || [];
      setAssignedEmployees(Array.isArray(assigned) ? assigned : []);
      onSave?.();
    } catch (error) {
      console.error('Error removing employee:', error);
    }
  };

  // Build options: ensure we compare companyId consistently (string vs object)
  const companyIdStr = typeof shift?.companyId === 'object' ? shift.companyId._id : shift?.companyId;
  const employeeOptions = (allEmployees || [])
    .filter(emp => {
      // employee.companyId could be string or object
      const empCompany = typeof emp.companyId === 'object' ? emp.companyId._id : emp.companyId;
      return empCompany === companyIdStr;
    })
    .map((employee) => ({
      value: employee._id,
      label: `${employee.fullName} (${employee.newEmployeeCode || employee.employeeCode || ''})`,
    }));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Assign Employees to {shift?.name}</h3>
          <div className="mt-2">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Add Employees</label>
              <Select
                isMulti
                options={employeeOptions}
                value={selectedEmployees}
                onChange={setSelectedEmployees}
                className="mt-1"
                placeholder="Select employees..."
              />
              <button
                onClick={handleAssign}
                className="mt-2 px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700"
              >
                Assign
              </button>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-900">Assigned Employees</h4>
              <ul className="mt-2">
                {assignedEmployees.map((employee) => (
                  <li key={employee._id} className="flex justify-between items-center py-1">
                    <span>{employee.fullName} ({employee.newEmployeeCode || employee.employeeCode})</span>
                    <button
                      onClick={() => handleRemove(employee._id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md shadow-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {assignedEmployees.length === 0 && <li className="text-sm text-gray-500">No employees assigned.</li>}
              </ul>
            </div>
          </div>
          <div className="items-center px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftAssignmentModal;
