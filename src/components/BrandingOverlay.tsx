import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Image, 
  Type, 
  Move, 
  RotateCcw, 
  Trash2, 
  Plus,
  Save,
  Eye,
  EyeOff,
  Settings,
  Palette
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BrandingElement {
  id: string;
  type: 'logo' | 'text' | 'watermark';
  content: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  opacity: number;
  rotation: number;
  visible: boolean;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

interface BrandingOverlayProps {
  onBrandingChange: (elements: BrandingElement[]) => void;
  className?: string;
}

export const BrandingOverlay: React.FC<BrandingOverlayProps> = ({
  onBrandingChange,
  className = ''
}) => {
  const [brandingElements, setBrandingElements] = useState<BrandingElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [newElement, setNewElement] = useState<Partial<BrandingElement>>({
    type: 'text',
    content: '',
    position: { x: 50, y: 50 },
    size: { width: 200, height: 50 },
    opacity: 1,
    rotation: 0,
    visible: true,
    style: {
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      borderColor: '#000000',
      borderWidth: 0
    }
  });

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addElement = () => {
    if (!newElement.content?.trim() && newElement.type !== 'logo') {
      toast({
        title: "Error",
        description: "Please enter content for the element",
        variant: "destructive"
      });
      return;
    }

    const element: BrandingElement = {
      id: `branding-${Date.now()}`,
      type: newElement.type || 'text',
      content: newElement.content || '',
      position: newElement.position || { x: 50, y: 50 },
      size: newElement.size || { width: 200, height: 50 },
      opacity: newElement.opacity || 1,
      rotation: newElement.rotation || 0,
      visible: newElement.visible !== false,
      style: newElement.style || {}
    };

    const updatedElements = [...brandingElements, element];
    setBrandingElements(updatedElements);
    onBrandingChange(updatedElements);
    setSelectedElement(element.id);

    toast({
      title: "Element added",
      description: `${element.type} element created`,
    });
  };

  const updateElement = (id: string, updates: Partial<BrandingElement>) => {
    const updatedElements = brandingElements.map(element =>
      element.id === id ? { ...element, ...updates } : element
    );
    setBrandingElements(updatedElements);
    onBrandingChange(updatedElements);
  };

  const deleteElement = (id: string) => {
    const updatedElements = brandingElements.filter(element => element.id !== id);
    setBrandingElements(updatedElements);
    onBrandingChange(updatedElements);
    setSelectedElement(null);

    toast({
      title: "Element deleted",
      description: "Branding element removed",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const element: BrandingElement = {
        id: `branding-${Date.now()}`,
        type: 'logo',
        content: e.target?.result as string,
        position: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
        opacity: 1,
        rotation: 0,
        visible: true
      };

      const updatedElements = [...brandingElements, element];
      setBrandingElements(updatedElements);
      onBrandingChange(updatedElements);
      setSelectedElement(element.id);

      toast({
        title: "Logo uploaded",
        description: "Logo element added to video",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragStart = (id: string, event: React.MouseEvent) => {
    setIsDragging(true);
    setSelectedElement(id);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleDragMove = (event: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    const element = brandingElements.find(el => el.id === selectedElement);
    if (element) {
      updateElement(selectedElement, {
        position: {
          x: Math.max(0, Math.min(100, element.position.x + deltaX)),
          y: Math.max(0, Math.min(100, element.position.y + deltaY))
        }
      });
    }

    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const exportBranding = () => {
    const brandingData = {
      elements: brandingElements,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(brandingData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branding-overlay.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Branding exported",
      description: "Branding configuration downloaded",
    });
  };

  const selectedElementData = brandingElements.find(el => el.id === selectedElement);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Add New Element */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Branding Element
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="elementType">Element Type</Label>
              <select
                id="elementType"
                value={newElement.type || 'text'}
                onChange={(e) => setNewElement(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'logo' | 'text' | 'watermark' 
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="text">Text</option>
                <option value="logo">Logo</option>
                <option value="watermark">Watermark</option>
              </select>
            </div>
            <div>
              <Label htmlFor="elementContent">Content</Label>
              {newElement.type === 'logo' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              ) : (
                <Input
                  id="elementContent"
                  value={newElement.content || ''}
                  onChange={(e) => setNewElement(prev => ({ 
                    ...prev, 
                    content: e.target.value 
                  }))}
                  placeholder="Enter text content..."
                />
              )}
            </div>
          </div>

          {/* Position and Size */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="positionX">X Position (%)</Label>
              <Input
                id="positionX"
                type="number"
                value={newElement.position?.x || 50}
                onChange={(e) => setNewElement(prev => ({ 
                  ...prev, 
                  position: { ...prev.position!, x: parseFloat(e.target.value) || 50 }
                }))}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="positionY">Y Position (%)</Label>
              <Input
                id="positionY"
                type="number"
                value={newElement.position?.y || 50}
                onChange={(e) => setNewElement(prev => ({ 
                  ...prev, 
                  position: { ...prev.position!, y: parseFloat(e.target.value) || 50 }
                }))}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={newElement.size?.width || 200}
                onChange={(e) => setNewElement(prev => ({ 
                  ...prev, 
                  size: { ...prev.size!, width: parseFloat(e.target.value) || 200 }
                }))}
                min="10"
                max="500"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                value={newElement.size?.height || 50}
                onChange={(e) => setNewElement(prev => ({ 
                  ...prev, 
                  size: { ...prev.size!, height: parseFloat(e.target.value) || 50 }
                }))}
                min="10"
                max="500"
              />
            </div>
          </div>

          {/* Text Styling (for text elements) */}
          {newElement.type === 'text' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={newElement.style?.fontSize || 16}
                  onChange={(e) => setNewElement(prev => ({ 
                    ...prev, 
                    style: { ...prev.style!, fontSize: parseFloat(e.target.value) || 16 }
                  }))}
                  min="8"
                  max="72"
                />
              </div>
              <div>
                <Label htmlFor="fontColor">Font Color</Label>
                <Input
                  id="fontColor"
                  type="color"
                  value={newElement.style?.color || '#FFFFFF'}
                  onChange={(e) => setNewElement(prev => ({ 
                    ...prev, 
                    style: { ...prev.style!, color: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="backgroundColor">Background Color</Label>
                <Input
                  id="backgroundColor"
                  type="color"
                  value={newElement.style?.backgroundColor || 'transparent'}
                  onChange={(e) => setNewElement(prev => ({ 
                    ...prev, 
                    style: { ...prev.style!, backgroundColor: e.target.value }
                  }))}
                />
              </div>
            </div>
          )}

          <Button onClick={addElement} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Element
          </Button>
        </CardContent>
      </Card>

      {/* Element List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Branding Elements ({brandingElements.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={exportBranding}>
              <Save className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {brandingElements.map((element) => (
              <div
                key={element.id}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedElement === element.id
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {element.type}
                    </Badge>
                    <span className="text-sm font-medium">
                      {element.type === 'logo' ? 'Logo' : element.content}
                    </span>
                    {!element.visible && (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedElement(
                        selectedElement === element.id ? null : element.id
                      )}
                    >
                      {selectedElement === element.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteElement(element.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div>Position: {element.position.x}%, {element.position.y}%</div>
                  <div>Size: {element.size.width}×{element.size.height}px</div>
                  <div>Opacity: {Math.round(element.opacity * 100)}%</div>
                  <div>Rotation: {element.rotation}°</div>
                </div>
              </div>
            ))}

            {brandingElements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No branding elements added yet</p>
                <p className="text-sm">Add your first element above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Element Editor */}
      {selectedElementData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Selected Element
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="editOpacity">Opacity</Label>
                <Input
                  id="editOpacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedElementData.opacity}
                  onChange={(e) => updateElement(selectedElementData.id, {
                    opacity: parseFloat(e.target.value)
                  })}
                />
                <span className="text-sm text-muted-foreground">
                  {Math.round(selectedElementData.opacity * 100)}%
                </span>
              </div>
              <div>
                <Label htmlFor="editRotation">Rotation</Label>
                <Input
                  id="editRotation"
                  type="number"
                  value={selectedElementData.rotation}
                  onChange={(e) => updateElement(selectedElementData.id, {
                    rotation: parseFloat(e.target.value) || 0
                  })}
                  min="-180"
                  max="180"
                />
              </div>
              <div>
                <Label htmlFor="editWidth">Width</Label>
                <Input
                  id="editWidth"
                  type="number"
                  value={selectedElementData.size.width}
                  onChange={(e) => updateElement(selectedElementData.id, {
                    size: { ...selectedElementData.size, width: parseFloat(e.target.value) || 100 }
                  })}
                  min="10"
                  max="500"
                />
              </div>
              <div>
                <Label htmlFor="editHeight">Height</Label>
                <Input
                  id="editHeight"
                  type="number"
                  value={selectedElementData.size.height}
                  onChange={(e) => updateElement(selectedElementData.id, {
                    size: { ...selectedElementData.size, height: parseFloat(e.target.value) || 100 }
                  })}
                  min="10"
                  max="500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => updateElement(selectedElementData.id, {
                  visible: !selectedElementData.visible
                })}
              >
                {selectedElementData.visible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {selectedElementData.visible ? 'Hide' : 'Show'}
              </Button>
              <Button
                variant="outline"
                onClick={() => updateElement(selectedElementData.id, {
                  rotation: 0,
                  opacity: 1
                })}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BrandingOverlay;
