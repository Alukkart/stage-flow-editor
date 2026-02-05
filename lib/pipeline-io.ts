import {StageDefinition, StageNode} from "@/core/nodes/stageNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {OrderEdge} from "@/core/edges/orderEdge";
import {BaseEdge} from "@/core/edges/baseEdge";
import {BaseNode} from "@/core/nodes/baseNode";

export type ParamLike = {
    type: string;
    description?: string;
    optional?: boolean;
    required?: boolean;
    default?: unknown;
};

export type StageDefinitionInput = Omit<StageDefinition, "arguments" | "config" | "outputs"> & {
    arguments?: StageDefinition["arguments"] | Record<string, ParamLike>;
    config?: StageDefinition["config"] | Record<string, ParamLike>;
    outputs?: StageDefinition["outputs"] | Record<string, ParamLike>;
};

export type PipelineNodeStage = {
    id: string;
    type: "stage";
    stage: string;
    next?: string | null;
    arguments?: Record<string, string>;
    config?: Record<string, unknown>;
    outputs?: Record<string, string>;
};

export type PipelineNodeParallel = {
    id: string;
    type: "parallel";
    policy?: "all" | "any";
    children?: string[];
    next?: string | null;
};

export type PipelineNode = PipelineNodeStage | PipelineNodeParallel | Record<string, unknown>;

export type Pipeline = {
    api_version?: string;
    entry?: string;
    nodes?: PipelineNode[];
};

const normalizeParams = (
    value: StageDefinitionInput["arguments"] | undefined
) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return Object.entries(value).map(([name, param]) => ({
        name,
        type: param.type,
        description: param.description,
        optional: param.optional ?? (param.required === false),
    }));
};

export const parseStagePayload = (payload: Record<string, StageDefinitionInput>) =>
    Object.entries(payload).map(([key, value]) => ({
        ...value,
        stage_name: value.stage_name || key,
        allowed_events: value.allowed_events ?? [],
        allowed_inputs: value.allowed_inputs ?? [],
        arguments: normalizeParams(value.arguments),
        config: normalizeParams(value.config),
        outputs: normalizeParams(value.outputs),
    }));

const buildStageFromPipeline = (
    stageName: string,
    pipelineNode: PipelineNodeStage
): StageDefinition => {
    const toParams = (value?: Record<string, string>) =>
        value
            ? Object.keys(value).map((name) => ({
                name,
                type: "any",
            }))
            : [];

    return {
        stage_name: stageName,
        skipable: false,
        allowed_events: [],
        allowed_inputs: [],
        category: "pipeline.import",
        description: "",
        arguments: toParams(pipelineNode.arguments),
        config: toParams(pipelineNode.config as Record<string, string> | undefined),
        outputs: toParams(pipelineNode.outputs),
    };
};

const serializeStageParams = (stage: StageDefinition) => {
    const result: Record<string, string> = {};
    stage.arguments.forEach((arg) => {
        result[arg.name] = "";
    });
    return result;
};

const serializeStageConfig = (stage: StageDefinition) => {
    const result: Record<string, string> = {};
    stage.config.forEach((cfg) => {
        result[cfg.name] = "";
    });
    return result;
};

const serializeStageOutputs = (stage: StageDefinition) => {
    const result: Record<string, string> = {};
    stage.outputs.forEach((output) => {
        result[output.name] = "";
    });
    return result;
};

export const buildGraphFromPipeline = (
    pipeline: Pipeline,
    remoteStages: StageDefinition[]
) => {
    const pipelineNodes = pipeline.nodes ?? [];
    const nodes: Array<StageNode | ParallelNode> = [];
    const nodeMap = new Map<string, StageNode | ParallelNode>();
    const spacingY = 320;

    pipelineNodes.forEach((node, index) => {
        if (!node || typeof node !== "object") return;
        const nodeType = (node as PipelineNodeStage | PipelineNodeParallel).type;

        if (nodeType === "stage") {
            const stageNode = node as PipelineNodeStage;
            const stageName = stageNode.stage || stageNode.id;
            const stageFromServer = remoteStages.find((stage) => stage.stage_name === stageName);
            const stage = stageFromServer ?? buildStageFromPipeline(stageName, stageNode);
            const created = new StageNode(stageNode.id, {x: 0, y: index * spacingY}, {stage});
            nodes.push(created);
            nodeMap.set(stageNode.id, created);
        }

        if (nodeType === "parallel") {
            const parallelNode = node as PipelineNodeParallel;
            const children = (parallelNode.children ?? []).filter(Boolean);
            const created = new ParallelNode(
                parallelNode.id,
                {x: 0, y: index * spacingY},
                {policy: parallelNode.policy ?? "all", childrenNodesIds: children}
            );
            nodes.push(created);
            nodeMap.set(parallelNode.id, created);
        }
    });

    const edges = pipelineNodes.flatMap((node) => {
        if (!node || typeof node !== "object") return [];
        const nodeType = (node as PipelineNodeStage | PipelineNodeParallel).type;
        if (nodeType !== "stage" && nodeType !== "parallel") return [];

        const sourceId = (node as PipelineNodeStage | PipelineNodeParallel).id;
        const nextId = (node as PipelineNodeStage | PipelineNodeParallel).next;
        if (!nextId) return [];

        const sourceNode = nodeMap.get(sourceId);
        const targetNode = nodeMap.get(nextId);
        if (!sourceNode || !targetNode) return [];

        const sourceHandle = sourceNode.handles.find((handle) => handle.kind === "order" && handle.type === "source");
        const targetHandle = targetNode.handles.find((handle) => handle.kind === "order" && handle.type === "target");
        if (!sourceHandle || !targetHandle) return [];

        return [
            new OrderEdge(
                `${sourceId}-${nextId}`,
                sourceId,
                nextId,
                sourceHandle.id,
                targetHandle.id
            ),
        ];
    });

    return {nodes, edges};
};

export const buildPipelineFromGraph = (nodes: BaseNode[], edges: BaseEdge[]) => {
    const orderEdges = edges.filter((edge) => edge.type === "orderEdge");
    const nextBySource = new Map<string, string>();
    orderEdges.forEach((edge) => {
        if (!nextBySource.has(edge.source)) {
            nextBySource.set(edge.source, edge.target);
        }
    });

    const pipelineNodes: Array<PipelineNodeStage | PipelineNodeParallel> = [];
    nodes.forEach((node) => {
        if (node.type === "stageNode") {
            const stageData = (node as StageNode).data.stage;
            pipelineNodes.push({
                id: node.id,
                type: "stage",
                stage: stageData.stage_name,
                next: nextBySource.get(node.id) ?? null,
                arguments: serializeStageParams(stageData),
                config: serializeStageConfig(stageData),
                outputs: serializeStageOutputs(stageData),
            });
            return;
        }

        if (node.type === "parallelNode") {
            const parallelData = (node as ParallelNode).data;
            pipelineNodes.push({
                id: node.id,
                type: "parallel",
                policy: parallelData.policy,
                children: parallelData.childrenNodesIds,
                next: nextBySource.get(node.id) ?? null,
            });
        }
    });

    const pipeline: Pipeline = {
        api_version: "1.0",
        entry: pipelineNodes[0]?.id,
        nodes: pipelineNodes,
    };

    return pipeline;
};
