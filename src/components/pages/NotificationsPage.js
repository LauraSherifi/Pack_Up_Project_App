import React, { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { getAuthItem } from '../../utills/auth';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const token = getAuthItem('token');

  const fetchNotifications = useCallback(async () => {
    setError('');

    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update notification');
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, is_read: 1 } : notification
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update notifications');
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: 1 }))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <main className="notifications-page">
      <section className="notifications-shell">
        <div className="notifications-header">
          <p className="packup-kicker mb-2">UPDATES</p>
          <h1 className="packup-page-title">Notifications</h1>
          <p className="packup-subtitle mb-0">
            Follow trip activity, reviews, and important updates in one place.
          </p>
        </div>

        <div className="notifications-toolbar">
          <div>
            <strong>{unreadCount}</strong> unread notification{unreadCount === 1 ? '' : 's'}
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={fetchNotifications}>
              Refresh
            </Button>
            <Button variant="primary" onClick={markAllAsRead} disabled={unreadCount === 0}>
              Mark all as read
            </Button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <p className="text-center">Loading notifications...</p>}

        {!loading && notifications.length === 0 && (
          <div className="notifications-empty">No notifications yet.</div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-item ${notification.is_read ? 'notification-read' : 'notification-unread'}`}
              >
                <div className="notification-main">
                  <div className="notification-topline">
                    <span className="notification-type">{notification.type}</span>
                    <time>{notification.created_at ? new Date(notification.created_at).toLocaleString() : 'No date'}</time>
                  </div>
                  <h2>{notification.title}</h2>
                  <p>{notification.message}</p>
                </div>
                {!notification.is_read && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as read
                  </Button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default NotificationsPage;
