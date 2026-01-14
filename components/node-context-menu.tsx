import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import React, {ReactNode} from "react";
import {useNodesStore} from "@/store/nodes-store";

interface Props{
    children: ReactNode,
    nodeId: string;
}

export const NodeContextMenu: React.FC<Props> = ({ children, nodeId }) => {
    const {deleteNode} = useNodesStore();

    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => {deleteNode(nodeId)}}>Delete</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}