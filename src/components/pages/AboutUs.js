import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

function AboutUs() {
  const contentSections = [
    {
      title: 'About PackUp',
      description:
        'A smarter place for friends, families, and teams to turn trip ideas into shared plans without scattered chats or messy spreadsheets.',
      icon: 'bi bi-people-fill',
    },
    {
      title: 'Our Mission',
      description:
        'We make group travel feel simple, collaborative, and exciting from the first destination idea to the final itinerary.',
      icon: 'bi bi-bullseye',
    },
    {
      title: 'Our Values',
      description:
        'Simple tools, shared decisions, and planning spaces where every traveler has a voice before the journey begins.',
      icon: 'bi bi-heart-fill',
    },
  ];

  return (
    <section className="about-page">
      <div className="about-glow about-glow-1"></div>
      <div className="about-glow about-glow-2"></div>
      <div className="about-glow about-glow-3"></div>
      <div className="about-glow about-glow-4"></div>

      <Container className="about-page-content">
        <div className="about-heading text-center">
          <p className="packup-kicker about-kicker mb-3">ABOUT</p>
          <h1 className="packup-page-title about-title mb-3">Plan trips together, without the chaos.</h1>
          <p className="packup-subtitle about-subtitle mb-0">
            PackUp brings the people, plans, and decisions into one calm space.
          </p>
        </div>

        <Row className="about-cards-row g-4 align-items-end">
          {contentSections.map((section, index) => (
            <Col md={12} lg={4} key={section.title}>
              <Card className={`about-card about-card-${index + 1} border-0`}>
                <div className="about-card-visual">
                  <i className={`${section.icon} about-card-icon`}></i>
                </div>
                <Card.Body className="about-card-body">
                  <div className="about-card-number">{String(index + 1).padStart(2, '0')}</div>
                  <Card.Title className="packup-card-title about-card-title">{section.title}</Card.Title>
                  <Card.Text className="about-card-text mb-0">
                    {section.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

export default AboutUs;
