import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'TripCircle API',
        description: 'Automated documentation for TripCircle endpoints',
    },
    host: process.env.BACKEND_URL ? process.env.BACKEND_URL.replace('https://', '') : 'localhost:5000',
    basePath: "/",
    schemes: ['https', 'http'],
};

const outputFile = './swagger/swagger-output.json';
const endpointsFiles = ['./server.js'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);