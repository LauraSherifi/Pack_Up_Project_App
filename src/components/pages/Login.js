import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthItem, setAuthSession } from '../../utills/auth';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔒 Redirect to Start if user is not logged in and uses the back button
  useEffect(() => {
    const token = getAuthItem('token');
    if (!token) {
      const handlePopState = () => {
        navigate('/', { replace: true });
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        setError(data.error || 'Invalid credentials.');
        setLoading(false);
        return;
      }

      // Save token and user info
      const { token, user } = data;
      const { id, username, role } = user;

      setAuthSession({ token, username, role, userId: id });

      navigate('/home', { replace: true });

    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center min-vh-100">
      <div className="auth-glow auth-glow-1"></div>
      <div className="auth-glow auth-glow-2"></div>
      <div className="auth-glow auth-glow-3"></div>

      <div className="auth-card card p-4">
        <p className="packup-kicker text-center mb-2">WELCOME BACK</p>
        <h3 className="packup-auth-title text-center mb-4">
          Log In
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              className="auth-input form-control"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              className="auth-input form-control"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button
            type="submit"
            className="auth-submit btn w-100"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-3 text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
