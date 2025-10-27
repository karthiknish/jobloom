# HireAll Test Suite

This directory contains comprehensive end-to-end tests for the HireAll web application and Chrome extension.

## Test Structure

### Web Application Tests

- **`homepage.spec.ts`** - Tests for the homepage functionality and navigation
- **`auth.spec.ts`** - Authentication flow tests (sign in, sign up, password reset)
- **`dashboard.spec.ts`** - Dashboard functionality, job management, and analytics
- **`cv-evaluator.spec.ts`** - CV upload, analysis, and ATS scoring
- **`settings.spec.ts`** - User settings, preferences, and account management
- **`api.spec.ts`** - API endpoint testing
- **`jobs.spec.ts`** - Job search and filtering
- **`portfolio-builder.spec.ts`** - Portfolio creation and customization
- **`resume-builder.spec.ts`** - Resume building and cover letter generation
- **`interview-prep.spec.ts`** - Interview preparation features
- **`chatbot.spec.ts`** - AI chatbot functionality
- **`mobile-navigation.spec.ts`** - Mobile responsiveness and navigation

### Extension Tests (Planned)

- **`popup.spec.ts`** - Extension popup functionality
- **`content-script.spec.ts`** - Content script job detection and highlighting
- **`background.spec.ts`** - Background script and API communication
- **`job-tracker.spec.ts`** - Job tracking and sponsorship checking

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Running All Tests

```bash
npm run test
```

### Running Specific Test Categories

Using the test runner:

```bash
# Run all web tests
node tests/test-runner.js all web

# Run specific category
node tests/test-runner.js cv-evaluator
node tests/test-runner.js auth
node tests/test-runner.js dashboard

# List all available categories
node tests/test-runner.js list
```

Using Playwright directly:

```bash
# Run specific test file
npx playwright test tests/cv-evaluator.spec.ts

# Run tests with specific browser
npx playwright test tests/auth.spec.ts --project=chromium
npx playwright test tests/dashboard.spec.ts --project=webkit

# Run tests in headed mode (visible browser)
npx playwright test tests/settings.spec.ts --headed

# Run tests with UI
npx playwright test tests/api.spec.ts --ui
```

### Running Tests in Different Modes

```bash
# Debug mode
npx playwright test tests/cv-evaluator.spec.ts --debug

# Generate code
npx playwright codegen http://localhost:3000

# Run with specific reporters
npx playwright test tests/dashboard.spec.ts --reporter=html
npx playwright test tests/auth.spec.ts --reporter=line
```

## Test Configuration

The test configuration is defined in `playwright.config.ts`:

- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Timeout**: 120 seconds for web server
- **Base URL**: http://localhost:3000
- **Retry on CI**: 2 retries
- **Reporters**: HTML reporter with screenshots on failure

## Test Data and Mocking

### Authentication Mock

Tests use mock authentication to avoid requiring real credentials:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
});
```

### API Mocking

Tests can mock API responses:

```typescript
await page.route('**/api/app/jobs', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ jobs: mockJobs })
  });
});
```

### File Upload Mock

For file upload tests:

```typescript
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles('test-cv.pdf');
```

## Coverage Areas

### Authentication & Authorization
- Sign in / Sign up flows
- Password reset
- Session management
- Protected routes
- OAuth integration

### Core Features
- Job searching and filtering
- CV analysis and ATS scoring
- Dashboard and analytics
- Portfolio building
- Interview preparation
- Settings management

### API Endpoints
- Authentication endpoints
- Jobs CRUD operations
- CV analysis
- Sponsorship checking
- Settings management
- Rate limiting
- Error handling

### User Experience
- Responsive design
- Loading states
- Error handling
- Form validation
- Navigation
- Accessibility

### Performance & Reliability
- Network error handling
- Loading states
- Empty states
- Edge cases
- Browser compatibility

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Use beforeEach for common setup

### Selectors
- Prefer semantic selectors (role, text)
- Use data-testid for testing-specific elements
- Avoid fragile CSS selectors

### Assertions
- Use specific assertions
- Check for element visibility and text
- Verify URL changes
- Assert error states

### Error Handling
- Test both happy path and error cases
- Mock network failures
- Test validation errors
- Check loading states

### Cleanup
- Use proper test isolation
- Clean up after each test
- Avoid test dependencies

## Debugging

### View Test Results
```bash
npx playwright show-report
```

### Debug Individual Tests
```bash
npx playwright test tests/cv-evaluator.spec.ts --debug
```

### Generate Test Code
```bash
npx playwright codegen http://localhost:3000/cv-evaluator
```

## Troubleshooting

### Common Issues

1. **Browser not found**: Install Playwright browsers
   ```bash
   npx playwright install
   ```

2. **Tests timeout**: Increase timeout in config or use `test.setTimeout()`

3. **Flaky tests**: Add retries or use proper waits

4. **Network issues**: Mock API responses in tests

5. **Element not found**: Use proper waits and selectors

### CI/CD Integration

Tests are configured to run on CI with:
- 2 retries on failure
- Headless execution
- HTML reporter
- Screenshot capture on failure

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Test both positive and negative cases
4. Mock external dependencies
5. Update this README if adding new test categories

## Extension Testing

Extension tests require special setup:

1. Build the extension: `npm run build:extension`
2. Load extension in test browser
3. Test popup, content scripts, and background scripts
4. Mock Chrome APIs as needed

Extension tests are planned but not yet fully implemented.
