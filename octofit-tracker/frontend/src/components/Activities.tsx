import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: loadedActivities }) => {
        setActivities(loadedActivities);
        setStatus('ready');
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Unable to load activities');
        setStatus('error');
      });
  }, []);

  if (status === 'loading') return <><h2>Activities</h2><p role="status">Loading activities...</p></>;
  if (status === 'error') return <><h2>Activities</h2><p role="alert">Unable to load activities: {error}</p></>;
  if (activities.length === 0) return <><h2>Activities</h2><p>No activities found.</p></>;

  return (
    <>
      <h2>Activities</h2>
      <ul className="list-group">
        {activities.map((activity, index) => (
          <li className="list-group-item" key={index}>
            {activity.type}: {activity.minutes} minutes, {activity.points} points
          </li>
        ))}
      </ul>
    </>
  );
}
