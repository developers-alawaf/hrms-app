import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getEmployeeProfile } from '../api/employee';

export const AuthContext = createContext();

export const buildProfileImageUrl = (path) => {
  if (!path) return null;
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const normalized = String(path).replace(/\\/g, '/').replace(/^\//, '');
  return base ? `${base}/${normalized}` : `/${normalized}`;
};

export const DEFAULT_AVATAR = '/default-avatar.png';

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
            profileImage: buildProfileImageUrl(decoded.passportSizePhoto) || null,
          };

          // Always fetch profile when we have employeeId so profileImage matches API (same as Profile page)
          if (decoded.employeeId) {
            const response = await getEmployeeProfile(decoded.employeeId, token);
            if (response.success) {
              userData.fullName = userData.fullName || response.data.fullName;
              userData.profileImage = buildProfileImageUrl(response.data.passportSizePhoto) || null;
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
            profileImage: buildProfileImageUrl(decoded.passportSizePhoto) || null,
        };

        if (decoded.employeeId) {
          const response = await getEmployeeProfile(decoded.employeeId, token);
          if (response.success) {
            setUser({
              ...userData,
              fullName: userData.fullName || response.data.fullName,
              profileImage: buildProfileImageUrl(response.data.passportSizePhoto) || null,
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

  const updateProfileImage = (passportSizePhotoPath) => {
    setUser((prev) =>
      prev
        ? { ...prev, profileImage: buildProfileImageUrl(passportSizePhotoPath) || DEFAULT_AVATAR }
        : prev
    );
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateProfileImage }}>
      {children}
    </AuthContext.Provider>
  );
};