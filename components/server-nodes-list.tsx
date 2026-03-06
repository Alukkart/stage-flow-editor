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
        <div className='w-full min-w-0'>
            <div className='px-0 py-1 text-sm font-semibold'>Server Nodes</div>

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

            <ScrollArea className='h-[30vh] w-full overflow-hidden'>
                <div className='w-full min-w-0 space-y-1.5 pr-2'>
                    {stages.map((stage) => (
                        <Card
                            className='w-full max-w-full min-w-0 cursor-pointer overflow-hidden border-border/80 bg-background/60 px-3 py-2 hover:bg-accent/40'
                            key={stage.stage_name}
                            onClick={() => onSelectAction(stage)}
                        >
                            <CardContent className='w-full min-w-0 px-0 text-sm leading-5 break-all whitespace-normal'>
                                {stage.stage_name}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>

        </div>
    );
};
