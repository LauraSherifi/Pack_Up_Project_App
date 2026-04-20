import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const ContactUs = ({ show, onHide }) => {
  const isModal = typeof show === 'boolean';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setStatus('error');
    }
  };

  const contactBody = (
    <div className="contact-panel p-3">
        <div className="container-fluid">
          <div className="row">
            {/* Left Column - Contact Info */}
            <div className="contact-info-column col-md-6 p-4">
              <div className="contact-info-item mb-4">
                <h5 className="packup-card-title">CALL US</h5>
                <p>1 (234) 567-891, 1 (234) 987-654</p>
              </div>
              <div className="contact-info-item mb-4">
                <h5 className="packup-card-title">LOCATION</h5>
                <p>
                  121 Rock Street, 21 Avenue, New York, NY<br />92 (03) 9000
                </p>
              </div>
              <div className="contact-info-item mb-4">
                <h5 className="packup-card-title">BUSINESS HOURS</h5>
                <p>
                  Mon - Fri: 10 am - 8 pm<br />Sat, Sun: Closed
                </p>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="contact-form-column col-md-6 p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="contact-input form-control" 
                    placeholder="Enter your Name" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <input 
                    type="email" 
                    className="contact-input form-control" 
                    placeholder="Enter a valid email address" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <textarea 
                    className="contact-input form-control" 
                    rows="5" 
                    placeholder="Enter your message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>
                <Button 
                  variant="success" 
                  type="submit" 
                  className="contact-submit w-100"
                >
                  Submit
                </Button>
                {status === 'loading' && <p className="text-center mt-2">Sending...</p>}
                {status === 'success' && <p className="text-success text-center mt-2">Message sent successfully!</p>}
                {status === 'error' && <p className="text-danger text-center mt-2">Failed to send message. Try again.</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
  );

  if (!isModal) {
    return (
      <div className="container py-5">
        <div className="contact-shell shadow overflow-hidden">
          <div className="contact-header p-3">
            <h2 className="packup-section-title m-0">Contact Us</h2>
          </div>
          {contactBody}
        </div>
      </div>
    );
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" dialogClassName="contact-modal">
      <Modal.Header closeButton className="contact-header border-0">
        <Modal.Title className="packup-modal-title">Contact Us</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {contactBody}
      </Modal.Body>
    </Modal>
  );
};

export default ContactUs;
