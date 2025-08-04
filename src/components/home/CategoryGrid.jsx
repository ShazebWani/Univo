import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Laptop, BookOpen, PenSquare, Shirt, Sofa, Calendar } from "lucide-react";

const categories = [
  { name: "Electronics", icon: Laptop, value: "electronics" },
  { name: "Textbooks", icon: BookOpen, value: "textbooks" },
  { name: "Supplies", icon: PenSquare, value: "supplies" },
  { name: "Clothing", icon: Shirt, value: "clothing" },
  { name: "Furniture", icon: Sofa, value: "furniture" },
  { name: "Events", icon: Calendar, value: "events" },
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {categories.map((category) => (
        <Link 
          key={category.name} 
          to={createPageUrl(`Explore?category=${category.value}`)}
          className="bg-card p-4 flex flex-col items-center justify-center rounded-2xl text-center shadow-md hover:shadow-lg transition-shadow duration-300"
          style={{ aspectRatio: '1.2/1' }}
        >
          <category.icon className="w-5 h-5 mb-2 text-primary" />
          <span className="text-xs font-medium text-foreground leading-tight">{category.name}</span>
        </Link>
      ))}
    </div>
  );
}