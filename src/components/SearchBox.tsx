interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search",
  ariaLabel = placeholder,
  className = ""
}: SearchBoxProps) {
  const classes = ["search-field", className].filter(Boolean).join(" ");

  return (
    <label className={classes}>
      <span className="material-symbols-rounded" aria-hidden="true">search</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
  );
}
