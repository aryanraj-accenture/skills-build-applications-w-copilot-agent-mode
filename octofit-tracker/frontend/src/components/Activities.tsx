import { useApiData } from '../api/useApiData.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const state = useApiData<{ activities: Activity[] }>('/api/activities');

  return <section>
    <h2 className="h4">Activities</h2>
    <p>Track student activity minutes and points.</p>
    {state.status === 'loading' && <p role="status">Loading activities...</p>}
    {state.status === 'error' && <p role="alert">Unable to load activities: {state.message}</p>}
    {state.status === 'success' && (state.data.activities.length === 0
      ? <p role="status">No activities yet.</p>
      : <ul>{state.data.activities.map((activity, index) => <li key={`${activity.type}-${index}`}>
        {activity.type} | {activity.minutes} minutes | {activity.points} points
      </li>)}</ul>)}
  </section>;
}
