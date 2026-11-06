import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers';
import './style.css';
import './styles/global.scss';
createRoot(document.getElementById('root')).render(<React.StrictMode><AppProviders /></React.StrictMode>);
