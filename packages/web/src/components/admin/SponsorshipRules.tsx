// components/admin/SponsorshipRules.tsx
import { useState } from "react";
import { useApiMutation, useApiQuery } from "../../hooks/useApi";
import { adminApi } from "../../utils/api/admin";
import toast from "react-hot-toast";

export function SponsorshipRules() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    jobSite: "",
    selectors: [""],
    keywords: [""],
    isActive: true
  });

  const { data: rules, refetch: refetchRules } = useApiQuery(
    () => adminApi.getAllSponsorshipRules(),
    []
  );

  const { mutate: addRule, loading: addRuleLoading } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { name, description, jobSite, selectors, keywords, isActive } = variables;
      return adminApi.addSponsorshipRule({
        name: name as string,
        description: description as string,
        jobSite: jobSite as string,
        selectors: selectors as string[],
        keywords: keywords as string[],
        isActive: isActive as boolean
      });
    }
  );

  const { mutate: updateRuleStatus } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { ruleId, isActive } = variables;
      return adminApi.updateSponsorshipRuleStatus(ruleId as string, isActive as boolean);
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const addSelectorField = () => {
    setFormData(prev => ({
      ...prev,
      selectors: [...prev.selectors, ""]
    }));
  };

  const updateSelector = (index: number, value: string) => {
    const updatedSelectors = [...formData.selectors];
    updatedSelectors[index] = value;
    setFormData(prev => ({ ...prev, selectors: updatedSelectors }));
  };

  const removeSelector = (index: number) => {
    const updatedSelectors = formData.selectors.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      selectors: updatedSelectors.length > 0 ? updatedSelectors : [""]
    }));
  };

  const addKeywordField = () => {
    setFormData(prev => ({
      ...prev,
      keywords: [...prev.keywords, ""]
    }));
  };

  const updateKeyword = (index: number, value: string) => {
    const updatedKeywords = [...formData.keywords];
    updatedKeywords[index] = value;
    setFormData(prev => ({ ...prev, keywords: updatedKeywords }));
  };

  const removeKeyword = (index: number) => {
    const updatedKeywords = formData.keywords.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      keywords: updatedKeywords.length > 0 ? updatedKeywords : [""]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addRule({
        ...formData,
        selectors: formData.selectors.filter(s => s.trim() !== ""),
        keywords: formData.keywords.filter(k => k.trim() !== "")
      });
      
      toast.success("Sponsorship rule added successfully!");
      setShowAddForm(false);
      setFormData({
        name: "",
        description: "",
        jobSite: "",
        selectors: [""],
        keywords: [""],
        isActive: true
      });
      refetchRules();
    } catch (error) {
      toast.error("Failed to add sponsorship rule");
      console.error("Error adding rule:", error);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      await updateRuleStatus({ ruleId, isActive: !isActive });
      toast.success(`Rule ${!isActive ? 'activated' : 'deactivated'} successfully!`);
      refetchRules();
    } catch (error) {
      toast.error(`Failed to ${!isActive ? 'activate' : 'deactivate'} rule`);
      console.error("Error updating rule:", error);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Sponsorship Rules
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage rules for automatically identifying sponsored jobs.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            {showAddForm ? "Cancel" : "Add Rule"}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Rule</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., LinkedIn Sponsored Jobs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Site</label>
                <input
                  type="text"
                  name="jobSite"
                  required
                  value={formData.jobSite}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., linkedin.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="Describe what this rule identifies"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">CSS Selectors</label>
                <div className="space-y-2">
                  {formData.selectors.map((selector, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={selector}
                        onChange={(e) => updateSelector(index, e.target.value)}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., .job-card-container.sponsored"
                      />
                      {formData.selectors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSelector(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSelectorField}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    + Add another selector
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                <div className="space-y-2">
                  {formData.keywords.map((keyword, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => updateKeyword(index, e.target.value)}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., SPONSORED, PROMOTED"
                      />
                      {formData.keywords.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addKeywordField}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    + Add another keyword
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addRuleLoading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {addRuleLoading ? "Adding..." : "Add Rule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {rules && rules.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {rules.map((rule) => (
            <li key={rule._id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {rule.name}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rule.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex text-sm text-gray-500">
                    <span>{rule.jobSite}</span>
                    <span className="mx-2">•</span>
                    <span>{rule.selectors.length} selectors</span>
                    <span className="mx-2">•</span>
                    <span>{rule.keywords.length} keywords</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => toggleRuleStatus(rule._id, rule.isActive)}
                    className={`${
                      rule.isActive
                        ? 'text-red-600 hover:text-red-900'
                        : 'text-green-600 hover:text-green-900'
                    } text-sm font-medium`}
                  >
                    {rule.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-12 text-center">
          <span className="text-4xl">📋</span>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sponsorship rules yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a new rule.
          </p>
        </div>
      )}
    </div>
  );
}