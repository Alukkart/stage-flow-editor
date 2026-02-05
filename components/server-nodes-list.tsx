'use client'

import React from "react";
import {Card, CardContent} from "@/components/ui/card";
import {StageDefinition} from "@/core/nodes/stageNode";
import {ScrollArea} from "@/components/ui/scroll-area";

type Props = {
    stages: StageDefinition[];
    isLoading: boolean;
    error: string | null;
    show: boolean;
    onSelectAction: (stage: StageDefinition) => void;
};

export const ServerNodesList: React.FC<Props> = ({
     stages,
     isLoading,
     error,
     show,
     onSelectAction,
    }) => {
    if (!show) return null;

    return (
        <>
            <div className='px-0 py-2 text-sm font-semibold'>Server Nodes</div>

            {isLoading && (
                <CardContent className='px-0 text-xs text-muted-foreground'>
                    Loading...
                </CardContent>
            )}

            {error && (
                <CardContent className='px-0 text-xs text-destructive'>
                    {error}
                </CardContent>
            )}

            <ScrollArea className='h-[40vh]'>
                <div className='space-y-2 mr-3'>
                    {stages.map((stage) => (
                        <Card className='p-4! cursor-pointer' key={stage.stage_name}
                              onClick={() => onSelectAction(stage)}>
                            <CardContent className='px-0'>{stage.stage_name}</CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>

        </>
    );
};
