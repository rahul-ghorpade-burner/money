import { Routes, Route } from 'react-router';
import App from '../App';

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<App />}>
      {/* Future routes will go here */}
    </Route>
  </Routes>
);
