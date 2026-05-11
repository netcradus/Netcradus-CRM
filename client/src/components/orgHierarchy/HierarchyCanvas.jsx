import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import HierarchyNodeCard from "./HierarchyNodeCard";

const HORIZONTAL_SPACING = 260;
const VERTICAL_SPACING = 180;
const ROOT_X = 520;
const ROOT_Y = 60;

const nodeTypes = {
  hierarchyNode: HierarchyNodeCard,
};

const getParentId = (entry) => entry.parentId?._id || entry.parentId || null;

const computeAutoLayout = (entries = []) => {
  const nodeMap = new Map(entries.map((entry) => [String(entry._id), { ...entry, children: [] }]));
  const roots = [];

  entries.forEach((entry) => {
    const node = nodeMap.get(String(entry._id));
    const parentId = getParentId(entry);
    if (parentId && nodeMap.has(String(parentId))) {
      nodeMap.get(String(parentId)).children.push(node);
    } else {
      roots.push(node);
    }
  });

  let cursor = 0;
  const positioned = [];

  const place = (node, depth) => {
    const savedPosition = Number(node.positionX || 0) || Number(node.positionY || 0);
    if (savedPosition) {
      positioned.push(node);
      node.children.forEach((child) => place(child, depth + 1));
      return;
    }

    if (!node.children.length) {
      const x = ROOT_X + cursor * HORIZONTAL_SPACING;
      cursor += 1;
      positioned.push({ ...node, positionX: x, positionY: ROOT_Y + depth * VERTICAL_SPACING });
      return;
    }

    const before = cursor;
    node.children.forEach((child) => place(child, depth + 1));
    const after = Math.max(before, cursor - 1);
    positioned.push({
      ...node,
      positionX: ROOT_X + ((before + after) / 2) * HORIZONTAL_SPACING,
      positionY: ROOT_Y + depth * VERTICAL_SPACING,
    });
  };

  roots
    .sort((left, right) => Number(left.priorityLevel || 0) - Number(right.priorityLevel || 0))
    .forEach((root) => place(root, Number(root.priorityLevel || 0)));

  return positioned;
};

const isAncestor = (nodeId, potentialAncestorId, edges) => {
  let current = nodeId;
  const visited = new Set();

  while (current) {
    if (visited.has(current)) break;
    visited.add(current);
    const parentEdge = edges.find((edge) => edge.target === current);
    if (!parentEdge) break;
    if (parentEdge.source === potentialAncestorId) return true;
    current = parentEdge.source;
  }

  return false;
};

function HierarchyCanvas({
  hierarchy,
  onEditNode,
  onRemoveNode,
  onRequestSaveLayout,
  onReassign,
  onShowError,
  saving,
  snapbackRequest,
  onSnapbackApplied,
  compact,
}) {
  const dragOriginRef = useRef({});
  const hasFitRef = useRef(false);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [edgeToRemove, setEdgeToRemove] = useState(null);
  const hierarchyWithLayout = useMemo(() => computeAutoLayout(hierarchy), [hierarchy]);

  const initialNodes = useMemo(
    () =>
      hierarchyWithLayout.map((entry) => ({
        id: String(entry._id),
        type: "hierarchyNode",
        position: { x: Number(entry.positionX || ROOT_X), y: Number(entry.positionY || ROOT_Y) },
        draggable: true,
        data: {
          id: String(entry._id),
          userId: entry.userId?._id,
          name: entry.userId?.name || "Unknown User",
          email: entry.userId?.email || "",
          phone: entry.userId?.phone || "",
          role: entry.userId?.role || "",
          designation: entry.userId?.designation || "",
          department: entry.userId?.department || "General",
          profilePhoto: entry.userId?.profilePhoto || "",
          priorityLevel: Number(entry.priorityLevel || 0),
          directReportsCount: hierarchy.filter((item) => String(getParentId(item)) === String(entry._id)).length,
          isRoot: Number(entry.priorityLevel || 0) === 0,
          selected: selectedNode?.id === String(entry._id),
          onSelect: () => setSelectedNode({
            id: String(entry._id),
            name: entry.userId?.name || "Unknown User",
            email: entry.userId?.email || "",
            phone: entry.userId?.phone || "",
            role: entry.userId?.role || "",
            designation: entry.userId?.designation || "",
            department: entry.userId?.department || "General",
            directReportsCount: hierarchy.filter((item) => String(getParentId(item)) === String(entry._id)).length,
          }),
          onEdit: () => onEditNode(entry._id),
          onRemove: () => onRemoveNode(entry._id),
        },
      })),
    [hierarchy, hierarchyWithLayout, onEditNode, onRemoveNode, selectedNode?.id]
  );

  const initialEdges = useMemo(
    () =>
      hierarchyWithLayout
        .filter((entry) => getParentId(entry))
        .map((entry) => ({
          id: `edge-${getParentId(entry)}-${entry._id}`,
          source: String(getParentId(entry)),
          target: String(entry._id),
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-accent)" },
          style: { stroke: "var(--color-accent)", strokeWidth: 2 },
        })),
    [hierarchyWithLayout]
  );

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);
  useEffect(() => setEdges(initialEdges), [initialEdges, setEdges]);

  useEffect(() => {
    if (!reactFlowInstance || hasFitRef.current || !nodes.length) return;
    reactFlowInstance.fitView({ padding: compact ? 0.35 : 0.24, duration: 350, maxZoom: compact ? 0.74 : 0.9 });
    hasFitRef.current = true;
  }, [compact, nodes.length, reactFlowInstance]);

  useEffect(() => {
    if (!snapbackRequest) return;
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === snapbackRequest.nodeId ? { ...node, position: snapbackRequest.position } : node
      )
    );
    onSnapbackApplied?.();
  }, [onSnapbackApplied, setNodes, snapbackRequest]);

  const onConnect = useCallback(
    (params) => {
      if (params.source === params.target) {
        onShowError?.("A node cannot connect to itself.");
        return;
      }

      const targetNode = nodes.find((node) => node.id === params.target);
      if (targetNode?.data?.priorityLevel === 0) {
        onShowError?.("The Super Admin root node cannot report to another employee.");
        return;
      }

      if (edges.some((edge) => edge.target === params.target)) {
        onShowError?.("This employee already has a reporting line. Remove the old connection first.");
        return;
      }

      if (isAncestor(params.source, params.target, edges)) {
        onShowError?.("This connection would create a circular hierarchy.");
        return;
      }

      setEdges((currentEdges) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-accent)" },
            style: { stroke: "var(--color-accent)", strokeWidth: 2 },
          },
          currentEdges
        )
      );
    },
    [edges, nodes, onShowError, setEdges]
  );

  const handleSaveLayout = useCallback(() => {
    const rootNode = nodes.find((node) => node.data.priorityLevel === 0) || nodes.find((node) => !edges.some((edge) => edge.target === node.id));
    if (!rootNode) {
      onShowError?.("A root node is required before saving the hierarchy.");
      return;
    }

    const parentMap = {};
    edges.forEach((edge) => {
      parentMap[edge.target] = edge.source;
    });

    const levelMap = { [rootNode.id]: 0 };
    const queue = [rootNode.id];
    while (queue.length) {
      const parentId = queue.shift();
      edges
        .filter((edge) => edge.source === parentId)
        .forEach((edge) => {
          levelMap[edge.target] = Number(levelMap[parentId] || 0) + 1;
          queue.push(edge.target);
        });
    }

    const disconnected = nodes.filter((node) => node.id !== rootNode.id && levelMap[node.id] === undefined);
    if (disconnected.length) {
      onShowError?.(`Connect these employees before saving: ${disconnected.map((node) => node.data.name).join(", ")}.`);
      return;
    }

    onRequestSaveLayout(
      nodes.map((node) => ({
        id: node.id,
        positionX: node.position.x,
        positionY: node.position.y,
        parentId: parentMap[node.id] || null,
        priorityLevel: levelMap[node.id] || 0,
      }))
    );
  }, [edges, nodes, onRequestSaveLayout, onShowError]);

  const findOverlappingNode = (draggedNode) =>
    nodes.find((candidate) => {
      if (candidate.id === draggedNode.id) return false;
      const deltaX = Math.abs((candidate.positionAbsolute?.x ?? candidate.position.x) - draggedNode.position.x);
      const deltaY = Math.abs((candidate.positionAbsolute?.y ?? candidate.position.y) - draggedNode.position.y);
      return deltaX <= 80 && deltaY <= 80;
    });

  return (
    <div className="nc-card" style={{ position: "relative", minHeight: compact ? 560 : 700, overflow: "hidden", padding: 0 }}>
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 12, display: "flex", gap: "var(--space-2)" }}>
        <button type="button" className="btn btn-ghost" onClick={() => reactFlowInstance?.fitView({ padding: 0.25, duration: 300 })}>
          Fit View
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSaveLayout} disabled={saving || !nodes.length}>
          {saving ? "Saving..." : "Save Layout"}
        </button>
      </div>

      <div style={{ height: compact ? 560 : 700 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          minZoom={0.2}
          maxZoom={1.5}
          onNodesChange={(changes) => setNodes((currentNodes) => applyNodeChanges(changes, currentNodes))}
          onEdgesChange={(changes) => setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges))}
          onConnect={onConnect}
          onEdgeClick={(event, edge) => {
            event.preventDefault();
            setEdgeToRemove(edge);
          }}
          onInit={setReactFlowInstance}
          onPaneClick={() => setSelectedNode(null)}
          onNodeDragStart={(_, node) => {
            dragOriginRef.current[node.id] = { ...node.position };
          }}
          onNodeDragStop={(_, node) => {
            setNodes((currentNodes) => currentNodes.map((item) => (item.id === node.id ? { ...item, position: node.position } : item)));
            const targetNode = findOverlappingNode(node);
            if (targetNode && targetNode.id !== node.id) {
              onReassign?.({
                nodeId: node.id,
                draggedName: node.data.name,
                targetNodeId: targetNode.id,
                targetName: targetNode.data.name,
                newPriorityLevel: Number(targetNode.data.priorityLevel || 0) + 1,
                originalPosition: dragOriginRef.current[node.id] || node.position,
              });
            }
          }}
          fitView={false}
        >
          <MiniMap nodeColor={() => "#e8420a"} maskColor="rgba(9, 9, 12, 0.72)" />
          <Controls />
          <Background color="rgba(255,255,255,0.16)" gap={24} />
        </ReactFlow>
      </div>

      {selectedNode && (
        <div
          className="nc-card"
          style={{
            position: "absolute",
            top: 72,
            right: 16,
            width: "min(420px, calc(100% - 32px))",
            zIndex: 12,
            padding: "var(--space-4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: "var(--font-bold)", fontSize: "var(--text-lg)" }}>{selectedNode.name}</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", overflowWrap: "anywhere" }}>{selectedNode.email || "-"}</div>
            </div>
            <button type="button" className="btn btn-ghost btn--sm" style={{ minWidth: 36, width: 36, padding: 0 }} onClick={() => setSelectedNode(null)}>
              x
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            {[
              ["Designation", selectedNode.designation || "-"],
              ["Department", selectedNode.department || "-"],
              ["Phone", selectedNode.phone || "-"],
              ["Role", selectedNode.role || "-"],
            ].map(([label, value]) => (
              <div key={label} style={{ minWidth: 0 }}>
                <div className="form-label" style={{ marginBottom: 4 }}>{label}</div>
                <div style={{ color: "var(--color-text-primary)", fontSize: "var(--text-sm)", overflowWrap: "anywhere" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {edgeToRemove && (
        <div className="nc-modal-overlay" onClick={() => setEdgeToRemove(null)}>
          <div className="nc-modal-content" style={{ width: 420 }} onClick={(event) => event.stopPropagation()}>
            <div className="nc-modal-header"><h3>Remove Reporting Line</h3></div>
            <div className="form">
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                Remove this connection from the hierarchy canvas?
              </p>
            </div>
            <div className="nc-modal-footer" style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEdgeToRemove(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setEdges((currentEdges) => currentEdges.filter((item) => item.id !== edgeToRemove.id));
                  setEdgeToRemove(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HierarchyCanvas;
