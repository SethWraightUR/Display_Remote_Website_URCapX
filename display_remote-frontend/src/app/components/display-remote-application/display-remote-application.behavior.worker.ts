/// <reference lib="webworker" />
import {
    ApplicationBehaviors,
    ApplicationNode,
    OptionalPromise,
    registerApplicationBehavior,
    ScriptBuilder,
} from '@universal-robots/contribution-api';
import {
    DISPLAY_REMOTE_APPLICATION_NODE_TYPE,
    DisplayRemoteApplicationNode,
} from './display-remote-application.node';

const createApplicationNode = (): OptionalPromise<DisplayRemoteApplicationNode> => ({
    type: DISPLAY_REMOTE_APPLICATION_NODE_TYPE,
    version: '1.0.1',
    remoteUrl: '',
});

const generatePreambleScriptCode = (_node: DisplayRemoteApplicationNode): OptionalPromise<ScriptBuilder> => {
    return new ScriptBuilder();
};

const mergeApplicationNode = (
    loadedNode: ApplicationNode,
    defaultNode: DisplayRemoteApplicationNode,
): DisplayRemoteApplicationNode => {
    const loaded = loadedNode as DisplayRemoteApplicationNode;
    return {
        ...defaultNode,
        ...loaded,
        remoteUrl: loaded.remoteUrl ?? '',
    };
};

const upgradeApplicationNode = (
    loadedNode: ApplicationNode,
    defaultNode: DisplayRemoteApplicationNode,
): DisplayRemoteApplicationNode => mergeApplicationNode(loadedNode, defaultNode);

const downgradeApplicationNode = (
    loadedNode: ApplicationNode,
    defaultNode: DisplayRemoteApplicationNode,
): DisplayRemoteApplicationNode => mergeApplicationNode(loadedNode, defaultNode);

const behaviors: ApplicationBehaviors = {
    factory: createApplicationNode,
    generatePreamble: generatePreambleScriptCode,
    upgradeNode: upgradeApplicationNode,
    downgradeNode: downgradeApplicationNode,
};

registerApplicationBehavior(behaviors);
