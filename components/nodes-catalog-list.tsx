'use client'

import React from "react";
import {Card, CardContent} from "@/components/ui/card";

type Entry<T> = [string, T];

type Props<T> = {
    entries: Entry<T>[];
    onSelectAction: (value: T) => void;
};

export const NodesCatalogList = <T,>({entries, onSelectAction}: Props<T>) => (
    <>
        {entries.map(([key, value]) => (
            <Card
                className='cursor-pointer border-border/80 bg-background/60 px-3 py-2 hover:bg-accent/40'
                key={key}
                onClick={() => onSelectAction(value)}
            >
                <CardContent className='px-0 text-sm leading-5'>{key}</CardContent>
            </Card>
        ))}
    </>
);
