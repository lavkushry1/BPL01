# Effective Prompting Strategies for Eventia Development

## Project-Specific Prompt Patterns

### 1. Feature Implementation Requests

**Basic Pattern:**
```
I need to implement [specific feature] for Eventia. This feature should [describe functionality] and integrate with [existing system components].

Context:
- Feature purpose: [business goal]
- Related components: [list relevant files/systems]
- Technical constraints: [any limitations to consider]

Please provide:
- Implementation steps
- Code examples for key components
- Integration points with existing architecture
```

**Example:**
```
I need to implement ticket transfer functionality for Eventia. This feature should allow users to transfer purchased tickets to other registered users and integrate with our existing booking system.

Context:
- Feature purpose: Increase ticket flexibility and user satisfaction
- Related components: booking.controller.ts, BookingService, TicketService
- Technical constraints: Must maintain ticket validation integrity

Please provide:
- Implementation steps
- Code examples for the transfer API endpoint
- Integration points with existing booking architecture
```

### 2. Debugging Assistance

**Basic Pattern:**
```
I'm experiencing an issue with [component/feature] in Eventia. When [describe actions], I expect [expected behavior] but instead [actual behavior] happens.

Code reference:
[Include relevant code snippet]

Error details:
[Include error message/stack trace if available]

What I've tried:
[List debugging steps already taken]

Please help me identify the root cause and suggest a solution.
```

**Example:**
```
I'm experiencing an issue with the UPI payment verification in Eventia. When users submit a UTR number, I expect the payment status to update to "verifying" but instead it remains "pending" with no errors in the console.

Code reference:
```ts
// PaymentController.updateUtrNumber
async updateUtrNumber(req, res) {
  const { bookingId, utrNumber } = req.body;
  try {
    const result = await paymentService.updateUtrNumber(bookingId, utrNumber);
    return res.json({ success: true, result });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}
```

Error details:
No visible errors, but payment status doesn't change.

What I've tried:
- Verified UTR number is received in the controller
- Checked database connections
- Manually updated status in database to confirm UI updates correctly

Please help me identify the root cause and suggest a solution.
```

### 3. Architecture & Design Decisions

**Basic Pattern:**
```
I'm designing [feature/component] for Eventia and considering [approach A vs approach B].

Requirements:
- [List key requirements]

Approach A:
- [Describe first approach]
- Pros: [List advantages]
- Cons: [List disadvantages]

Approach B:
- [Describe second approach]
- Pros: [List advantages]
- Cons: [List disadvantages]

Which approach would better align with Eventia's architecture, considering [specific concerns]?
```

**Example:**
```
I'm designing the dynamic pricing engine for Eventia and considering a rule-based approach vs. a simple time-based algorithm.

Requirements:
- Must adjust prices based on demand and time-to-event
- Should support admin-configurable rules
- Needs to be performant for concurrent users

Rule-based Approach:
- Would use a flexible rule engine with condition evaluation
- Pros: Highly flexible, admin-configurable
- Cons: More complex, potential performance impact

Time-based Algorithm:
- Simple function of days-to-event with fixed percentage changes
- Pros: Simpler implementation, better performance
- Cons: Less flexible, limited configurability

Which approach would better align with Eventia's architecture, considering our mobile-first optimization requirements and admin usability needs?
```

### 4. Code Review Requests

**Basic Pattern:**
```
Please review this [component/implementation] for Eventia:

```ts
[Include code to review]
```

I'd like feedback on:
- Code quality and best practices
- Performance considerations
- Security implications
- Mobile-first optimizations
- Potential edge cases I've missed
```

**Example:**
```
Please review this SeatMap component implementation for Eventia:

```tsx
import React, { useState, useEffect } from 'react';
// ... component code ...
```

I'd like feedback on:
- Code quality and React best practices
- Performance for rendering large seat maps
- Mobile touch optimization
- Accessibility considerations
- Potential edge cases I've missed with seat locking
```

### 5. Documentation Generation

**Basic Pattern:**
```
Based on this implementation of [feature/component] for Eventia, please help me generate comprehensive documentation:

```ts
[Include code to document]
```

Please include:
- High-level overview
- API/component interface details
- Usage examples
- Edge cases and limitations
- Mobile considerations
```

**Example:**
```
Based on this implementation of the UPI payment flow for Eventia, please help me generate comprehensive documentation:

```ts
// UPI payment service implementation
// ... code ...
```

Please include:
- High-level overview of the UPI payment process
- API endpoints and request/response formats
- Integration examples for mobile clients
- Security considerations
- Troubleshooting common issues
```

## General Prompt Improvement Tips

1. **Be specific about the phase of your project**: Reference which part of your implementation plan you're working on.

2. **Include the validation criteria**: Mention the frontend, backend, and database validation expectations.

3. **Reference architecture constraints**: Remind about the mobile-first requirements and RTL support when relevant.

4. **Clarify the feature context**: Explain how the feature fits into the overall user journey.

5. **Specify output format preferences**: Request code examples in a specific style matching your existing codebase.

6. **Include relevant error messages and logs**: When debugging, more context helps AI understand the issue better.

7. **Reference specific files from your project**: This helps AI understand the context and code organization.

8. **Mention dependencies and constraints**: Specify which libraries or APIs you're using.

9. **Set clear expectations for the response**: Do you want step-by-step instructions, code snippets, or architectural advice?

10. **Break down complex requests**: For large features, focus on one aspect at a time.
