'use client'

import React from "react";
import {Eye, EyeOff} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {EdgeLineStyle, EdgeStyleConfig, EdgeStyleKind, EdgeStyleSettings, useGraphStore} from "@/store/graph-store";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger
} from "@/components/ui/menubar";

type Props = {
    onImportClickAction: () => void;
    onExportAction: () => void;
    onLayoutAction: () => void;
    onClearAction: () => void;
    onImportFileAction: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    edgeStyleSettings: EdgeStyleSettings;
    onEdgeStyleChangeAction: (kind: EdgeStyleKind, patch: Partial<EdgeStyleConfig>) => void;
};

export const NodesCatalogToolbar: React.FC<Props> = ({
        onImportClickAction,
        onExportAction,
        onLayoutAction,
        onClearAction,
        onImportFileAction,
        fileInputRef,
        edgeStyleSettings,
        onEdgeStyleChangeAction,
    }) => {
    const canUndo = useGraphStore((state) => state.canUndo);
    const canRedo = useGraphStore((state) => state.canRedo);
    const undo = useGraphStore((state) => state.undo);
    const redo = useGraphStore((state) => state.redo);

    const handleStyleChange = (kind: EdgeStyleKind, value: string) => {
        if (value !== "solid" && value !== "dashed" && value !== "dotted") return;
        onEdgeStyleChangeAction(kind, {style: value as EdgeLineStyle});
    };

    const handleWidthChange = (kind: EdgeStyleKind, raw: string) => {
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) return;
        const width = Math.max(0.5, Math.min(8, parsed));
        onEdgeStyleChangeAction(kind, {width});
    };

    const rows: Array<{kind: EdgeStyleKind; label: string}> = [
        {kind: "flow", label: "Flow"},
        {kind: "data", label: "Data"},
        {kind: "input", label: "Input"},
    ];

    return (
        <div className='space-y-2 rounded-md border border-border bg-card/95 p-2.5 text-card-foreground shadow-sm backdrop-blur-sm'>
            <div className='flex items-center gap-1.5'>
                <Menubar className='h-8 border-border bg-background/70 p-2'>
                    <MenubarMenu>
                        <MenubarTrigger className='px-2 py-1'>File</MenubarTrigger>
                        <MenubarContent align="start">
                            <MenubarItem onSelect={onImportClickAction}>
                                Import
                                <MenubarShortcut>JSON</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem onSelect={onExportAction}>
                                Export
                                <MenubarShortcut>JSON</MenubarShortcut>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className='px-2 py-1'>Graph</MenubarTrigger>
                        <MenubarContent align="start">
                            <MenubarItem onSelect={onLayoutAction}>
                                Auto layout
                            </MenubarItem>
                            <MenubarSeparator/>
                            <MenubarItem variant="destructive" onSelect={onClearAction}>
                                Clear graph
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className='px-2 py-1'>Edit</MenubarTrigger>
                        <MenubarContent align="start">
                            <MenubarItem disabled={!canUndo} onSelect={undo}>
                                Undo
                                <MenubarShortcut>Ctrl/Cmd+Z</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem disabled={!canRedo} onSelect={redo}>
                                Redo
                                <MenubarShortcut>Ctrl/Cmd+Y</MenubarShortcut>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className='px-2 py-1'>Edges</MenubarTrigger>
                        <MenubarContent align="start" className='min-w-[24rem]'>
                            <div>
                                {rows.map(({kind, label}) => {
                                    const settings = edgeStyleSettings[kind];

                                    return (
                                        <div key={kind} className='grid grid-cols-5 items-center gap-1 p-2'>
                                            <span className='text-xs font-medium'>{label}</span>

                                            <Button
                                                size='sm'
                                                variant='outline'
                                                className='h-7 px-1.5 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                                                onClick={() => onEdgeStyleChangeAction(kind, {visible: !settings.visible})}
                                            >
                                                {settings.visible ? <Eye/> : <EyeOff/>}
                                                {settings.visible ? "Show" : "Hide"}
                                            </Button>

                                            <Input
                                                type='color'
                                                aria-label={`${label} color`}
                                                value={settings.color}
                                                onChange={(event) => onEdgeStyleChangeAction(kind, {color: event.target.value})}
                                                className='h-7 w-9 cursor-pointer rounded border border-border bg-background p-1'
                                            />

                                            <Input
                                                type='number'
                                                min={0.5}
                                                max={8}
                                                step={0.5}
                                                value={settings.width}
                                                onChange={(event) => handleWidthChange(kind, event.target.value)}
                                                className='h-7 rounded-md border border-border bg-background px-1.5 text-foreground'
                                            />

                                            <Select value={settings.style} onValueChange={(value) => handleStyleChange(kind, value)}>
                                                <SelectTrigger
                                                    size="sm"
                                                    className='h-7 rounded-md border border-border bg-background px-1.5 text-foreground'
                                                >
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent align="end">
                                                    <SelectItem value='solid'>solid</SelectItem>
                                                    <SelectItem value='dashed'>dashed</SelectItem>
                                                    <SelectItem value='dotted'>dotted</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                })}
                            </div>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>

                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={onImportFileAction}
                />
            </div>
        </div>
    );
};
