import React from 'react';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaGoogle, 
  FaInstagram, 
  FaLinkedinIn, 
  FaGithub 
} from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const Footer = () => {
  const socialIcons = [
    { icon: <FaFacebookF />, key: 'facebook', color: '#25A18E' },
    { icon: <FaTwitter />, key: 'twitter', color: '#93C86D' },
    { icon: <FaGoogle />, key: 'google', color: '#E56E38' },
    { icon: <FaInstagram />, key: 'instagram', color: '#F3B550' },
    { icon: <FaLinkedinIn />, key: 'linkedin', color: '#CE8042' },
    { icon: <FaGithub />, key: 'github', color: '#004E64' }
  ];

  return (
    <footer className="text-center" style={{ 
      backgroundColor: '#004E64',
      color: '#E0FECA',
      fontFamily: 'var(--packup-font)'
    }}>
      <div className="container py-4 pb-0">
        <section className="mb-4">
          {socialIcons.map((social) => (
            <button
              key={social.key}
              className="btn btn-floating m-1"
              type="button"
              aria-label={social.key}
              style={{
                color: '#E0FECA',
                backgroundColor: social.color,
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#E0FECA';
                e.currentTarget.style.color = social.color;
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = social.color;
                e.currentTarget.style.color = '#E0FECA';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {social.icon}
            </button>
          ))}
        </section>
      </div>

      <div 
        className="text-center p-3" 
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          fontFamily: 'var(--packup-font)'
        }}
      >
        © {new Date().getFullYear()} PackUp Travel
        <a className="text-white ms-1" href="/">
          All Rights Reserved
        </a>
      </div>
    </footer>
  );
};

export default Footer;
