import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');

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

  const getTripById = (tripId) => {
    return trips.find((trip) => Number(trip.id) === Number(tripId));
  };

  const getTripImageSrc = (trip) => {
    if (!trip) return '';

    const rawImage = trip.img || trip.image || '';
    if (!rawImage) return '';

    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
      return rawImage;
    }

    if (rawImage.startsWith('/uploads/')) {
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
      <span style={{ color: '#f4b400', letterSpacing: '1px', fontSize: '14px' }}>
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
  }, [reviews, trips]);

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
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>Loading reviews...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '24px', color: '#222' }}>
        Reviews
      </h1>

      {error && (
        <div
          style={{
            marginBottom: '16px',
            border: '1px solid #f5c2c7',
            background: '#f8d7da',
            color: '#842029',
            padding: '12px 16px',
            borderRadius: '8px',
          }}
        >
          {error}
        </div>
      )}

      {!error && totalReviews === 0 && (
        <div
          style={{
            border: '1px solid #b6d4fe',
            background: '#cfe2ff',
            color: '#084298',
            padding: '12px 16px',
            borderRadius: '8px',
          }}
        >
          No reviews yet.
        </div>
      )}

      {!error && totalReviews > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '18px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: '14px', color: '#777', marginBottom: '8px' }}>
                Total Reviews
              </div>
              <div style={{ fontSize: '34px', fontWeight: '700', color: '#222' }}>
                {totalReviews}
              </div>
            </div>

            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '18px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: '14px', color: '#777', marginBottom: '8px' }}>
                Average Rating
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '34px', fontWeight: '700', color: '#222' }}>
                  {overallAverageRating}
                </span>
                {renderStars(overallAverageRating)}
              </div>
            </div>

            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '18px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: '14px', color: '#777', marginBottom: '8px' }}>
                Trips Reviewed
              </div>
              <div style={{ fontSize: '34px', fontWeight: '700', color: '#222' }}>
                {totalTripsReviewed}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {groupedTripReviews.map((tripGroup) => (
              <div
                key={tripGroup.tripId}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '18px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '18px',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  {tripGroup.tripImage ? (
                    <img
                      src={tripGroup.tripImage}
                      alt={tripGroup.tripTitle}
                      style={{
                        width: '58px',
                        height: '58px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '58px',
                        height: '58px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        background: '#f3f4f6',
                        color: '#777',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '6px',
                        flexShrink: 0,
                      }}
                    >
                      No Image
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#222',
                        marginBottom: '6px',
                      }}
                    >
                      {tripGroup.tripTitle}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignItems: 'center',
                        color: '#666',
                        fontSize: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {renderStars(tripGroup.averageRating)}
                        <span style={{ fontWeight: '600', color: '#333' }}>
                          {tripGroup.averageRating}
                        </span>
                      </div>
                      <span>
                        {tripGroup.reviewCount} review{tripGroup.reviewCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
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
                      <div
                        key={review.id}
                        style={{
                          padding: '16px 18px',
                          borderTop: '1px solid #f5f5f5',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '12px',
                            marginBottom: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: '700',
                                color: '#222',
                                marginBottom: '4px',
                              }}
                            >
                              {username}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {renderStars(review.rating)}
                              <span style={{ fontSize: '14px', color: '#444', fontWeight: '600' }}>
                                {Number(review.rating) || 0}/5
                              </span>
                            </div>
                          </div>

                          <div style={{ fontSize: '13px', color: '#888' }}>
                            {formatDate(rawDate)}
                          </div>
                        </div>

                        <div style={{ color: '#444', lineHeight: '1.6', fontSize: '15px' }}>
                          {comment}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewsPage;