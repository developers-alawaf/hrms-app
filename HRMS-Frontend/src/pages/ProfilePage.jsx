import { useState, useEffect, useContext } from 'react';
import { AuthContext, DEFAULT_AVATAR } from '../context/AuthContext';
import { getEmployeeProfile, updateMyAvatar } from '../api/employee';
import { getCompanies } from '../api/company';
import { User, Briefcase, Phone, MapPin, Users, FileText } from 'lucide-react';
import '../styles/Profile.css';

const ProfilePage = () => {
  const { user, updateProfileImage } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [companyName, setCompanyName] = useState('-');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');

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

          const company = companyData.data.find((c) => c._id === profileData.companyId);
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

  const avatarDisplayUrl =
    previewImage || user?.profileImage || DEFAULT_AVATAR;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');
    setAvatarSuccess('');
    setPreviewImage(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('passportSizePhoto', file);

    setAvatarLoading(true);
    try {
      const token = localStorage.getItem('token');
      const result = await updateMyAvatar(formData, token);
      if (result.success) {
        const newPath = result.data?.passportSizePhoto;
        setProfile((prev) => ({
          ...prev,
          passportSizePhoto: newPath ?? prev.passportSizePhoto,
        }));
        if (typeof updateProfileImage === 'function' && newPath) {
          updateProfileImage(newPath);
        }
        setAvatarSuccess('Avatar updated successfully.');
        setPreviewImage(null);
      } else {
        setAvatarError(result.error || 'Failed to update avatar');
      }
    } catch (err) {
      setAvatarError(err.response?.data?.error || err.message || 'Failed to update avatar');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="profile-wrap">
        <div className="profile-loading">
          <div className="profile-loading-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="profile-wrap">
        <div className="profile-message profile-error">{error}</div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="profile-wrap">
        <div className="profile-message">No profile data available</div>
      </div>
    );
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : null);
  const display = (val, fallback = '-') =>
    val != null && val !== '' ? String(val) : fallback;

  const Field = ({ label, value, fallback, noCapitalize }) => (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className={`profile-field-value${noCapitalize ? ' profile-field-value--lowercase' : ''}`}>
        {display(value, fallback)}
      </span>
    </div>
  );

  const SectionCard = ({ icon: Icon, title, children, className = '' }) => (
    <section className={`profile-section-card ${className}`}>
      <h3 className="profile-section-heading">
        {Icon && <Icon className="profile-section-icon" size={20} />}
        {title}
      </h3>
      <div className="profile-section-body">{children}</div>
    </section>
  );

  return (
    <div className="profile-wrap">
      <h1 className="profile-page-title">My Profile -</h1>

      {/* Hero: Avatar + Name + ID */}
      <div className="profile-hero">
        <div className="profile-hero-avatar-wrap">
          <img
            src={avatarDisplayUrl}
            alt="Profile"
            className="profile-hero-avatar"
            onError={(e) => {
              if (e.target.src !== DEFAULT_AVATAR) e.target.src = DEFAULT_AVATAR;
            }}
          />
          <label className="profile-hero-avatar-edit">
            <span>Change photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={avatarLoading}
              aria-hidden="true"
            />
          </label>
          {avatarLoading && <span className="profile-hero-avatar-loading">Updating...</span>}
          {avatarError && <span className="profile-hero-avatar-err">{avatarError}</span>}
          {avatarSuccess && <span className="profile-hero-avatar-ok">{avatarSuccess}</span>}
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-hero-name">{display(profile.fullName)}</h2>
          <p className="profile-hero-id">HRMS ID: {display(profile.newEmployeeCode)}</p>
          {profile.designation?.name && (
            <p className="profile-hero-designation">{profile.designation.name}</p>
          )}
          {profile.department?.name && (
            <p className="profile-hero-department">{profile.department.name}</p>
          )}
        </div>
      </div>

      {/* Sections grid */}
      <div className="profile-grid">
        <SectionCard icon={User} title="Basic Information" className="profile-card-basic">
          <Field label="Full Name" value={profile.fullName} />
          <Field label="HRMS ID" value={profile.newEmployeeCode} />
          <Field label="Email" value={profile.email ? profile.email.toLowerCase() : null} noCapitalize />
          <Field label="Gender" value={profile.gender} />
          <Field label="Date of Birth" value={formatDate(profile.dob)} />
          <Field label="Blood Group" value={profile.bloodGroup} />
        </SectionCard>

        <SectionCard icon={Briefcase} title="Work Information" className="profile-card-work">
          <Field label="Company" value={companyName} />
          <Field label="Department" value={profile.department?.name} />
          <Field label="Designation" value={profile.designation?.name} />
          <Field label="Manager" value={profile.manager?.fullName} />
          <Field label="Manager Email" value={profile.manager?.email} noCapitalize />
          <Field label="Joining Date" value={formatDate(profile.joiningDate)} />
          <Field label="Last Working Day" value={formatDate(profile.lastWorkingDay)} />
          <Field label="Age of Service" value={profile.ageOfService} />
          <Field label="Status" value={profile.employeeStatus} />
          <Field label="Role" value={profile.role} />
        </SectionCard>

        <SectionCard icon={Phone} title="Contact" className="profile-card-contact">
          <Field label="Personal Phone" value={profile.personalPhoneNumber} />
          <Field label="Emergency Contact" value={profile.emergencyContactNumber} />
        </SectionCard>

        <SectionCard icon={MapPin} title="Address" className="profile-card-address">
          <Field label="Present Address" value={profile.presentAddress} />
          <Field label="Permanent Address" value={profile.permanentAddress} />
        </SectionCard>

        <SectionCard icon={Users} title="Family" className="profile-card-family">
          <Field label="Father's Name" value={profile.fatherName} />
          <Field label="Mother's Name" value={profile.motherName} />
        </SectionCard>

        <SectionCard icon={FileText} title="Other" className="profile-card-other">
          <Field label="NID / Passport" value={profile.nidPassportNumber} />
          <Field label="Has ID Card" value={profile.hasIdCard != null ? (profile.hasIdCard ? 'Yes' : 'No') : null} />
          <Field label="ID Card Status" value={profile.idCardStatus} />
          {(profile.separationReason || profile.separationRemarks) && (
            <>
              <Field label="Separation Reason" value={profile.separationReason} />
              <Field label="Separation Remarks" value={profile.separationRemarks} />
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default ProfilePage;
