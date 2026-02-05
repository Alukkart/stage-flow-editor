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
            <Card className='p-4! cursor-pointer' key={key} onClick={() => onSelectAction(value)}>
                <CardContent className='px-0'>{key}</CardContent>
            </Card>
        ))}
    </>
);
