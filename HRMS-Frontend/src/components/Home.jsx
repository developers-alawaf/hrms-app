import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Calendar, Mail, Shield, ArrowRight, Sparkles } from 'lucide-react';
import '../styles/Home.css';

const Home = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <Users className="w-10 h-10" />,
      title: 'Employee Management',
      description: 'Easily create, update, and manage employee profiles with comprehensive details.',
    },
    {
      icon: <Calendar className="w-10 h-10" />,
      title: 'Attendance Tracking',
      description: 'Monitor employee attendance with date range filters and detailed reports.',
    },
    {
      icon: <Mail className="w-10 h-10" />,
      title: 'Secure Invitation System',
      description: 'Invite employees securely with automated email invitations and account activation.',
    },
    {
      icon: <Shield className="w-10 h-10" />,
      title: 'Role-Based Access',
      description: 'Customized dashboards and permissions for Super Admins, HR Managers, and Employees.',
    },
  ];

  return (
    <div className="home-container">
      {/* Animated background particles */}
      <div className="particle-background">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i}`} />
        ))}
      </div>

      {/* Hero Section */}
      <header className={`hero-section ${isVisible ? 'fade-in' : ''}`}>
        <div className="hero-content">
          <div className="logo-container">
            <div className="logo-glow" />
            <img src="/logo-al.svg" alt="Alawaf HRMS Logo" className="home-logo animate-float" />
          </div>
          <h1 className="hero-title">Welcome to Alawaf HRMS</h1>
          <p className="hero-subtitle">
            Streamline your HR operations with our powerful and intuitive platform.
            <Sparkles className="sparkles-icon" />
          </p>
          <Link to="/login" className="login-button">
            <span>Login to Get Started</span>
            <ArrowRight className="arrow-icon" />
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="features-title">Why Choose Alawaf HRMS?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`feature-card feature-card-${index}`}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-glow" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your HR?</h2>
          <p className="cta-subtitle">
            Join thousands of businesses using Alawaf HRMS to manage their workforce efficiently.
          </p>
          <Link to="/login" className="login-button cta-button">
            <span>Login Now</span>
            <ArrowRight className="arrow-icon" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;