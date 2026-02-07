// swagger.js
import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv';
dotenv.config();

const doc = {
    info: {
        title: 'TripCircle API',
        description: 'Automated documentation for TripCircle endpoints',
    },
    servers: [
        {
            url: process.env.BACKEND_URL || 'http://localhost:5000',
            description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Local Development'
        }
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

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);