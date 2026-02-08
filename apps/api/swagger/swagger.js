import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv';
dotenv.config();

const doc = {
    info: {
        title: 'TripCircle API',
        description: 'Comprehensive API documentation for the TripCircle travel platform.',
        version: '1.0.0'
    },
    servers: [
        {
            url: '/',
            description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Local Development'
        }
    ],
    tags: [
        { name: 'Authentication', description: 'User registration and login endpoints' },
        { name: 'Trips', description: 'Core trip management and planning' },
        { name: 'Social', description: 'User posts, likes, and comments' },
        { name: 'External Services', description: 'Weather and Geocoding integrations' },
        { name: 'Users', description: 'User profile management' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            }
        }
    }
};

const outputFile = './swagger/swagger-output.json';
const endpointsFiles = ['./server.js'];

// Generate the documentation
swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);