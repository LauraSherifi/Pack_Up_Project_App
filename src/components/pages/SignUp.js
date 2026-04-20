import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    role: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Restrict phone input to digits only
    if (name === 'phone') {
      if (!/^\d*$/.test(value)) return;
    }

    setForm({ ...form, [name]: value });
  };

  const validate = () => {
    const newErrors = {};

    // Full name: at least 2 words
    if (!form.fullName.trim() || form.fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Full name required (at least 2 words)';
    }

    // Email: valid format
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = 'Valid email required';
    }

    // Password: minimum 8 characters
    if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password: must match
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role selection: required
    if (!form.role) {
      newErrors.role = 'Please select how you want to register';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.fullName,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone || undefined,
          city: form.city || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Registration failed');
        return;
      }

      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Something went wrong, please try again.');
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center min-vh-100">
      <div className="auth-glow auth-glow-1"></div>
      <div className="auth-glow auth-glow-2"></div>
      <div className="auth-glow auth-glow-3"></div>

      <div className="auth-card auth-card-wide card p-4">
        <p className="packup-kicker text-center mb-2">JOIN PACKUP</p>
        <h3 className="packup-auth-title text-center mb-4">
          Create Account
        </h3>
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              type="text"
              className={`auth-input form-control ${errors.fullName ? 'is-invalid' : ''}`}
              placeholder="Your full name"
              required
            />
            {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              className={`auth-input form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="you@example.com"
              required
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              className={`auth-input form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder="********"
              required
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              type="password"
              className={`auth-input form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              placeholder="********"
              required
            />
            {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
          </div>

          {/* Phone */}
          <div className="mb-3">
            <label className="form-label">Phone (optional)</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              type="text"
              className="auth-input form-control"
              placeholder="+383..."
            />
          </div>

          {/* City */}
          <div className="mb-3">
            <label className="form-label">City (optional)</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              type="text"
              className="auth-input form-control"
              placeholder="City"
            />
          </div>

          Role
          <div className="mb-3">
            <label className="form-label">Register as</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={`auth-input form-select ${errors.role ? 'is-invalid' : ''}`}
              required
            >
              <option value="">-- Select Role --</option>
              <option value="user">User</option>
              <option value="trip_planner">Trip Planner</option>
            </select>
            {errors.role && <div className="invalid-feedback">{errors.role}</div>}
          </div>

          <button type="submit" className="auth-submit btn w-100">
            Sign Up
          </button>
        </form>

        <p className="mt-3 text-center">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
