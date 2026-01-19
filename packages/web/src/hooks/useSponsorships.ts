"use client";

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useSponsorships() {
  return useQuery(api.sponsorships.getSponsorships, { limit: 1000 });
}

export function useSponsorshipByDomain(domain: string) {
  return useQuery(api.sponsorships.getSponsorshipByDomain, domain ? { domain } : "skip");
}

export function useCreateSponsorship() {
  return useMutation(api.sponsorships.createSponsorship);
}

export function useUpdateSponsorship() {
  return useMutation(api.sponsorships.updateSponsorship);
}
