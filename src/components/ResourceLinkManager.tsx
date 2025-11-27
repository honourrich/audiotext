import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { 
  Link, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit, 
  Search,
  BookOpen,
  Globe,
  Users,
  Wrench,
  Check,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { ResourceItem } from '../lib/personalization';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/use-toast';

interface ResourceLinkManagerProps {
  extractedResources?: ResourceItem[];
  onResourcesUpdate?: (resources: ResourceItem[]) => void;
}

const resourceTypeIcons = {
  book: BookOpen,
  website: Globe,
  tool: Wrench,
  organization: Users,
  person: Users,
  default: Link
};

const resourceCategories = [
  'AI Tools',
  'Productivity',
  'Communication',
  'Books',
  'Organizations',
  'News',
  'Tools',
  'Education',
  'Business',
  'Technology'
];

export default function ResourceLinkManager({ 
  extractedResources = [], 
  onResourcesUpdate 
}: ResourceLinkManagerProps) {
  const { toast } = useToast();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // New resource form state
  const [newResource, setNewResource] = useState({
    resource_name: '',
    resource_type: 'tool',
    canonical_url: '',
    alternative_names: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resource_database')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast({
        title: "Failed to load resources",
        description: "Could not load the resource database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async () => {
    if (!newResource.resource_name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a resource name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const alternativeNames = newResource.alternative_names
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      const { data, error } = await supabase
        .from('resource_database')
        .insert({
          resource_name: newResource.resource_name,
          resource_type: newResource.resource_type,
          canonical_url: newResource.canonical_url || null,
          alternative_names: alternativeNames,
          category: newResource.category || null,
          description: newResource.description || null,
          auto_link_enabled: true,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setResources(prev => [data, ...prev]);
      setNewResource({
        resource_name: '',
        resource_type: 'tool',
        canonical_url: '',
        alternative_names: '',
        category: '',
        description: ''
      });
      setShowAddForm(false);

      toast({
        title: "Resource added",
        description: "New resource has been added to the database.",
      });
    } catch (error) {
      console.error('Failed to add resource:', error);
      toast({
        title: "Failed to add resource",
        description: "Could not add the resource to the database.",
        variant: "destructive",
      });
    }
  };

  const toggleResourceStatus = async (resourceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('resource_database')
        .update({ auto_link_enabled: !currentStatus })
        .eq('id', resourceId);

      if (error) throw error;

      setResources(prev => 
        prev.map(resource => 
          resource.id === resourceId 
            ? { ...resource, auto_link_enabled: !currentStatus }
            : resource
        )
      );

      toast({
        title: !currentStatus ? "Resource enabled" : "Resource disabled",
        description: `Auto-linking ${!currentStatus ? 'enabled' : 'disabled'} for this resource.`,
      });
    } catch (error) {
      console.error('Failed to update resource:', error);
      toast({
        title: "Update failed",
        description: "Could not update the resource status.",
        variant: "destructive",
      });
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.alternative_names.some(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getResourceIcon = (type: string) => {
    const IconComponent = resourceTypeIcons[type as keyof typeof resourceTypeIcons] || resourceTypeIcons.default;
    return <IconComponent className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading resources...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="w-5 h-5" />
            <span>Resource Link Manager</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Extracted Resources Section */}
          {extractedResources.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-green-700 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Detected in Current Content</span>
              </h3>
              <div className="grid gap-2">
                {extractedResources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getResourceIcon(resource.resource_type)}
                      <div>
                        <div className="font-medium">{resource.resource_name}</div>
                        <div className="text-sm text-gray-600">{resource.category}</div>
                      </div>
                    </div>
                    {resource.canonical_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={resource.canonical_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Visit
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and Add */}
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>

          {/* Add Resource Form */}
          {showAddForm && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Resource Name *</label>
                    <Input
                      value={newResource.resource_name}
                      onChange={(e) => setNewResource(prev => ({ ...prev, resource_name: e.target.value }))}
                      placeholder="e.g., ChatGPT, Notion, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={newResource.resource_type}
                      onValueChange={(value) => setNewResource(prev => ({ ...prev, resource_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tool">Tool</SelectItem>
                        <SelectItem value="book">Book</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="person">Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">URL</label>
                    <Input
                      value={newResource.canonical_url}
                      onChange={(e) => setNewResource(prev => ({ ...prev, canonical_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={newResource.category}
                      onValueChange={(value) => setNewResource(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Alternative Names</label>
                  <Input
                    value={newResource.alternative_names}
                    onChange={(e) => setNewResource(prev => ({ ...prev, alternative_names: e.target.value }))}
                    placeholder="Chat GPT, OpenAI ChatGPT, GPT (comma-separated)"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newResource.description}
                    onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the resource..."
                    rows={2}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleAddResource}>Add Resource</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resources List */}
          <div className="space-y-3">
            <h3 className="font-medium">Resource Database ({filteredResources.length})</h3>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {getResourceIcon(resource.resource_type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{resource.resource_name}</span>
                        {resource.category && (
                          <Badge variant="secondary" className="text-xs">
                            {resource.category}
                          </Badge>
                        )}
                      </div>
                      {resource.alternative_names.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Also: {resource.alternative_names.slice(0, 3).join(', ')}
                          {resource.alternative_names.length > 3 && '...'}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Used {resource.usage_count} times
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {resource.canonical_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={resource.canonical_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                    
                    <Button
                      variant={resource.auto_link_enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleResourceStatus(resource.id, resource.auto_link_enabled)}
                    >
                      {resource.auto_link_enabled ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Disabled
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}