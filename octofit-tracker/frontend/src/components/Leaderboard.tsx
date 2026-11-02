import { useApiData } from '../api/useApiData.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const state = useApiData<{ leaderboard: Entry[] }>('/api/leaderboard');

  return <section>
    <h2 className="h4">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
    {state.status === 'error' && <p role="alert">Unable to load leaderboard: {state.message}</p>}
    {state.status === 'success' && (state.data.leaderboard.length === 0
      ? <p role="status">No leaderboard scores yet.</p>
      : <ol>{state.data.leaderboard.map((entry) => <li key={entry.teamName}>
        {entry.teamName} | Rank {entry.rank} | {entry.totalPoints} points
      </li>)}</ol>)}
  </section>;
}
