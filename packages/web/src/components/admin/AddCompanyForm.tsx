// components/admin/AddCompanyForm.tsx
import { useState } from "react";
import type { SponsoredCompany } from "../../types/convex";

interface AddCompanyFormProps {
  onSubmit: (data: Omit<SponsoredCompany, "_id" | "createdAt" | "updatedAt"> & { createdBy: string }) => void;
  onCancel: () => void;
}

export function AddCompanyForm({ onSubmit, onCancel }: AddCompanyFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    aliases: [""],
    sponsorshipType: "sponsored",
    description: "",
    website: "",
    industry: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addAliasField = () => {
    setFormData(prev => ({
      ...prev,
      aliases: [...prev.aliases, ""]
    }));
  };

  const updateAlias = (index: number, value: string) => {
    const updatedAliases = [...formData.aliases];
    updatedAliases[index] = value;
    setFormData(prev => ({ ...prev, aliases: updatedAliases }));
  };

  const removeAlias = (index: number) => {
    const updatedAliases = formData.aliases.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      aliases: updatedAliases.length > 0 ? updatedAliases : [""]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      aliases: formData.aliases.filter(alias => alias.trim() !== ""),
      createdBy: "" // This will be filled by the parent component
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Sponsored Company</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Google"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Industry</label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Technology"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sponsorship Type</label>
            <select
              name="sponsorshipType"
              value={formData.sponsorshipType}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="sponsored">Sponsored</option>
              <option value="promoted">Promoted</option>
              <option value="featured">Featured</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              placeholder="Why is this company marked as sponsored?"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Aliases</label>
            <div className="space-y-2">
              {formData.aliases.map((alias, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => updateAlias(index, e.target.value)}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Alphabet Inc, Google LLC"
                  />
                  {formData.aliases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAlias(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addAliasField}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                + Add another alias
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Sponsored Company
          </button>
        </div>
      </form>
    </div>
  );
}