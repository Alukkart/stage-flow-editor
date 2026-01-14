import type { DataFieldKey } from '../nodes/node-definitions';

export type ParsedHandle = {
    direction: 'in' | 'out';
    field: DataFieldKey;
    index: number;
};

export function parseHandleId(handleId: string | null): ParsedHandle | null {
    if (!handleId) return null;

    const [direction, field, index] = handleId.split('-');

    if (
        (direction !== 'in' && direction !== 'out') ||
        index === undefined
    ) {
        return null;
    }

    return {
        direction,
        field: field as DataFieldKey,
        index: Number(index),
    };
}
