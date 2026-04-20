import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Button, Image, Offcanvas } from 'react-bootstrap';
import ContactUs from '../pages/ContactUs';
import { getAuthItem, logout } from '../../utills/auth';

const logo1 = '/img/logo1.png';

function MyNavbar() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  const username = getAuthItem('username');
  const role = getAuthItem('role');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      setShowMobileMenu(false);
      logout();
      navigate('/login', { replace: true });
      window.location.reload();
    }
  };

  const openContactModal = () => {
    setShowMobileMenu(false);
    setShowContactModal(true);
  };

  const renderDashboardButton = () => {
    if (role === 'admin') {
      return (
        <Button
          as={NavLink}
          to="/admin"    // FIXED route here for admin dashboard
          variant="outline-light"
          className="px-3 py-2 navbar-action-button"
          style={dashboardButtonStyle}
          onClick={() => setShowMobileMenu(false)}
          onMouseEnter={(e) => hoverStyle(e, true)}
          onMouseLeave={(e) => hoverStyle(e, false)}
        >
          Admin Dashboard
        </Button>
      );
    }
    if (role === 'trip_planner') {
      return (
        <Button
          as={NavLink}
          to="/planner-dashboard"  // Ensure this matches your route setup
          variant="outline-light"
          className="px-3 py-2 navbar-action-button"
          style={dashboardButtonStyle}
          onClick={() => setShowMobileMenu(false)}
          onMouseEnter={(e) => hoverStyle(e, true)}
          onMouseLeave={(e) => hoverStyle(e, false)}
        >
          Planner Dashboard
        </Button>
      );
    }
    return null;
  };

  const dashboardButtonStyle = {
    borderRadius: '50px',
    fontFamily: 'var(--packup-font)',
    fontWeight: 'bold',
    color: '#E0FECA',
    minWidth: 'max-content',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
  };

  const hoverStyle = (e, isHover) => {
    e.currentTarget.style.backgroundColor = isHover ? '#FFE66D' : 'transparent';
    e.currentTarget.style.color = isHover ? '#004E64' : '#E0FECA';
  };

  return (
    <>
      <Navbar
        expand="xxl"
        className="shadow-sm py-2 sticky-top"
        style={{ backgroundColor: 'rgb(0, 78, 100)' }}
      >
        <Container fluid className="px-3 px-xxl-4">
          <Navbar.Brand href="#" className="d-flex align-items-center me-3 me-xxl-4">
            <Image
              src={logo1}
              alt="Logo"
              width="60"
              height="60"
              className="d-inline-block align-top me-3"
              style={{
                borderRadius: '50%',
                border: '2px solid #E0FECA',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#E0FECA',
                fontFamily: 'var(--packup-font)',
              }}
            >
              PackUp
            </span>
          </Navbar.Brand>

          <Navbar.Toggle
            aria-controls="mobile-navbar"
            aria-label="Open navigation menu"
            className="packup-navbar-toggle border-0 d-xxl-none"
            onClick={() => setShowMobileMenu(true)}
          >
            <span style={toggleLineStyle} />
            <span style={toggleLineStyle} />
            <span style={toggleLineStyle} />
          </Navbar.Toggle>

          <div className="d-none d-xxl-flex align-items-center flex-grow-1 navbar-desktop-row">
            <Nav className="me-auto align-items-center navbar-desktop-links">
              <NavItem to="/home" icon="bi-house-door" label="Home" />
              <NavItem to="/AboutUs" icon="bi-info-circle" label="About Us" />
              <NavItem to="/reviews" icon="bi-star" label="Reviews" />
              <NavItem to="/notifications" icon="bi-bell" label="Notifications" />
              <Nav.Link
                onClick={openContactModal}
                className="navbar-link mx-1 px-3 py-2 rounded hover-effect text-E0FECA"
                style={navLinkStyle}
              >
                <i className="bi bi-envelope me-2"></i>
                Contact Us
              </Nav.Link>
            </Nav>

            <div className="d-flex flex-column flex-md-row align-items-center gap-2 my-2 my-md-0 ms-md-2 navbar-user-actions">
              {username && (
                <span style={userStyle}>
                  Hi, <br /> {username} <br /> Registered as: {role}
                </span>
              )}

              {renderDashboardButton()}

              <Button
                variant="outline-light"
                className="px-3 px-md-4 py-2 d-flex align-items-center navbar-action-button"
                style={logoutButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#25A18E')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Log Out
              </Button>
            </div>
          </div>
        </Container>
      </Navbar>

      <Offcanvas
        show={showMobileMenu}
        onHide={() => setShowMobileMenu(false)}
        placement="end"
        id="mobile-navbar"
        className="d-xxl-none"
        style={{ backgroundColor: 'rgb(0, 78, 100)', color: '#E0FECA', width: '310px' }}
      >
        <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-light border-opacity-25">
          <Offcanvas.Title className="d-flex align-items-center gap-3">
            <Image
              src={logo1}
              alt="Logo"
              width="48"
              height="48"
              style={{
                borderRadius: '50%',
                border: '2px solid #E0FECA',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
            <span
              style={{
                fontSize: '1.35rem',
                fontWeight: '700',
                color: '#E0FECA',
                fontFamily: 'var(--packup-font)',
              }}
            >
              PackUp
            </span>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column gap-4">
          <Nav className="d-flex flex-column align-items-stretch gap-2">
            <NavItem to="/home" icon="bi-house-door" label="Home" onClick={() => setShowMobileMenu(false)} />
            <NavItem to="/AboutUs" icon="bi-info-circle" label="About Us" onClick={() => setShowMobileMenu(false)} />
            <NavItem to="/reviews" icon="bi-star" label="Reviews" onClick={() => setShowMobileMenu(false)} />
            <NavItem to="/notifications" icon="bi-bell" label="Notifications" onClick={() => setShowMobileMenu(false)} />
            <Nav.Link
              onClick={openContactModal}
              className="px-3 py-2 rounded text-E0FECA"
              style={{ ...navLinkStyle, textAlign: 'left' }}
            >
              <i className="bi bi-envelope me-2"></i>
              Contact Us
            </Nav.Link>
          </Nav>

          <div className="mt-auto d-flex flex-column align-items-stretch gap-3">
            {username && (
              <span style={{ ...userStyle, marginRight: 0, whiteSpace: 'normal' }}>
                Hi, <br /> {username} <br /> Registered as: {role}
              </span>
            )}

            {renderDashboardButton()}

            <Button
              variant="outline-light"
              className="px-4 py-2 d-flex align-items-center"
              style={logoutButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#25A18E')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Log Out
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <ContactUs show={showContactModal} onHide={() => setShowContactModal(false)} />
    </>
  );
}

const NavItem = ({ to, icon, label, onClick }) => (
  <Nav.Link
    as={NavLink}
    to={to}
    end
    onClick={onClick}
    className={({ isActive }) =>
      `navbar-link mx-1 px-3 py-2 rounded hover-effect ${
        isActive ? 'bg-E56E38 text-white' : 'text-E0FECA'
      }`
    }
    style={({ isActive }) => ({
      fontFamily: 'var(--packup-font)',
      fontWeight: 'bold',
      backgroundColor: isActive ? '#E56E38' : 'transparent',
      color: isActive ? '#004E64' : '#E0FECA',
      borderRadius: '20px',
      transition: 'all 0.3s',
    })}
  >
    <i className={`bi ${icon} me-2`}></i>
    {label}
  </Nav.Link>
);

const toggleLineStyle = {
  display: 'block',
  width: '25px',
  height: '3px',
  backgroundColor: '#E0FECA',
  margin: '5px 0',
  transition: 'all 0.3s ease',
};

const navLinkStyle = {
  fontFamily: 'var(--packup-font)',
  fontWeight: 'bold',
  color: '#E0FECA',
  borderRadius: '20px',
  transition: 'all 0.3s',
};

const userStyle = {
  color: '#E0FECA',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  marginRight: '1rem',
  fontFamily: 'var(--packup-font)',
  whiteSpace: 'nowrap',
};

const logoutButtonStyle = {
  borderWidth: '2px',
  borderRadius: '50px',
  transition: 'all 0.3s ease',
  minWidth: 'max-content',
  justifyContent: 'center',
  fontFamily: 'var(--packup-font)',
  fontWeight: 'bold',
  color: '#E0FECA',
  whiteSpace: 'nowrap',
};

export default MyNavbar;
