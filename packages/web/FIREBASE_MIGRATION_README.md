# Firebase Migration Guide

This guide explains how to migrate from JSON files to Firebase Firestore for better search performance and scalability.

## Why Firebase?

- **Advanced Search**: Full-text search, filtering, pagination
- **Scalability**: Handle large datasets (137K+ sponsors)
- **Real-time**: Live updates and synchronization
- **Security**: Built-in authentication and authorization
- **Performance**: Indexed queries and caching

## Prerequisites

1. **Firebase Admin SDK**: Install service account key
2. **Firestore Database**: Enable in Firebase Console
3. **Environment Variables**: Update `.env` file

## Setup Instructions

### 1. Service Account Key

Create a service account key in Firebase Console:
- Go to **Project Settings > Service Accounts**
- Click **"Generate new private key"**
- Save as `serviceAccountKey.json` in the `packages/web/` directory

### 2. Environment Variables

Add to your `.env` file:
```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"hireall-4f106",...}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hireall-4f106
```

### 3. Migrate Data

Run the migration script:
```bash
cd packages/web
npm run migrate-data
```

This will:
- Upload 137K+ sponsor records to Firestore
- Upload SOC codes to Firestore
- Create searchable fields

### 4. Create Firestore Indexes

Go to Firebase Console > Firestore Database > Indexes and create:

**For sponsors collection:**
- `searchName` (Ascending) + `route` (Ascending)
- `searchCity` (Ascending) + `route` (Ascending)
- `isActive` (Ascending) + `route` (Ascending)

**For socCodes collection:**
- `eligibility` (Ascending) + `code` (Ascending)
- `searchTerms` (Ascending) + `eligibility` (Ascending)

## API Endpoints

### Sponsors Search
```
GET /api/sponsors?q=company&route=skilled&city=london&limit=20
```

**Parameters:**
- `q`: Company name search
- `route`: Visa route filter (Skilled Worker, etc.)
- `city`: City filter
- `limit`: Results limit (default: 20)

### SOC Codes Search
```
GET /api/soc-codes?q=developer&eligibility=higher&code=2136
```

**Parameters:**
- `q`: Job title search
- `eligibility`: Higher/Medium Skilled filter
- `code`: Specific SOC code
- `limit`: Results limit (default: 20)

## Advanced Search Features

### 1. Fuzzy Matching
- Searches across company names, job titles, and related terms
- Handles typos and partial matches

### 2. Multi-field Filtering
- Combine text search with category filters
- Route-based filtering for sponsors
- Eligibility-based filtering for SOC codes

### 3. Pagination
- Built-in result limiting
- Efficient queries with Firestore indexes

### 4. Real-time Updates
- Data can be updated without redeployment
- Live sponsor status changes

## Performance Optimizations

### Current Implementation
- Client-side filtering for text search (up to 1000 records)
- Firestore compound queries for exact matches
- Result caching in API responses

### Future Enhancements
- **Algolia Integration**: For advanced full-text search
- **Redis Caching**: For frequently accessed data
- **Cloud Functions**: For complex search logic

## Monitoring & Maintenance

### Firestore Usage
- Monitor read/write operations in Firebase Console
- Set up billing alerts for cost control
- Optimize queries to reduce data transfer

### Data Updates
- Sponsors list updates quarterly
- SOC codes update annually
- Automated scripts for data refresh

## Troubleshooting

### Common Issues

**"Service account key not found"**
- Ensure `serviceAccountKey.json` is in `packages/web/`
- Check file permissions

**"Quota exceeded"**
- Firestore has free tier limits
- Upgrade to Blaze plan for unlimited usage

**"Index not found"**
- Create required composite indexes in Firebase Console
- Wait 5-10 minutes for index propagation

**Slow queries**
- Add more specific indexes
- Reduce result limits
- Consider Algolia for complex searches

## Cost Estimation

**Free Tier (Spark Plan):**
- 50K reads/day
- 20K writes/day
- 1GB storage

**Blaze Plan (Pay-as-you-go):**
- $0.06 per 100K reads
- $0.18 per 100K writes
- $0.026 per GB storage

For 137K sponsors + daily searches: ~$2-5/month

## Migration Checklist

- [ ] Service account key created and saved
- [ ] Environment variables updated
- [ ] Firestore enabled in Firebase Console
- [ ] Migration script run successfully
- [ ] Composite indexes created
- [ ] API endpoints tested
- [ ] Search functionality verified

## Next Steps

After migration:
1. **Test Search**: Verify API responses
2. **UI Integration**: Update frontend to use new APIs
3. **Performance**: Monitor query performance
4. **Optimization**: Add Algolia if needed for complex searches

The Firebase approach provides much better scalability and search capabilities for your UK visa compliance features! 🚀
