
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getEmployeeProfile } from '../api/employee';
import { getCompanies } from '../api/company';
import '../styles/Profile.css';

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [companyName, setCompanyName] = useState('-');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const defaultAvatar = '/default-avatar.png';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.employeeId) {
        setError('No employee ID found');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const [employeeData, companyData] = await Promise.all([
          getEmployeeProfile(user.employeeId, token),
          getCompanies(token),
        ]);

        if (employeeData.success) {
          const profileData = employeeData.data;
          
          if (profileData.joiningDate) {
            const today = new Date();
            const join = new Date(profileData.joiningDate);
            
            let years = today.getFullYear() - join.getFullYear();
            let months = today.getMonth() - join.getMonth();
            let days = today.getDate() - join.getDate();

            if (days < 0) {
              months--;
              days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
            }
            
            if (months < 0) {
              years--;
              months += 12;
            }
            
            const service = [];
            if (years > 0) service.push(`${years} year${years > 1 ? 's' : ''}`);
            if (months > 0) service.push(`${months} month${months > 1 ? 's' : ''}`);
            if (days > 0) service.push(`${days} day${days > 1 ? 's' : ''}`);
            
            profileData.ageOfService = service.length > 0 ? service.join(', ') : '0 days';
          }
          
          setProfile(profileData);
          
          const company = companyData.data.find(c => c._id === profileData.companyId);
          setCompanyName(company ? company.name : '-');
        } else {
          setError('Failed to fetch profile');
        }
      } catch (err) {
        setError(err.error || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const normalizeImageUrl = (url) => {
    if (!url) return defaultAvatar;
    return `${import.meta.env.VITE_API_URL}${url.replace(/\\/g, '/')}`;
  };

  if (loading) return <div className="profile-message">Loading profile...</div>;
  if (error) return <div className="profile-message profile-error">{error}</div>;
  if (!profile) return <div className="profile-message">No profile data available</div>;

  return (
    <div className="profile-container">
      <h2 className="profile-title">My Profile</h2>
      <div className="profile-card">
        <img
          src={profile.passportSizePhoto ? normalizeImageUrl(profile.passportSizePhoto) : defaultAvatar}
          alt="Profile"
          className="profile-image"
          onError={(e) => { e.target.src = defaultAvatar; }}
        />
        <div className="profile-details">
          <div className="profile-field">
            <span className="profile-label">Full Name:</span>
            <span className="profile-value">{profile.fullName || '-'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">HRMS ID:</span>
            <span className="profile-value">{profile.newEmployeeCode || '-'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{profile.email || '-'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Company:</span>
            <span className="profile-value">{companyName}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Department:</span>
            <span className="profile-value">{profile.department?.name || '-'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Designation:</span>
            <span className="profile-value">{profile.designation?.name || '-'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Joining Date:</span>
            <span className="profile-value">{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '-'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Age of Service:</span>
            <span className="profile-value">{profile.ageOfService || '-'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Status:</span>
            <span className="profile-value">{profile.employeeStatus || '-'}</span>
          </div>
          <div className="profile-field">
            <span className="profile-label">Role:</span>
            <span className="profile-value">{profile.role || '-'}</span>
          </div>
          {profile.personalPhoneNumber && (
            <div className="profile-field">
              <span className="profile-label">Phone Number:</span>
              <span className="profile-value">{profile.personalPhoneNumber}</span>
            </div>
          )}
          {profile.presentAddress && (
            <div className="profile-field">
              <span className="profile-label">Address:</span>
              <span className="profile-value">{profile.presentAddress}</span>
            </div>
          )}
          {profile.gender && (
            <div className="profile-field">
              <span className="profile-label">Gender:</span>
              <span className="profile-value">{profile.gender}</span>
            </div>
          )}
          {profile.dob && (
            <div className="profile-field">
              <span className="profile-label">Date of Birth:</span>
              <span className="profile-value">{new Date(profile.dob).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;