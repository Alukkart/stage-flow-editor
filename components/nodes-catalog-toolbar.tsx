'use client'

import React from "react";
import {Download, LayoutGrid, Trash2, Upload} from "lucide-react";
import {Button} from "@/components/ui/button";

type Props = {
    onImportClickAction: () => void;
    onExportAction: () => void;
    onLayoutAction: () => void;
    onClearAction: () => void;
    onImportFileAction: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
};

export const NodesCatalogToolbar: React.FC<Props> = ({
    onImportClickAction,
    onExportAction,
    onLayoutAction,
    onClearAction,
    onImportFileAction,
    fileInputRef,
}) => (
    <div className='pt-0 pb-3 flex items-center gap-2'>
        <Button size='sm' variant='outline' onClick={onImportClickAction}>
            <Upload/>
            Import
        </Button>
        <Button size='sm' variant='outline' onClick={onExportAction}>
            <Download/>
            Export
        </Button>
        <Button size='sm' variant='outline' onClick={onLayoutAction}>
            <LayoutGrid/>
            Layout
        </Button>
        <Button size='sm' variant='outline' onClick={onClearAction}>
            <Trash2/>
            Clear
        </Button>
        <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportFileAction}
        />
    </div>
);
