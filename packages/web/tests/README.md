# HireAll Web App Tests

This directory contains Playwright tests for the HireAll web application. These tests verify the functionality of key features including navigation, job search, interview preparation, portfolio building, and chatbot interactions.

## Test Structure

### Test Files

- **`homepage.spec.ts`** - Tests for the main homepage including navigation and key CTAs
- **`jobs.spec.ts`** - Tests for job search functionality, filtering, and job listings
- **`interview-prep.spec.ts`** - Tests for interview preparation features and content
- **`portfolio-builder.spec.ts`** - Tests for portfolio builder marketing and basic functionality
- **`chatbot.spec.ts`** - Tests for chatbot UI and basic interactions
- **`mobile-navigation.spec.ts`** - Tests for mobile navigation and responsive design

### Configuration

- **`playwright.config.ts`** - Playwright configuration with multiple browsers and devices
- **`README.md`** - This documentation file

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

3. Start the development server:
   ```bash
   npm run dev
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with UI mode (visual test runner)
npm run test:ui

# Run tests in headed mode (see browser windows)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run specific test file
npx playwright test homepage.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Generate test report
npx playwright show-report
```

## Test Coverage

### Homepage Tests
- ✅ Page loading and basic elements
- ✅ Navigation between main sections
- ✅ Call-to-action buttons

### Jobs Page Tests
- ✅ Job listings display
- ✅ Search and filtering functionality
- ✅ Job card information display
- ✅ Loading states during filtering

### Interview Prep Tests
- ✅ Tab navigation and content switching
- ✅ Question category selection
- ✅ Interview tips display
- ✅ Mock interview information
- ✅ Progress tracking display

### Portfolio Builder Tests
- ✅ Marketing page content
- ✅ Feature descriptions
- ✅ Call-to-action buttons
- ✅ Navigation to builder (requires auth)

### Chatbot Tests
- ✅ Chatbot button visibility
- ✅ Chat window opening/closing
- ✅ Suggested questions display
- ✅ Input field functionality
- ✅ Chat history and controls
- ✅ Branding and messaging

### Mobile Navigation Tests
- ✅ Bottom navigation on mobile devices
- ✅ Responsive design adaptation
- ✅ Mobile-specific UI elements

## MCP Integration

These tests are designed to work with the Playwright MCP (Model Context Protocol) server configured in `~/.cursor/mcp.json`. The MCP server allows Cursor to run Playwright tests directly from the editor.

### MCP Configuration

The tests use the following MCP server configuration:
```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest"]
  }
}
```

## Test Best Practices

### Page Object Model
Tests use semantic selectors and ARIA roles for better maintainability:
- `page.getByRole('button', { name: /Search/i })`
- `page.getByPlaceholder(/Job title/i)`
- `page.getByText(/Welcome/i)`

### Data Attributes
Consider adding `data-testid` attributes to components for more reliable test selectors:
```tsx
<button data-testid="chatbot-button">Chat</button>
```

### Wait Strategies
Tests use appropriate waiting strategies:
- `await expect(element).toBeVisible()` for visibility checks
- `await page.waitForTimeout(500)` for UI transitions
- `await page.waitForURL()` for navigation

### Responsive Testing
Tests include mobile-specific scenarios using Playwright's device emulation and viewport settings.

## Continuous Integration

For CI/CD integration, add the following to your workflow:

```yaml
- name: Run Playwright tests
  run: |
    npm ci
    npx playwright install
    npm run build
    npm test
```

## Troubleshooting

### Common Issues

1. **Tests failing due to timing**: Add `await page.waitForTimeout(1000)` for slow operations
2. **Element not found**: Check if elements require authentication or specific states
3. **Flaky tests**: Use more specific selectors or add retry logic
4. **Mobile tests failing**: Ensure proper viewport settings and device emulation

### Debugging Tips

1. Use `npm run test:debug` to step through tests
2. Add `await page.pause()` to inspect the page state
3. Use `console.log(await element.textContent())` for debugging
4. Check the Playwright test report for screenshots and traces

## Contributing

When adding new tests:

1. Follow the existing naming convention (`*.spec.ts`)
2. Use descriptive test names and group related tests
3. Add appropriate assertions and error handling
4. Test both success and failure scenarios
5. Include mobile/responsive test cases when applicable

## Performance Testing

For performance testing, consider adding:
- Lighthouse CI integration
- Core Web Vitals monitoring
- Load testing with multiple concurrent users
- Bundle size analysis

---

**Note**: Some tests may be skipped if they require authentication or specific user states. These can be enabled once proper test authentication is set up.
