import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Filter, Grid, List, Calendar, Users, FileText, Building, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUniversalSearch } from '@/hooks/useUniversalSearch';
import { SearchResult, SearchFilters, UserRole } from '@/types/search';

interface UniversalSearchProps {
  userRole: UserRole;
  className?: string;
}

export function UniversalSearch({ userRole, className = '' }: UniversalSearchProps) {
  const userPermissions = {
    role: userRole,
    department: 'Computer Science & Engineering',
    branch: 'CSE',
    canViewUsers: true,
    canViewAllDepartments: userRole === 'principal' || userRole === 'registrar'
  };
  
  const {
    searchState,
    search,
    updateQuery,
    updateFilters,
    clearSearch,
    resetFilters,
    toggleViewMode,
    loadRecentSearch,
    activeFilterCount
  } = useUniversalSearch(userPermissions);
  
  const {
    query: searchTerm,
    filters,
    results,
    isLoading: loading,
    error,
    viewMode,
    recentSearches
  } = searchState;

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'bg-yellow-500 text-white';
      case 'pending':
        return 'bg-blue-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      case 'approved':
      case 'archived':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle search input
  const handleSearchChange = (value: string) => {
    updateQuery(value);
    setShowSuggestions(value.length > 0);
  };

  // Handle search submission
  const handleSearch = () => {
    if (searchTerm.trim()) {
      search();
      setShowSuggestions(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    clearSearch();
    setShowSuggestions(false);
  };

  // Filter active count
  const activeFiltersCount = useMemo(() => {
    if (!filters) return 0;
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.departments.length > 0) count++;
    if (filters.roles.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  }, [filters]);

  // Highlight search terms in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  // Render search suggestions
  const renderSuggestions = () => {
    if (!showSuggestions || !searchTerm) return null;

    const suggestions = [
      'Letters from Principal',
      'Pending approvals',
      'CSE Department reports',
      'Emergency notifications',
      'Meeting schedules'
    ].filter(suggestion => 
      suggestion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
        <div className="p-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
              onClick={() => {
                setSearchTerm(suggestion);
                setShowSuggestions(false);
                performSearch();
              }}
            >
              <span dangerouslySetInnerHTML={{ 
                __html: highlightText(suggestion, searchTerm) 
              }} />
            </button>
          ))}
          {recentSearches.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-xs text-gray-500 font-medium">Recent Searches</span>
                <button
                  onClick={() => {
                    // Clear recent searches functionality would be implemented here
                    setShowSuggestions(false);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              {recentSearches.map((recent, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center justify-between"
                  onClick={() => {
                    setSearchTerm(recent);
                    setShowSuggestions(false);
                    performSearch();
                  }}
                >
                  <span>{recent.query}</span>
                  <Clock className="w-3 h-3 text-gray-400" />
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  // Render filter chips
  const renderActiveFilters = () => {
    if (!filters) return null;
    
    const activeFilters = [];
    
    filters.status.forEach(status => {
      activeFilters.push({ type: 'status', value: status, label: status });
    });
    
    filters.departments.forEach(dept => {
      activeFilters.push({ type: 'departments', value: dept, label: dept });
    });
    
    filters.roles.forEach(role => {
      activeFilters.push({ type: 'roles', value: role, label: role });
    });
    
    filters.priority.forEach(priority => {
      activeFilters.push({ type: 'priority', value: priority, label: priority });
    });

    if (activeFilters.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {activeFilters.map((filter, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            {filter.label}
            <button
              onClick={() => {
                const newFilters = { ...filters };
                newFilters[filter.type as keyof SearchFilters] = 
                  (newFilters[filter.type as keyof SearchFilters] as string[])
                    .filter(item => item !== filter.value);
                setFilters(newFilters);
              }}
              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-xs"
        >
          Clear all
        </Button>
      </div>
    );
  };

  // Render search results
  const renderResults = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => search()}>Try Again</Button>
          </CardContent>
        </Card>
      );
    }

    if (results.length === 0 && searchTerm) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => search('letters')}>
                Search Letters
              </Button>
              <Button variant="outline" size="sm" onClick={() => search('reports')}>
                Search Reports
              </Button>
              <Button variant="outline" size="sm" onClick={() => search('meetings')}>
                Search Meetings
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (results.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Universal Search</h3>
            <p className="text-gray-600 mb-4">
              Search across letters, reports, users, departments, and more
            </p>
            {recentSearches.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Recent Searches</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recentSearches.map((recent, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm(recent);
                        performSearch();
                      }}
                    >
                      {recent.query}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {results.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 
                  className="font-semibold text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightText(result.title, searchTerm) 
                  }}
                />
                <Badge className={getStatusColor(result.status)}>
                  {result.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{result.type}</Badge>
                <Badge variant="outline">{result.department}</Badge>
                {result.priority && (
                  <Badge className={getPriorityColor(result.priority)}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mb-3">
                <div>Created: {new Date(result.createdDate).toLocaleDateString()}</div>
                <div>By: {result.submittedBy}</div>
                {result.modifiedDate && (
                  <div>Modified: {new Date(result.modifiedDate).toLocaleDateString()}</div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  View
                </Button>
                {result.canEdit && (
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                )}
                {result.canApprove && (
                  <>
                    <Button size="sm" variant="outline" className="text-green-600">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search letters, reports, users, departments..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-10 rounded-full shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {renderSuggestions()}
      </div>

      {/* Filters and View Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-blue-500 text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Search Filters</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full mt-4">
                <div className="space-y-4 pb-4">
                  {/* Mobile filters content would go here */}
                  <div className="text-center text-gray-500 py-8">
                    Filter options will be implemented here
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-2">
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cse">CSE</SelectItem>
                <SelectItem value="ece">ECE</SelectItem>
                <SelectItem value="eee">EEE</SelectItem>
                <SelectItem value="mech">Mechanical</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>


      </div>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Results */}
      {renderResults()}
    </div>
  );
}