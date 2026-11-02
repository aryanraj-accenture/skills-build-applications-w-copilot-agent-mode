import { useApiData } from '../api/useApiData.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };

export default function Workouts() {
  const email = 'mona@example.com';
  const state = useApiData<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent(email)}`);

  return <section>
    <h2 className="h4">Workout suggestions</h2>
    <p>Recommend workouts from activity patterns.</p>
    {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
    {state.status === 'error' && <p role="alert">Unable to load workout suggestions: {state.message}</p>}
    {state.status === 'success' && (state.data.suggestions.length === 0
      ? <p role="status">No workout suggestions yet.</p>
      : <ul>{state.data.suggestions.map((workout) => <li key={workout.title}>
        {workout.title}{workout.focus ? ` | ${workout.focus}` : ''}{workout.minutes ? ` | ${workout.minutes} minutes` : ''}
        {workout.difficulty ? ` | ${workout.difficulty}` : ''}{workout.reason ? ` | ${workout.reason}` : ''}
      </li>)}</ul>)}
  </section>;
}
