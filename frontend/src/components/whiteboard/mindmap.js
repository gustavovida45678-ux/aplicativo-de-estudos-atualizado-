import { uid, makeNode, makeConnector, elementBBox, unionBox } from "./core";
import { MINDMAP_DIRECTIONS } from "./core";

export function findRoot(elements) {
  const nodes = elements.filter((e) => e.type === "node");
  const ids = new Set(nodes.map((n) => n.id));
  const hasParent = new Set(nodes.filter((n) => n.parentId && ids.has(n.parentId)).map((n) => n.parentId));
  const parentIds = new Set(nodes.map((n) => n.parentId).filter(Boolean));
  for (const n of nodes) {
    if (!n.parentId || !ids.has(n.parentId)) return n;
  }
  for (const id of parentIds) {
    if (!hasParent.has(id)) {
      const root = nodes.find((n) => n.id === id);
      if (root) return root;
    }
  }
  return nodes[0] || null;
}

export function buildChildrenMap(nodes) {
  const map = new Map();
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    if (n.parentId && ids.has(n.parentId)) {
      if (!map.has(n.parentId)) map.set(n.parentId, []);
      map.get(n.parentId).push(n);
    }
  }
  return map;
}

export function subtreeIds(elements, rootId) {
  const nodes = elements.filter((e) => e.type === "node");
  const children = buildChildrenMap(nodes);
  const ids = new Set();
  const visit = (id) => {
    ids.add(id);
    for (const child of children.get(id) || []) visit(child.id);
  };
  visit(rootId);
  return ids;
}

export function subtreeElements(elements, rootId) {
  const ids = subtreeIds(elements, rootId);
  return elements.filter((e) => ids.has(e.id) || (e.type === "connector" && (ids.has(e.fromId) && ids.has(e.toId))));
}

export function removeNodeAndDescendants(elements, nodeId) {
  const ids = subtreeIds(elements, nodeId);
  return elements.filter(
    (e) =>
      !ids.has(e.id) &&
      !(e.type === "connector" && (ids.has(e.fromId) || ids.has(e.toId)))
  );
}

export function nodeSizeEstimate(node) {
  const lines = String(node.text || "").split("\n").length;
  const chars = String(node.text || "").split("\n").reduce((m, l) => Math.max(m, l.length), 0);
  const w = Math.max(80, chars * (node.fontSize || 15) * 0.55 + 28);
  const h = Math.max(38, lines * (node.fontSize || 15) * 1.3 + 20);
  return { w, h };
}

const H_GAP = 48;
const V_GAP = 16;

function tidyLayout(nodes, rootId, direction) {
  const children = buildChildrenMap(nodes);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const sizeOf = (id) => {
    const n = byId.get(id);
    return nodeSizeEstimate(n);
  };

  const layoutNode = (id, dir) => {
    const childList = (children.get(id) || []).map((c) => c.id);
    const childLayouts = childList.map((c) => layoutNode(c, dir));
    const own = sizeOf(id);
    let width, height;
    if (dir === "lr" || dir === "rl") {
      const cw = childLayouts.reduce((m, c) => Math.max(m, c.width), 0);
      const ch = childLayouts.reduce((m, c) => m + c.height + V_GAP, -V_GAP);
      width = own.w + (childLayouts.length ? H_GAP + cw : 0);
      height = Math.max(own.h, ch);
    } else {
      const cw = childLayouts.reduce((m, c) => m + c.width + H_GAP, -H_GAP);
      const ch = childLayouts.reduce((m, c) => Math.max(m, c.height), 0);
      width = Math.max(own.w, cw);
      height = own.h + (childLayouts.length ? V_GAP + ch : 0);
    }
    return { id, own, children: childLayouts, width, height };
  };

  const root = byId.get(rootId);
  if (!root) return { positions: new Map(), root: null };
  const tree = layoutNode(rootId, direction);

  const positions = new Map();
  const place = (node, x, y, dir) => {
    positions.set(node.id, { x, y });
    let acc;
    if (dir === "lr" || dir === "rl") {
      acc = y + node.own.h / 2 - node.height / 2;
      for (const c of node.children) {
        const cy = acc + c.height / 2;
        if (dir === "lr") place(c, x + node.own.w + H_GAP, cy, dir);
        else place(c, x - c.own.w - H_GAP, cy - c.own.h / 2 + node.own.h / 2, dir);
        acc += c.height + V_GAP;
      }
    } else {
      acc = x + node.own.w / 2 - node.width / 2;
      for (const c of node.children) {
        const cx = acc + c.width / 2;
        place(c, cx - c.own.w / 2, y + node.own.h + V_GAP, dir);
        acc += c.width + H_GAP;
      }
    }
  };

  const originX = direction === "rl" ? -tree.own.w : 0;
  const originY = tree.height === 0 ? 0 : 0;
  place(tree, originX, originY, direction);
  return { positions, root };
}

function radialLayout(nodes, rootId) {
  const children = buildChildrenMap(nodes);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const root = byId.get(rootId);
  if (!root) return { positions: new Map(), root: null };

  const counts = new Map();
  const countLeaves = (id) => {
    const kids = children.get(id) || [];
    const total = kids.reduce((m, c) => m + countLeaves(c.id), kids.length ? 0 : 1);
    counts.set(id, total);
    return total;
  };
  countLeaves(rootId);

  const positions = new Map();
  const levelGap = 120;
  const leafAngles = new Map();
  let angleCursor = 0;

  const place = (id, depth, cx, cy) => {
    positions.set(id, { x: cx, y: cy });
    const kids = children.get(id) || [];
    const total = counts.get(id) || 1;
    let start = angleCursor;
    kids.forEach((child) => {
      const span = ((counts.get(child.id) || 1) / total) * Math.PI * 2;
      const mid = start + span / 2;
      const r = levelGap * (depth + 1);
      const nx = cx + r * Math.cos(mid);
      const ny = cy + r * Math.sin(mid);
      place(child.id, depth + 1, nx, ny);
      start += span;
    });
    if (kids.length === 0) {
      leafAngles.set(id, angleCursor);
      angleCursor += 0.4;
    }
  };

  place(rootId, 0, 0, 0);
  return { positions, root };
}

export function autoLayout(elements, rootId, direction, origin = { x: 60, y: 60 }) {
  const nodes = elements.filter((e) => e.type === "node");
  if (!nodes.length) return elements;
  const root = findRoot(elements);
  if (!root) return elements;

  let positions;
  if (direction === MINDMAP_DIRECTIONS.RADIAL) {
    positions = radialLayout(nodes, root.id).positions;
  } else {
    positions = tidyLayout(nodes, root.id, direction).positions;
  }

  if (!positions.size) return elements;

  let box = null;
  for (const [id, pos] of positions) {
    const n = nodes.find((nn) => nn.id === id);
    const { w, h } = nodeSizeEstimate(n);
    const b = { x: pos.x, y: pos.y, width: w, height: h };
    box = box ? unionBox(box, b) : b;
  }

  const offsetX = origin.x - box.x;
  const offsetY = origin.y - box.y;

  const idToPos = new Map();
  for (const [id, pos] of positions) {
    idToPos.set(id, { x: pos.x + offsetX, y: pos.y + offsetY });
  }

  const next = nodes.map((n) => {
    const pos = idToPos.get(n.id);
    if (!pos) return n;
    const { w, h } = nodeSizeEstimate(n);
    return { ...n, x: pos.x, y: pos.y, width: w, height: h };
  });

  return elements.map((e) => {
    if (e.type === "node") {
      const nn = next.find((n) => n.id === e.id);
      return nn || e;
    }
    return e;
  });
}

export function buildTreeElements(title, children, origin = { x: 120, y: 90 }, opts = {}) {
  const nodes = [];
  const connectors = [];
  const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"];

  const create = (text, parentId, depth, index) => {
    const node = makeNode(text, 0, 0, {
      color: "#ffffff",
      bg: opts.rootBg && depth === 0 ? opts.rootBg : "#1f2937",
      borderColor: opts.palette ? colors[depth % colors.length] : "#60a5fa",
      fontSize: depth === 0 ? 18 : 14,
      bold: depth <= 1,
      parentId,
    });
    nodes.push(node);
    if (parentId) {
      connectors.push(
        makeConnector(parentId, node.id, opts.palette ? colors[depth % colors.length] : "#60a5fa", 2, "curve")
      );
    }
    return node;
  };

  const walk = (item, parentId, depth, index) => {
    const node = create(item.title || item, parentId, depth, index);
    (item.children || []).forEach((child, i) => walk(child, node.id, depth + 1, i));
    return node;
  };

  const root = walk({ title, children }, null, 0, 0);

  const provisional = nodes.map((n) => ({ ...n }));
  const laid = autoLayout(provisional, root.id, opts.direction || MINDMAP_DIRECTIONS.LEFT_RIGHT, origin);
  const idToPos = new Map(laid.filter((e) => e.type === "node").map((e) => [e.id, e]));

  const finalNodes = nodes.map((n) => {
    const laidNode = idToPos.get(n.id);
    return laidNode ? { ...n, ...laidNode } : n;
  });

  return { elements: [...connectors, ...finalNodes], rootId: root.id };
}

export function addChildNode(elements, parentId, text, opts) {
  const parent = elements.find((e) => e.id === parentId);
  if (!parent) return { elements, node: null };
  const x = parent.x + parent.width + H_GAP;
  const y = parent.y + (opts && opts.offsetY != null ? opts.offsetY : 0);
  const node = makeNode(text, x, y, {
    color: "#ffffff",
    bg: "#1f2937",
    borderColor: opts && opts.color ? opts.color : "#60a5fa",
    fontSize: 14,
    parentId,
  });
  const conn = makeConnector(parentId, node.id, opts && opts.color ? opts.color : "#60a5fa", 2, "curve");
  return { elements: [...elements, conn, node], node };
}

export function addSiblingNode(elements, siblingId, text) {
  const sibling = elements.find((e) => e.id === siblingId);
  if (!sibling) return { elements, node: null };
  const parentId = sibling.parentId;
  const node = makeNode(text, sibling.x + sibling.width + H_GAP, sibling.y + sibling.height + 20, {
    color: "#ffffff",
    bg: "#1f2937",
    borderColor: sibling.borderColor || "#60a5fa",
    fontSize: 14,
    parentId,
  });
  const out = [...elements, node];
  if (parentId) out.push(makeConnector(parentId, node.id, node.borderColor, 2, "curve"));
  return { elements: out, node };
}

export function toggleCollapse(elements, nodeId) {
  return elements.map((e) => {
    if (e.id === nodeId) return { ...e, collapsed: !e.collapsed };
    if (e.type === "node" && e.parentId === nodeId) {
      return { ...e, hidden: !e.hidden };
    }
    return e;
  });
}

export function countNodes(elements) {
  return elements.filter((e) => e.type === "node").length;
}
