import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        setEntries(leaderboard);
        setStatus('ready');
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Unable to load leaderboard');
        setStatus('error');
      });
  }, []);

  if (status === 'loading') return <><h2>Leaderboard</h2><p role="status">Loading leaderboard...</p></>;
  if (status === 'error') return <><h2>Leaderboard</h2><p role="alert">Unable to load leaderboard: {error}</p></>;
  if (entries.length === 0) return <><h2>Leaderboard</h2><p>No leaderboard rankings found.</p></>;

  return (
    <>
      <h2>Leaderboard</h2>
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li className="list-group-item" key={entry.teamName}>
            {entry.teamName}: {entry.totalPoints} points
          </li>
        ))}
      </ol>
    </>
  );
}
