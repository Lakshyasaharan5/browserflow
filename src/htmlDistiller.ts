import { Page } from "playwright";
import { AXNodeLite } from "./types";

export async function distill(
    page: Page,
): Promise<{ llmReadyTree: string; xpathMap: Map<number, string> }> {
    const cdp = await page.context().newCDPSession(page);

    await cdp.send("DOM.enable");
    await cdp.send("Accessibility.enable");

    const { root } = await cdp.send("DOM.getDocument", {
        depth: -1,
        pierce: true,
    });

    const xpathMap = buildXpathMap(root);

    const { nodes } = await cdp.send("Accessibility.getFullAXTree");

    const normalized = normalizeAXNodes(nodes);
    const axTree = buildAXTree(normalized);
    const pruned = pruneAXTree(axTree);
    const llmReadyTree = buildLLMString(pruned);

    return { llmReadyTree, xpathMap };
}

function normalizeAXNodes(rawNodes: any[]): AXNodeLite[] {
    return rawNodes.map((node) => ({
        nodeId: node.nodeId,
        parentId: node.parentId,
        role: node.role?.value || "",
        name: (node.name?.value || "").trim(),
        backendDOMNodeId: node.backendDOMNodeId,
        ignored: node.ignored || false,
        children: [],
    }));
}

function buildAXTree(nodes: AXNodeLite[]): AXNodeLite[] {
    const nodeMap = new Map<string, AXNodeLite>();
    const roots: AXNodeLite[] = [];

    for (const node of nodes) {
        nodeMap.set(node.nodeId, node);
    }

    for (const node of nodes) {
        if (node.parentId && nodeMap.has(node.parentId)) {
            nodeMap.get(node.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

function pruneAXTree(nodes: AXNodeLite[]): AXNodeLite[] {
    const cleaned: AXNodeLite[] = [];

    const structuralRoles = new Set(["generic", "none", "InlineTextBox"]);

    for (const node of nodes) {
        const { role, name, backendDOMNodeId, ignored } = node;

        let children = pruneAXTree(node.children);

        if (ignored) {
            cleaned.push(...children);
            continue;
        }

        // Drop decorative images
        if (role === "image" && !name) continue;

        // Remove redundant static text children
        children = removeRedundantStaticTextChildren(name, children);

        // Structural collapse
        if (structuralRoles.has(role)) {
            if (children.length === 1) cleaned.push(children[0]);
            else cleaned.push(...children);
            continue;
        }

        cleaned.push({
            nodeId: node.nodeId,
            role,
            name,
            backendDOMNodeId: backendDOMNodeId ?? 0,
            children,
        });
    }

    return cleaned;
}

function removeRedundantStaticTextChildren(
    parentName: string,
    children: AXNodeLite[],
): AXNodeLite[] {
    if (!parentName) return children;

    const normalizedParent = normalizeSpaces(parentName);

    let combined = "";
    for (const child of children) {
        if (child.role === "StaticText" && child.name) {
            combined += normalizeSpaces(child.name);
        }
    }

    if (normalizeSpaces(combined) === normalizedParent) {
        return children.filter((c) => c.role !== "StaticText");
    }

    return children;
}

function normalizeSpaces(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

// @ts-ignore
function printTree(nodes: AXNodeLite[], depth = 0) {
    const indent = "  ".repeat(depth);

    for (const node of nodes) {
        console.log(
            `${indent}[${node.backendDOMNodeId ?? "-"}] ${node.role}${node.name ? ` "${node.name}"` : ""}`,
        );

        if (node.children.length) {
            printTree(node.children, depth + 1);
        }
    }
}

function buildLLMString(nodes: AXNodeLite[]): string {
    const lines: string[] = [];

    function walk(nodeList: AXNodeLite[], depth: number) {
        const indent = "  ".repeat(depth);

        for (const node of nodeList) {
            const id = node.backendDOMNodeId ?? "-";

            const label =
                `[${id}] ${node.role}` + (node.name ? ` "${normalizeSpaces(node.name)}"` : "");

            lines.push(indent + label);

            if (node.children.length) {
                walk(node.children, depth + 1);
            }
        }
    }

    walk(nodes, 0);

    return lines.join("\n");
}

function buildXpathMap(domRoot: any) {
    const xpathMap = new Map<number, string>();

    const htmlNode = domRoot.children?.find(
        (child: any) => child.nodeType === 1 && child.nodeName.toLowerCase() === "html",
    );

    if (!htmlNode) throw new Error("HTML root not found");

    dfs(htmlNode, "//html[1]");

    function dfs(node: any, currentPath: string) {
        if (node.backendNodeId) {
            xpathMap.set(node.backendNodeId, currentPath);
        }

        if (!node.children) return;

        const elementChildren = node.children.filter((child: any) => child.nodeType === 1);

        const tagCounter: Record<string, number> = {};

        for (const child of elementChildren) {
            const tag = child.nodeName.toLowerCase();
            tagCounter[tag] = (tagCounter[tag] || 0) + 1;
            const index = tagCounter[tag];
            const childPath = `${currentPath}/${tag}[${index}]`;
            dfs(child, childPath);
        }
    }

    return xpathMap;
}
