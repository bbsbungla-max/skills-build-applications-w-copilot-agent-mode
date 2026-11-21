import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then(({ suggestions: loadedSuggestions }) => {
        setSuggestions(loadedSuggestions);
        setStatus('ready');
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Unable to load workout suggestions');
        setStatus('error');
      });
  }, []);

  if (status === 'loading') return <><h2>Workout suggestions</h2><p role="status">Loading workout suggestions...</p></>;
  if (status === 'error') return <><h2>Workout suggestions</h2><p role="alert">Unable to load workout suggestions: {error}</p></>;
  if (suggestions.length === 0) return <><h2>Workout suggestions</h2><p>No workout suggestions found.</p></>;

  return (
    <>
      <h2>Workout suggestions</h2>
      <ul className="list-group">
        {suggestions.map((suggestion, index) => (
          <li className="list-group-item" key={`${suggestion.title}-${index}`}>
            <strong>{suggestion.title}</strong>
            <p className="mb-0">{suggestion.reason}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
