import { Robot, RobotJob, RobotState } from "./use-world";
import React from "react";

type RenderProps = {
  number: number;
  robot: Robot;
  changeJob: (job: Exclude<RobotJob, RobotJob.Switching>) => void;
};

const RobotCard: React.FC<RenderProps> = ({ number, robot, changeJob }) => {
  return (
    <div className={"robotCard" + (robot.state === RobotState.Idle ? " robotCard--idle" : "")}>
      <h2 className="title">Robot {number}</h2>
      <dl>
        <dt>Boulot</dt>
        <dd>
          {robot.job === RobotJob.Switching ? (
            <>En train de changer de boulot...</>
          ) : (
            <select onChange={job => changeJob(job.target.value as Exclude<RobotJob, RobotJob.Switching>)} value={robot.job}>
              <option value={RobotJob.MiningFoo}>Miner du Foo</option>
              <option value={RobotJob.MiningBar}>Miner du Bar</option>
              <option value={RobotJob.AssemblingFoobar}>Assembler du FooBar</option>
              <option value={RobotJob.BuyingRobot}>Acheter des robots</option>
            </select>
          )}
        </dd>

        <dt>Statut</dt>
        <dd>{getState(robot.state)}</dd>
      </dl>
    </div>
  );
};

function getState(state: RobotState) {
  switch (state) {
    case RobotState.Idle:
      return "En attente";
    case RobotState.Working:
      return "Occupé...";
  }
}

export default RobotCard;
