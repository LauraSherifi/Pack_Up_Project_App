import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Card, Button, Form, Modal, Container, Row, Col } from 'react-bootstrap';
import { getAuthItem } from '../../utills/auth';

const PlannerDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    img: null
  });

  const token = getAuthItem('token');

  const fetchTrips = useCallback(async () => {
    try {
      const response = await axios.get('/api/trips/my-trips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrips(response.data.trips || []);
    } catch (err) {
      console.error('Error fetching your trips:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'img') {
      setForm({ ...form, img: files[0] }); // Save file object
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('startDate', form.startDate);
      formData.append('endDate', form.endDate);
      if (form.img) {
        formData.append('img', form.img);
      }

      if (editingTrip) {
        await axios.put(`/api/trips/${editingTrip.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/trips', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      fetchTrips();
      closeForm();
    } catch (err) {
      console.error('Error saving trip:', err);
    }
  };

  const handleDelete = async (id) => {
   const confirmDelete = window.confirm('Are you sure you want to delete this trip?');
   if (!confirmDelete) return;
    try {
      await axios.delete(`/api/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTrips();
    } catch (err) {
      console.error('Error deleting trip:', err);
    }
  };

  const openEditModal = (trip) => {
    setEditingTrip(trip);
    setForm({
      title: trip.title || '',
      description: trip.description || '',
      startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
      endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
      img: null // Reset to null; user can re-upload
    });
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditingTrip(null);
    setForm({ title: '', description: '', startDate: '', endDate: '', img: null });
  };

  return (
    <Container className="my-4">
      <h2 className="packup-section-title text-center mb-4">My Trip Cards</h2>
      <Button onClick={() => setShowModal(true)} className="mb-4">
        Add New Trip
      </Button>

      <Row>
        {trips.map((trip) => (
          <Col md={4} key={trip.id} className="mb-4">
            <Card>
              <Card.Img
                variant="top"
                src={trip.img || '/img/slider1.jpg'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/img/slider1.jpg';
                }}
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <Card.Body>
                <Card.Title className="packup-card-title">{trip.title}</Card.Title>
                <Card.Text>{trip.description}</Card.Text>
                <Button variant="primary" onClick={() => openEditModal(trip)} className="me-2">
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(trip.id)}>
                  Delete
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={closeForm}>
        <Modal.Header closeButton>
          <Modal.Title className="packup-modal-title">{editingTrip ? 'Edit Trip' : 'Add New Trip'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Title</Form.Label>
              <Form.Control type="text" name="title" value={form.title} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" name="description" value={form.description} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" name="startDate" value={form.startDate} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" name="endDate" value={form.endDate} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Trip Image</Form.Label>
              <Form.Control type="file" name="img" accept="image/*" onChange={handleInputChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeForm}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PlannerDashboard;
