import { nanoid } from "nanoid";
import { useMemo, useState } from "react";

type World = {
  foobarCount: number;
  fooCount: number;
  barCount: number;
  robots: Map<RobotId, Robot>;
};

export type RobotId = string;

type WorkingRobot = { state: RobotState.Working; jobEndTime: number };
type IdleRobot = { state: RobotState.Idle };

type SwitchingRobot = { job: RobotJob.Switching; targetJob: Exclude<RobotJob, RobotJob.Switching> };
type OtherJobRobot = { job: Exclude<RobotJob, RobotJob.Switching> };

export type Robot = {
  id: RobotId;
} & (SwitchingRobot | OtherJobRobot) &
  (WorkingRobot | IdleRobot);

export enum RobotState {
  Idle,
  Working,
}

export enum RobotJob {
  Switching = "switching",
  MiningFoo = "miningFoo",
  MiningBar = "miningBar",
  AssemblingFoobar = "assemblingFoobar",
  BuyingRobot = "buyingRobot",
}

export function useWorld(initialRobots?: Robot[]) {
  const defaultInitialRobots = useMemo(() => toRobotMap([newRobot(), newRobot()]), []);

  const [world, setWorld] = useState({
    foobarCount: 0,
    fooCount: 0,
    barCount: 0,
    robots: initialRobots ? toRobotMap(initialRobots) : defaultInitialRobots,
    lastHandledFrame: 0,
  });

  function changeRobotJob(id: RobotId, newJob: Exclude<RobotJob, RobotJob.Switching>) {
    const robot = world.robots.get(id);
    if (!robot || robot.job === newJob) {
      return;
    }
    const updatedRobots = new Map(world.robots);
    updatedRobots.set(id, { ...robot, job: RobotJob.Switching, targetJob: newJob, state: RobotState.Idle });
    const newWorld = { ...world, robots: updatedRobots };
    setWorld(newWorld);
  }

  const robots = Array.from(world.robots.values());
  const resources = {
    foobarCount: world.foobarCount,
    fooCount: world.fooCount,
    barCount: world.barCount,
  };

  function tick(delay: number) {
    if (robots.length >= 20) {
      return;
    }
    const frame = world.lastHandledFrame + delay;
    const afterFinishingTasks = robots.reduce((reducedWorld: World, robot) => {
      return endRobotTaskIfPossible(robot, reducedWorld, frame);
    }, world);
    const newWorld = getRobots(afterFinishingTasks).reduce((reducedWorld: World, robot) => {
      return startRobotTaskIfPossible(robot, reducedWorld, frame);
    }, afterFinishingTasks);
    setWorld({ ...newWorld, lastHandledFrame: frame });
  }

  return { robots, resources, changeRobotJob, isDone: robots.length >= 20, tick };
}

export function newRobot(): Robot {
  return { id: nanoid(), state: RobotState.Idle, job: RobotJob.MiningFoo };
}

function getRobots(world: World): Robot[] {
  return Array.from(world.robots.values());
}

function endRobotTaskIfPossible(robot: Robot, world: World, frame: number): World {
  if (robot.state !== RobotState.Working) {
    return world;
  }
  switch (robot.job) {
    case RobotJob.Switching:
      if (robot.jobEndTime <= frame) {
        const newRobot = { ...robot, job: robot.targetJob, state: RobotState.Idle, targetJob: undefined };
        return updateRobot(newRobot, world);
      }
      return world;
    case RobotJob.MiningFoo:
      if (robot.jobEndTime <= frame) {
        const newRobot = { ...robot, state: RobotState.Idle };
        return { ...updateRobot(newRobot, world), fooCount: world.fooCount + 1 };
      }
      return world;
    case RobotJob.MiningBar:
      if (robot.jobEndTime <= frame) {
        const newRobot = { ...robot, state: RobotState.Idle };
        return { ...updateRobot(newRobot, world), barCount: world.barCount + 1 };
      }
      return world;
    case RobotJob.AssemblingFoobar:
      if (robot.jobEndTime > frame) {
        return world;
      }
      const worldWithNewRobot = updateRobot({ ...robot, state: RobotState.Idle }, world);
      const isSuccess = Math.random() <= 0.6;
      if (isSuccess) {
        return { ...worldWithNewRobot, foobarCount: worldWithNewRobot.foobarCount + 1 };
      } else {
        return { ...worldWithNewRobot, barCount: worldWithNewRobot.barCount + 1 };
      }
    case RobotJob.BuyingRobot:
    default:
      return world;
  }
}

function startRobotTaskIfPossible(robot: Robot, world: World, frame: number): World {
  if (robot.state !== RobotState.Idle) {
    return world;
  }
  switch (robot.job) {
    case RobotJob.Switching:
    case RobotJob.MiningFoo:
    case RobotJob.MiningBar:
      const jobEndTime = frame + getJobTimeInMs(robot.job);
      return updateRobot({ ...robot, state: RobotState.Working, jobEndTime }, world);
    case RobotJob.AssemblingFoobar:
      if (world.fooCount >= 1 && world.barCount >= 1) {
        const jobEndTime = frame + getJobTimeInMs(robot.job);
        const newWorld = updateRobot({ ...robot, state: RobotState.Working, jobEndTime }, world);
        return { ...newWorld, fooCount: world.fooCount - 1, barCount: world.barCount - 1 };
      }
      return world;
    case RobotJob.BuyingRobot:
      const robotsToBuy = Math.floor(Math.min(world.foobarCount / 3, world.fooCount / 6));
      const updatedRobots = new Map(world.robots);
      Array.from(new Array(robotsToBuy), newRobot).forEach((robot) => updatedRobots.set(robot.id, robot));
      return {
        ...world,
        robots: updatedRobots,
        foobarCount: world.foobarCount - robotsToBuy * 3,
        fooCount: world.fooCount - robotsToBuy * 6,
      };
  }
}

function updateRobot(newRobot: Robot, world: World) {
  const newRobots = Array.from(world.robots.values()).map((robot) => {
    if (robot.id === newRobot.id) {
      return newRobot;
    }
    return robot;
  });
  const newRobotsMap = new Map(newRobots.map((robot) => [robot.id, robot]));
  return { ...world, robots: newRobotsMap };
}

function getJobTimeInMs(job: RobotJob): number {
  switch (job) {
    case RobotJob.Switching:
      return 5000;
    case RobotJob.MiningFoo:
      return 1000;
    case RobotJob.MiningBar:
      return Math.random() * (2000 - 500) + 500;
    case RobotJob.AssemblingFoobar:
      return 2000;
    case RobotJob.BuyingRobot:
      return 0;
  }
}

function toRobotMap(robots: Robot[]): Map<RobotId, Robot> {
  return new Map(robots.map(robot => [robot.id, robot]));
}
