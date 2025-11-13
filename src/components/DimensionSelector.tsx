import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Monitor, 
  Smartphone, 
  Square, 
  Tv,
  Check,
  Settings,
  Info
} from 'lucide-react';
import { VideoDimension, VIDEO_DIMENSIONS, getDimensionsByPlatform } from '@/lib/videoDimensions';

interface DimensionSelectorProps {
  selectedDimension: VideoDimension | null;
  onDimensionSelect: (dimension: VideoDimension | null) => void;
  className?: string;
}

export const DimensionSelector: React.FC<DimensionSelectorProps> = ({
  selectedDimension,
  onDimensionSelect,
  className = ''
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [customWidth, setCustomWidth] = useState<number>(1920);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [showCustom, setShowCustom] = useState(false);

  const platforms = ['all', 'TikTok', 'Instagram', 'YouTube', 'Facebook', 'Twitter', 'LinkedIn'];
  
  const filteredDimensions = selectedPlatform === 'all' 
    ? VIDEO_DIMENSIONS 
    : getDimensionsByPlatform(selectedPlatform);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'TikTok':
        return <Smartphone className="w-4 h-4" />;
      case 'Instagram':
        return <Square className="w-4 h-4" />;
      case 'YouTube':
        return <Tv className="w-4 h-4" />;
      case 'Facebook':
      case 'Twitter':
      case 'LinkedIn':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getAspectRatioIcon = (aspectRatio: string) => {
    switch (aspectRatio) {
      case '9:16':
        return <Smartphone className="w-4 h-4" />;
      case '1:1':
        return <Square className="w-4 h-4" />;
      case '16:9':
        return <Tv className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const handleCustomDimension = () => {
    if (customWidth > 0 && customHeight > 0) {
      const customDimension: VideoDimension = {
        id: 'custom',
        name: 'Custom',
        aspectRatio: `${customWidth}:${customHeight}`,
        width: customWidth,
        height: customHeight,
        description: 'Custom video dimensions',
        platform: 'Custom',
        icon: '⚙️'
      };
      onDimensionSelect(customDimension);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Platform Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Video Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Filter by Platform</Label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <Button
                  key={platform}
                  variant={selectedPlatform === platform ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform)}
                  className="flex items-center gap-2"
                >
                  {getPlatformIcon(platform)}
                  {platform === 'all' ? 'All' : platform}
                </Button>
              ))}
            </div>
          </div>

          {/* Dimension Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDimensions.map((dimension) => (
              <Card
                key={dimension.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedDimension?.id === dimension.id
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
                onClick={() => onDimensionSelect(dimension)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{dimension.icon}</span>
                      <div>
                        <h3 className="font-medium text-sm">{dimension.name}</h3>
                        <p className="text-xs text-muted-foreground">{dimension.platform}</p>
                      </div>
                    </div>
                    {selectedDimension?.id === dimension.id && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getAspectRatioIcon(dimension.aspectRatio)}
                      <span className="text-sm font-medium">{dimension.aspectRatio}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dimension.width} × {dimension.height}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dimension.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Dimensions */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Custom Dimensions</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustom(!showCustom)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {showCustom ? 'Hide' : 'Show'} Custom
              </Button>
            </div>
            
            {showCustom && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customWidth" className="text-xs">Width (px)</Label>
                    <Input
                      id="customWidth"
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1920)}
                      min="100"
                      max="4096"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customHeight" className="text-xs">Height (px)</Label>
                    <Input
                      id="customHeight"
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1080)}
                      min="100"
                      max="4096"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Aspect Ratio: {customWidth}:{customHeight}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={handleCustomDimension}
                    disabled={customWidth <= 0 || customHeight <= 0}
                  >
                    Apply Custom
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Dimension Info */}
          {selectedDimension && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Selected Format</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedDimension.icon}</span>
                  <span className="font-medium">{selectedDimension.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedDimension.platform}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedDimension.width} × {selectedDimension.height} ({selectedDimension.aspectRatio})
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedDimension.description}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DimensionSelector;
