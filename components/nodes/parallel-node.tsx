'use client'

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Handle, NodeProps, Position, useUpdateNodeInternals} from '@xyflow/react';
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useEditor} from "@/components/editor-selectors";
import {ParallelNode, ParallelNodeProps} from "@/core/nodes/parallelNode";

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

export function ParallelNodeComp({id, data}: NodeProps<ParallelNodeProps>) {
    const {updateNode, getNode, setEdges, edges} = useEditor();
    const updateNodeInternals = useUpdateNodeInternals();
    const internalsKey = `${data.policy ?? "all"}::${(data.childrenNodesIds ?? []).join("|")}`;
    const containerRef = useRef<HTMLDivElement>(null);
    const childRefs = useMemo(() => new Map<number, HTMLDivElement | null>(), []);
    const [childTops, setChildTops] = useState<Record<number, number>>({});

    const node = getNode(id) as ParallelNode | undefined;

    const measureHandles = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const nextChildTops: Record<number, number> = {};
        childRefs.forEach((element, index) => {
            if (!element) return;
            nextChildTops[index] = getRelativeCenterTop(element, container);
        });

        if (!shallowEqual(childTops, nextChildTops)) {
            setChildTops(nextChildTops);
            requestAnimationFrame(() => updateNodeInternals(id));
        }
    }, [childRefs, childTops, id, updateNodeInternals]);

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

    if (!node) return null;

    const handleAddChildren = () => {
        const newChildren = data.childrenNodesIds ? [...data.childrenNodesIds, ""] : [""];

        updateNode(id, (node) => {
            return ParallelNode.setData(node, {...data, childrenNodesIds: newChildren});
        });
    }

    const handleRemoveChild = (index: number) => {
        const newChildren = (data.childrenNodesIds ?? []).filter((_, i) => i !== index);

        updateNode(id, (node) => {
            return ParallelNode.setData(node, {...data, childrenNodesIds: newChildren});
        });

        setEdges(
            edges
                .filter((edge) => !(edge.source === id && edge.sourceHandle === `flow-child-${index}`))
                .map((edge) => {
                    if (edge.source !== id) return edge;
                    const sourceHandle = edge.sourceHandle ?? "";
                    if (!sourceHandle.startsWith("flow-child-")) return edge;
                    const childIndex = Number(sourceHandle.replace("flow-child-", ""));
                    if (Number.isNaN(childIndex) || childIndex < index) return edge;
                    return {
                        ...edge,
                        sourceHandle: `flow-child-${childIndex - 1}`,
                    };
                }),
        );
    }

    const handleChildrenChange = (index: number, value: string) => {
        const newChildren = data.childrenNodesIds ? [...data.childrenNodesIds] : [];
        newChildren[index] = value;

        updateNode(id, (node) => {
            return ParallelNode.setData(node, {...data, childrenNodesIds: newChildren});
        });
    }

    const handlePolicyChange = (value: "all" | "any") => {
        updateNode(id, (node) => {
            return ParallelNode.setData(node, {...data, policy: value});
        });
    }

    return (
        <NodeContextMenu nodeId={id}>
            <Card className='w-sm relative' ref={containerRef}>
                <CardHeader>
                    <CardTitle>
                        Parallel Node
                    </CardTitle>
                    <CardDescription>
                        ctx_retriever
                    </CardDescription>
                </CardHeader>
                <CardContent className='px-0 flex flex-col gap-4 relative'>
                    <div className='px-6'>
                        <Label className='mb-2'>
                            Policy
                        </Label>
                        <Select value={data.policy ?? "all"} onValueChange={handlePolicyChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="any">Any</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Label className='px-6'>
                        Children Nodes
                    </Label>

                    <div className='flex flex-col gap-4 relative px-6'>
                        {
                            data?.childrenNodesIds?.map((childNodeId: string, index) => (
                                <div
                                    className='relative flex justify-center gap-3'
                                    key={index}
                                    ref={(element) => {
                                        childRefs.set(index, element);
                                    }}
                                >
                                    <Input value={childNodeId} onChange={(e) => {
                                        handleChildrenChange(index, e.target.value)
                                    }}/>

                                    <Button size='icon' onClick={() => handleRemoveChild(index)}>
                                        <X/>
                                    </Button>
                                </div>
                            ))
                        }
                    </div>

                    <Button className='mx-6' onClick={handleAddChildren}>
                        Add child
                    </Button>

                </CardContent>

                <Handle id="flow-input" type="target" position={Position.Top} style={{top: -6, width: 10, height: 10}}/>
                <Handle id="flow-next" type="source" position={Position.Bottom} style={{bottom: -6, width: 10, height: 10}}/>

                {Object.keys(childTops).map((key) => {
                    const index = Number(key);
                    return (
                        <Handle
                            key={`flow-child-${index}`}
                            id={`flow-child-${index}`}
                            type="source"
                            position={Position.Right}
                            style={{
                                right: -8,
                                top: `${childTops[index]}px`,
                                width: 10,
                                height: 10,
                                transform: "translateY(-50%)",
                                background: "#a78bfa",
                                border: "2px solid white",
                            }}
                        />
                    );
                })}

            </Card>
        </NodeContextMenu>

    );
}
