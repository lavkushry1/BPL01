import { Navigate, useParams } from 'react-router-dom';

/**
 * Legacy route kept for backward compatibility.
 * The new BookMyShow-like flow lives at `/matches/:id`.
 */
const StadiumBooking = () => {
  const { matchId } = useParams<{ matchId: string }>();
  if (!matchId) return <Navigate to="/ipl-tickets" replace />;
  return <Navigate to={`/matches/${matchId}`} replace />;
};

export default StadiumBooking;

