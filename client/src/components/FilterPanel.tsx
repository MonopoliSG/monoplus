import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Filter, X } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

interface FilterPanelProps {
  cities?: string[];
  branches?: string[];
  professions?: string[];
  onFilterChange?: (filters: FilterState) => void;
}

interface FilterState {
  cities: string[];
  branches: string[];
  professions: string[];
  kvkk: string;
  ageRange: string;
}

export function FilterPanel({ cities = [], branches = [], professions = [], onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    cities: [],
    branches: [],
    professions: [],
    kvkk: "all",
    ageRange: "all",
  });

  const [openSections, setOpenSections] = useState({
    city: true,
    branch: true,
    profession: false,
    kvkk: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCityToggle = (city: string) => {
    const newCities = filters.cities.includes(city)
      ? filters.cities.filter((c) => c !== city)
      : [...filters.cities, city];
    const newFilters = { ...filters, cities: newCities };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleBranchToggle = (branch: string) => {
    const newBranches = filters.branches.includes(branch)
      ? filters.branches.filter((b) => b !== branch)
      : [...filters.branches, branch];
    const newFilters = { ...filters, branches: newBranches };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleKvkkChange = (value: string) => {
    const newFilters = { ...filters, kvkk: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      cities: [],
      branches: [],
      professions: [],
      kvkk: "all",
      ageRange: "all",
    };
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  const hasActiveFilters =
    filters.cities.length > 0 ||
    filters.branches.length > 0 ||
    filters.professions.length > 0 ||
    filters.kvkk !== "all" ||
    filters.ageRange !== "all";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs"
              data-testid="button-clear-filters"
            >
              <X className="h-3 w-3 mr-1" />
              Temizle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Collapsible open={openSections.city} onOpenChange={() => toggleSection("city")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
            Şehir
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.city ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {cities.slice(0, 8).map((city) => (
              <div key={city} className="flex items-center gap-2">
                <Checkbox
                  id={`city-${city}`}
                  checked={filters.cities.includes(city)}
                  onCheckedChange={() => handleCityToggle(city)}
                  data-testid={`checkbox-city-${city}`}
                />
                <Label htmlFor={`city-${city}`} className="text-sm font-normal cursor-pointer">
                  {city}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={openSections.branch} onOpenChange={() => toggleSection("branch")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
            Branş
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.branch ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {branches.slice(0, 6).map((branch) => (
              <div key={branch} className="flex items-center gap-2">
                <Checkbox
                  id={`branch-${branch}`}
                  checked={filters.branches.includes(branch)}
                  onCheckedChange={() => handleBranchToggle(branch)}
                  data-testid={`checkbox-branch-${branch}`}
                />
                <Label htmlFor={`branch-${branch}`} className="text-sm font-normal cursor-pointer">
                  {branch}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2">
          <Label className="text-sm font-medium">KVKK Durumu</Label>
          <Select value={filters.kvkk} onValueChange={handleKvkkChange}>
            <SelectTrigger data-testid="select-kvkk">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="yes">Onaylı</SelectItem>
              <SelectItem value="no">Onaysız</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
