import { useMemo, useCallback, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type NodeTypes,
    type OnNodeDrag,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { JobNode } from './JobNode';
import type { PlanningJob, PlanningStatusType } from './planning.types';
import axios from '../../utils/axios';

interface PlanningFlowProps {
    jobs: PlanningJob[];
    onStatusChange: (id: string, status: PlanningStatusType) => void;
    onDelete: (id: string) => void;
    direction: 'LR' | 'TB';
}

const NODE_WIDTH = 260;
const NODE_HEIGHT = 180;

const nodeTypes: NodeTypes = {
    jobNode: JobNode as unknown as NodeTypes['jobNode'],
};

/**
 * Use dagre to compute graph layout, respecting saved positions when available.
 */
function getLayoutedElements(
    jobs: PlanningJob[],
    direction: 'LR' | 'TB'
): { nodes: Node[]; edges: Edge[] } {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: direction,
        ranksep: 80,
        nodesep: 50,
        marginx: 40,
        marginy: 40,
    });

    jobs.forEach(job => {
        g.setNode(job.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    const edges: Edge[] = [];
    const jobIdSet = new Set(jobs.map(j => j.id));

    jobs.forEach(job => {
        const deps = Array.isArray(job.dependencies)
            ? job.dependencies
            : (() => { try { return JSON.parse(job.dependencies as string) || []; } catch { return []; } })();
        deps.forEach((depId: string) => {
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

    // Use saved positions if available, otherwise use dagre layout
    const nodes: Node[] = jobs.map(job => {
        const nodeWithPos = g.node(job.id);
        const hasSavedPos = job.positionX !== null && job.positionY !== null;

        return {
            id: job.id,
            type: 'jobNode',
            position: hasSavedPos
                ? { x: job.positionX!, y: job.positionY! }
                : { x: nodeWithPos.x - NODE_WIDTH / 2, y: nodeWithPos.y - NODE_HEIGHT / 2 },
            data: { job },
            draggable: true,
        };
    });

    return { nodes, edges };
}

export const PlanningFlow = ({ jobs, onStatusChange, onDelete, direction }: PlanningFlowProps) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
        () => getLayoutedElements(jobs, direction),
        [jobs, direction]
    );

    // Inject callbacks into node data
    const nodesWithCallbacks = useMemo(
        () =>
            layoutedNodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    onStatusChange,
                    onDelete,
                },
            })),
        [layoutedNodes, onStatusChange, onDelete]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithCallbacks);
    const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

    // Sync when jobs/direction change
    useMemo(() => {
        setNodes(nodesWithCallbacks);
    }, [nodesWithCallbacks, setNodes]);

    // Debounce position save
    const positionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onNodeDragStop: OnNodeDrag = useCallback((_event, node) => {
        // Debounce the API call
        if (positionTimerRef.current) clearTimeout(positionTimerRef.current);
        positionTimerRef.current = setTimeout(async () => {
            try {
                await axios.patch(`/api/v1/planning/jobs/${node.id}/position`, {
                    positionX: node.position.x,
                    positionY: node.position.y,
                });
            } catch (err) {
                console.error('Failed to save position:', err);
            }
        }, 300);
    }, []);

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <p className="text-lg font-medium">No jobs in this instance</p>
                <p className="text-sm mt-1">Click "Add Job" to start building the plan.</p>
            </div>
        );
    }

    return (
        <div className="h-[600px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                nodesDraggable={true}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={2}
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
