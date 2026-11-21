import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Valid activity data is required'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const data = input as Record<string, unknown>;
  if (
    typeof data.userId !== 'string' ||
    !mongoose.isValidObjectId(data.userId) ||
    typeof data.teamId !== 'string' ||
    !mongoose.isValidObjectId(data.teamId) ||
    typeof data.type !== 'string' ||
    !data.type.trim() ||
    typeof data.minutes !== 'number' ||
    !Number.isFinite(data.minutes) ||
    data.minutes < 1
  ) {
    throw invalidInput();
  }

  const occurredAt = data.occurredAt === undefined ? new Date() : new Date(String(data.occurredAt));
  if (Number.isNaN(occurredAt.getTime())) throw invalidInput();

  const [user, team] = await Promise.all([
    User.findById(data.userId).select('_id'),
    Team.findById(data.teamId).select('_id'),
  ]);
  if (!user || !team) throw invalidInput();

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: data.type.trim(),
    minutes: data.minutes,
    points: data.minutes,
    occurredAt,
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Valid team data is required'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const data = input as Record<string, unknown>;
  if (
    typeof data.name !== 'string' ||
    !data.name.trim() ||
    typeof data.mascot !== 'string' ||
    !data.mascot.trim()
  ) {
    throw invalidInput();
  }

  const memberIds = data.members === undefined ? [] : data.members;
  if (
    !Array.isArray(memberIds) ||
    memberIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))
  ) {
    throw invalidInput();
  }

  const members = await User.find({ _id: { $in: memberIds } }).select('_id');
  if (members.length !== memberIds.length) throw invalidInput();

  const team = await Team.create({
    name: data.name.trim(),
    mascot: data.mascot.trim(),
    members: members.map((member) => member._id),
  });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map((entry) => entry._id) } }).select('_id name').lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals.map((entry, index) => {
    const teamName = teamNames.get(entry._id.toString());
    if (!teamName) throw new Error('Team not found for leaderboard activity');
    return { teamName, totalPoints: entry.totalPoints, rank: index + 1 };
  });
}

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail.trim().toLowerCase();
  if (!email) throw Object.assign(new Error('User email is required'), { status: 400 });

  const user = await User.findOne({ email }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).lean(),
    Workout.find().lean(),
  ]);
  const activityTypes = [...new Set(activities.map((activity) => activity.type.toLowerCase()))];
  const goal = user.fitnessGoal.toLowerCase();

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const matchesGoal = focus === goal;
      const matchingActivities = activityTypes.filter((type) => type === focus || type.includes(focus) || focus.includes(type));
      const score = (matchesGoal ? 2 : 0) + (matchingActivities.length > 0 ? 3 : 0);
      const reasons = [
        ...(matchesGoal ? [`matches your ${goal} goal`] : []),
        ...(matchingActivities.length ? [`matches your ${matchingActivities.join(', ')} activity pattern`] : []),
      ];
      if (reasons.length === 0) reasons.push(`offers a complementary ${focus} workout for your ${goal} goal`);
      return { workout, score, reason: reasons.join(' and ') };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ workout, reason }) => ({ ...workout, reason }));
}

export { User };
