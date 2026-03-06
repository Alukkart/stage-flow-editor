import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import React, {ReactNode} from "react";
import {useGraphStore} from "@/store/graph-store";

interface Props{
    children: ReactNode,
    nodeId: string;
}

export const NodeContextMenu: React.FC<Props> = ({ children, nodeId }) => {
    const removeNode = useGraphStore((state) => state.removeNode);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => {removeNode(nodeId)}}>Delete</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
