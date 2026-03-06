import {BaseEdge, EdgeLabelRenderer, getBezierPath, type Edge, type EdgeProps} from '@xyflow/react';

type CustomEdge = Edge<Record<string, unknown>, 'orderEdge' | 'dataEdge'>;

export default function OrderEdgeComp({
                                          id,
                                          sourceX,
                                          sourceY,
                                          targetX,
                                          targetY,
                                          sourcePosition,
                                          targetPosition,
                                          style,
                                          label,
                                      }: EdgeProps<CustomEdge>) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge id={id} path={edgePath} style={style}/>
            {label ? (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                        }}
                    >
                        {String(label)}
                    </div>
                </EdgeLabelRenderer>
            ) : null}
        </>
    );
}
