import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getEmployeeProfile } from '../api/employee';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded && decoded.id && decoded.email && decoded.role) {
          const userData = {
            id: decoded.id,
            fullName: decoded.fullName || null,
            email: decoded.email,
            role: decoded.role,
            employeeId: decoded.employeeId,
            companyId: decoded.companyId,
            profileImage: decoded.passportSizePhoto
              ? `${import.meta.env.VITE_API_URL}${decoded.passportSizePhoto}`
              : null,
          };

          // Fetch fullName from API if missing in token
          if (!userData.fullName && decoded.employeeId) {
            const response = await getEmployeeProfile(decoded.employeeId, token);
            if (response.success) {
              userData.fullName = response.data.fullName;
              userData.profileImage = response.data.passportSizePhoto
                ? `${import.meta.env.VITE_API_URL}${response.data.passportSizePhoto}`
                : null;
              userData.department = response.data.department;
            } else {
              localStorage.removeItem('token');
              setUser(null);
              setLoading(false);
              return;
            }
          }
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error('Error decoding token or fetching profile:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (token) => {
    localStorage.setItem('token', token);
    try {
      const decoded = jwtDecode(token);
      if (decoded && decoded.id && decoded.email && decoded.role) {
        const userData = {
          id: decoded.id,
          fullName: decoded.fullName || null,
          email: decoded.email,
          role: decoded.role,
          employeeId: decoded.employeeId,
          companyId: decoded.companyId,
          profileImage: decoded.passportSizePhoto
            ? `${import.meta.env.VITE_API_URL}${decoded.passportSizePhoto}`
            : null,
        };

        if (!userData.fullName && decoded.employeeId) {
          const response = await getEmployeeProfile(decoded.employeeId, token);
          if (response.success) {
            setUser({
              ...userData,
              fullName: response.data.fullName,
              profileImage: response.data.passportSizePhoto
                ? `${import.meta.env.VITE_API_URL}${response.data.passportSizePhoto}`
                : null,
              department: response.data.department,
            });
          } else {
            localStorage.removeItem('token');
            setUser(null);
            return { success: false, error: 'Failed to fetch employee profile' };
          }
        } else {
          setUser(userData);
        }
        return { success: true };
      } else {
        localStorage.removeItem('token');
        setUser(null);
        return { success: false, error: 'Invalid token payload' };
      }
    } catch (error) {
      console.error('Error during login:', error);
      localStorage.removeItem('token');
      setUser(null);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};