import CitySearch from "@/components/CitySearch";

interface SearchHeaderProps {
  onSearch: (city: string) => void;
}

const SearchHeader = ({ onSearch }: SearchHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-center mb-8">Find a Pharmacy Near You</h1>
      <div className="max-w-xl mx-auto">
        <CitySearch onSearch={onSearch} />
      </div>
    </div>
  );
};

export default SearchHeader;