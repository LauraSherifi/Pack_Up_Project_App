import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Button, Image } from 'react-bootstrap';
import ContactUs from '../pages/ContactUs';

const logo1 = '/img/logo1.png';

function MyNavbar() {
  const [showContactModal, setShowContactModal] = useState(false);
  const navigate = useNavigate();

  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.clear();
      navigate('/login', { replace: true });
      window.location.reload();
    }
  };

  const renderDashboardButton = () => {
    if (role === 'admin') {
      return (
        <Button
          as={NavLink}
          to="/admin"    // FIXED route here for admin dashboard
          variant="outline-light"
          className="px-3 py-2"
          style={dashboardButtonStyle}
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
          className="px-3 py-2"
          style={dashboardButtonStyle}
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
    fontFamily: 'TAN-St-Canard, sans-serif',
    fontWeight: 'bold',
    color: '#E0FECA',
    minWidth: '120px',
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
        <Container fluid="lg">
          <Navbar.Brand href="#" className="d-flex align-items-center me-md-5">
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
                fontFamily: 'TAN-St-Canard, sans-serif',
              }}
            >
              PackUp
            </span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-navbar" className="border-0">
            <span style={toggleLineStyle} />
            <span style={toggleLineStyle} />
            <span style={toggleLineStyle} />
          </Navbar.Toggle>

          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto align-items-center">
              <NavItem to="/home" icon="bi-house-door" label="Home" />
              <NavItem to="/AboutUs" icon="bi-info-circle" label="About Us" />
              <NavItem to="/reviews" icon="bi-star" label="Reviews" />
              <Nav.Link
                onClick={() => setShowContactModal(true)}
                className="mx-1 mx-md-2 px-3 py-2 rounded hover-effect text-E0FECA"
                style={navLinkStyle}
              >
                <i className="bi bi-envelope me-2"></i>
                Contact Us
              </Nav.Link>
            </Nav>

            <div className="d-flex flex-column flex-md-row align-items-center gap-2 my-2 my-md-0 ms-md-3">
              {username && (
                <span style={userStyle}>
                  Hi, <br /> {username} <br /> Registered as: {role}
                </span>
              )}

              {renderDashboardButton()}

              <Button
                variant="outline-light"
                className="px-3 px-md-4 py-2 d-flex align-items-center"
                style={logoutButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#25A18E')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Log Out
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <ContactUs show={showContactModal} onHide={() => setShowContactModal(false)} />
    </>
  );
}

const NavItem = ({ to, icon, label }) => (
  <Nav.Link
    as={NavLink}
    to={to}
    end
    className={({ isActive }) =>
      `mx-1 mx-md-2 px-3 py-2 rounded hover-effect ${
        isActive ? 'bg-E56E38 text-white' : 'text-E0FECA'
      }`
    }
    style={({ isActive }) => ({
      fontFamily: 'TAN-St-Canard, sans-serif',
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
  fontFamily: 'TAN-St-Canard, sans-serif',
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
  fontFamily: 'TAN-St-Canard, sans-serif',
  whiteSpace: 'nowrap',
};

const logoutButtonStyle = {
  borderWidth: '2px',
  borderRadius: '50px',
  transition: 'all 0.3s ease',
  minWidth: '120px',
  justifyContent: 'center',
  fontFamily: 'TAN-St-Canard, sans-serif',
  fontWeight: 'bold',
  color: '#E0FECA',
};

export default MyNavbar;
