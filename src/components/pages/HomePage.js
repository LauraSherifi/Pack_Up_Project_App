import React, { useState, useEffect } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const HomePage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeReviewTripId, setActiveReviewTripId] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({});
  const [reviewFeedback, setReviewFeedback] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [topTrips, setTopTrips] = useState([]);
  const [topTripsLoading, setTopTripsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const fallbackImg = '/img/slider1.jpg';
  const role = localStorage.getItem('role');

  const toggleReviewForm = (tripId) => {
    setActiveReviewTripId((prev) => (prev === tripId ? null : tripId));
  };

  const buildTopTrips = (tripList, reviewsByTripCache) => {
    if (!tripList.length) {
      setTopTrips([]);
      return;
    }

    setTopTripsLoading(true);

    try {
      const tripsWithRatings = tripList.map((trip) => {
        const tripReviews = reviewsByTripCache[trip.id] || [];
        const total = tripReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
        const averageRating = tripReviews.length ? total / tripReviews.length : 0;

        return {
          ...trip,
          averageRating,
          reviewCount: tripReviews.length,
        };
      });

      const sortedTrips = [...tripsWithRatings].sort((a, b) => {
        if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
        return b.reviewCount - a.reviewCount;
      });

      setTopTrips(sortedTrips.slice(0, 3));
    } finally {
      setTopTripsLoading(false);
    }
  };

  const handleReviewInputChange = (tripId, field, value) => {
    setReviewFormData((prev) => ({
      ...prev,
      [tripId]: {
        rating: prev[tripId]?.rating || '',
        comment: prev[tripId]?.comment || '',
        [field]: value,
      },
    }));
  };

  const handleReviewSubmit = async (e, tripId) => {
    e.preventDefault();
    setReviewSubmitting(true);
    const token = localStorage.getItem('token');
    const data = reviewFormData[tripId] || {};

    try {
      await axios.post(
        '/api/reviews',
        {
          tripId,
          trip_id: tripId,
          rating: Number(data.rating),
          comment: data.comment || '',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReviewFeedback((prev) => ({
        ...prev,
        [tripId]: { type: 'success', message: 'Review submitted successfully!' },
      }));
      setReviewFormData((prev) => ({
        ...prev,
        [tripId]: { rating: '', comment: '' },
      }));
      setActiveReviewTripId(null);

      try {
        const refreshedReviews = await axios.get(`/api/reviews/${tripId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        let updatedReviewsByTrip;
        // Note: reviewsByTrip state removed - using local variable only
        updatedReviewsByTrip = Array.isArray(refreshedReviews.data)
          ? refreshedReviews.data
          : refreshedReviews.data.reviews || [];

        try {
          buildTopTrips(trips, { [tripId]: updatedReviewsByTrip });
        } catch (buildError) {
          console.error('Top trips recalculation failed after refresh:', buildError);
        }
      } catch (refreshError) {
        console.error('Review saved but failed to refresh review list:', refreshError.response || refreshError);
      }
    } catch (err) {
      console.error('Error submitting review:', err.response || err);
      setReviewFeedback((prev) => ({
        ...prev,
        [tripId]: { type: 'error', message: 'Failed to submit review. Please try again.' },
      }));
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchTrips = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to view trips.');
        setLoading(false);
        return;
      }

      try {
        // Fetch trips and reviews in parallel (2 requests instead of 11)
        const [tripsRes, reviewsRes] = await Promise.all([
          axios.get('/api/trips', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('/api/reviews', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const fetchedTrips = tripsRes.data.trips || [];
        const allReviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : reviewsRes.data.reviews || [];

        // Group reviews by trip_id
        const groupedReviews = {};
        allReviews.forEach((review) => {
          const tripId = review.trip_id;
          if (!groupedReviews[tripId]) {
            groupedReviews[tripId] = [];
          }
          groupedReviews[tripId].push(review);
        });

        setTrips(fetchedTrips);
        buildTopTrips(fetchedTrips, groupedReviews);
      } catch (err) {
        console.error('❌ Error fetching data:', err.response || err);
        setError('Failed to fetch trips. Please check your login or server.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  return (
    <div className="home-page" style={{ background: '#fff' }}>
      {/* Hero */}
      <div className="position-relative mx-4 mb-5">
        <div className="position-absolute top-50 start-50 translate-middle text-white text-center z-2"
          style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
          <h1 className="fw-bold display-4 mb-3">Welcome</h1>
          <p className="fs-4">Let's plan our next trip together</p>
        </div>
        <Carousel interval={6000} pause={false}>
          {['slider1.jpg', 'slider2.jpg', 'slider3.jpg'].map((img, idx) => (
            <Carousel.Item key={idx}>
              <img
                className="d-block w-100"
                src={`/img/${img}`}
                alt={`Slide ${idx + 1}`}
                loading="lazy"
                style={{ height: '60vh', objectFit: 'cover' }}
              />
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      {/* Intro */}
      <div className="text-center mb-4 px-3">
        <h2>Explore the World with Us</h2>
        <hr className="mx-auto" style={{ width: '80%', maxWidth: '850px' }} />
        <p className="lead">Travel opens your mind, expands your horizons, and connects you with the beauty of the world.</p>
      </div>

      {/* Trips */}
      <Container className="py-4">
        <h3 className="text-center mb-4">Top Rated Trips</h3>
        {topTripsLoading && <p className="text-center">Calculating top trips...</p>}
        {!topTripsLoading && topTrips.length > 0 && (
          <Row className="mb-5">
            {topTrips.map((trip, index) => (
              <Col key={`top-${trip.id}`} xs={12} md={4} className="mb-3">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body>
                    <Card.Title className="mb-2">
                      #{index + 1} {trip.title}
                    </Card.Title>
                    <Card.Text className="mb-1">
                      ⭐ {trip.averageRating.toFixed(1)} ({trip.reviewCount} reviews)
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <h3 className="text-center mb-4">Our Destinations</h3>
        {loading && <p className="text-center">Loading trips...</p>}
        {error && <p className="text-danger text-center">{error}</p>}

        <Row>
          {!loading && !error && trips.length === 0 && (
            <p className="text-center">No trips found.</p>
          )}

          {trips.map((trip) => (
            <Col key={trip.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  <Card.Img
                    variant="top"
                    src={trip.img || fallbackImg}
                    alt={trip.title}
                    loading="lazy"
                    className="w-100 h-100"
                    style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = fallbackImg;
                    }}
                  />
                </div>
                <Card.Body className="d-flex flex-column justify-content-between">
                  <div>
                    <Card.Title>{trip.title}</Card.Title>
                  </div>
                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    <Button
                      style={{ backgroundColor: '#4a90e2', border: 'none', borderRadius: '20px', padding: '8px 20px' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a7bc8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4a90e2')}
                      onClick={() => {
                        setSelectedTrip(trip);
                        setShowModal(true);
                      }}
                    >
                      View Details
                    </Button>
                    {role === 'user' && (
                      <Button
                        style={{ backgroundColor: '#4a90e2', border: 'none', borderRadius: '20px', padding: '8px 20px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a7bc8')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4a90e2')}
                        onClick={() => toggleReviewForm(trip.id)}
                      >
                        Leave a Review
                      </Button>
                    )}
                  </div>
                  {role === 'user' && activeReviewTripId === trip.id && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        borderRadius: '0.375rem'
                      }}
                    >
                      <Form
                        className="mt-3"
                        onSubmit={(e) => handleReviewSubmit(e, trip.id)}
                        style={{
                          backgroundColor: 'white',
                          padding: '24px',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          width: '90%',
                          maxWidth: '420px',
                          position: 'relative'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleReviewForm(trip.id)}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#666',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          ×
                        </button>
                        <Form.Group className="mb-2">
                          <Form.Label>Rating (1-5)</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            max="5"
                            value={reviewFormData[trip.id]?.rating || ''}
                            onChange={(e) => handleReviewInputChange(trip.id, 'rating', e.target.value)}
                            required
                          />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Comment</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={reviewFormData[trip.id]?.comment || ''}
                            onChange={(e) => handleReviewInputChange(trip.id, 'comment', e.target.value)}
                            placeholder="Write your review..."
                            required
                          />
                        </Form.Group>
                        <Button
                          type="submit"
                          disabled={reviewSubmitting}
                          style={{ backgroundColor: '#4a90e2', border: 'none', borderRadius: '20px', padding: '8px 20px' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a7bc8')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4a90e2')}
                        >
                          {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </Form>
                    </div>
                  )}
                  {role === 'user' && reviewFeedback[trip.id] && (
                    <p
                      className={`mt-2 mb-0 ${
                        reviewFeedback[trip.id].type === 'success' ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {reviewFeedback[trip.id].message}
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Trip Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Trip Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTrip && (
            <div>
              <img
                src={selectedTrip.img || fallbackImg}
                alt={selectedTrip.title}
                className="img-fluid mb-3"
                style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
                loading="lazy"
              />
              <h4 className="mb-3">Trip to: {selectedTrip.title}</h4>
              <p><strong>Description:</strong> {selectedTrip.description}</p>
              <p><strong>Start Date:</strong> {selectedTrip.startDate ? new Date(selectedTrip.startDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>End Date:</strong> {selectedTrip.endDate ? new Date(selectedTrip.endDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => setShowModal(false)}>
            Join Trip
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HomePage;
