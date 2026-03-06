'use client'

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Handle, NodeProps, Position, useUpdateNodeInternals} from "@xyflow/react";
import {Plus, X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {ConditionItem, ConditionNode, ConditionNodeProps} from "@/core/nodes/conditionNode";
import {useGraphStore} from "@/store/graph-store";

const defaultConditionLogic = () => ({"==": [{var: ""}, ""]});

const parseConditionLogic = (value: string, fallback: Record<string, unknown>) => {
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
    } catch {
    }
    return fallback;
};

const shallowEqual = (a: Record<number, number>, b: Record<number, number>) => {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
        if (a[Number(key)] !== b[Number(key)]) return false;
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

export function ConditionNodeComp({id, data}: NodeProps<ConditionNodeProps>) {
    const updateNode = useGraphStore((state) => state.updateNode);
    const setEdges = useGraphStore((state) => state.setEdges);
    const updateNodeInternals = useUpdateNodeInternals();
    const internalsKey = [
        (data.conditions ?? []).map((condition) => condition.then).join("|"),
        String(data.elseNodeId ?? ""),
        String((data.conditions ?? []).length),
    ].join("::");
    const containerRef = useRef<HTMLDivElement>(null);
    const thenRefs = useMemo(() => new Map<number, HTMLDivElement | null>(), []);
    const elseRef = useRef<HTMLDivElement>(null);
    const [thenTops, setThenTops] = useState<Record<number, number>>({});
    const [elseTop, setElseTop] = useState<number>(0);

    const measureHandles = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const nextThenTops: Record<number, number> = {};
        thenRefs.forEach((element, index) => {
            if (!element) return;
            nextThenTops[index] = getRelativeCenterTop(element, container);
        });

        let changed = false;
        if (!shallowEqual(thenTops, nextThenTops)) {
            setThenTops(nextThenTops);
            changed = true;
        }

        const elseElement = elseRef.current;
        if (elseElement) {
            const nextElseTop = getRelativeCenterTop(elseElement, container);
            if (nextElseTop !== elseTop) {
                setElseTop(nextElseTop);
                changed = true;
            }
        }

        if (changed) {
            requestAnimationFrame(() => updateNodeInternals(id));
        }
    }, [thenRefs, thenTops, elseTop, id, updateNodeInternals]);

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

    const handleUpdateCondition = (index: number, next: ConditionItem) => {
        const conditions = [...data.conditions];
        conditions[index] = next;
        updateNode(id, (node) => ConditionNode.setData(node, {...data, conditions}));
    };

    const handleAddCondition = () => {
        const conditions = [...data.conditions, {if: defaultConditionLogic(), then: ""}];
        updateNode(id, (node) => ConditionNode.setData(node, {...data, conditions}));
    };

    const handleRemoveCondition = (index: number) => {
        const conditions = data.conditions.filter((_, i) => i !== index);
        const normalized = conditions.length === 0 ? [{if: defaultConditionLogic(), then: ""}] : conditions;
        updateNode(id, (node) => ConditionNode.setData(node, {...data, conditions: normalized}));

        const currentEdges = useGraphStore.getState().edges;
        setEdges(
            currentEdges
                .filter((edge) => !(edge.source === id && edge.sourceHandle === `flow-then-${index}`))
                .map((edge) => {
                    if (edge.source !== id) return edge;
                    const sourceHandle = edge.sourceHandle ?? "";
                    if (!sourceHandle.startsWith("flow-then-")) return edge;
                    const thenIndex = Number(sourceHandle.replace("flow-then-", ""));
                    if (Number.isNaN(thenIndex) || thenIndex < index) return edge;
                    return {
                        ...edge,
                        sourceHandle: `flow-then-${thenIndex - 1}`,
                    };
                }),
        );
    };

    const handleElseChange = (value: string) => {
        updateNode(id, (node) => ConditionNode.setData(node, {...data, elseNodeId: value}));
    };

    return (
        <NodeContextMenu nodeId={id}>
            <Card className="w-sm relative" ref={containerRef}>
                <CardHeader>
                    <CardTitle>Condition Node</CardTitle>
                    <CardDescription>Branch by JSON logic rules</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 px-6 pb-6">
                    {data.conditions.map((condition, index) => (
                        <div className="border rounded-md p-3 flex flex-col gap-2" key={index}>
                            <div className="flex items-center justify-between">
                                <Label>Condition #{index + 1}</Label>
                                <Button size="icon" variant="ghost" onClick={() => handleRemoveCondition(index)}>
                                    <X size={16}/>
                                </Button>
                            </div>

                            <textarea
                                className="w-full min-h-[88px] rounded-md border bg-transparent p-2 text-xs"
                                defaultValue={JSON.stringify(condition.if, null, 2)}
                                onBlur={(event) => {
                                    const nextIf = parseConditionLogic(event.target.value, condition.if || defaultConditionLogic());
                                    handleUpdateCondition(index, {...condition, if: nextIf});
                                    event.target.value = JSON.stringify(nextIf, null, 2);
                                }}
                            />

                            <div
                                className="relative"
                                ref={(element) => {
                                    thenRefs.set(index, element);
                                }}
                            >
                                <Input
                                    value={condition.then}
                                    onChange={(event) => handleUpdateCondition(index, {...condition, then: event.target.value})}
                                    placeholder="then node id"
                                />
                            </div>
                        </div>
                    ))}

                    <Button variant="outline" onClick={handleAddCondition}>
                        <Plus size={14}/>
                        Add condition
                    </Button>

                    <div className="relative flex flex-col gap-2" ref={elseRef}>
                        <Label>Else node id</Label>
                        <Input value={data.elseNodeId ?? ""} onChange={(event) => handleElseChange(event.target.value)}/>
                    </div>
                </CardContent>

                <Handle id="flow-input" type="target" position={Position.Top} style={{top: -6, width: 10, height: 10}}/>

                {Object.keys(thenTops).map((key) => {
                    const index = Number(key);
                    return (
                        <Handle
                            key={`flow-then-${index}`}
                            id={`flow-then-${index}`}
                            type="source"
                            position={Position.Right}
                            style={{
                                right: -8,
                                top: `${thenTops[index]}px`,
                                width: 10,
                                height: 10,
                                transform: "translateY(-50%)",
                                background: "#facc15",
                                border: "2px solid white",
                            }}
                        />
                    );
                })}

                {elseTop > 0 && (
                    <Handle
                        id="flow-else"
                        type="source"
                        position={Position.Right}
                        style={{
                            right: -8,
                            top: `${elseTop}px`,
                            width: 10,
                            height: 10,
                            transform: "translateY(-50%)",
                            background: "#9ca3af",
                            border: "2px solid white",
                        }}
                    />
                )}
            </Card>
        </NodeContextMenu>
    );
}
