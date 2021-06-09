import {act, renderHook} from '@testing-library/react-hooks';
import {newRobot, RobotJob, useWorld} from "./use-world";
import {mockRandom} from "jest-mock-random";


test('should initialize properly', () => {
  const { result: world } = renderHook(() => useWorld())
  expect(world.current.resources.barCount).toBe(0)
  expect(world.current.resources.fooCount).toBe(0)
  expect(world.current.resources.foobarCount).toBe(0)
  expect(world.current.robots.length).toBe(2)
  expect(world.current.robots[0].job).toBe(RobotJob.MiningFoo)
  expect(world.current.robots[1].job).toBe(RobotJob.MiningFoo)
  expect(world.current.isDone).toBe(false)
})

test('should produce Foo', () => {
  const robotMiningFoo = newRobot();
  const { result: world } = renderHook(() => useWorld([robotMiningFoo]))
  act(() => {
    world.current.tick(1);
  })
  act(() => {
    world.current.tick(1000);
  })
  expect(world.current.resources.fooCount).toBe(1)
})

test('should produce Bar', () => {
  const robotMiningBar = newRobot();
  robotMiningBar.job = RobotJob.MiningBar;
  const { result: world } = renderHook(() => useWorld([robotMiningBar]))
  act(() => {
    world.current.tick(1);
  })
  act(() => {
    world.current.tick(2000);
  })
  expect(world.current.resources.barCount).toBe(1)
})

test('should switch job in 5 seconds', () => {
  const { result: world } = renderHook(() => useWorld([newRobot()]))
  act(() => {
    world.current.changeRobotJob(world.current.robots[0].id, RobotJob.MiningBar);
  })
  act(() => {
    world.current.tick(1);
  })
  act(() => {
    world.current.tick(4999);
  })
  expect(world.current.robots[0].job).toBe(RobotJob.Switching)
  act(() => {
    world.current.tick(1);
  })
  expect(world.current.robots[0].job).toBe(RobotJob.MiningBar)
})

test('should produce FooBar', () => {
  const robotMiningFoo = newRobot()
  const robotMiningBar = newRobot()
  robotMiningBar.job = RobotJob.MiningBar
  const robotAssemblingFoobar = newRobot()
  robotAssemblingFoobar.job = RobotJob.AssemblingFoobar
  const { result: world } = renderHook(() => useWorld([robotMiningFoo, robotMiningBar, robotAssemblingFoobar]))

  // Producing Foo and Bar
  act(() => {
    world.current.tick(1);
  })
  act(() => {
    world.current.tick(2000);
  })

  // Assembling FooBar
  mockRandom([0.1]);
  act(() => {
    world.current.tick(1);
  })
  act(() => {
    world.current.tick(2000);
  })
  expect(world.current.resources.foobarCount).toBe(1)
})

test('should not produce FooBar when gods of luck are displeased', () => {
  const robotMiningFoo = newRobot()
  const robotMiningBar = newRobot()
  robotMiningBar.job = RobotJob.MiningBar
  const robotAssemblingFoobar = newRobot()
  robotAssemblingFoobar.job = RobotJob.AssemblingFoobar
  const { result: world } = renderHook(() => useWorld([robotMiningFoo, robotMiningBar, robotAssemblingFoobar]))

  // Producing Foo and Bar
  act(() => {
    world.current.tick(1);
  })
  act(() => {
    world.current.tick(2000);
  })

  // Assembling FooBar with failure
  mockRandom([0.7]);
  act(() => {
    world.current.tick(1);
  })
  act(() => {
    world.current.tick(2000);
  })
  expect(world.current.resources.foobarCount).toBe(0)
})

test('should stop at 20 robots', () => {
  const robots = Array.from(Array(20).keys()).map(newRobot);
  const { result: world } = renderHook(() => useWorld(robots))
  expect(world.current.isDone).toBeTruthy()
})
