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
 * Use dagre to compute a clean, automatic graph layout.
 * Nodes are sorted by scheduledTime so the flow reads chronologically.
 */
function getLayoutedElements(
    jobs: PlanningJob[],
    direction: 'LR' | 'TB'
): { nodes: Node[]; edges: Edge[] } {
    // Sort by scheduledTime so dagre assigns ranks chronologically
    const sortedJobs = [...jobs].sort(
        (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: direction,
        ranksep: 120,   // distance between ranks (columns in LR)
        nodesep: 60,    // distance between nodes in the same rank
        marginx: 60,
        marginy: 60,
        align: 'UL',    // align nodes to upper-left for uniform layout
    });

    sortedJobs.forEach(job => {
        g.setNode(job.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    const edges: Edge[] = [];
    const jobIdSet = new Set(sortedJobs.map(j => j.id));

    sortedJobs.forEach(job => {
        const deps = Array.isArray(job.dependencies)
            ? job.dependencies
            : (() => { try { return JSON.parse(job.dependencies as string) || []; } catch { return []; } })();
        deps.forEach((depId: string) => {
            if (jobIdSet.has(depId)) {
                const depJob = sortedJobs.find(j => j.id === depId);
                const edgeColor =
                    job.status === 'done' ? '#10b981'
                        : job.status === 'running' ? '#3b82f6'
                            : depJob?.status === 'done' ? '#6ee7b7'
                                : '#cbd5e1';

                edges.push({
                    id: `${depId}->${job.id}`,
                    source: depId,
                    target: job.id,
                    animated: job.status === 'running',
                    type: 'smoothstep',
                    style: {
                        stroke: edgeColor,
                        strokeWidth: 2,
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: edgeColor,
                    },
                });
                g.setEdge(depId, job.id);
            }
        });
    });

    dagre.layout(g);

    // Always use dagre's computed layout for clean positioning
    const nodes: Node[] = sortedJobs.map(job => {
        const nodeWithPos = g.node(job.id);
        return {
            id: job.id,
            type: 'jobNode',
            position: {
                x: nodeWithPos.x - NODE_WIDTH / 2,
                y: nodeWithPos.y - NODE_HEIGHT / 2,
            },
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
