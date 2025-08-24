/**
 * Unit Test Template
 * 
 * Usage: Copy this template when creating unit tests for components or functions
 * Location: Place in __tests__/ directory next to the source file
 * Naming: [ComponentName].test.tsx or [functionName].test.ts
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// OR for Jest:
// import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Import the component/function to test
import { ComponentName } from '../ComponentName';
// import { functionName } from '../functionName';

// Mock external dependencies
vi.mock('../services/api', () => ({
  fetchData: vi.fn(),
}));

describe('ComponentName', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Setup test data
    // Reset state
  });

  // Cleanup after each test
  afterEach(() => {
    // Clean up any side effects
    // Reset global state
  });

  // Group related tests
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ComponentName />);
      
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('should render with custom props', () => {
      render(<ComponentName title="Custom Title" />);
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should not render when hidden prop is true', () => {
      const { container } = render(<ComponentName hidden={true} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<ComponentName onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle form submission', async () => {
      const handleSubmit = vi.fn();
      render(<ComponentName onSubmit={handleSubmit} />);
      
      const input = screen.getByRole('textbox');
      const submitButton = screen.getByText('Submit');
      
      fireEvent.change(input, { target: { value: 'test value' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({ value: 'test value' });
      });
    });

    it('should disable submit button while loading', () => {
      render(<ComponentName isLoading={true} />);
      
      const submitButton = screen.getByText('Submit');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('State Management', () => {
    it('should update state on input change', () => {
      render(<ComponentName />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      expect(input).toHaveValue('new value');
    });

    it('should reset state on clear button click', () => {
      render(<ComponentName />);
      
      const input = screen.getByRole('textbox');
      const clearButton = screen.getByText('Clear');
      
      fireEvent.change(input, { target: { value: 'some value' } });
      expect(input).toHaveValue('some value');
      
      fireEvent.click(clearButton);
      expect(input).toHaveValue('');
    });
  });

  describe('API Integration', () => {
    it('should fetch data on mount', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetchData = vi.fn().mockResolvedValue(mockData);
      
      render(<ComponentName fetchData={fetchData} />);
      
      await waitFor(() => {
        expect(fetchData).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Test')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      const fetchData = vi.fn().mockRejectedValue(new Error('API Error'));
      
      render(<ComponentName fetchData={fetchData} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error loading data')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching', () => {
      const fetchData = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<ComponentName fetchData={fetchData} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error for invalid email', () => {
      render(<ComponentName />);
      
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('should show error for required fields', () => {
      render(<ComponentName />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should not show errors for valid input', () => {
      render(<ComponentName />);
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      render(<ComponentName items={[]} />);
      
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should handle null/undefined props gracefully', () => {
      render(<ComponentName data={null} />);
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should handle very long text with ellipsis', () => {
      const longText = 'a'.repeat(1000);
      render(<ComponentName text={longText} />);
      
      const textElement = screen.getByTestId('text-display');
      expect(textElement).toHaveStyle({ textOverflow: 'ellipsis' });
    });
  });

  describe('Performance', () => {
    it('should render large lists efficiently', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));
      
      const startTime = performance.now();
      render(<ComponentName items={items} />);
      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(100); // Should render in < 100ms
      expect(screen.getAllByRole('listitem')).toHaveLength(1000);
    });

    it('should debounce search input', async () => {
      const handleSearch = vi.fn();
      render(<ComponentName onSearch={handleSearch} />);
      
      const searchInput = screen.getByRole('searchbox');
      
      // Type quickly
      fireEvent.change(searchInput, { target: { value: 't' } });
      fireEvent.change(searchInput, { target: { value: 'te' } });
      fireEvent.change(searchInput, { target: { value: 'tes' } });
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // Should only call once after debounce
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledTimes(1);
        expect(handleSearch).toHaveBeenCalledWith('test');
      }, { timeout: 500 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ComponentName />);
      
      expect(screen.getByRole('button')).toHaveAttribute('aria-label');
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', () => {
      render(<ComponentName />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
      
      fireEvent.keyDown(button, { key: 'Enter' });
      // Verify Enter key triggers click
    });

    it('should announce changes to screen readers', () => {
      render(<ComponentName />);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
});

/**
 * Function Test Example
 */
describe('functionName', () => {
  it('should return expected result for valid input', () => {
    const result = functionName('input');
    expect(result).toBe('expected output');
  });

  it('should throw error for invalid input', () => {
    expect(() => functionName(null)).toThrow('Input cannot be null');
  });

  it('should handle edge cases', () => {
    expect(functionName('')).toBe('');
    expect(functionName([])).toEqual([]);
    expect(functionName(0)).toBe(0);
  });

  it('should be pure function (no side effects)', () => {
    const input = { value: 'test' };
    const result = functionName(input);
    
    expect(input).toEqual({ value: 'test' }); // Input unchanged
    expect(result).not.toBe(input); // Returns new object
  });
});