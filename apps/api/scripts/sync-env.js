import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const examplePath = path.resolve('.env.example');

if (!fs.existsSync(envPath)) {
    console.error('.env file not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const exampleContent = envContent
    .split('\n')
    .map(line => {
        // Keep comments and empty lines
        if (!line.trim() || line.startsWith('#')) return line;

        // Split key and value, keep the key, replace value with a placeholder
        const [key] = line.split('=');
        return `${key}=your_${key.toLowerCase()}`;
    })
    .join('\n');

fs.writeFileSync(examplePath, exampleContent);
console.log('.env.example has been synchronized!');