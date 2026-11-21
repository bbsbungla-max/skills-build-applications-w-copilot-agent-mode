import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: loadedTeams }) => {
        setTeams(loadedTeams);
        setStatus('ready');
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Unable to load teams');
        setStatus('error');
      });
  }, []);

  if (status === 'loading') return <><h2>Teams</h2><p role="status">Loading teams...</p></>;
  if (status === 'error') return <><h2>Teams</h2><p role="alert">Unable to load teams: {error}</p></>;
  if (teams.length === 0) return <><h2>Teams</h2><p>No teams found.</p></>;

  return (
    <>
      <h2>Teams</h2>
      <ul className="list-group">
        {teams.map((team) => <li className="list-group-item" key={team.name}>{team.name}</li>)}
      </ul>
    </>
  );
}
