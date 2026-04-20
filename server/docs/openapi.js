const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'PackUp API',
    version: '1.0.0',
    description: 'REST API for PackUp trip planning, reviews, users, and contact messages.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'System', description: 'Health and readiness checks' },
    { name: 'Auth', description: 'Registration and login' },
    { name: 'Trips', description: 'Trip browsing and trip planner management' },
    { name: 'Reviews', description: 'Trip reviews and top-rated trip data' },
    { name: 'Admin', description: 'Admin user management' },
    { name: 'Contact', description: 'Contact form submissions' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['user', 'trip_planner', 'admin'] },
        },
      },
      Trip: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          createdBy: { type: 'integer' },
          img: { type: 'string', nullable: true },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          trip_id: { type: 'integer' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          username: { type: 'string' },
          trip_title: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Check whether the API process is alive',
        responses: {
          200: { description: 'API is alive' },
        },
      },
    },
    '/ready': {
      get: {
        tags: ['System'],
        summary: 'Check whether the API and database are ready',
        responses: {
          200: { description: 'API and database are ready' },
          503: { description: 'Database is unavailable' },
        },
      },
    },
    '/metrics': {
      get: {
        tags: ['System'],
        summary: 'Return Prometheus-style API and database metrics',
        responses: {
          200: { description: 'Metrics returned as text/plain' },
          503: { description: 'Database metrics unavailable' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user or trip planner',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  role: { type: 'string', enum: ['user', 'trip_planner'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User registered' },
          400: { description: 'Validation failed' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          400: { description: 'Validation failed' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/trips': {
      get: {
        tags: ['Trips'],
        summary: 'Get all trips',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Trip list returned' },
          401: { description: 'Missing token' },
        },
      },
      post: {
        tags: ['Trips'],
        summary: 'Create a trip as a trip planner',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'startDate', 'endDate'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                  img: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Trip created' },
          400: { description: 'Validation failed' },
          403: { description: 'Insufficient role' },
        },
      },
    },
    '/api/trips/my-trips': {
      get: {
        tags: ['Trips'],
        summary: "Get the current trip planner's trips",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Planner trip list returned' },
          403: { description: 'Insufficient role' },
        },
      },
    },
    '/api/trips/search': {
      get: {
        tags: ['Trips'],
        summary: 'Search trips by title or description',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Matching trips returned' },
          401: { description: 'Missing token' },
        },
      },
    },
    '/api/trips/{id}': {
      get: {
        tags: ['Trips'],
        summary: 'Get one trip',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Trip returned' },
          404: { description: 'Trip not found' },
        },
      },
      put: {
        tags: ['Trips'],
        summary: 'Update a trip as planner or admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Trip updated' },
          400: { description: 'Validation failed' },
          404: { description: 'Trip not found' },
        },
      },
      delete: {
        tags: ['Trips'],
        summary: 'Delete a trip as planner or admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Trip deleted' },
          404: { description: 'Trip not found' },
        },
      },
    },
    '/api/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'Get all reviews',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Review list returned' },
        },
      },
      post: {
        tags: ['Reviews'],
        summary: 'Create a review as a user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tripId', 'rating'],
                properties: {
                  tripId: { type: 'integer' },
                  trip_id: { type: 'integer' },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  comment: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Review created' },
          400: { description: 'Validation failed' },
          409: { description: 'User already reviewed this trip' },
        },
      },
    },
    '/api/reviews/mine': {
      get: {
        tags: ['Reviews'],
        summary: "Get the current user's reviews",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user reviews returned' },
        },
      },
    },
    '/api/reviews/mine/{tripId}': {
      get: {
        tags: ['Reviews'],
        summary: "Get the current user's review for a trip",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'tripId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Review returned or null' },
        },
      },
      put: {
        tags: ['Reviews'],
        summary: "Update the current user's review for a trip",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'tripId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Review updated' },
          400: { description: 'Validation failed' },
          404: { description: 'Review not found' },
        },
      },
    },
    '/api/reviews/top/all': {
      get: {
        tags: ['Reviews'],
        summary: 'Get top-rated trips',
        responses: {
          200: { description: 'Top trips returned' },
        },
      },
    },
    '/api/reviews/{tripId}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get reviews for a trip',
        parameters: [{ name: 'tripId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Trip reviews returned' },
        },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['System'],
        summary: 'Get notifications for the current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Notification list returned' },
          401: { description: 'Missing token' },
        },
      },
    },
    '/api/notifications/unread-count': {
      get: {
        tags: ['System'],
        summary: 'Get unread notification count for the current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Unread count returned' },
          401: { description: 'Missing token' },
        },
      },
    },
    '/api/notifications/{id}/read': {
      put: {
        tags: ['System'],
        summary: 'Mark one notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Notification marked as read' },
          404: { description: 'Notification not found' },
        },
      },
    },
    '/api/notifications/read-all': {
      put: {
        tags: ['System'],
        summary: 'Mark all current user notifications as read',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Notifications marked as read' },
        },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Get non-admin users',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User list returned' },
          403: { description: 'Admin only' },
        },
      },
    },
    '/api/admin/audit-logs': {
      get: {
        tags: ['Admin'],
        summary: 'Get recent audit logs',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Recent audit logs returned' },
          403: { description: 'Admin only' },
        },
      },
    },
    '/api/admin/event-logs': {
      get: {
        tags: ['Admin'],
        summary: 'Get recent event logs',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Recent event logs returned' },
          403: { description: 'Admin only' },
        },
      },
    },
    '/api/admin/users/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update a user as admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'User updated' },
          400: { description: 'Validation failed' },
          404: { description: 'User not found' },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user and related data as admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'User deleted' },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/contact': {
      post: {
        tags: ['Contact'],
        summary: 'Submit a contact message',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'message'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Message submitted' },
          400: { description: 'Validation failed' },
        },
      },
    },
  },
};

module.exports = openApiSpec;
