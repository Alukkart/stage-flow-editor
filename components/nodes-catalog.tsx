import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Sidebar, SidebarClose} from "lucide-react";
import {Button} from "@/components/ui/button";
import React from "react";
import {useViewport} from "@xyflow/react";
import {Separator} from "@/components/ui/separator";
import {useGraphStore} from "@/store/graph-store";
import { NodeClassType, NodeClasses } from "@/core/nodes/nodeTypes";
import { v4 as uuid } from 'uuid';

// const asd = {
//     "SetValueStage": {
//         "stage_name": "SetValueStage",
//         "skipable": false,
//         "allowed_events": [],
//         "allowed_inputs": [],
//         "category": "builtin.vars",
//         "description": "Set value from arguments or config to the target path",
//         "arguments": [
//             {
//                 "name": "value",
//                 "type": "any",
//                 "description": "Value to set (overrides config)",
//                 "optional": false
//             }
//         ],
//         "config": [
//             {
//                 "name": "value",
//                 "type": "any",
//                 "description": "Fallback value when argument is missing",
//                 "optional": false
//             }
//         ],
//         "outputs": [
//             {
//                 "name": "value",
//                 "type": "any",
//                 "description": "Value that was written",
//                 "optional": false
//             }
//         ]
//     },
// }

export const NodesCatalog = () => {
    const [open, setOpen] = React.useState(true);
    const {x, y} = useViewport();
    const { addNode } = useGraphStore()

    const handleAddNode = (nodeClass: NodeClassType) => {
        addNode(new nodeClass(uuid(), {x: x, y: y}));
    }

    return (
        <div className='space-y-3'>
            {
                open ? (
                    <Card className='min-w-xs rounded-sm'>
                        <CardHeader className='flex items-center justify-between'>
                            <CardTitle>
                                Nodes Catalog
                            </CardTitle>

                            <Button size='icon' variant='ghost' onClick={() => setOpen(false)}>
                                <SidebarClose/>
                            </Button>
                        </CardHeader>
                        <CardContent className='flex flex-col space-y-3'>
                            {
                                Object.entries(NodeClasses).map((node) => (
                                    <Card className='p-4!' key={node[0]}
                                          onClick={() => handleAddNode(node[1])}>
                                        <CardContent className='px-0'>{node[0]}</CardContent>
                                    </Card>
                                ))
                            }

                            <Separator/>

                            {/*{*/}
                            {/*    Object.values(asd).map((stage) => (*/}
                            {/*        <Card className='p-4!' key={stage.stage_name}*/}
                            {/*              onClick={() => addNode({*/}
                            {/*                  type: 'stageNode',*/}
                            {/*                  position: {x: x, y: y},*/}
                            {/*                  data: {stage}*/}
                            {/*              })}>*/}
                            {/*            <CardContent className='px-0'>{stage.stage_name}</CardContent>*/}
                            {/*        </Card>*/}
                            {/*    ))*/}
                            {/*}*/}

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