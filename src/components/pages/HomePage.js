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
import { getAuthItem } from '../../utills/auth';

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
  const [allReviews, setAllReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [tripSearchTerm, setTripSearchTerm] = useState('');
  const [tripSearchResults, setTripSearchResults] = useState([]);
  const [tripSearchLoading, setTripSearchLoading] = useState(false);
  const [tripSearchError, setTripSearchError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const fallbackImg = '/img/slider1.jpg';
  const role = getAuthItem('role');
  const currentUserId = getAuthItem('userId');

  const getCurrentUserReviewForTrip = (tripId) => {
    if (myReviews.length > 0) {
      return myReviews.find((review) => {
        const reviewTripId = review.trip_id || review.tripId;
        return String(reviewTripId) === String(tripId);
      }) || null;
    }

    if (!currentUserId) return null;

    return allReviews.find((review) => {
      const reviewTripId = review.trip_id || review.tripId;
      const reviewUserId = review.user_id || review.userId;
      return String(reviewTripId) === String(tripId) && String(reviewUserId) === String(currentUserId);
    }) || null;
  };

  const toggleReviewForm = (tripId) => {
    setActiveReviewTripId((prev) => {
      if (prev === tripId) return null;

      const existingReview = getCurrentUserReviewForTrip(tripId);
      setReviewFormData((current) => ({
        ...current,
        [tripId]: {
          rating: existingReview ? String(existingReview.rating || '') : current[tripId]?.rating || '',
          comment: existingReview ? existingReview.comment || '' : current[tripId]?.comment || '',
        },
      }));

      return tripId;
    });
  };

  const groupReviewsByTrip = (reviewsList) => {
    const groupedReviews = {};

    reviewsList.forEach((review) => {
      const tripId = review.trip_id || review.tripId;
      if (!tripId) return;

      if (!groupedReviews[tripId]) {
        groupedReviews[tripId] = [];
      }

      groupedReviews[tripId].push(review);
    });

    return groupedReviews;
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
    const token = getAuthItem('token');
    const data = reviewFormData[tripId] || {};
    const existingReview = getCurrentUserReviewForTrip(tripId);

    try {
      const payload = {
        tripId,
        trip_id: tripId,
        rating: Number(data.rating),
        comment: data.comment || '',
      };
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (existingReview) {
        await axios.put(`/api/reviews/mine/${tripId}`, payload, config);
      } else {
        await axios.post('/api/reviews', payload, config);
      }

      setReviewFeedback((prev) => ({
        ...prev,
        [tripId]: {
          type: 'success',
          message: existingReview ? 'Review updated successfully!' : 'Review submitted successfully!',
        },
      }));
      setReviewFormData((prev) => ({
        ...prev,
        [tripId]: { rating: '', comment: '' },
      }));
      setActiveReviewTripId(null);

      try {
        const [refreshedReviews, refreshedMyReviews] = await Promise.all([
          axios.get('/api/reviews', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get('/api/reviews/mine', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const refreshedReviewList = Array.isArray(refreshedReviews.data)
          ? refreshedReviews.data
          : refreshedReviews.data.reviews || [];
        const refreshedMyReviewList = Array.isArray(refreshedMyReviews.data)
          ? refreshedMyReviews.data
          : refreshedMyReviews.data.reviews || [];
        const groupedReviews = groupReviewsByTrip(refreshedReviewList);
        setAllReviews(refreshedReviewList);
        setMyReviews(refreshedMyReviewList);

        try {
          buildTopTrips(trips, groupedReviews);
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
      const token = getAuthItem('token');
      if (!token) {
        setError('You must be logged in to view trips.');
        setLoading(false);
        return;
      }

      try {
        // Fetch trips and reviews in parallel (2 requests instead of 11)
        const [tripsRes, reviewsRes, myReviewsRes] = await Promise.all([
          axios.get('/api/trips', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('/api/reviews', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          role === 'user'
            ? axios.get('/api/reviews/mine', {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve({ data: { reviews: [] } }),
        ]);

        const fetchedTrips = tripsRes.data.trips || [];
        const allReviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : reviewsRes.data.reviews || [];
        const myReviews = Array.isArray(myReviewsRes.data) ? myReviewsRes.data : myReviewsRes.data.reviews || [];

        const groupedReviews = groupReviewsByTrip(allReviews);

        setTrips(fetchedTrips);
        setAllReviews(allReviews);
        setMyReviews(myReviews);
        buildTopTrips(fetchedTrips, groupedReviews);
      } catch (err) {
        console.error('❌ Error fetching data:', err.response || err);
        setError('Failed to fetch trips. Please check your login or server.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [role]);

  useEffect(() => {
    const q = tripSearchTerm.trim();

    if (!q) {
      setTripSearchResults([]);
      setTripSearchError('');
      setTripSearchLoading(false);
      return undefined;
    }

    const token = getAuthItem('token');

    if (!token) {
      setTripSearchError('You must be logged in to search trips.');
      setTripSearchLoading(false);
      return undefined;
    }

    setTripSearchLoading(true);
    setTripSearchError('');

    const timeoutId = setTimeout(async () => {
      try {
        const response = await axios.get('/api/trips/search', {
          params: { q },
          headers: { Authorization: `Bearer ${token}` },
        });

        setTripSearchResults(response.data.trips || []);
      } catch (err) {
        console.error('Error searching trips:', err.response || err);
        setTripSearchError('Search is unavailable right now.');
      } finally {
        setTripSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [tripSearchTerm]);

  const isSearchingTrips = tripSearchTerm.trim().length > 0;
  const visibleTrips = isSearchingTrips ? tripSearchResults : trips;

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero position-relative">
        <div className="home-hero-copy position-absolute top-50 start-50 translate-middle text-white text-center z-2">
          <p className="home-hero-kicker mb-3">PACKUP TRAVEL PLANNER</p>
          <h1 className="home-hero-title mb-3">Welcome to easier group trips.</h1>
          <p className="home-hero-subtitle mb-0">Plan together, decide faster, and start the journey with less chaos.</p>
        </div>
        <Carousel className="home-hero-carousel" interval={6000} pause={false}>
          {['slider1.jpg', 'slider2.jpg', 'slider3.jpg'].map((img, idx) => (
            <Carousel.Item key={idx}>
              <img
                className="home-hero-image d-block w-100"
                src={`/img/${img}`}
                alt={`Slide ${idx + 1}`}
                loading="lazy"
              />
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      {/* Intro */}
      <div className="home-intro text-center px-3">
        <p className="packup-kicker mb-2">START WITH INSPIRATION</p>
        <h2 className="packup-section-title">Explore the World with Us</h2>
        <div className="home-section-divider mx-auto"></div>
        <p className="packup-subtitle mb-0">Travel opens your mind, expands your horizons, and connects you with the beauty of the world.</p>
      </div>

      {/* Trips */}
      <Container className="home-trips-section py-4">
        <div className="home-section-heading text-center">
          <p className="packup-kicker mb-2">TRAVELER FAVORITES</p>
          <h3 className="packup-section-title mb-0">Top Rated Trips</h3>
        </div>
        {topTripsLoading && <p className="text-center">Calculating top trips...</p>}
        {!topTripsLoading && topTrips.length > 0 && (
          <Row className="top-rated-trips mb-5 g-4 justify-content-center align-items-stretch">
            {topTrips.map((trip, index) => (
              <Col key={`top-${trip.id}`} xs={12} md={4}>
                <Card className={`top-rated-card top-rated-card-${index + 1} h-100 border-0`}>
                  <Card.Body className="top-rated-card-body">
                    <div className="top-rated-rank">#{index + 1}</div>
                    <div className="top-rated-glow"></div>
                    <Card.Title className="packup-card-title top-rated-title mb-3">
                      {trip.title}
                    </Card.Title>
                    <Card.Text className="top-rated-score mb-2">
                      ⭐ {trip.averageRating.toFixed(1)} ({trip.reviewCount} reviews)
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <div className="home-section-heading text-center">
          <p className="packup-kicker mb-2">CHOOSE YOUR NEXT VIEW</p>
          <h3 className="packup-section-title mb-0">Our Destinations</h3>
        </div>
        <Form className="trip-search-form mx-auto mb-4" onSubmit={(e) => e.preventDefault()}>
          <Form.Label className="visually-hidden" htmlFor="trip-search-input">
            Search trips
          </Form.Label>
          <Form.Control
            id="trip-search-input"
            className="trip-search-input"
            type="search"
            placeholder="Search destinations or descriptions..."
            value={tripSearchTerm}
            onChange={(e) => setTripSearchTerm(e.target.value)}
          />
          <p className="trip-search-helper mb-0">
            {tripSearchLoading
              ? 'Searching trips...'
              : isSearchingTrips
                ? `${visibleTrips.length} trip${visibleTrips.length === 1 ? '' : 's'} found`
                : 'Find a trip by destination name or details.'}
          </p>
        </Form>
        {tripSearchError && <p className="text-danger text-center">{tripSearchError}</p>}
        {loading && <p className="text-center">Loading trips...</p>}
        {error && <p className="text-danger text-center">{error}</p>}

        <Row>
          {!loading && !error && visibleTrips.length === 0 && (
            <p className="text-center">{isSearchingTrips ? 'No trips match your search.' : 'No trips found.'}</p>
          )}

          {visibleTrips.map((trip) => {
            const existingReview = getCurrentUserReviewForTrip(trip.id);
            const isEditingReview = Boolean(existingReview);

            return (
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
                <Card.Body className="destination-card-body d-flex flex-column">
                  <div className="destination-card-title-area">
                    <Card.Title className="packup-card-title">{trip.title}</Card.Title>
                  </div>
                  <div className="destination-card-actions">
                    <div className="destination-card-buttons d-flex gap-2 flex-wrap">
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
                          {isEditingReview ? 'Edit Review' : 'Leave a Review'}
                        </Button>
                      )}
                    </div>
                    {role === 'user' && (
                      <p
                        className={`destination-card-feedback mb-0 ${
                          reviewFeedback[trip.id]?.type === 'success' ? 'text-success' : 'text-danger'
                        }`}
                        aria-hidden={!reviewFeedback[trip.id]}
                      >
                        {reviewFeedback[trip.id]?.message || 'No review message'}
                      </p>
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
                        <h5 className="mb-3">{isEditingReview ? 'Edit your review' : 'Leave a review'}</h5>
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
                          {reviewSubmitting
                            ? 'Saving...'
                            : isEditingReview
                              ? 'Update Review'
                              : 'Submit Review'}
                        </Button>
                      </Form>
                    </div>
                  )}
                </Card.Body>
              </Card>
              </Col>
            );
          })}
        </Row>
      </Container>

      {/* Trip Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" dialogClassName="trip-details-modal">
        <Modal.Header closeButton className="trip-details-header border-0">
          <Modal.Title className="packup-modal-title">Trip Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="trip-details-body">
          {selectedTrip && (
            <div className="trip-details-content">
              <img
                src={selectedTrip.img || fallbackImg}
                alt={selectedTrip.title}
                className="trip-details-image img-fluid"
                loading="lazy"
              />
              <div className="trip-details-info">
                <p className="packup-kicker mb-2">DESTINATION</p>
                <h4 className="packup-card-title mb-3">Trip to: {selectedTrip.title}</h4>
                <div className="trip-details-row">
                  <strong>Description</strong>
                  <span>{selectedTrip.description}</span>
                </div>
                <div className="trip-details-dates">
                  <div className="trip-details-row">
                    <strong>Start Date</strong>
                    <span>{selectedTrip.startDate ? new Date(selectedTrip.startDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="trip-details-row">
                    <strong>End Date</strong>
                    <span>{selectedTrip.endDate ? new Date(selectedTrip.endDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="trip-details-footer border-0">
          <Button className="trip-details-close" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button className="trip-details-join" onClick={() => setShowModal(false)}>
            Join Trip
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HomePage;
