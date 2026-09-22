import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../utils/api";

interface Subcategory {
  id: number;
  name: string;
  icon?: string;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  subcategories: Subcategory[];
}

export default function CategorySettings() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);

  const [newCategoryForm, setNewCategoryForm] = useState({
    name: "",
    icon: "",
    color: "",
  });

  const [editingCategory, setEditingCategory] = useState<{
    id: number;
    name: string;
    icon: string;
    color: string;
  } | null>(null);

  const [newSubcategoryForm, setNewSubcategoryForm] = useState<{
    [key: number]: { name: string; icon: string };
  }>({});

  const [editingSubcategory, setEditingSubcategory] = useState<{
    categoryId: number;
    subcategoryId: number;
    name: string;
    icon: string;
  } | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiCall("/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryForm.name.trim()) return;

    try {
      const response = await apiCall("/categories", {
        method: "POST",
        body: JSON.stringify(newCategoryForm),
      });

      if (response.ok) {
        setNewCategoryForm({ name: "", icon: "", color: "" });
        setShowNewCategoryForm(false);
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category");
    }
  };

  const handleUpdateCategory = async (categoryId: number, updates: any) => {
    try {
      const response = await apiCall(`/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setEditingCategoryId(null);
        setEditingCategory(null);
        fetchCategories();
      } else {
        alert("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await apiCall(`/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategories();
      } else {
        alert("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  const handleAddSubcategory = async (categoryId: number) => {
    const form = newSubcategoryForm[categoryId];
    if (!form || !form.name.trim()) return;

    try {
      const response = await apiCall(`/categories/${categoryId}/subcategories`, {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setNewSubcategoryForm({ ...newSubcategoryForm, [categoryId]: { name: "", icon: "" } });
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create subcategory");
      }
    } catch (error) {
      console.error("Error creating subcategory:", error);
      alert("Failed to create subcategory");
    }
  };

  const handleUpdateSubcategory = async (subcategoryId: number, updates: any) => {
    try {
      const response = await apiCall(`/subcategories/${subcategoryId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setEditingSubcategory(null);
        fetchCategories();
      } else {
        alert("Failed to update subcategory");
      }
    } catch (error) {
      console.error("Error updating subcategory:", error);
      alert("Failed to update subcategory");
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: number) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;

    try {
      const response = await apiCall(`/subcategories/${subcategoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategories();
      } else {
        alert("Failed to delete subcategory");
      }
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      alert("Failed to delete subcategory");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(to bottom right, #000000, #0f0f0f, #000000)' }}>
      <style>{`
        .glow-card {
          position: relative;
          border-radius: 1.5rem;
          padding: 1.5rem;
          background: rgba(10, 15, 30, 0.3);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 0.3px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .glow-card::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100%;
          background:
            linear-gradient(to top, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 5%, transparent 15%),
            radial-gradient(ellipse 20% 250% at 1% 115%, var(--glow-color-dim) 0%, transparent 25%),
            radial-gradient(ellipse 20% 250% at 99% 115%, var(--glow-color-dim) 0%, transparent 25%),
            linear-gradient(to top, var(--glow-color) 0%, var(--glow-color-dim) 20%, var(--glow-color-dim) 35%, transparent 70%);
          z-index: 0;
          pointer-events: none;
          opacity: 0.9;
          transition: opacity 0.3s ease;
        }

        .glow-purple {
          --color-1: #c77dff;
          --color-2: #ff006e;
          --glow-color: rgba(199, 125, 255, 0.8);
          --glow-color-dim: rgba(199, 125, 255, 0.3);
        }

        .glow-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 1.5rem;
          padding: 1px;
          background: linear-gradient(135deg, var(--color-1), var(--color-2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 10;
          opacity: 0.35;
          transition: opacity 0.3s ease;
        }

        .glow-card > * {
          position: relative;
          z-index: 2;
        }

        .category-card {
          background: rgba(30, 41, 59, 0.3);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .category-card:hover {
          border-color: rgba(148, 163, 184, 0.4);
          background: rgba(30, 41, 59, 0.5);
        }

        .subcategory-item {
          background: rgba(15, 23, 42, 0.5);
          border-left: 2px solid rgba(139, 92, 246, 0.3);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-top: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Category Settings</h1>
            <p className="text-gray-400">Create, edit, and manage your transaction categories</p>
          </div>
          <button
            onClick={() => navigate("/transactions")}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition cursor-pointer"
          >
            ← Back
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading categories...</p>
          </div>
        ) : (
          <>
            {/* New Category Form */}
            {showNewCategoryForm && (
              <div className="glow-card glow-purple mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Add New Category</h2>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        value={newCategoryForm.name}
                        onChange={(e) =>
                          setNewCategoryForm({ ...newCategoryForm, name: e.target.value })
                        }
                        placeholder="e.g., Shopping"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 hover:border-purple-400 hover:bg-slate-600 focus:border-purple-400 focus:outline-none transition cursor-text"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Icon (Optional)
                      </label>
                      <input
                        type="text"
                        value={newCategoryForm.icon}
                        onChange={(e) =>
                          setNewCategoryForm({ ...newCategoryForm, icon: e.target.value })
                        }
                        placeholder="e.g., 🛍️"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 hover:border-purple-400 hover:bg-slate-600 focus:border-purple-400 focus:outline-none transition cursor-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Color (Optional)
                      </label>
                      <input
                        type="text"
                        value={newCategoryForm.color}
                        onChange={(e) =>
                          setNewCategoryForm({ ...newCategoryForm, color: e.target.value })
                        }
                        placeholder="e.g., #ff6b6b"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 hover:border-purple-400 hover:bg-slate-600 focus:border-purple-400 focus:outline-none transition cursor-text"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition cursor-pointer"
                    >
                      Create Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryForm(false)}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showNewCategoryForm && (
              <button
                onClick={() => setShowNewCategoryForm(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition cursor-pointer mb-8"
              >
                + Add New Category
              </button>
            )}

            {/* Categories List */}
            <div className="space-y-4">
              {categories.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No categories yet. Create one to get started!
                </div>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="category-card">
                    {/* Category Header */}
                    {editingCategoryId === category.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              value={editingCategory?.name || ""}
                              onChange={(e) =>
                                setEditingCategory({
                                  ...editingCategory!,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:border-purple-400 focus:border-purple-400 focus:outline-none transition cursor-text"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Icon
                            </label>
                            <input
                              type="text"
                              value={editingCategory?.icon || ""}
                              onChange={(e) =>
                                setEditingCategory({
                                  ...editingCategory!,
                                  icon: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:border-purple-400 focus:border-purple-400 focus:outline-none transition cursor-text"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Color
                            </label>
                            <input
                              type="text"
                              value={editingCategory?.color || ""}
                              onChange={(e) =>
                                setEditingCategory({
                                  ...editingCategory!,
                                  color: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white hover:border-purple-400 focus:border-purple-400 focus:outline-none transition cursor-text"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              handleUpdateCategory(category.id, {
                                name: editingCategory?.name,
                                icon: editingCategory?.icon,
                                color: editingCategory?.color,
                              })
                            }
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategory(null);
                            }}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedCategoryId(expandedCategoryId === category.id ? null : category.id)}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon || "📁"}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {category.subcategories.length} subcategories
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategoryId(category.id);
                              setEditingCategory({
                                id: category.id,
                                name: category.name,
                                icon: category.icon || "",
                                color: category.color || "",
                              });
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category.id);
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Subcategories */}
                    {expandedCategoryId === category.id && (
                      <div className="mt-6 pt-6 border-t border-slate-700">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">
                          Subcategories
                        </h4>

                        {/* Subcategory List */}
                        <div className="space-y-2 mb-4">
                          {category.subcategories.map((sub) => (
                            <div key={sub.id}>
                              {editingSubcategory?.subcategoryId === sub.id ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editingSubcategory.name}
                                    onChange={(e) =>
                                      setEditingSubcategory({
                                        ...editingSubcategory,
                                        name: e.target.value,
                                      })
                                    }
                                    className="flex-1 px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm hover:border-purple-400 focus:border-purple-400 focus:outline-none transition cursor-text"
                                  />
                                  <button
                                    onClick={() =>
                                      handleUpdateSubcategory(sub.id, {
                                        name: editingSubcategory.name,
                                        icon: editingSubcategory.icon,
                                      })
                                    }
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingSubcategory(null)}
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="subcategory-item">
                                  <div>
                                    <span className="text-sm text-gray-300">
                                      {sub.icon && <span className="mr-2">{sub.icon}</span>}
                                      {sub.name}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        setEditingSubcategory({
                                          categoryId: category.id,
                                          subcategoryId: sub.id,
                                          name: sub.name,
                                          icon: sub.icon || "",
                                        })
                                      }
                                      className="text-blue-400 hover:text-blue-300 transition cursor-pointer text-sm"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteSubcategory(sub.id)
                                      }
                                      className="text-red-400 hover:text-red-300 transition cursor-pointer text-sm"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add Subcategory Form */}
                        <div className="flex gap-2 mt-3">
                          <input
                            type="text"
                            value={newSubcategoryForm[category.id]?.name || ""}
                            onChange={(e) =>
                              setNewSubcategoryForm({
                                ...newSubcategoryForm,
                                [category.id]: {
                                  name: e.target.value,
                                  icon: newSubcategoryForm[category.id]?.icon || "",
                                },
                              })
                            }
                            placeholder="Add subcategory..."
                            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-gray-500 hover:border-purple-400 focus:border-purple-400 focus:outline-none transition cursor-text"
                          />
                          <button
                            onClick={() => handleAddSubcategory(category.id)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
