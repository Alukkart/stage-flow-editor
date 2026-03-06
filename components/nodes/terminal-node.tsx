'use client'

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Handle, NodeProps, Position, useUpdateNodeInternals} from '@xyflow/react';
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {NodeContextMenu} from "@/components/node-context-menu";
import {Label} from "@/components/ui/label";
import {useEditor} from "@/components/editor-selectors";
import {TerminalNode, TerminalNodeProps} from "@/core/nodes/terminalNode";

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

export function TerminalNodeComp({id, data}: NodeProps<TerminalNodeProps>) {
    const {updateNode, getNode, setEdges, edges} = useEditor();
    const updateNodeInternals = useUpdateNodeInternals();
    const internalsKey = `${data.result ?? ""}::${(data.artifacts ?? []).join("|")}`;
    const containerRef = useRef<HTMLDivElement>(null);
    const artifactRefs = useMemo(() => new Map<number, HTMLDivElement | null>(), []);
    const [artifactTops, setArtifactTops] = useState<Record<number, number>>({});

    const node = getNode(id) as TerminalNode | undefined;

    const measureHandles = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const nextArtifactTops: Record<number, number> = {};
        artifactRefs.forEach((element, index) => {
            if (!element) return;
            nextArtifactTops[index] = getRelativeCenterTop(element, container);
        });

        if (!shallowEqual(artifactTops, nextArtifactTops)) {
            setArtifactTops(nextArtifactTops);
            requestAnimationFrame(() => updateNodeInternals(id));
        }
    }, [artifactRefs, artifactTops, id, updateNodeInternals]);

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

    const handleAddArtifact = () => {
        const newArtifacts = [...(data.artifacts ?? []), ""];
        updateNode(id, (node) => TerminalNode.setData(node, {...data, artifacts: newArtifacts}));
    };

    const handleRemoveArtifact = (index: number) => {
        const newArtifacts = (data.artifacts ?? []).filter((_, i) => i !== index);
        updateNode(id, (node) => TerminalNode.setData(node, {...data, artifacts: newArtifacts}));

        setEdges(
            edges
                .filter((edge) => !(edge.target === id && edge.targetHandle === `artifact-${index}`))
                .map((edge) => {
                    if (edge.target !== id) return edge;
                    const targetHandle = edge.targetHandle ?? "";
                    if (!targetHandle.startsWith("artifact-")) return edge;
                    const artifactIndex = Number(targetHandle.replace("artifact-", ""));
                    if (Number.isNaN(artifactIndex) || artifactIndex < index) return edge;
                    return {
                        ...edge,
                        targetHandle: `artifact-${artifactIndex - 1}`,
                    };
                }),
        );
    };

    const handleArtifactChange = (index: number, value: string) => {
        const newArtifacts = [...(data.artifacts ?? [])];
        newArtifacts[index] = value;
        updateNode(id, (node) => TerminalNode.setData(node, {...data, artifacts: newArtifacts}));
    };

    const handleResultChange = (value: string) => {
        updateNode(id, (node) => TerminalNode.setData(node, {...data, result: value}));
    };

    return (
        <NodeContextMenu nodeId={id}>
            <Card className='w-sm relative' ref={containerRef}>
                <CardHeader>
                    <CardTitle>Terminal Node</CardTitle>
                    <CardDescription>Pipeline output</CardDescription>
                </CardHeader>
                <CardContent className='px-0 flex flex-col gap-4 relative'>
                    <div className='px-6'>
                        <Label className='mb-2'>Result</Label>
                        <Input value={data.result} onChange={(e) => handleResultChange(e.target.value)}/>
                    </div>

                    <Label className='px-6'>Artifacts</Label>

                    <div className='flex flex-col gap-4 relative px-6'>
                        {data?.artifacts?.map((artifact: string, index) => (
                            <div
                                className='relative flex justify-center gap-3'
                                key={index}
                                ref={(element) => {
                                    artifactRefs.set(index, element);
                                }}
                            >
                                <Input value={artifact} onChange={(e) => handleArtifactChange(index, e.target.value)}/>

                                <Button size='icon' onClick={() => handleRemoveArtifact(index)}>
                                    <X/>
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button className='mx-6' onClick={handleAddArtifact}>
                        Add artifact
                    </Button>
                </CardContent>

                <Handle id="flow-input" type="target" position={Position.Top} style={{top: -6, width: 10, height: 10}}/>

                {Object.keys(artifactTops).map((key) => {
                    const index = Number(key);
                    return (
                        <Handle
                            key={`artifact-${index}`}
                            id={`artifact-${index}`}
                            type="target"
                            position={Position.Left}
                            style={{
                                left: -8,
                                top: `${artifactTops[index]}px`,
                                width: 10,
                                height: 10,
                                transform: "translateY(-50%)",
                                background: "#10b981",
                                border: "2px solid white",
                            }}
                        />
                    );
                })}
            </Card>
        </NodeContextMenu>
    );
}
