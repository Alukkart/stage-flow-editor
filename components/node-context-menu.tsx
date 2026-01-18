import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import React, {ReactNode} from "react";
import {useEditor} from "@/components/editor-selectors";

interface Props{
    children: ReactNode,
    nodeId: string;
}

export const NodeContextMenu: React.FC<Props> = ({ children, nodeId }) => {
    const {removeNode} = useEditor();

    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => {removeNode(nodeId)}}>Delete</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}