import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getAuthItem } from '../../utills/auth';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({ username: '', role: '' });
  const [showTripEditModal, setShowTripEditModal] = useState(false);
  const [currentEditingTrip, setCurrentEditingTrip] = useState(null);
  const [editTripFormData, setEditTripFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    img: null
  });
  const [showReviewDetailsModal, setShowReviewDetailsModal] = useState(false);
  const [currentReviewTrip, setCurrentReviewTrip] = useState(null);
  const [tripReviews, setTripReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);

  const token = getAuthItem('token');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch('/api/trips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch trips');
      setTrips(data.trips || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch reviews');
      setAllReviews(Array.isArray(data) ? data : data.reviews || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs');
      setAuditLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchEventLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/event-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch event logs');
      setEventLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchTrips();
    fetchReviews();
    fetchAuditLogs();
    fetchEventLogs();
  }, [fetchUsers, fetchTrips, fetchReviews, fetchAuditLogs, fetchEventLogs]);

  const handleDelete = async (id, role) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${role}?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTrip = async (id, title) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the trip "${title}"? This will also delete all reviews for this trip.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete trip');
      fetchTrips();
      fetchReviews();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setEditFormData({ username: user.username, role: user.role });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleEditSubmit = async (id) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setEditingUserId(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditTrip = (trip) => {
    setCurrentEditingTrip(trip);
    setEditTripFormData({
      title: trip.title || '',
      description: trip.description || '',
      startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
      endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
      img: null
    });
    setShowTripEditModal(true);
  };

  const handleEditTripChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setEditTripFormData({ ...editTripFormData, [name]: files[0] || null });
    } else {
      setEditTripFormData({ ...editTripFormData, [name]: value });
    }
  };

  const handleEditTripSubmit = async () => {
    if (!currentEditingTrip) return;
    
    try {
      let res;
      
      if (editTripFormData.img) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('title', editTripFormData.title);
        formData.append('description', editTripFormData.description);
        formData.append('startDate', editTripFormData.startDate);
        formData.append('endDate', editTripFormData.endDate);
        formData.append('img', editTripFormData.img);
        
        res = await fetch(`/api/trips/${currentEditingTrip.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // Use JSON for text-only updates (preserves existing image)
        const updateData = {
          title: editTripFormData.title,
          description: editTripFormData.description,
          startDate: editTripFormData.startDate,
          endDate: editTripFormData.endDate
        };
        
        res = await fetch(`/api/trips/${currentEditingTrip.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update trip');
      setShowTripEditModal(false);
      setCurrentEditingTrip(null);
      fetchTrips();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReviewDetails = async (trip) => {
    setCurrentReviewTrip(trip);
    try {
      const res = await fetch(`/api/reviews/${trip.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch reviews');
      setTripReviews(Array.isArray(data) ? data : data.reviews || []);
      setShowReviewDetailsModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    console.log('handleDeleteReview called with reviewId:', reviewId);
    console.log('tripReviews before delete:', tripReviews);

    const confirmDelete = window.confirm('Are you sure you want to delete this review?');
    if (!confirmDelete) return;

    const adminToken = getAuthItem('token');

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      const data = await res.json();
      console.log('DELETE /api/reviews response:', res.status, data);
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete review');

      const deletedId = String(reviewId);
      setTripReviews((prevReviews) => {
        const filtered = prevReviews.filter((review) => {
          const reviewKey = review.id ?? review.reviewId ?? review.review_id ?? review.id;
          return String(reviewKey) !== deletedId;
        });
        console.log('tripReviews after filter:', filtered);
        return filtered;
      });
      setAllReviews((prevReviews) =>
        prevReviews.filter((review) => String(review.id ?? review.reviewId ?? review.review_id) !== deletedId)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const calculateAverageRating = (reviews) => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return (total / reviews.length).toFixed(1);
  };

  const totalUsers = users.length;
  const totalTrips = trips.length;
  const totalReviews = allReviews.length;
  const averageRating = calculateAverageRating(allReviews);
  const totalAuditLogs = auditLogs.length;
  const totalEventLogs = eventLogs.length;

  const analyticsData = useMemo(() => {
    return trips.map((trip) => {
      const reviewsForTrip = allReviews.filter((review) => {
        const reviewTripId = review.trip_id ?? review.tripId ?? review.trip?.id;
        return String(reviewTripId) === String(trip.id);
      });
      const ratingTotal = reviewsForTrip.reduce(
        (sum, review) => sum + (Number(review.rating) || 0),
        0
      );

      return {
        id: trip.id,
        title: trip.title || `Trip ${trip.id}`,
        reviewCount: reviewsForTrip.length,
        averageRating: reviewsForTrip.length ? Number((ratingTotal / reviewsForTrip.length).toFixed(1)) : 0
      };
    });
  }, [trips, allReviews]);

  const renderBarChart = (data, valueKey, maxValue, color) => {
    if (!data.length) {
      return <p className="text-muted mb-0">No trip data available.</p>;
    }

    const safeMax = Math.max(maxValue, 1);

    return (
      <div className="d-flex align-items-end gap-3 overflow-auto" style={{ minHeight: '220px' }}>
        {data.map((item) => {
          const value = Number(item[valueKey]) || 0;
          const height = Math.max((value / safeMax) * 160, value > 0 ? 8 : 2);

          return (
            <div
              key={item.id}
              className="d-flex flex-column align-items-center flex-shrink-0"
              style={{ width: '72px' }}
            >
              <div className="small fw-semibold mb-2">{value}</div>
              <div
                className="w-100 rounded-top"
                title={`${item.title}: ${value}`}
                style={{
                  height: `${height}px`,
                  backgroundColor: color,
                  transition: 'height 0.2s ease'
                }}
              />
              <div className="small text-muted text-center mt-2 text-truncate w-100" title={item.title}>
                {item.title}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const formatLogDate = (value) => {
    if (!value) return 'No date';
    return new Date(value).toLocaleString();
  };

  const parseLogJson = (value) => {
    if (!value) return '';

    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return JSON.stringify(parsed);
    } catch (err) {
      return String(value);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="packup-section-title text-center mb-4">Admin Dashboard</h2>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100 p-3">
            <div className="text-muted">Total Users</div>
            <div className="packup-stat-value">{totalUsers}</div>
            <div className="text-small text-secondary">Active user accounts</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100 p-3">
            <div className="text-muted">Total Trips</div>
            <div className="packup-stat-value">{totalTrips}</div>
            <div className="text-small text-secondary">Available trip listings</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100 p-3">
            <div className="text-muted">Total Reviews</div>
            <div className="packup-stat-value">{totalReviews}</div>
            <div className="text-small text-secondary">Loaded review count</div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100 p-3">
            <div className="text-muted">Average Rating</div>
            <div className="packup-stat-value">{averageRating}</div>
            <div className="text-small text-secondary">Based on loaded reviews</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card shadow-sm h-100 p-3">
            <div className="text-muted">Recent Audit Logs</div>
            <div className="packup-stat-value">{totalAuditLogs}</div>
            <div className="text-small text-secondary">Latest admin and user actions loaded</div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card shadow-sm h-100 p-3">
            <div className="text-muted">Recent Event Logs</div>
            <div className="packup-stat-value">{totalEventLogs}</div>
            <div className="text-small text-secondary">Latest domain events loaded</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      )}

      <section className="mt-5 mb-5">
        <h3 className="packup-section-title mb-3">Analytics</h3>
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '8px' }}>
              <div className="card-body">
                <h5 className="packup-card-title mb-4">Reviews per Trip</h5>
                {renderBarChart(
                  analyticsData,
                  'reviewCount',
                  Math.max(...analyticsData.map((item) => item.reviewCount), 0),
                  '#2f80ed'
                )}
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '8px' }}>
              <div className="card-body">
                <h5 className="packup-card-title mb-4">Average Rating per Trip</h5>
                {renderBarChart(analyticsData, 'averageRating', 5, '#27ae60')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 mb-5">
        <h3 className="packup-section-title mb-3">System Logs</h3>
        <div className="row g-4">
          <div className="col-12 col-xl-7">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '8px' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="packup-card-title mb-0">Audit Logs</h5>
                  <button className="btn btn-outline-primary btn-sm" onClick={fetchAuditLogs}>
                    Refresh
                  </button>
                </div>
                {auditLogs.length === 0 ? (
                  <p className="text-muted mb-0">No audit logs found.</p>
                ) : (
                  <div className="table-responsive admin-log-scroll">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>User</th>
                          <th>Entity</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <strong>{log.action}</strong>
                              {log.metadata && (
                                <div className="small text-muted text-truncate" style={{ maxWidth: '260px' }}>
                                  {parseLogJson(log.metadata)}
                                </div>
                              )}
                            </td>
                            <td>{log.username || (log.user_id ? `User #${log.user_id}` : 'System')}</td>
                            <td>{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                            <td className="small text-muted">{formatLogDate(log.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-5">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '8px' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="packup-card-title mb-0">Event Logs</h5>
                  <button className="btn btn-outline-primary btn-sm" onClick={fetchEventLogs}>
                    Refresh
                  </button>
                </div>
                {eventLogs.length === 0 ? (
                  <p className="text-muted mb-0">No event logs found.</p>
                ) : (
                  <div className="list-group list-group-flush admin-log-scroll">
                    {eventLogs.map((log) => (
                      <div key={log.id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between gap-3">
                          <strong>{log.event_type}</strong>
                          <span className={`badge ${log.processed ? 'bg-success' : 'bg-secondary'}`}>
                            {log.processed ? 'Processed' : 'Pending'}
                          </span>
                        </div>
                        <div className="small text-muted">
                          {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''} - {formatLogDate(log.created_at)}
                        </div>
                        {log.payload && (
                          <div className="small text-muted text-truncate">
                            {parseLogJson(log.payload)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="row">
        {/* Users Management Section */}
        <div className="col-lg-6 mb-4">
          <h3 className="packup-section-title mb-3">Manage Users</h3>
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    {editingUserId === user.id ? (
                      <input
                        className="form-control"
                        name="username"
                        value={editFormData.username}
                        onChange={handleEditChange}
                      />
                    ) : (
                      user.username
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {editingUserId === user.id ? (
                      <select
                        className="form-select"
                        name="role"
                        value={editFormData.role}
                        onChange={handleEditChange}
                      >
                        <option value="user">user</option>
                        <option value="trip_planner">trip_planner</option>
                        {/* <option value="admin">admin</option> */}
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td className="text-center">
                    {editingUserId === user.id ? (
                      <>
                        <button className="btn btn-success btn-sm me-2" onClick={() => handleEditSubmit(user.id)}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingUserId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(user)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id, user.role)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trips Management Section */}
        <div className="col-lg-6">
          <h3 className="packup-section-title mb-3">Manage Trips</h3>
          <div className="row">
            {trips.map(trip => (
              <div key={trip.id} className="col-md-6 mb-3">
                <div className="card h-100">
                  <img
                    src={trip.img || '/img/slider1.jpg'}
                    className="card-img-top"
                    alt={trip.title}
                    style={{ height: '150px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/img/slider1.jpg';
                    }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="packup-card-title">{trip.title}</h5>
                    <p className="card-text">
                      <small className="text-muted">
                        <strong>Start:</strong> {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'N/A'}<br />
                        <strong>End:</strong> {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'N/A'}
                      </small>
                    </p>
                    <div className="mt-auto d-flex align-items-center gap-1">
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEditTrip(trip)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteTrip(trip.id, trip.title)}
                        >
                          Delete
                        </button>
                      </div>
                      <button
                        className="btn btn-info btn-sm ms-auto"
                        onClick={() => handleReviewDetails(trip)}
                      >
                        Reviews
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trip Edit Modal */}
      <Modal show={showTripEditModal} onHide={() => setShowTripEditModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="packup-modal-title">Edit Trip</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={editTripFormData.title}
                  onChange={handleEditTripChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  rows="4"
                  value={editTripFormData.description}
                  onChange={handleEditTripChange}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="startDate"
                  value={editTripFormData.startDate}
                  onChange={handleEditTripChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="endDate"
                  value={editTripFormData.endDate}
                  onChange={handleEditTripChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Trip Image (optional)</label>
                <input
                  type="file"
                  className="form-control"
                  name="img"
                  accept="image/*"
                  onChange={handleEditTripChange}
                />
                <small className="text-muted">Leave empty to keep current image</small>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTripEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditTripSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Review Details Modal */}
      <Modal show={showReviewDetailsModal} onHide={() => setShowReviewDetailsModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="packup-modal-title">Review Details - {currentReviewTrip?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentReviewTrip && (
            <div>
              <div className="mb-3 p-3 bg-light rounded">
                <h5 className="packup-card-title">{currentReviewTrip.title}</h5>
                <p className="mb-1">
                  <strong>Average Rating:</strong> {calculateAverageRating(tripReviews)} ⭐
                </p>
                <p className="mb-0">
                  <strong>Total Reviews:</strong> {tripReviews.length}
                </p>
              </div>

              {tripReviews.length === 0 ? (
                <p className="text-center text-muted">No reviews yet for this trip.</p>
              ) : (
                <div className="list-group">
                  {tripReviews.map(review => (
                    <div key={review.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>{review.username || review.userName || 'Anonymous'}</strong>
                            <div className="d-flex align-items-center gap-2">
                              <span>{'⭐'.repeat(review.rating || 0)} ({review.rating || 0}/5)</span>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteReview(review.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="mb-1">{review.comment || 'No comment'}</p>
                          <small className="text-muted">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'No date'}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminDashboard;
