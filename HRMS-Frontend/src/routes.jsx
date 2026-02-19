import InitialSetupPage from './pages/InitialSetupPage';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PresentTodayPage from './pages/PresentTodayPage';
import AbsentTodayPage from './pages/AbsentTodayPage';
import RemoteTodayPage from './pages/RemoteTodayPage';
import LeaveTodayPage from './pages/LeaveTodayPage';
import EmployeeListPage from './pages/EmployeeListPage';
import EmployeeCreatePage from './pages/EmployeeCreatePage';
import EmployeeUpdatePage from './pages/EmployeeUpdatePage';
import CompanyCreatePage from './pages/CompanyCreatePage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AttendanceListPage from './pages/AttendanceListPage';
import AttendanceAdjustmentRequestPage from './pages/AttendanceAdjustmentRequestPage';
import LeavePolicyPage from './pages/LeavePolicyPage';
import LeaveEntitlementPage from './pages/LeaveEntitlementPage';
import CreateDepartmentPage from './pages/CreateDepartmentPage';
import CreateDesignationPage from './pages/CreateDesignationPage';
import LeaveList from './components/LeaveList';
import LeaveSummaryPage from './pages/LeaveSummaryPage';
import RemoteList from './components/RemoteList';
import ProfilePage from './pages/ProfilePage';
import DocumentListPage from './pages/DocumentListPage';
import AllLeaveHistoryPage from './pages/AllLeaveHistoryPage';
import AllLeaveRequestsPage from './pages/AllLeaveRequestsPage';
import EmployeeLeaveBalancePage from './pages/EmployeeLeaveBalancePage';
import MyLeaveBalancePage from './pages/MyLeaveBalancePage';
import CommonDocumentsPage from './pages/CommonDocumentsPage';
import DepartmentListPage from './pages/DepartmentListPage';
import DesignationListPage from './pages/DesignationListPage';
import ShiftingRoster from './pages/ShiftingRoster';
import ShiftManagement from './pages/ShiftManagement/ShiftManagement';
import RosterManagement from './pages/ShiftManagement/RosterManagement';
import ShiftAttendance from './pages/ShiftManagement/ShiftAttendance';
import WFHRequests from './pages/ShiftManagement/WFHRequests';
import OutsideWorkRequests from './pages/ShiftManagement/OutsideWorkRequests';
import EmployeeRoster from './pages/ShiftManagement/EmployeeRoster';
import HolidayPage from './pages/HolidayPage';
import ShiftTemplatePage from './pages/ShiftTemplatePage';
import SendEmailPage from './pages/SendEmailPage';
import { AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, allowedDepartments }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles && !allowedDepartments) {
    return children;
  }

  if (user.role === 'Super Admin') {
    return children;
  }

  if (allowedRoles && allowedRoles.includes(user.role)) {
    return children;
  }

  if (allowedDepartments && user.department && allowedDepartments.some(dep => user.department.name.toLowerCase().includes(dep))) {
    return children;
  }

  return <Navigate to="/dashboard" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <HomePage />,
        // element: <PublicRoute><HomePage /></PublicRoute>,
      },
      {
        path: '/login',
        element: <PublicRoute><LoginPage /></PublicRoute>,
      },
      {
        path: '/initial-setup',
        element: <PublicRoute><InitialSetupPage /></PublicRoute>,
      },
      {
        path: '/accept-invitation',
        element: <PublicRoute><AcceptInvitationPage /></PublicRoute>,
      },
      {
        path: '/reset-password',
        element: <PublicRoute><ResetPasswordPage /></PublicRoute>,
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/present-today',
        element: (
          <ProtectedRoute>
            <PresentTodayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/absent-today',
        element: (
          <ProtectedRoute>
            <AbsentTodayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/remote-today',
        element: (
          <ProtectedRoute>
            <RemoteTodayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/leave-today',
        element: (
          <ProtectedRoute>
            <LeaveTodayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employees',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager', , 'C-Level Executive']}>
            <EmployeeListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employees/create',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <EmployeeCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employees/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <EmployeeUpdatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/companies/create',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin']}>
            <CompanyCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance',
        element: (
          <ProtectedRoute>
            <AttendanceListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance/adjustments',
        element: (
          <ProtectedRoute allowedRoles={['Employee', 'Manager', 'HR Manager', 'Super Admin', 'Company Admin', 'C-Level Executive']}>
            <AttendanceAdjustmentRequestPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/company',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager', 'C-Level Executive']}>
            <CompanyCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/change-password',
        element: (
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/leave',
        element: (
          <ProtectedRoute>
            <LeaveList />
          </ProtectedRoute>
        ),
      },
      {
        path: '/leave/policy',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager', 'C-Level Executive']}>
            <LeavePolicyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/leave/entitlements',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager', 'C-Level Executive']}>
            <LeaveEntitlementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/leave/summary',
        element: (
          <ProtectedRoute>
            <LeaveSummaryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/departments/create',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <CreateDepartmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/designations/create',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <CreateDesignationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/departments',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <DepartmentListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/designations',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <DesignationListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/remote',
        element: (
          <ProtectedRoute>
            <RemoteList />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/documents',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager', 'C-Level Executive']}>
            <DocumentListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/leave/history',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'HR Manager']}>
            <AllLeaveHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/leave/all',
        element: (
          <ProtectedRoute allowedRoles={['HR Manager']}>
            <AllLeaveRequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/leave/balance',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'HR Manager']}>
            <EmployeeLeaveBalancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my-leave-balance',
        element: (
          <ProtectedRoute allowedRoles={['Employee', 'Manager', 'HR Manager', 'Super Admin', 'Company Admin', 'C-Level Executive']}>
            <MyLeaveBalancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/documents/common',
        element: (
          <ProtectedRoute>
            <CommonDocumentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/company-policies',
        element: (
          <ProtectedRoute>
            <CommonDocumentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shifts',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <ShiftManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shift-templates',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <ShiftTemplatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shifting-roster',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <ShiftingRoster />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shift-management/shifts',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager', 'Manager', 'Employee']} allowedDepartments={['noc']}>
            <ShiftManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shift-management/roster',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager', 'Manager', 'Employee']} allowedDepartments={['noc']}>
            <RosterManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shift-management/attendance',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager', 'Manager', 'Employee']} allowedDepartments={['noc']}>
            <ShiftAttendance />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shift-management/wfh',
        element: (
          <ProtectedRoute>
            <WFHRequests />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shift-management/outside-work',
        element: (
          <ProtectedRoute>
            <OutsideWorkRequests />
          </ProtectedRoute>
        ),
      },
      /*
      {
        path: '/shifting-roster/employee-roster',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'Company Admin', 'HR Manager']}>
            <EmployeeRoster />
          </ProtectedRoute>
        ),
      },
      */
      {
        path: '/holidays',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin', 'HR Manager']}>
            <HolidayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/send-email',
        element: (
          <ProtectedRoute allowedRoles={['Super Admin']}>
            <SendEmailPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export { router };