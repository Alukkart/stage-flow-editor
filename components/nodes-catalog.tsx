import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Sidebar, SidebarClose} from "lucide-react";
import {Button} from "@/components/ui/button";
import React from "react";
import {useReactFlow} from "@xyflow/react";
import {Separator} from "@/components/ui/separator";
import {useGraphStore} from "@/store/graph-store";
import { NodeClassType, NodeClasses } from "@/core/nodes/nodeTypes";
import { v4 as uuid } from 'uuid';
import {StageDefinition, StageNode} from "@/core/nodes/stageNode";
import {autoLayoutNodes} from "@/lib/graph-layout";
import {
    buildGraphFromPipeline,
    buildPipelineFromGraph,
    parseStagePayload,
    Pipeline,
    StageDefinitionInput
} from "@/lib/pipeline-io";
import {NodesCatalogToolbar} from "@/components/nodes-catalog-toolbar";
import {NodesCatalogList} from "@/components/nodes-catalog-list";
import {ServerNodesList} from "@/components/server-nodes-list";

export const NodesCatalog = () => {
    const [open, setOpen] = React.useState(true);
    const reactFlow = useReactFlow();
    const { addNode, setNodes, setEdges, clear } = useGraphStore()
    const [remoteStages, setRemoteStages] = React.useState<StageDefinition[]>([]);
    const [remoteError, setRemoteError] = React.useState<string | null>(null);
    const [remoteLoading, setRemoteLoading] = React.useState(false);
    const stagesUrl = process.env.NEXT_PUBLIC_STAGES_URL;
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const getCenterPosition = () => {
        if (typeof window === "undefined") {
            return {x: 0, y: 0};
        }

        return reactFlow.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });
    };

    const handleAddNode = (nodeClass: NodeClassType) => {
        const position = getCenterPosition();
        addNode(new nodeClass(uuid(), position));
    }

    const handleAddStageNode = (stage: StageDefinition) => {
        const position = getCenterPosition();
        addNode(new StageNode(uuid(), position, {stage}));
    }

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result)) as Pipeline;
                const {nodes: createdNodes, edges: createdEdges} = buildGraphFromPipeline(parsed, remoteStages);
                setNodes(createdNodes);
                setEdges(createdEdges);
            } catch (error) {
                console.error("Failed to import pipeline.json", error);
            } finally {
                event.target.value = "";
            }
        };
        reader.readAsText(file);
    };

    const handleExport = () => {
        const graph = useGraphStore.getState();
        const pipeline = buildPipelineFromGraph(graph.nodes, graph.edges);

        const blob = new Blob([JSON.stringify(pipeline, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "pipeline.json";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleAutoLayout = () => {
        const graph = useGraphStore.getState();
        const nextNodes = autoLayoutNodes(graph.nodes, graph.edges);
        setNodes(nextNodes);
    };

    React.useEffect(() => {
        if (!stagesUrl) return;
        let active = true;
        setRemoteLoading(true);
        setRemoteError(null);

        fetch(stagesUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load stages: ${response.status}`);
                }
                return response.json();
            })
            .then((payload: Record<string, StageDefinitionInput>) => {
                if (!active) return;
                setRemoteStages(parseStagePayload(payload));
            })
            .catch((error: Error) => {
                if (!active) return;
                setRemoteError(error.message);
            })
            .finally(() => {
                if (!active) return;
                setRemoteLoading(false);
            });

        return () => {
            active = false;
        };
    }, [stagesUrl]);

    return (
        <div className='space-y-3'>
            {
                open ? (
                    <Card className='rounded-sm'>
                        <CardHeader className='flex items-center justify-between'>
                            <CardTitle>
                                Nodes Catalog
                            </CardTitle>

                            <Button size='icon' variant='ghost' onClick={() => setOpen(false)}>
                                <SidebarClose/>
                            </Button>
                        </CardHeader>
                        <CardContent className='pt-0 pb-0'>
                            <NodesCatalogToolbar
                                onImportClickAction={handleImportClick}
                                onExportAction={handleExport}
                                onLayoutAction={handleAutoLayout}
                                onClearAction={clear}
                                onImportFileAction={handleImportFile}
                                fileInputRef={fileInputRef}
                            />
                        </CardContent>
                        <CardContent className='flex flex-col space-y-3'>
                            <NodesCatalogList
                                entries={Object.entries(NodeClasses)}
                                onSelectAction={handleAddNode}
                            />

                            <Separator/>

                            <ServerNodesList
                                stages={remoteStages}
                                isLoading={remoteLoading}
                                error={remoteError}
                                show={Boolean(stagesUrl || remoteStages.length > 0 || remoteLoading || remoteError)}
                                onSelectAction={handleAddStageNode}
                            />

                        </CardContent>
                    </Card>
                ) : (
                    <Button onClick={() => setOpen(true)}>
                        <Sidebar/>
                    </Button>
                )
            }
        </div>
    )
}
