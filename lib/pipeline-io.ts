import {StageDefinition, StageNode, StageParam} from "@/core/nodes/stageNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {OrderEdge} from "@/core/edges/orderEdge";
import {BaseEdge} from "@/core/edges/baseEdge";
import {BaseNode} from "@/core/nodes/baseNode";
import {InputsNode} from "@/core/nodes/inputsNode";
import {DataEdge} from "@/core/edges/dataEdge";
import {ConditionNode} from "@/core/nodes/conditionNode";
import {TerminalNode} from "@/core/nodes/terminalNode";
import type {MarkerType} from "@xyflow/react";
import {autoLayoutNodes} from "@/lib/graph-layout";

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

export type PipelineCondition = {
    if: Record<string, unknown>;
    then: string;
};

export type PipelineNodeCondition = {
    id: string;
    type: "condition";
    conditions: PipelineCondition[];
    else?: string | null;
};

export type PipelineNodeTerminal = {
    id: string;
    type: "terminal";
    artifacts?: string[];
    result?: unknown;
};

export type PipelineNode =
    | PipelineNodeStage
    | PipelineNodeParallel
    | PipelineNodeCondition
    | PipelineNodeTerminal
    | Record<string, unknown>;

export type Pipeline = {
    api_version?: string;
    entry?: string;
    nodes?: PipelineNode[];
};

type Producer = {
    nodeId: string;
    handleKey: string;
    sourceType: "inputs" | "stage";
};

const FLOW_MAIN_HANDLES = new Set(["", "flow-output", "flow-next"]);

const normalizeParams = (
    value: StageDefinitionInput["arguments"] | undefined,
) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return Object.entries(value).map(([name, param]) => ({
        name,
        type: param.type,
        description: param.description,
        optional: param.optional ?? (param.required === false),
        value: param.default == null ? "" : String(param.default),
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

const toStageParams = (value?: Record<string, unknown>): StageParam[] =>
    value
        ? Object.entries(value).map(([name, paramValue]) => ({
            name,
            type: "any",
            value: paramValue == null ? "" : String(paramValue),
        }))
        : [];

const buildStageFromPipeline = (
    stageName: string,
    pipelineNode: PipelineNodeStage,
): StageDefinition => ({
    stage_name: stageName,
    skipable: false,
    allowed_events: [],
    allowed_inputs: [],
    category: "pipeline.import",
    description: "",
    arguments: toStageParams(pipelineNode.arguments),
    config: toStageParams(pipelineNode.config as Record<string, unknown> | undefined),
    outputs: toStageParams(pipelineNode.outputs),
});

const mergeStageWithPipelineValues = (stage: StageDefinition, pipelineNode: PipelineNodeStage): StageDefinition => {
    const merge = (base: StageParam[], value?: Record<string, unknown>) => {
        const valueMap = new Map(Object.entries(value ?? {}));
        const merged = base.map((param) => {
            const raw = valueMap.get(param.name);
            if (raw === undefined) return {...param, value: param.value ?? ""};
            return {...param, value: raw == null ? "" : String(raw)};
        });

        valueMap.forEach((raw, name) => {
            if (!merged.find((param) => param.name === name)) {
                merged.push({
                    name,
                    type: "any",
                    value: raw == null ? "" : String(raw),
                });
            }
        });

        return merged;
    };

    return {
        ...stage,
        arguments: merge(stage.arguments, pipelineNode.arguments),
        config: merge(stage.config, pipelineNode.config as Record<string, unknown> | undefined),
        outputs: merge(stage.outputs, pipelineNode.outputs),
    };
};

const parseVarReference = (value: unknown): {scope: "vars" | "inputs"; key: string} | null => {
    if (typeof value !== "string") return null;
    const varsMatch = value.match(/^vars\.(.+)$/);
    if (varsMatch) return {scope: "vars", key: varsMatch[1]};

    const inputsMatch = value.match(/^inputs\.(.+)$/);
    if (inputsMatch) return {scope: "inputs", key: inputsMatch[1]};

    return null;
};

const collectInputVars = (value: unknown, acc: Set<string>) => {
    if (typeof value === "string") {
        const ref = parseVarReference(value);
        if (ref?.scope === "inputs") {
            acc.add(ref.key);
        }
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item) => collectInputVars(item, acc));
        return;
    }

    if (value && typeof value === "object") {
        Object.values(value).forEach((item) => collectInputVars(item, acc));
    }
};

const serializeStageParams = (params: StageParam[]) => {
    const result: Record<string, string> = {};
    params.forEach((param) => {
        result[param.name] = param.value ?? "";
    });
    return result;
};

const newFlowEdge = (
    id: string,
    source: string,
    target: string,
    sourceHandle: string,
    targetHandle: string,
    label?: string,
) => {
    const edge = new OrderEdge(id, source, target, sourceHandle, targetHandle);
    edge.className = "edge-flow";
    edge.animated = true;
    edge.label = label;
    edge.markerEnd = {type: "arrowclosed" as MarkerType};
    edge.style = {stroke: "#94a3b8", strokeWidth: 1.5, strokeDasharray: "5,5"};
    return edge;
};

const newDataEdge = (
    id: string,
    source: string,
    target: string,
    sourceHandle: string,
    targetHandle: string,
    label: string,
    sourceType: "inputs" | "stage",
) => {
    const edge = new DataEdge(id, source, target, sourceHandle, targetHandle);
    edge.className = "edge-data";
    edge.label = label;
    edge.style = sourceType === "inputs"
        ? {stroke: "#d97706", strokeWidth: 1.5, strokeDasharray: "2,2"}
        : {stroke: "#8b5cf6", strokeWidth: 2.5};
    return edge;
};

export const buildGraphFromPipeline = (
    pipeline: Pipeline,
    remoteStages: StageDefinition[],
) => {
    const pipelineNodes = pipeline.nodes ?? [];
    const nodes: Array<StageNode | ParallelNode | ConditionNode | TerminalNode | InputsNode> = [];
    const nodeMap = new Map<string, BaseNode>();
    const spacingY = 320;

    const inputVars = new Set<string>();
    pipelineNodes.forEach((node) => {
        if (!node || typeof node !== "object") return;

        if ((node as PipelineNodeStage).type === "stage") {
            const stageNode = node as PipelineNodeStage;
            collectInputVars(stageNode.arguments, inputVars);
            collectInputVars(stageNode.config, inputVars);
            collectInputVars(stageNode.outputs, inputVars);
        }

        if ((node as PipelineNodeTerminal).type === "terminal") {
            const terminalNode = node as PipelineNodeTerminal;
            collectInputVars(terminalNode.artifacts, inputVars);
        }
    });

    let inputsNode: InputsNode | null = null;
    if (inputVars.size > 0) {
        inputsNode = new InputsNode("inputs", {x: 0, y: -spacingY}, {
            variables: Array.from(inputVars),
            nextNodeId: pipeline.entry ?? null,
        });
        nodes.push(inputsNode);
        nodeMap.set(inputsNode.id, inputsNode);
    }

    pipelineNodes.forEach((node, index) => {
        if (!node || typeof node !== "object") return;
        const nodeType = (node as PipelineNodeStage | PipelineNodeParallel | PipelineNodeCondition | PipelineNodeTerminal).type;

        if (nodeType === "stage") {
            const stageNode = node as PipelineNodeStage;
            const stageName = stageNode.stage || stageNode.id;
            const remote = remoteStages.find((stage) => stage.stage_name === stageName);
            const stage = remote
                ? mergeStageWithPipelineValues(remote, stageNode)
                : buildStageFromPipeline(stageName, stageNode);
            const created = new StageNode(stageNode.id, {x: 0, y: index * spacingY}, {
                stage,
                nextNodeId: stageNode.next ?? null,
            });
            nodes.push(created);
            nodeMap.set(stageNode.id, created);
            return;
        }

        if (nodeType === "parallel") {
            const parallelNode = node as PipelineNodeParallel;
            const created = new ParallelNode(
                parallelNode.id,
                {x: 0, y: index * spacingY},
                {
                    policy: parallelNode.policy ?? "all",
                    childrenNodesIds: [...(parallelNode.children ?? [])],
                    nextNodeId: parallelNode.next ?? null,
                },
            );
            nodes.push(created);
            nodeMap.set(parallelNode.id, created);
            return;
        }

        if (nodeType === "condition") {
            const conditionNode = node as PipelineNodeCondition;
            const created = new ConditionNode(
                conditionNode.id,
                {x: 0, y: index * spacingY},
                {
                    conditions: (conditionNode.conditions ?? []).map((item) => ({
                        if: item.if && typeof item.if === "object" ? item.if : {"==": [{var: ""}, ""]},
                        then: item.then ?? "",
                    })),
                    elseNodeId: conditionNode.else ?? null,
                },
            );
            nodes.push(created);
            nodeMap.set(conditionNode.id, created);
            return;
        }

        if (nodeType === "terminal") {
            const terminalNode = node as PipelineNodeTerminal;
            const created = new TerminalNode(
                terminalNode.id,
                {x: 0, y: index * spacingY},
                {
                    result: terminalNode.result == null ? "" : String(terminalNode.result),
                    artifacts: [...(terminalNode.artifacts ?? [])],
                },
            );
            nodes.push(created);
            nodeMap.set(terminalNode.id, created);
        }
    });

    const edges: BaseEdge[] = [];

    if (inputsNode && inputsNode.data.nextNodeId && nodeMap.has(inputsNode.data.nextNodeId)) {
        edges.push(
            newFlowEdge(
                `e-${inputsNode.id}-${inputsNode.data.nextNodeId}`,
                inputsNode.id,
                inputsNode.data.nextNodeId,
                "flow-output",
                "flow-input",
            ),
        );
    }

    nodes.forEach((node) => {
        if (node.type === "stageNode") {
            const stageNode = node as StageNode;
            if (stageNode.data.nextNodeId && nodeMap.has(stageNode.data.nextNodeId)) {
                edges.push(
                    newFlowEdge(
                        `e-${stageNode.id}-${stageNode.data.nextNodeId}`,
                        stageNode.id,
                        stageNode.data.nextNodeId,
                        "flow-output",
                        "flow-input",
                    ),
                );
            }
            return;
        }

        if (node.type === "parallelNode") {
            const parallelNode = node as ParallelNode;
            parallelNode.data.childrenNodesIds.forEach((childId, index) => {
                if (!childId || !nodeMap.has(childId)) return;
                edges.push(
                    newFlowEdge(
                        `e-${parallelNode.id}-child-${index}-${childId}`,
                        parallelNode.id,
                        childId,
                        `flow-child-${index}`,
                        "flow-input",
                        "child",
                    ),
                );
            });

            if (parallelNode.data.nextNodeId && nodeMap.has(parallelNode.data.nextNodeId)) {
                edges.push(
                    newFlowEdge(
                        `e-${parallelNode.id}-next-${parallelNode.data.nextNodeId}`,
                        parallelNode.id,
                        parallelNode.data.nextNodeId,
                        "flow-next",
                        "flow-input",
                        "next",
                    ),
                );
            }
            return;
        }

        if (node.type === "conditionNode") {
            const conditionNode = node as ConditionNode;
            conditionNode.data.conditions.forEach((condition, index) => {
                if (!condition.then || !nodeMap.has(condition.then)) return;
                edges.push(
                    newFlowEdge(
                        `e-${conditionNode.id}-then-${index}-${condition.then}`,
                        conditionNode.id,
                        condition.then,
                        `flow-then-${index}`,
                        "flow-input",
                        conditionNode.data.conditions.length === 1 ? "true" : `if#${index + 1}`,
                    ),
                );
            });

            if (conditionNode.data.elseNodeId && nodeMap.has(conditionNode.data.elseNodeId)) {
                edges.push(
                    newFlowEdge(
                        `e-${conditionNode.id}-else-${conditionNode.data.elseNodeId}`,
                        conditionNode.id,
                        conditionNode.data.elseNodeId,
                        "flow-else",
                        "flow-input",
                        conditionNode.data.conditions.length === 1 ? "false" : "else",
                    ),
                );
            }
        }
    });

    const producers = new Map<string, Producer[]>();
    const pushProducer = (key: string, producer: Producer) => {
        if (!producers.has(key)) {
            producers.set(key, []);
        }
        producers.get(key)!.push(producer);
    };

    if (inputsNode) {
        inputsNode.data.variables.forEach((variable) => {
            pushProducer(variable, {nodeId: inputsNode.id, handleKey: variable, sourceType: "inputs"});
        });
    }

    nodes.forEach((node) => {
        if (node.type !== "stageNode") return;
        const stageNode = node as StageNode;
        stageNode.data.stage.outputs.forEach((output) => {
            const ref = parseVarReference(output.value);
            const varName = ref?.key ?? output.name;
            pushProducer(varName, {nodeId: stageNode.id, handleKey: output.name, sourceType: "stage"});
        });
    });

    nodes.forEach((node) => {
        if (node.type === "stageNode") {
            const stageNode = node as StageNode;
            stageNode.data.stage.arguments.forEach((argument) => {
                const ref = parseVarReference(argument.value);
                if (!ref) return;
                const producer = producers.get(ref.key)?.[0];
                if (!producer) return;
                edges.push(
                    newDataEdge(
                        `d-${producer.nodeId}-${producer.handleKey}-${stageNode.id}-${argument.name}`,
                        producer.nodeId,
                        stageNode.id,
                        `out-${producer.handleKey}`,
                        `arg-${argument.name}`,
                        argument.value ?? "",
                        producer.sourceType,
                    ),
                );
            });
            return;
        }

        if (node.type === "terminalNode") {
            const terminalNode = node as TerminalNode;
            terminalNode.data.artifacts.forEach((artifact, index) => {
                const ref = parseVarReference(artifact);
                if (!ref) return;
                const producer = producers.get(ref.key)?.[0];
                if (!producer) return;
                edges.push(
                    newDataEdge(
                        `d-${producer.nodeId}-${producer.handleKey}-${terminalNode.id}-artifact-${index}`,
                        producer.nodeId,
                        terminalNode.id,
                        `out-${producer.handleKey}`,
                        `artifact-${index}`,
                        artifact,
                        producer.sourceType,
                    ),
                );
            });
        }
    });

    const layoutedNodes = autoLayoutNodes(nodes, edges);
    return {nodes: layoutedNodes, edges};
};

const findMainNextTarget = (nodeId: string, edges: BaseEdge[]) => {
    const edge = edges.find((item) => item.type === "orderEdge" && item.source === nodeId && FLOW_MAIN_HANDLES.has(item.sourceHandle || ""));
    return edge?.target ?? null;
};

const findSourceHandleTarget = (nodeId: string, sourceHandle: string, edges: BaseEdge[]) => {
    const edge = edges.find((item) => item.type === "orderEdge" && item.source === nodeId && (item.sourceHandle || "") === sourceHandle);
    return edge?.target ?? null;
};

const readDataFromIncoming = (nodeId: string, targetHandle: string, edges: BaseEdge[]) => {
    const edge = edges.find((item) => item.type === "dataEdge" && item.target === nodeId && item.targetHandle === targetHandle);
    if (edge?.label) {
        return edge.label;
    }
    return "";
};

export const buildPipelineFromGraph = (nodes: BaseNode[], edges: BaseEdge[]) => {
    const pipelineNodes: Array<PipelineNodeStage | PipelineNodeParallel | PipelineNodeCondition | PipelineNodeTerminal> = [];

    nodes.forEach((node) => {
        if (node.type === "inputsNode") {
            return;
        }

        if (node.type === "stageNode") {
            const stageNode = node as StageNode;
            const stage = stageNode.data.stage;
            const argumentsMap = serializeStageParams(stage.arguments);
            const configMap = serializeStageParams(stage.config);
            const outputsMap = serializeStageParams(stage.outputs);

            stage.arguments.forEach((argument) => {
                const fromEdge = readDataFromIncoming(node.id, `arg-${argument.name}`, edges);
                if (fromEdge) {
                    argumentsMap[argument.name] = fromEdge;
                }
            });

            pipelineNodes.push({
                id: node.id,
                type: "stage",
                stage: stage.stage_name,
                next: findMainNextTarget(node.id, edges),
                arguments: argumentsMap,
                config: configMap,
                outputs: outputsMap,
            });
            return;
        }

        if (node.type === "parallelNode") {
            const parallelNode = node as ParallelNode;
            const children = parallelNode.data.childrenNodesIds.map((child, index) =>
                findSourceHandleTarget(node.id, `flow-child-${index}`, edges) ?? child ?? "",
            );

            pipelineNodes.push({
                id: node.id,
                type: "parallel",
                policy: parallelNode.data.policy,
                children,
                next: findSourceHandleTarget(node.id, "flow-next", edges) ?? findMainNextTarget(node.id, edges),
            });
            return;
        }

        if (node.type === "conditionNode") {
            const conditionNode = node as ConditionNode;
            const conditions = conditionNode.data.conditions.map((condition, index) => ({
                if: condition.if,
                then: findSourceHandleTarget(node.id, `flow-then-${index}`, edges) ?? condition.then ?? "",
            }));

            pipelineNodes.push({
                id: node.id,
                type: "condition",
                conditions,
                else: findSourceHandleTarget(node.id, "flow-else", edges) ?? conditionNode.data.elseNodeId ?? null,
            });
            return;
        }

        if (node.type === "terminalNode") {
            const terminalNode = node as TerminalNode;
            const artifacts = terminalNode.data.artifacts.map((artifact, index) =>
                readDataFromIncoming(node.id, `artifact-${index}`, edges) || artifact || "",
            );

            pipelineNodes.push({
                id: node.id,
                type: "terminal",
                artifacts,
                result: terminalNode.data.result,
            });
        }
    });

    const inputNode = nodes.find((node) => node.type === "inputsNode") as InputsNode | undefined;
    const entryFromInputs = inputNode ? findMainNextTarget(inputNode.id, edges) : null;
    const fallbackEntry = pipelineNodes[0]?.id ?? "";

    const pipeline: Pipeline = {
        api_version: "1.0",
        entry: entryFromInputs || fallbackEntry,
        nodes: pipelineNodes,
    };

    return pipeline;
};
