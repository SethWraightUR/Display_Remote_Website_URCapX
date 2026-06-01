import {
  registerSidebarBehavior,
  SidebarItemBehaviors,
} from "@universal-robots/contribution-api";

const behaviors: SidebarItemBehaviors = {
  factory: () => {
    return {
      type: "universal-robots-display-remote-display-remote-sidebar",
      version: "1.0.1",
    };
  },
};

registerSidebarBehavior(behaviors);
