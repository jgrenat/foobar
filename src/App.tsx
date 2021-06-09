import "./App.css";
import {useWorld} from "./use-world";
import RobotCard from "./RobotCard";
import useInterval from "./use-interval";
import {useState} from "react";

const TICK_DELAY_IN_MS = 100;

function App() {
  const { robots, resources, changeRobotJob, isDone, tick } = useWorld();
  const [lastHandledFrame, setLastHandledFrame] = useState(performance.now());
  useInterval(() => {
    const frame = performance.now()
    const delay = frame - lastHandledFrame;
    setLastHandledFrame(frame);
    tick(delay);
  }, isDone ? null : TICK_DELAY_IN_MS);

  return (
    <main>
      <h1 className="mainTitle">Foobartory</h1>

      {isDone && <p className="success" aria-live="assertive">Bravo, vous avez atteint 20 robots !</p>}

      <aside className="resources">
        <dl>
          <dt>Foo</dt>
          <dd>{resources.fooCount}</dd>
          <dt>Bar</dt>
          <dd>{resources.barCount}</dd>
          <dt>Foobar</dt>
          <dd>{resources.foobarCount}</dd>
          <dt>Robots</dt>
          <dd aria-live="polite" aria-valuenow={robots.length} aria-valuemin={2} aria-valuemax={20}>{robots.length}/20</dd>
        </dl>
      </aside>

      <section className="robots">
        {robots.map((robot, index) => (
          <RobotCard number={index + 1} key={index} robot={robot} changeJob={(job) => changeRobotJob(robot.id, job)} />
        ))}
      </section>
    </main>
  );
}

export default App;
