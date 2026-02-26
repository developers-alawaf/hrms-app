import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getLeaveRequests } from '../api/leave';
import { AuthContext } from './AuthContext';

export const PendingRequestsContext = createContext();

export const PendingRequestsProvider = ({ children }) => {
  const { user } = useContext(AuthContext) || {};
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [pendingRemoteCount, setPendingRemoteCount] = useState(0);

  const refreshPendingCounts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const data = await getLeaveRequests(token);
      if (data.success && Array.isArray(data.data)) {
        const leave = data.data.filter(
          (r) => (r.type || '').toLowerCase() !== 'remote' && (r.status || '').toLowerCase() === 'pending'
        );
        const remote = data.data.filter(
          (r) => (r.type || '').toLowerCase() === 'remote' && (r.status || '').toLowerCase() === 'pending'
        );
        setPendingLeaveCount(leave.length);
        setPendingRemoteCount(remote.length);
      }
    } catch {
      setPendingLeaveCount(0);
      setPendingRemoteCount(0);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshPendingCounts();
    } else {
      setPendingLeaveCount(0);
      setPendingRemoteCount(0);
    }
  }, [user, refreshPendingCounts]);

  return (
    <PendingRequestsContext.Provider value={{ pendingLeaveCount, pendingRemoteCount, refreshPendingCounts }}>
      {children}
    </PendingRequestsContext.Provider>
  );
};

export const usePendingRequests = () => useContext(PendingRequestsContext);
