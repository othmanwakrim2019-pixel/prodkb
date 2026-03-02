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
 * Compute the "blast radius" of failed/blocked jobs.
 * Returns a Map<jobId, blastCount> where blastCount is the number of
 * downstream jobs that would be blocked by this job's failure.
 * Also returns a Set of all currently-blocked downstream job IDs.
 */
function computeBlastRadius(jobs: PlanningJob[]): {
    blockedSet: Set<string>;
    blastCountMap: Map<string, number>;
} {
    // Build adjacency list: depId → [jobIds that depend on depId]
    const downstream = new Map<string, string[]>();
    const jobIdSet = new Set(jobs.map(j => j.id));

    jobs.forEach(job => {
        const deps = Array.isArray(job.dependencies)
            ? job.dependencies
            : (() => { try { return JSON.parse(job.dependencies as string) || []; } catch { return []; } })();
        deps.forEach((depId: string) => {
            if (jobIdSet.has(depId)) {
                if (!downstream.has(depId)) downstream.set(depId, []);
                downstream.get(depId)!.push(job.id);
            }
        });
    });

    // Find all root failures: jobs with status 'failed'
    const failedIds = new Set(jobs.filter(j => j.status === 'failed').map(j => j.id));

    // BFS from each failed node to find all descendants
    const blockedSet = new Set<string>();
    const queue = [...failedIds];
    while (queue.length > 0) {
        const current = queue.shift()!;
        const children = downstream.get(current) || [];
        children.forEach(childId => {
            if (!blockedSet.has(childId) && !failedIds.has(childId)) {
                blockedSet.add(childId);
                queue.push(childId);
            }
        });
    }

    // For each failed node, count how many total downstream are blocked by it
    const blastCountMap = new Map<string, number>();
    failedIds.forEach(failedId => {
        const affected = new Set<string>();
        const bfsQ = [failedId];
        while (bfsQ.length > 0) {
            const cur = bfsQ.shift()!;
            const ch = downstream.get(cur) || [];
            ch.forEach(c => {
                if (!affected.has(c)) {
                    affected.add(c);
                    bfsQ.push(c);
                }
            });
        }
        if (affected.size > 0) blastCountMap.set(failedId, affected.size);
    });

    return { blockedSet, blastCountMap };
}

/**
 * Use dagre to compute a clean, automatic graph layout.
 * Nodes are sorted by scheduledTime so the flow reads chronologically.
 * Failed nodes show their blast radius, blocked descendants are highlighted.
 */
function getLayoutedElements(
    jobs: PlanningJob[],
    direction: 'LR' | 'TB'
): { nodes: Node[]; edges: Edge[] } {
    const sortedJobs = [...jobs].sort(
        (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

    const { blockedSet, blastCountMap } = computeBlastRadius(sortedJobs);

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: direction,
        ranksep: 120,
        nodesep: 60,
        marginx: 60,
        marginy: 60,
        align: 'UL',
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
                const isBlastEdge = depJob?.status === 'failed' || blockedSet.has(depId);

                const edgeColor = isBlastEdge
                    ? '#ef4444'  // red for blast radius edges
                    : job.status === 'done' ? '#10b981'
                        : job.status === 'running' ? '#3b82f6'
                            : depJob?.status === 'done' ? '#6ee7b7'
                                : '#cbd5e1';

                edges.push({
                    id: `${depId}->${job.id}`,
                    source: depId,
                    target: job.id,
                    animated: job.status === 'running' || isBlastEdge,
                    type: 'smoothstep',
                    style: {
                        stroke: edgeColor,
                        strokeWidth: isBlastEdge ? 3 : 2,
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

    const nodes: Node[] = sortedJobs.map(job => {
        const nodeWithPos = g.node(job.id);
        const isBlocked = blockedSet.has(job.id);
        const blastCount = blastCountMap.get(job.id);
        return {
            id: job.id,
            type: 'jobNode',
            position: {
                x: nodeWithPos.x - NODE_WIDTH / 2,
                y: nodeWithPos.y - NODE_HEIGHT / 2,
            },
            data: {
                job,
                isBlastBlocked: isBlocked,         // downstream blocked node
                blastCount: blastCount ?? 0,        // how many it blocks (for failed nodes)
            },
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

    useMemo(() => {
        setNodes(nodesWithCallbacks);
    }, [nodesWithCallbacks, setNodes]);

    const positionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onNodeDragStop: OnNodeDrag = useCallback((_event, node) => {
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
                        const isBlocked = (node.data as { isBlastBlocked?: boolean }).isBlastBlocked;
                        if (job.status === 'failed') return '#ef4444';
                        if (isBlocked) return '#f97316';
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
