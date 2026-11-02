import { useApiData } from '../api/useApiData.js';

type Team = { name: string; mascot?: string; members: Array<string | { name?: string }> };

export default function Teams() {
  const state = useApiData<{ teams: Team[] }>('/api/teams');

  return <section>
    <h2 className="h4">Teams</h2>
    <p>Manage teams and members.</p>
    {state.status === 'loading' && <p role="status">Loading teams...</p>}
    {state.status === 'error' && <p role="alert">Unable to load teams: {state.message}</p>}
    {state.status === 'success' && (state.data.teams.length === 0
      ? <p role="status">No teams yet.</p>
      : <ul>{state.data.teams.map((team) => <li key={team.name}>
        {team.name}{team.mascot ? ` | ${team.mascot}` : ''} | {team.members.length} members
      </li>)}</ul>)}
  </section>;
}
