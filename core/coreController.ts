import {BaseNode} from "@/core/nodes/baseNode";
import {BaseEdge} from "@/core/edges/baseEdge";
import type {Connection, EdgeChange, MarkerType, NodeChange} from "@xyflow/react";
import {applyNodeChanges as anc} from "@xyflow/react";
import {applyEdgeChanges as aec} from "@xyflow/react";
import {DataEdge} from "@/core/edges/dataEdge";
import {OrderEdge} from "@/core/edges/orderEdge";
import {StageNode} from "@/core/nodes/stageNode";
import {ParallelNode} from "@/core/nodes/parallelNode";
import {InputsNode} from "@/core/nodes/inputsNode";
import {ConditionNode} from "@/core/nodes/conditionNode";
import {TerminalNode} from "@/core/nodes/terminalNode";

const FLOW_MAIN_HANDLES = new Set(["", "flow-output", "flow-next"]);

export class CoreController {
    private nodes: BaseNode[] = [];
    private edges: BaseEdge[] = [];

    connect(conn: Connection) {
        const sourceNode = this.nodes.find((n) => n.id === conn.source);
        const targetNode = this.nodes.find((n) => n.id === conn.target);

        if (!sourceNode || !targetNode) {
            throw new Error("Connection error: source or target node not found");
        }

        const sourceHandle = sourceNode.connectors.find((h) => h.id === conn.sourceHandle);
        const targetHandle = targetNode.connectors.find((h) => h.id === conn.targetHandle);

        if (!sourceHandle || !targetHandle) {
            throw new Error("Connection error: source or target handle not found");
        }

        if (sourceHandle.kind !== targetHandle.kind) {
            throw new Error("Connection error: different handle kinds cannot be connected");
        }

        const edgeId = `${conn.source}-${conn.sourceHandle}-${conn.target}-${conn.targetHandle}`;
        if (this.edges.some((edge) => edge.id === edgeId)) {
            return;
        }

        if (sourceHandle.kind === "data") {
            this.connectData(conn, sourceNode, targetNode);
            return;
        }

        this.connectFlow(conn, sourceNode);
    }

    private connectData(conn: Connection, sourceNode: BaseNode, targetNode: BaseNode) {
        const sourceHandle = conn.sourceHandle ?? "";
        const targetHandle = conn.targetHandle ?? "";

        if (!sourceHandle.startsWith("out-")) {
            throw new Error("Only out-* handles can produce data connections");
        }
        if (!targetHandle.startsWith("arg-") && !targetHandle.startsWith("artifact-") && !targetHandle.startsWith("cfg-")) {
            throw new Error("Data connection target must use arg-*, cfg-* or artifact-* handles");
        }

        this.removeEdges((edge) => edge.target === conn.target && edge.targetHandle === targetHandle, true);

        const valueToSet = this.resolveDataValue(sourceNode, sourceHandle);
        this.applyDataConnection(targetNode, targetHandle, valueToSet);

        const edge = new DataEdge(
            `${conn.source}-${conn.sourceHandle}-${conn.target}-${conn.targetHandle}`,
            conn.source!,
            conn.target!,
            sourceHandle,
            targetHandle,
        );
        edge.className = "edge-data";
        edge.label = valueToSet;
        edge.style = this.getDataEdgeStyle(sourceNode);
        this.addEdge(edge);
    }

    private connectFlow(conn: Connection, sourceNode: BaseNode) {
        const sourceHandle = conn.sourceHandle ?? "";
        const targetHandle = conn.targetHandle ?? "";

        if (!targetHandle.startsWith("flow-")) {
            throw new Error("Flow target must use flow-* handle");
        }

        const isMainFlow = FLOW_MAIN_HANDLES.has(sourceHandle);

        if (isMainFlow) {
            this.removeEdges(
                (edge) => edge.source === conn.source && FLOW_MAIN_HANDLES.has(edge.sourceHandle || ""),
                true,
            );
        } else {
            this.removeEdges(
                (edge) => edge.source === conn.source && (edge.sourceHandle || "") === sourceHandle,
                true,
            );
        }

        this.applyFlowConnection(sourceNode, sourceHandle, conn.target!);

        const edge = new OrderEdge(
            `${conn.source}-${conn.sourceHandle}-${conn.target}-${conn.targetHandle}`,
            conn.source!,
            conn.target!,
            sourceHandle,
            targetHandle,
        );
        edge.className = "edge-flow";
        edge.animated = true;
        edge.markerEnd = {type: "arrowclosed" as MarkerType};
        edge.style = {
            stroke: "#94a3b8",
            strokeWidth: 1.5,
            strokeDasharray: "5,5",
        };
        edge.label = this.getFlowEdgeLabel(sourceHandle);
        this.addEdge(edge);
    }

    private getFlowEdgeLabel(sourceHandle: string) {
        if (sourceHandle.startsWith("flow-then-")) {
            return "true";
        }
        if (sourceHandle === "flow-else") {
            return "false";
        }
        if (sourceHandle.startsWith("flow-child-")) {
            return "child";
        }
        if (sourceHandle === "flow-next") {
            return "next";
        }
        return undefined;
    }

    private resolveDataValue(sourceNode: BaseNode, sourceHandle: string) {
        const key = sourceHandle.replace(/^out-/, "");

        if (sourceNode.type === "inputsNode") {
            return `inputs.${key}`;
        }

        if (sourceNode.type === "stageNode") {
            const stageNode = sourceNode as StageNode;
            const output = stageNode.data.stage.outputs.find((item) => item.name === key);
            if (output?.value && output.value.trim()) {
                return output.value;
            }
            return `vars.${key}`;
        }

        return `vars.${key}`;
    }

    private applyDataConnection(targetNode: BaseNode, targetHandle: string, value: string) {
        if (targetNode.type === "stageNode") {
            const stageNode = targetNode as StageNode;
            const stage = stageNode.data.stage;

            if (targetHandle.startsWith("arg-")) {
                const argName = targetHandle.replace(/^arg-/, "");
                const argumentsList = stage.arguments.map((arg) =>
                    arg.name === argName ? {...arg, value} : arg,
                );
                this.replaceNode(StageNode.setData(stageNode, {...stageNode.data, stage: {...stage, arguments: argumentsList}}));
                return;
            }

            if (targetHandle.startsWith("cfg-")) {
                const cfgName = targetHandle.replace(/^cfg-/, "");
                const configList = stage.config.map((cfg) =>
                    cfg.name === cfgName ? {...cfg, value} : cfg,
                );
                this.replaceNode(StageNode.setData(stageNode, {...stageNode.data, stage: {...stage, config: configList}}));
            }
            return;
        }

        if (targetNode.type === "terminalNode" && targetHandle.startsWith("artifact-")) {
            const terminalNode = targetNode as TerminalNode;
            const index = Number(targetHandle.replace(/^artifact-/, ""));
            const artifacts = [...terminalNode.data.artifacts];
            while (artifacts.length <= index) {
                artifacts.push("");
            }
            artifacts[index] = value;
            this.replaceNode(TerminalNode.setData(terminalNode, {...terminalNode.data, artifacts}));
        }
    }

    private applyFlowConnection(sourceNode: BaseNode, sourceHandle: string, targetNodeId: string) {
        if (sourceNode.type === "inputsNode" && FLOW_MAIN_HANDLES.has(sourceHandle)) {
            const inputsNode = sourceNode as InputsNode;
            this.replaceNode(InputsNode.setData(inputsNode, {...inputsNode.data, nextNodeId: targetNodeId}));
            return;
        }

        if (sourceNode.type === "stageNode") {
            const stageNode = sourceNode as StageNode;
            if (FLOW_MAIN_HANDLES.has(sourceHandle)) {
                this.replaceNode(StageNode.setData(stageNode, {...stageNode.data, nextNodeId: targetNodeId}));
            }
            return;
        }

        if (sourceNode.type === "parallelNode") {
            const parallelNode = sourceNode as ParallelNode;
            if (sourceHandle.startsWith("flow-child-")) {
                const index = Number(sourceHandle.replace(/^flow-child-/, ""));
                const childrenNodesIds = [...parallelNode.data.childrenNodesIds];
                while (childrenNodesIds.length <= index) {
                    childrenNodesIds.push("");
                }
                childrenNodesIds[index] = targetNodeId;
                this.replaceNode(ParallelNode.setData(parallelNode, {...parallelNode.data, childrenNodesIds}));
                return;
            }
            if (FLOW_MAIN_HANDLES.has(sourceHandle)) {
                this.replaceNode(ParallelNode.setData(parallelNode, {...parallelNode.data, nextNodeId: targetNodeId}));
            }
            return;
        }

        if (sourceNode.type === "conditionNode") {
            const conditionNode = sourceNode as ConditionNode;
            if (sourceHandle.startsWith("flow-then-")) {
                const index = Number(sourceHandle.replace(/^flow-then-/, ""));
                const conditions = [...conditionNode.data.conditions];
                while (conditions.length <= index) {
                    conditions.push({if: {"==": [{var: ""}, ""]}, then: ""});
                }
                conditions[index] = {...conditions[index], then: targetNodeId};
                this.replaceNode(ConditionNode.setData(conditionNode, {...conditionNode.data, conditions}));
                return;
            }
            if (sourceHandle === "flow-else") {
                this.replaceNode(ConditionNode.setData(conditionNode, {...conditionNode.data, elseNodeId: targetNodeId}));
            }
        }
    }

    private cleanupEdgeReferences(edge: BaseEdge) {
        if (edge.type === "dataEdge") {
            const target = this.nodes.find((node) => node.id === edge.target);
            if (!target) return;
            this.applyDataConnection(target, edge.targetHandle, "");
            return;
        }

        if (edge.type === "orderEdge") {
            const source = this.nodes.find((node) => node.id === edge.source);
            if (!source) return;
            this.applyFlowConnection(source, edge.sourceHandle, "");
        }
    }

    private getDataEdgeStyle(sourceNode: BaseNode) {
        if (sourceNode.type === "inputsNode") {
            return {
                stroke: "#d97706",
                strokeWidth: 1.5,
                strokeDasharray: "2,2",
            };
        }

        return {
            stroke: "#8b5cf6",
            strokeWidth: 2.5,
        };
    }

    private replaceNode(nextNode: BaseNode) {
        this.nodes = this.nodes.map((node) => (node.id === nextNode.id ? nextNode : node));
    }

    private removeEdges(predicate: (edge: BaseEdge) => boolean, cleanup: boolean) {
        const toRemove = this.edges.filter(predicate);
        if (cleanup) {
            toRemove.forEach((edge) => this.cleanupEdgeReferences(edge));
        }
        this.edges = this.edges.filter((edge) => !predicate(edge));
    }

    get Nodes() {
        return this.nodes;
    }

    get Edges() {
        return this.edges;
    }

    set Nodes(nodes: BaseNode[]) {
        this.nodes = nodes;
    }

    set Edges(edges: BaseEdge[]) {
        this.edges = edges;
    }

    addNode(node: BaseNode) {
        this.nodes = [...this.nodes, node];
    }

    updateNode(id: string, updater: (node: BaseNode) => BaseNode) {
        this.nodes = this.nodes.map((node) => (node.id === id ? updater(node) : node));
    }

    removeNode(id: string) {
        const relatedEdges = this.edges.filter((edge) => edge.source === id || edge.target === id);
        relatedEdges.forEach((edge) => this.cleanupEdgeReferences(edge));

        this.nodes = this.nodes.filter((node) => node.id !== id);
        this.edges = this.edges.filter((edge) => edge.source !== id && edge.target !== id);
    }

    addEdge(edge: BaseEdge) {
        this.edges = [...this.edges, edge];
    }

    removeEdge(id: string) {
        const edge = this.edges.find((item) => item.id === id);
        if (edge) {
            this.cleanupEdgeReferences(edge);
        }
        this.edges = this.edges.filter((item) => item.id !== id);
    }

    applyNodeChanges(changes: NodeChange<BaseNode>[]) {
        this.nodes = anc(changes, this.nodes);
    }

    applyEdgeChanges(changes: EdgeChange<BaseEdge>[]) {
        changes
            .filter((change) => change.type === "remove")
            .forEach((change) => {
                const edge = this.edges.find((item) => item.id === change.id);
                if (edge) {
                    this.cleanupEdgeReferences(edge);
                }
            });

        this.edges = aec(changes, this.edges);
    }

    clear() {
        this.nodes = [];
        this.edges = [];
    }
}
