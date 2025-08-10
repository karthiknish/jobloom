// components/admin/CompanyList.tsx
import type { SponsoredCompany } from "../../types/convex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompanyListProps {
  companies: SponsoredCompany[];
}

export function CompanyList({ companies }: CompanyListProps) {
  const getSponsorshipTypeVariant = (type: string) => {
    switch (type) {
      case 'sponsored': return 'orange';
      case 'promoted': return 'purple';
      case 'featured': return 'green';
      case 'premium': return 'yellow';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sponsored Companies Database</CardTitle>
        <CardDescription>
          Manage the database of sponsored companies. All job postings from these companies will be highlighted by the extension.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {companies.length > 0 ? (
          <div className="space-y-4">
            {companies.map((company) => (
              <div key={company._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-sm font-medium text-primary truncate">
                        {company.name}
                      </p>
                      <Badge variant={getSponsorshipTypeVariant(company.sponsorshipType)}>
                        {company.sponsorshipType}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center text-sm text-muted-foreground gap-2">
                      <span className="truncate">
                        {company.industry || 'Unknown Industry'}
                        {company.aliases.length > 0 && ` • Aliases: ${company.aliases.join(', ')}`}
                      </span>
                    </div>
                  </div>
                </div>
                {company.description && (
                  <div className="mt-3">
                    <p className="text-sm text-foreground">{company.description}</p>
                  </div>
                )}
                {company.website && (
                  <div className="mt-2">
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-4xl">🏢</span>
            <h3 className="mt-2 text-sm font-medium text-foreground">No sponsored companies yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start by adding companies to the sponsored database.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}