import React, { useState } from "react";
import { Search, X } from "lucide-react";

function SearchBar({ onSearch, onClear, searching }) {
  const [value, setValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (value.trim().length < 2) return;
    onSearch(value.trim());
  };

  return (
    <form className="mail-search" onSubmit={handleSubmit}>
      <Search size={16} />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search email"
        minLength={2}
      />
      {value ? (
        <button
          type="button"
          className="mail-button mail-button--ghost"
          onClick={() => {
            setValue("");
            onClear();
          }}
        >
          <X size={14} />
        </button>
      ) : null}
      <button type="submit" className="mail-button mail-button--ghost" disabled={searching || value.trim().length < 2}>
        {searching ? "Searching..." : "Search"}
      </button>
    </form>
  );
}

export default SearchBar;
