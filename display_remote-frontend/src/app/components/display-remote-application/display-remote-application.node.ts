import { ApplicationNode } from '@universal-robots/contribution-api';

export const DISPLAY_REMOTE_APPLICATION_NODE_TYPE =
    'universal-robots-display-remote-display-remote-application' as const;

export interface DisplayRemoteApplicationNode extends ApplicationNode {
    type: typeof DISPLAY_REMOTE_APPLICATION_NODE_TYPE;
    version: string;
    remoteUrl: string;
}
