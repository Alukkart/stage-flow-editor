import {getBezierPath, BaseEdge, type EdgeProps, type Edge} from '@xyflow/react';

type CustomEdge = Edge<{ value: number }, 'custom'>;

export default function OrderEdgeComp(
    {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
    }: EdgeProps<CustomEdge>) {
    const [edgePath] = getBezierPath({sourceX, sourceY, targetX, targetY});

    return (
        <BaseEdge
            id={id}
            path={edgePath}
            style={{
                stroke: 'red'
            }}
        />
    );
}