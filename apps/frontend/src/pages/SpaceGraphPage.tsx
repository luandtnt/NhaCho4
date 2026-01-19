import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';
import NodeDetailModal from '../components/NodeDetailModal';
import NodeFormModal from '../components/NodeFormModal.tsx';

interface SpaceNode {
  id: string;
  name: string;
  node_type: string;
  parent_id: string | null;
  asset_id: string;
  attrs: any;
  children?: SpaceNode[];
  created_at: string;
}

export default function SpaceGraphPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [nodes, setNodes] = useState<SpaceNode[]>([]);
  const [treeData, setTreeData] = useState<SpaceNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<SpaceNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [parentIdForNewNode, setParentIdForNewNode] = useState<string>('');

  useEffect(() => {
    loadAsset();
    loadNodes();
  }, [assetId]);

  useEffect(() => {
    buildTree();
  }, [nodes]);

  const loadAsset = async () => {
    try {
      const response = await apiClient.get(`/assets/${assetId}`);
      setAsset(response.data);
    } catch (error) {
      console.error('Không thể tải tài sản:', error);
    }
  };

  const loadNodes = async () => {
    try {
      const response = await apiClient.get(`/space-nodes?asset_id=${assetId}&page_size=1000`);
      setNodes(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách node:', error);
      setNodes([]);
    } finally {
      setLoading(false);
    }
  };

  const buildTree = () => {
    const nodeMap = new Map<string, SpaceNode>();
    const roots: SpaceNode[] = [];

    // Create map
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Build tree
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        const parent = nodeMap.get(node.parent_id)!;
        if (!parent.children) parent.children = [];
        parent.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });

    setTreeData(roots);
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAddNode = async (formData: any) => {
    try {
      await apiClient.post('/space-nodes', {
        ...formData,
        parent_id: formData.parent_id || null,
        asset_id: assetId,
      });
      alert('Đã thêm node thành công!');
      setShowAddModal(false);
      setParentIdForNewNode('');
      loadNodes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể thêm node');
    }
  };

  const handleUpdateNode = async (formData: any) => {
    if (!selectedNode) return;

    try {
      await apiClient.put(`/space-nodes/${selectedNode.id}`, formData);
      alert('Đã cập nhật node thành công!');
      setShowEditModal(false);
      loadNodes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể cập nhật node');
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Bạn có chắc muốn xóa node này? Các node con cũng sẽ bị xóa.')) return;

    try {
      await apiClient.delete(`/space-nodes/${nodeId}`);
      alert('Đã xóa node thành công!');
      loadNodes();
      setSelectedNode(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xóa. Node có thể đang được sử dụng.');
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const prefix = (form.elements.namedItem('prefix') as HTMLInputElement).value;
    const count = parseInt((form.elements.namedItem('count') as HTMLInputElement).value);
    const nodeType = (form.elements.namedItem('node_type') as HTMLInputElement).value;
    const parentId = (form.elements.namedItem('parent_id') as HTMLInputElement).value;

    if (!prefix || count < 1 || count > 100) {
      alert('Vui lòng nhập prefix và số lượng hợp lệ (1-100)');
      return;
    }

    try {
      const promises = [];
      for (let i = 1; i <= count; i++) {
        promises.push(
          apiClient.post('/space-nodes', {
            name: `${prefix} ${i}`,
            node_type: nodeType,
            parent_id: parentId || null,
            asset_id: assetId,
            attrs: {},
          })
        );
      }
      await Promise.all(promises);
      alert(`Đã tạo ${count} nodes thành công!`);
      setShowBulkAddModal(false);
      loadNodes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể tạo hàng loạt');
    }
  };

  const renderTreeNode = (node: SpaceNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer rounded ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
            }`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => setSelectedNode(node)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <span className="w-5" />}

          <span className="text-lg">{getNodeIcon(node.node_type)}</span>
          <span className="font-medium text-gray-900">{node.name}</span>
          <span className="text-xs text-gray-500 ml-2">({node.node_type})</span>
          {hasChildren && (
            <span className="text-xs text-gray-400 ml-auto">
              {node.children!.length} con
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNode(node);
              setShowDetailModal(true);
            }}
            className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Chi tiết
          </button>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getNodeIcon = (type: string) => {
    const icons: any = {
      building: '🏢',
      floor: '🏬',
      unit: '🚪',
      room: '🛏️',
      bed: '🛌',
      parking: '🅿️',
      amenity: '🎯',
    };
    return icons[type] || '📦';
  };

  if (loading) {
    return (
      <Layout userRole="LANDLORD">
        <div className="p-8">Đang tải...</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="LANDLORD">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/assets')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Quay lại danh sách tài sản
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Cây không gian: {asset?.name || 'Asset'}
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý cấu trúc phân cấp không gian của tài sản
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setParentIdForNewNode('');
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ➕ Thêm node
              </button>
              <button
                onClick={() => setShowBulkAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📦 Thêm hàng loạt
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Tree View */}
          <div className="col-span-2 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Cây phân cấp</h2>
              <p className="text-sm text-gray-600">
                Click vào node để xem chi tiết, click mũi tên để mở/đóng
              </p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {treeData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏗️</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Chưa có không gian nào
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Bắt đầu bằng cách thêm node gốc (building, floor...)
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Thêm node đầu tiên
                  </button>
                </div>
              ) : (
                treeData.map(node => renderTreeNode(node))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết node</h2>
            </div>
            <div className="p-4">
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Tên</label>
                    <div className="font-medium text-gray-900">{selectedNode.name}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Loại</label>
                    <div className="font-medium text-gray-900">
                      {getNodeIcon(selectedNode.node_type)} {selectedNode.node_type}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">ID</label>
                    <div className="text-sm text-gray-500 font-mono break-all">
                      {selectedNode.id}
                    </div>
                  </div>
                  {selectedNode.parent_id && (
                    <div>
                      <label className="text-sm text-gray-600">Parent ID</label>
                      <div className="text-sm text-gray-500 font-mono break-all">
                        {selectedNode.parent_id}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-600">Thuộc tính (attrs)</label>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
                      {JSON.stringify(selectedNode.attrs, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Ngày tạo</label>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedNode.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <button
                      onClick={() => {
                        setParentIdForNewNode(selectedNode.id);
                        setShowAddModal(true);
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      ➕ Thêm node con
                    </button>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      ✏️ Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      🗑️ Xóa node
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">👈</div>
                  <p>Chọn một node để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Node Modal */}
        {showAddModal && (
          <NodeFormModal
            mode="create"
            nodes={nodes}
            parentId={parentIdForNewNode}
            onSubmit={handleAddNode}
            onClose={() => {
              setShowAddModal(false);
              setParentIdForNewNode('');
            }}
          />
        )}

        {/* Edit Node Modal */}
        {showEditModal && selectedNode && (
          <NodeFormModal
            mode="edit"
            initialData={selectedNode}
            nodes={nodes}
            onSubmit={handleUpdateNode}
            onClose={() => setShowEditModal(false)}
          />
        )}

        {/* Bulk Add Modal */}
        {showBulkAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Thêm hàng loạt</h2>
              <p className="text-gray-600 mb-4">
                Tạo nhiều nodes cùng lúc với tên theo số thứ tự
              </p>
              <form onSubmit={handleBulkAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prefix (tiền tố) *
                  </label>
                  <input
                    type="text"
                    name="prefix"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="VD: Tầng, Phòng..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kết quả: "Tầng 1", "Tầng 2", "Tầng 3"...
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng * (1-100)
                  </label>
                  <input
                    type="number"
                    name="count"
                    min="1"
                    max="100"
                    defaultValue="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại node *
                  </label>
                  <select
                    name="node_type"
                    defaultValue="floor"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="building">🏢 Building</option>
                    <option value="floor">🏬 Floor</option>
                    <option value="unit">🚪 Unit</option>
                    <option value="room">🛏️ Room</option>
                    <option value="bed">🛌 Bed</option>
                    <option value="parking">🅿️ Parking</option>
                    <option value="amenity">🎯 Amenity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent node (để trống nếu là root)
                  </label>
                  <select
                    name="parent_id"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Root node --</option>
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.name} ({node.node_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowBulkAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Tạo hàng loạt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Node Detail Modal */}
        {showDetailModal && selectedNode && (
          <NodeDetailModal
            nodeId={selectedNode.id}
            onClose={() => setShowDetailModal(false)}
            onUpdate={() => {
              loadNodes();
              setShowDetailModal(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
