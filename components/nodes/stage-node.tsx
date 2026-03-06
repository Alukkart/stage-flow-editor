'use client'

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Handle, NodeProps, Position, useUpdateNodeInternals} from "@xyflow/react";
import {Plus, X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {useEditor} from "@/components/editor-selectors";
import {StageNode, StageNodeProps, StageParam} from "@/core/nodes/stageNode";

const renderParamMeta = (type: string, optional?: boolean) => {
    const optionalSuffix = optional ? "?" : "";
    return `${type}${optionalSuffix}`;
};

const shallowEqual = (a: Record<string, number>, b: Record<string, number>) => {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
        if (a[key] !== b[key]) return false;
    }
    return true;
};

const getRelativeCenterTop = (element: HTMLElement, container: HTMLElement) => {
    let offsetTop = element.offsetTop;
    let parent = element.offsetParent as HTMLElement | null;
    while (parent && parent !== container) {
        offsetTop += parent.offsetTop;
        parent = parent.offsetParent as HTMLElement | null;
    }
    return offsetTop + element.offsetHeight / 2;
};

export function StageNodeComp({id}: NodeProps<StageNodeProps>) {
    const {getNode, updateNode, setEdges, edges} = useEditor();
    const updateNodeInternals = useUpdateNodeInternals();
    const node = getNode(id) as StageNode | undefined;
    const stage = node?.data.stage;
    const internalsKey = [
        stage?.arguments.map((param) => param.name).join("|") ?? "",
        stage?.outputs.map((param) => param.name).join("|") ?? "",
        stage?.config.map((param) => param.name).join("|") ?? "",
    ].join("::");

    const containerRef = useRef<HTMLDivElement>(null);
    const argRefs = useMemo(() => new Map<string, HTMLDivElement | null>(), []);
    const outRefs = useMemo(() => new Map<string, HTMLDivElement | null>(), []);
    const cfgRefs = useMemo(() => new Map<string, HTMLDivElement | null>(), []);
    const [argTops, setArgTops] = useState<Record<string, number>>({});
    const [outTops, setOutTops] = useState<Record<string, number>>({});
    const [cfgTops, setCfgTops] = useState<Record<string, number>>({});

    const measureHandles = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const nextArgTops: Record<string, number> = {};
        const nextOutTops: Record<string, number> = {};
        const nextCfgTops: Record<string, number> = {};

        argRefs.forEach((element, key) => {
            if (!element) return;
            nextArgTops[key] = getRelativeCenterTop(element, container);
        });

        outRefs.forEach((element, key) => {
            if (!element) return;
            nextOutTops[key] = getRelativeCenterTop(element, container);
        });

        cfgRefs.forEach((element, key) => {
            if (!element) return;
            nextCfgTops[key] = getRelativeCenterTop(element, container);
        });

        let changed = false;
        if (!shallowEqual(argTops, nextArgTops)) {
            setArgTops(nextArgTops);
            changed = true;
        }
        if (!shallowEqual(outTops, nextOutTops)) {
            setOutTops(nextOutTops);
            changed = true;
        }
        if (!shallowEqual(cfgTops, nextCfgTops)) {
            setCfgTops(nextCfgTops);
            changed = true;
        }

        if (changed) {
            requestAnimationFrame(() => updateNodeInternals(id));
        }
    }, [argRefs, outRefs, cfgRefs, argTops, outTops, cfgTops, id, updateNodeInternals]);

    useEffect(() => {
        const timer = setTimeout(() => measureHandles(), 0);
        return () => clearTimeout(timer);
    }, [measureHandles, internalsKey]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver(() => measureHandles());
        observer.observe(container);
        return () => observer.disconnect();
    }, [measureHandles]);

    if (!node || !stage) return null;

    const updateStageSection = (
        section: "arguments" | "config" | "outputs",
        nextParams: StageParam[]
    ) => {
        updateNode(id, (node) => {
            const currentData = (node as StageNode).data;
            const currentStage = currentData.stage;
            return StageNode.setData(node, {
                ...currentData,
                stage: {
                    ...currentStage,
                    [section]: nextParams,
                },
            });
        });
    };

    const getNextParamName = (prefix: string, params: StageParam[]) => {
        let index = params.length + 1;
        let name = `${prefix}${index}`;
        while (params.some((param) => param.name === name)) {
            index += 1;
            name = `${prefix}${index}`;
        }
        return name;
    };

    const handleAddParam = (section: "arguments" | "config" | "outputs", prefix: string) => {
        const nextName = getNextParamName(prefix, stage[section]);
        const nextParams = [
            ...stage[section],
            {name: nextName, type: "any", value: ""},
        ];
        updateStageSection(section, nextParams);
    };

    const handleRemoveParam = (section: "arguments" | "config" | "outputs", index: number) => {
        const removed = stage[section][index];
        const nextParams = stage[section].filter((_, idx) => idx !== index);
        updateStageSection(section, nextParams);

        if (!removed) return;

        if (section === "arguments") {
            const targetHandle = `arg-${removed.name}`;
            setEdges(edges.filter((edge) => !(edge.target === id && edge.targetHandle === targetHandle)));
            return;
        }

        if (section === "outputs") {
            const sourceHandle = `out-${removed.name}`;
            setEdges(edges.filter((edge) => !(edge.source === id && edge.sourceHandle === sourceHandle)));
        }
    };

    const handleValueChange = (
        section: "arguments" | "config" | "outputs",
        index: number,
        value: string
    ) => {
        const nextParams = [...stage[section]];
        nextParams[index] = {...nextParams[index], value};
        updateStageSection(section, nextParams);
    };

    const renderSection = (
        title: string,
        section: "arguments" | "config" | "outputs",
        emptyLabel: string,
        prefix: string
    ) => (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-6">
                <span className="text-sm font-semibold">{title}</span>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleAddParam(section, prefix)}
                >
                    <Plus size={16}/>
                </Button>
            </div>
            {stage[section].length === 0 ? (
                <span className="px-6 text-xs text-muted-foreground">{emptyLabel}</span>
            ) : (
                stage[section].map((param, index) => (
                    <div key={`${param.name}-${index}`} className="flex flex-col gap-1 px-6 py-1">
                        <div
                            className="relative flex items-center gap-2"
                            ref={(element) => {
                                if (section === "arguments") {
                                    argRefs.set(param.name, element);
                                    return;
                                }
                                if (section === "outputs") {
                                    outRefs.set(param.name, element);
                                    return;
                                }
                                cfgRefs.set(param.name, element);
                            }}
                        >
                            <span className="text-sm w-28 shrink-0 truncate" title={param.name}>
                                {param.name}
                            </span>
                            <Input
                                value={param.value ?? ""}
                                onChange={(event) => handleValueChange(section, index, event.target.value)}
                                placeholder="value"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveParam(section, index)}
                            >
                                <X size={16}/>
                            </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {renderParamMeta(param.type, param.optional)}
                        </span>
                        {param.description && (
                            <span className="text-xs text-muted-foreground">{param.description}</span>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <NodeContextMenu nodeId={id}>
            <Card className="w-sm relative" ref={containerRef}>
                <CardHeader>
                    <CardTitle>{stage.stage_name}</CardTitle>
                    <CardDescription>{stage.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-6 relative px-0">
                    {renderSection("Arguments", "arguments", "No arguments", "arg")}
                    {renderSection("Outputs", "outputs", "No outputs", "out")}
                    {renderSection("Config", "config", "No config", "cfg")}
                </CardContent>

                <Handle id="flow-input" type="target" position={Position.Top} style={{top: -6, width: 10, height: 10}}/>
                <Handle id="flow-output" type="source" position={Position.Bottom} style={{bottom: -6, width: 10, height: 10}}/>

                {Object.keys(argTops).map((name) => (
                    <Handle
                        key={`arg-${name}`}
                        id={`arg-${name}`}
                        type="target"
                        position={Position.Left}
                        style={{
                            left: -8,
                            top: `${argTops[name]}px`,
                            width: 10,
                            height: 10,
                            transform: "translateY(-50%)",
                            background: "#3b82f6",
                            border: "2px solid white",
                        }}
                    />
                ))}

                {Object.keys(cfgTops).map((name) => (
                    <Handle
                        key={`cfg-${name}`}
                        id={`cfg-${name}`}
                        type="target"
                        position={Position.Left}
                        style={{
                            left: -8,
                            top: `${cfgTops[name]}px`,
                            width: 10,
                            height: 10,
                            transform: "translateY(-50%)",
                            background: "#3b82f6",
                            border: "2px solid white",
                        }}
                    />
                ))}

                {Object.keys(outTops).map((name) => (
                    <Handle
                        key={`out-${name}`}
                        id={`out-${name}`}
                        type="source"
                        position={Position.Right}
                        style={{
                            right: -8,
                            top: `${outTops[name]}px`,
                            width: 10,
                            height: 10,
                            transform: "translateY(-50%)",
                            background: "#10b981",
                            border: "2px solid white",
                        }}
                    />
                ))}
            </Card>
        </NodeContextMenu>
    );
}
