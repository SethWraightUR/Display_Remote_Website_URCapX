/// <reference lib="webworker" />
import {
  OperatorScreenBehaviors,
  registerOperatorScreenBehavior
} from '@universal-robots/contribution-api';

const behaviors: OperatorScreenBehaviors = {
  factory: () => {
    return {
      type: "universal-robots-display-remote-display-remote-operator",
      version: "1.0.1",
    };
  },
};

registerOperatorScreenBehavior(behaviors);
