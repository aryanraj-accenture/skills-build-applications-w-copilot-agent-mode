import { Activity, Team, User, Workout } from '../models/index.js';

type ServiceError = Error & { status: number };

function serviceError(message: string, status: number): ServiceError {
  return Object.assign(new Error(message), { status });
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw serviceError('Request body must be an object', 400);
  }
  return input as Record<string, unknown>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function activityFocus(type: string): string {
  const normalized = type.toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'swim', 'swimming'].includes(normalized)) return 'endurance';
  if (['strength', 'weights', 'weightlifting'].includes(normalized)) return 'strength';
  if (['walk', 'walking', 'yoga', 'stretch'].includes(normalized)) return 'mobility';
  return normalized;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const { userId, teamId, type, minutes } = body;
  if (!isNonEmptyString(userId) || !isNonEmptyString(teamId) || !isNonEmptyString(type)) {
    throw serviceError('userId, teamId, and type are required', 400);
  }
  if (!Number.isFinite(minutes) || typeof minutes !== 'number' || minutes <= 0) {
    throw serviceError('minutes must be a positive number', 400);
  }
  if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(teamId)) {
    throw serviceError('userId and teamId must be valid IDs', 400);
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw serviceError('User or team was not found', 404);

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  const { name, mascot } = body;
  if (!isNonEmptyString(name)) throw serviceError('A team name is required', 400);
  if (!isNonEmptyString(mascot)) throw serviceError('A team mascot is required', 400);

  const memberIds = body.members ?? [];
  if (!Array.isArray(memberIds) || memberIds.some((memberId) => typeof memberId !== 'string' || !/^[a-f\d]{24}$/i.test(memberId))) {
    throw serviceError('members must be an array of valid user IDs', 400);
  }
  const members = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (members.length !== memberIds.length) throw serviceError('One or more team members were not found', 404);

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: unknown; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw serviceError('User was not found', 404);

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentFocuses = new Set(activities.map((activity) => activityFocus(activity.type)));

  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const matchesGoal = focus === goal;
      const matchingActivity = activities.find((activity) => activityFocus(activity.type) === focus);
      return {
        ...workout,
        reason: matchesGoal && matchingActivity
          ? `Recommended for your ${goal} goal and recent ${matchingActivity.type} activity.`
          : matchesGoal
            ? `Recommended for your ${goal} fitness goal.`
            : matchingActivity
              ? `Recommended based on your recent ${matchingActivity.type} activity.`
              : `Suggested to complement your ${goal} fitness goal.`,
        relevance: matchesGoal || recentFocuses.has(focus) ? 0 : 1,
      };
    })
    .sort((left, right) => left.relevance - right.relevance || left.title.localeCompare(right.title))
    .map(({ relevance: _relevance, ...workout }) => workout);
}

export { User };
