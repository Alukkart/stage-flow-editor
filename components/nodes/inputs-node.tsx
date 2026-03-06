'use client'

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {useEditor} from "@/components/editor-selectors";
import {Handle, NodeProps, Position, useUpdateNodeInternals} from '@xyflow/react';
import {InputsNode, InputsNodeProps} from "@/core/nodes/inputsNode";

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

export function InputsNodeComp({id, data}: NodeProps<InputsNodeProps>) {
    const {updateNode, getNode, setEdges, edges} = useEditor();
    const updateNodeInternals = useUpdateNodeInternals();
    const internalsKey = (data.variables ?? []).join("|");
    const containerRef = useRef<HTMLDivElement>(null);
    const outRefs = useMemo(() => new Map<string, HTMLDivElement | null>(), []);
    const [outTops, setOutTops] = useState<Record<string, number>>({});

    const node = getNode(id) as InputsNode | undefined;

    const measureHandles = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const nextOutTops: Record<string, number> = {};
        outRefs.forEach((element, key) => {
            if (!element) return;
            nextOutTops[key] = getRelativeCenterTop(element, container);
        });

        if (!shallowEqual(outTops, nextOutTops)) {
            setOutTops(nextOutTops);
            requestAnimationFrame(() => updateNodeInternals(id));
        }
    }, [outRefs, outTops, id, updateNodeInternals]);

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

    const handleAddInput = () => {
        const used = new Set(data.variables ?? []);
        let suffix = (data.variables?.length ?? 0) + 1;
        let nextName = `input_${suffix}`;
        while (used.has(nextName)) {
            suffix += 1;
            nextName = `input_${suffix}`;
        }
        const newVars = [...(data.variables ?? []), nextName];

        updateNode(id, (node) => {
            return InputsNode.setData(node, {...data, variables: newVars});
        });
    }

    const handleRemoveInput = (index: number) => {
        const removedName = (data.variables ?? [])[index];
        const newVars = (data.variables ?? []).filter((_, i) => i !== index);

        updateNode(id, (node) => {
            return InputsNode.setData(node, {...data, variables: newVars});
        });

        if (!removedName) return;
        const sourceHandle = `out-${removedName}`;
        setEdges(edges.filter((edge) => !(edge.source === id && edge.sourceHandle === sourceHandle)));
    }

    const handleInputChange = (index: number, value: string) => {
        const newVars = data.variables ? [...data.variables] : [];
        const previous = newVars[index];
        newVars[index] = value;

        updateNode(id, (node) => {
            return InputsNode.setData(node, {...data, variables: newVars});
        });

        if (!previous || previous === value) return;

        const prevSourceHandle = `out-${previous}`;
        const nextSourceHandle = `out-${value}`;
        setEdges(
            edges.map((edge) => {
                if (edge.source === id && edge.sourceHandle === prevSourceHandle) {
                    return {
                        ...edge,
                        sourceHandle: nextSourceHandle,
                        label: edge.type === "dataEdge" ? `inputs.${value}` : edge.label,
                    };
                }
                return edge;
            }),
        );
    }

    return (
        <NodeContextMenu nodeId={id}>
            <div className="relative">
                <Card className='w-sm relative' ref={containerRef}>
                    <CardHeader>
                        <CardTitle>
                            Input Node
                        </CardTitle>
                        <CardDescription>
                            Input variable for the pipeline
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-4'>
                        {
                            data?.variables?.map((variable: string, i) => (
                                <div
                                    className='relative flex justify-center gap-3'
                                    key={i}
                                    ref={(element) => {
                                        outRefs.set(variable, element);
                                    }}
                                >
                                    <Input value={variable} onChange={(e) => {
                                        handleInputChange(i, e.target.value)
                                    }}/>

                                    <Button size='icon' onClick={() => handleRemoveInput(i)}>
                                        <X/>
                                    </Button>
                                </div>
                            ))
                        }

                        <Button onClick={handleAddInput}>
                            Add input
                        </Button>

                    </CardContent>

                    <Handle id="flow-output" type="source" position={Position.Bottom} style={{bottom: -6, width: 10, height: 10}}/>

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
                                background: "#f59e0b",
                                border: "2px solid white",
                            }}
                        />
                    ))}
                </Card>
            </div>
        </NodeContextMenu>

    );
}
