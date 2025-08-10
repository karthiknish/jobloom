// components/admin/CompanyList.tsx
import type { SponsoredCompany } from "../../types/convex";

interface CompanyListProps {
  companies: SponsoredCompany[];
}

export function CompanyList({ companies }: CompanyListProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Sponsored Companies Database
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage the database of sponsored companies. All job postings from these companies will be highlighted by the extension.
        </p>
      </div>

      {companies.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {companies.map((company) => (
            <li key={company._id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {company.name}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.sponsorshipType === 'sponsored' ? 'bg-orange-100 text-orange-800' :
                        company.sponsorshipType === 'promoted' ? 'bg-purple-100 text-purple-800' :
                        company.sponsorshipType === 'featured' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {company.sponsorshipType}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="truncate">
                        {company.industry || 'Unknown Industry'}
                        {company.aliases.length > 0 && ` • Aliases: ${company.aliases.join(', ')}`}
                      </span>
                    </div>
                  </div>
                  {company.description && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">{company.description}</p>
                    </div>
                  )}
                  {company.website && (
                    <div className="mt-2">
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-12 text-center">
          <span className="text-4xl">🏢</span>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sponsored companies yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start by adding companies to the sponsored database.
          </p>
        </div>
      )}
    </div>
  );
}