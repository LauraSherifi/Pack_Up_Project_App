import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../../utills/auth';

function Start() {
  useEffect(() => {
    logout();
  }, []);

  const backgroundBoxes = [
    { top: '10%', left: '5%', size: 150, img: '/img/img1.jpg' },
    { top: '22%', left: '78%', size: 140, img: '/img/img2.jpg' },
    { top: '62%', left: '8%', size: 155, img: '/img/img3.jpg' },
    { top: '74%', left: '74%', size: 132, img: '/img/img1.jpg' },
    { top: '16%', left: '28%', size: 104, img: '/img/img2.jpg' },
    { top: '68%', left: '30%', size: 118, img: '/img/img3.jpg' },
  ];

  return (
    <div className="start-page position-relative min-vh-100 d-flex">
      <div className="start-glow start-glow-1"></div>
      <div className="start-glow start-glow-2"></div>
      <div className="start-glow start-glow-3"></div>
      <div className="start-glow start-glow-4"></div>

      {backgroundBoxes.map((box, index) => (
        <div
          key={index}
          className="start-image-box"
          style={{
            width: `${box.size}px`,
            height: `${box.size}px`,
            top: box.top,
            left: box.left,
            backgroundImage: `url(${box.img})`,
          }}
        />
      ))}

      <div className="container d-flex align-items-center justify-content-center z-1">
        <div className="start-card row w-100 align-items-center">
          <div className="col-md-7 p-5">
            <p className="packup-kicker mb-3">GROUP TRAVEL MADE CALM</p>
            <h1 className="packup-page-title mb-3">Welcome to PackUp!</h1>
            <p className="packup-subtitle start-subtitle mb-0">
              Plan group trips effortlessly, coordinate decisions, and keep every traveler on the same page from the first idea to the final itinerary.
            </p>
          </div>
          <div className="col-md-5 d-flex flex-column justify-content-center align-items-stretch p-5">
            <div className="start-actions d-grid gap-3">
              <Link to="/login" className="start-button start-button-primary btn btn-lg">
                Log In
              </Link>
              <Link to="/signup" className="start-button start-button-secondary btn btn-lg">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Start;
