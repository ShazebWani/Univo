
import React, { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SearchBar({ onSearch, onFilter, initialCategory = "all" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "textbooks", label: "Textbooks" },
    { value: "electronics", label: "Electronics" },
    { value: "clothing", label: "Clothing" },
    { value: "furniture", label: "Furniture" },
    { value: "supplies", label: "Supplies" },
    { value: "events", label: "Events" }, // Added "Events" category
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    onFilter(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative neumorphic-inset">
          <Input
            placeholder="Search for items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="border-0 bg-transparent h-10 pl-4 pr-10 focus:ring-0 focus:border-0"
          />
          <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <Button
            onClick={handleSearch}
            className="neumorphic-button bg-primary text-white hover:bg-primary/90 h-10 px-4"
        >
            Search
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="neumorphic-inset border-0 bg-transparent">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="neumorphic-card border-0">
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
