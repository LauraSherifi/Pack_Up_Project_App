import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuthItem } from '../../utills/auth';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const [tripsRes, reviewsRes] = await Promise.all([
          axios.get('/api/trips', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('/api/reviews', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const tripsData = tripsRes.data.trips || [];
        const reviewsData = Array.isArray(reviewsRes.data)
          ? reviewsRes.data
          : reviewsRes.data.reviews || [];

        setTrips(tripsData);
        setReviews(reviewsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load reviews and trips.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const getTripById = useCallback(
    (tripId) => trips.find((trip) => Number(trip.id) === Number(tripId)),
    [trips]
  );

  const getTripImageSrc = (trip) => {
    if (!trip) return '';

    const rawImage = trip.img || trip.image || '';
    if (!rawImage) return '';

    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
      return rawImage;
    }

    if (rawImage.startsWith('/')) {
      return rawImage;
    }

    if (rawImage.startsWith('uploads/')) {
      return `/${rawImage}`;
    }

    return `/uploads/${rawImage}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating) => {
    const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
    const fullStars = Math.round(safeRating);

    return (
      <span className="reviews-stars" aria-label={`${safeRating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (star <= fullStars ? '★' : '☆')).join('')}
      </span>
    );
  };

  const groupedTripReviews = useMemo(() => {
    const grouped = {};

    reviews.forEach((review) => {
      const tripId = review.trip_id || review.tripId;
      if (!tripId) return;

      if (!grouped[tripId]) {
        const trip = getTripById(tripId);

        grouped[tripId] = {
          tripId,
          tripTitle: trip?.title || review.trip_title || `Trip ${tripId}`,
          tripImage: getTripImageSrc(trip),
          reviews: [],
        };
      }

      grouped[tripId].reviews.push(review);
    });

    return Object.values(grouped)
      .map((group) => {
        const total = group.reviews.reduce(
          (sum, review) => sum + (Number(review.rating) || 0),
          0
        );

        const averageRating = group.reviews.length
          ? (total / group.reviews.length).toFixed(1)
          : '0.0';

        const sortedReviews = [...group.reviews].sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        return {
          ...group,
          averageRating,
          reviewCount: group.reviews.length,
          reviews: sortedReviews,
        };
      })
      .sort((a, b) => {
        if (Number(b.averageRating) !== Number(a.averageRating)) {
          return Number(b.averageRating) - Number(a.averageRating);
        }
        return b.reviewCount - a.reviewCount;
      });
  }, [reviews, getTripById]);

  const totalReviews = reviews.length;
  const totalTripsReviewed = groupedTripReviews.length;
  const overallAverageRating =
    totalReviews > 0
      ? (
          reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) /
          totalReviews
        ).toFixed(1)
      : '0.0';

  if (loading) {
    return (
      <main className="reviews-page">
        <div className="reviews-shell">
          <div className="reviews-empty">Loading reviews...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="reviews-page">
      <div className="reviews-shell">
        <div className="reviews-header">
          <p className="packup-kicker reviews-kicker">TRAVEL FEEDBACK</p>
          <h1 className="packup-page-title">Reviews</h1>
          <p className="packup-subtitle">See what travelers are saying about their latest PackUp trips.</p>
        </div>

        {error && <div className="reviews-alert reviews-alert-error">{error}</div>}

        {!error && totalReviews === 0 && (
          <div className="reviews-alert reviews-alert-info">No reviews yet.</div>
        )}

        {!error && totalReviews > 0 && (
          <>
            <section className="reviews-stats" aria-label="Review summary">
              <div className="reviews-stat-card">
                <span>Total Reviews</span>
                <strong>{totalReviews}</strong>
              </div>

              <div className="reviews-stat-card">
                <span>Average Rating</span>
                <div className="reviews-stat-rating">
                  <strong>{overallAverageRating}</strong>
                  {renderStars(overallAverageRating)}
                </div>
              </div>

              <div className="reviews-stat-card">
                <span>Trips Reviewed</span>
                <strong>{totalTripsReviewed}</strong>
              </div>
            </section>

            <section className="reviews-grid" aria-label="Trip reviews">
              {groupedTripReviews.map((tripGroup) => (
                <article className="reviews-trip-card" key={tripGroup.tripId}>
                  <div className="reviews-trip-header">
                    {tripGroup.tripImage ? (
                      <img
                        src={tripGroup.tripImage}
                        alt={tripGroup.tripTitle}
                        className="reviews-trip-image"
                      />
                    ) : (
                      <div className="reviews-trip-placeholder">No Image</div>
                    )}

                    <div className="reviews-trip-summary">
                      <h2>{tripGroup.tripTitle}</h2>
                      <div className="reviews-trip-meta">
                        <span>
                          {renderStars(tripGroup.averageRating)}
                          <strong>{tripGroup.averageRating}</strong>
                        </span>
                        <span>
                          {tripGroup.reviewCount} review{tripGroup.reviewCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="reviews-list">
                    {tripGroup.reviews.map((review) => {
                      const username =
                        review.username ||
                        review.userName ||
                        review.user_id ||
                        review.userId ||
                        'Anonymous';

                      const rawDate = review.created_at || review.createdAt;
                      const comment = review.comment || 'No comment';

                      return (
                        <div className="reviews-item" key={review.id}>
                          <div className="reviews-item-top">
                            <div>
                              <h3>{username}</h3>
                              <div className="reviews-item-rating">
                                {renderStars(review.rating)}
                                <span>{Number(review.rating) || 0}/5</span>
                              </div>
                            </div>

                            <time>{formatDate(rawDate)}</time>
                          </div>

                          <p>{comment}</p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default ReviewsPage;
