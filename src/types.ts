export type RunConfig = {
  userQuery: string;
  url: string;
  test?: boolean;
};

export type AXNodeLite = {
  nodeId: string;
  parentId?: string;
  role: string;
  name: string;
  backendDOMNodeId?: number;
  ignored?: boolean;
  children: AXNodeLite[];
};
