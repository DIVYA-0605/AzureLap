import React from "react";
import { TextInput, Paragraph } from "@contentful/f36-components";

/**
 * SearchBar Component
 *
 * A reusable search input field with error display functionality.
 *
 * Props:
 * - searchTerm: Current value of the search input.
 * - onSearchChange: Callback function to handle changes in the search input.
 * - error: Error message to display (if any).
 */

const SearchBar = ({ searchTerm, onSearchChange, error }) => (
  <header style={{ flexShrink: 0, marginBottom: "16px" }}>
    {/* Input field for searching */}
    <TextInput
      placeholder="Search for PBI's to link"
      value={searchTerm}
      onChange={onSearchChange} // Trigger search action on typing
    />

    {/* Display error message in red if error is present */}
    {error && (
      <Paragraph style={{ color: "red", marginTop: "8px" }}>{error}</Paragraph>
    )}
  </header>
);

export default SearchBar;
