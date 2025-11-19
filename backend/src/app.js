import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
dotenv.config();

import authRoutes from './routes/auth.js';
import photoRoutes from './routes/photo.js';
import userRoutes from './routes/user.js';
import bonusRoutes from './routes/bonus.js';


const app = express();
app.use(cors());
app.set('trust proxy', true);
app.use(express.json());
app.use('/uploads', express.static('uploads')); // для доступа к фото

app.use('/auth', authRoutes);
app.use('/photo', photoRoutes);
app.use('/user', userRoutes);
app.use('/bonus', bonusRoutes);


// Функция для получения локального IP адреса
const getLocalIP = () => {
  const interfaces = Object.values(os.networkInterfaces()).flat();
  return interfaces.find(iface => 
    iface.family === 'IPv4' && 
    !iface.internal
  )?.address || 'localhost';
};

const PORT = process.env.PORT || 3000;
const localIP = getLocalIP();
const hostname = os.hostname();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Server is running on port ${PORT}
📍 Local: http://localhost:${PORT}
🌐 Network: http://${localIP}:${PORT}
🖥️ Hostname: http://${hostname}:${PORT}
  `);
});