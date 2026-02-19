import { useMemo, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
    type Edge,
    type NodeTypes,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { JobNode } from './JobNode';
import type { PlanningJob } from './planning.types';

interface PlanningFlowProps {
    jobs: PlanningJob[];
    onComplete: (id: string) => void;
    onDelete: (id: string) => void;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 160;

const nodeTypes: NodeTypes = {
    jobNode: JobNode as unknown as NodeTypes['jobNode'],
};

/**
 * Use dagre to compute a left-to-right graph layout.
 */
function getLayoutedElements(jobs: PlanningJob[]): { nodes: Node[]; edges: Edge[] } {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 40, marginx: 40, marginy: 40 });

    // Add nodes
    jobs.forEach(job => {
        g.setNode(job.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    // Add edges (dependency → job)
    const edges: Edge[] = [];
    const jobIdSet = new Set(jobs.map(j => j.id));

    jobs.forEach(job => {
        (job.dependencies || []).forEach(depId => {
            if (jobIdSet.has(depId)) {
                edges.push({
                    id: `${depId}->${job.id}`,
                    source: depId,
                    target: job.id,
                    animated: job.status === 'running',
                    style: {
                        stroke: job.status === 'done' ? '#10b981' : job.status === 'running' ? '#3b82f6' : '#94a3b8',
                        strokeWidth: 2,
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: job.status === 'done' ? '#10b981' : job.status === 'running' ? '#3b82f6' : '#94a3b8',
                    },
                });
            }
        });
    });

    dagre.layout(g);

    const nodes: Node[] = jobs.map(job => {
        const nodeWithPos = g.node(job.id);
        return {
            id: job.id,
            type: 'jobNode',
            position: {
                x: nodeWithPos.x - NODE_WIDTH / 2,
                y: nodeWithPos.y - NODE_HEIGHT / 2,
            },
            data: { job },
        };
    });

    return { nodes, edges };
}

export const PlanningFlow = ({ jobs, onComplete, onDelete }: PlanningFlowProps) => {
    const { nodes, edges } = useMemo(() => getLayoutedElements(jobs), [jobs]);

    // Inject callbacks into node data
    const nodesWithCallbacks = useMemo(
        () =>
            nodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    onComplete,
                    onDelete,
                },
            })),
        [nodes, onComplete, onDelete]
    );

    const onNodeDragStop = useCallback(() => {
        // Intentionally empty — allows user to reposition nodes after dagre layout
    }, []);

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <p className="text-lg font-medium">No jobs in this period</p>
                <p className="text-sm mt-1">Click "Add Job" to create the first one.</p>
            </div>
        );
    }

    return (
        <div className="h-[600px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <ReactFlow
                nodes={nodesWithCallbacks}
                edges={edges}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.3}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#e2e8f0" gap={20} />
                <Controls
                    showInteractive={false}
                    className="!bg-white !rounded-lg !shadow-md !border !border-slate-200"
                />
                <MiniMap
                    nodeColor={node => {
                        const job = (node.data as { job: PlanningJob }).job;
                        if (job.status === 'done') return '#10b981';
                        if (job.status === 'running') return '#3b82f6';
                        return '#94a3b8';
                    }}
                    className="!bg-white !rounded-lg !shadow-md !border !border-slate-200"
                />
            </ReactFlow>
        </div>
    );
};
