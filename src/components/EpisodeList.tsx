import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileAudio,
  Youtube,
  Edit3,
  Download,
  Trash2,
  MoreHorizontal,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Episode {
  id: string;
  title: string;
  source: "file" | "youtube";
  status: "processing" | "completed" | "error";
  duration: string;
  createdAt: string;
  fileSize?: string;
  youtubeUrl?: string;
  progress?: number;
}

interface EpisodeListProps {
  limit?: number;
}

const EpisodeList: React.FC<EpisodeListProps> = ({ limit }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Load episodes from localStorage on component mount
  React.useEffect(() => {
    const loadEpisodes = () => {
      try {
        const storedEpisodes = localStorage.getItem("episodes");
        if (storedEpisodes) {
          const parsedEpisodes = JSON.parse(storedEpisodes);
          setEpisodes(parsedEpisodes);
        }
      } catch (error) {
        console.error("Failed to load episodes:", error);
      }
    };

    loadEpisodes();

    // Listen for storage changes to update episodes in real-time
    const handleStorageChange = () => {
      loadEpisodes();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<string | null>(null);

  const filteredEpisodes = episodes
    .filter((episode) =>
      episode.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .slice(0, limit);

  const getStatusIcon = (status: Episode["status"], progress?: number) => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: Episode["status"]) => {
    switch (status) {
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleEdit = (episodeId: string) => {
    navigate(`/episode/${episodeId}`);
  };

  const handleDeleteClick = (episodeId: string) => {
    setEpisodeToDelete(episodeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (episodeToDelete) {
      const updatedEpisodes = episodes.filter(
        (ep) => ep.id !== episodeToDelete,
      );
      setEpisodes(updatedEpisodes);
      localStorage.setItem("episodes", JSON.stringify(updatedEpisodes));
      setEpisodeToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleExport = (episodeId: string) => {
    // In a real app, this would trigger an export
    const episode = episodes.find((ep) => ep.id === episodeId);
    if (episode) {
      // Create a mock download
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," +
          encodeURIComponent(
            `Episode: ${episode.title}\nDuration: ${episode.duration}\nCreated: ${episode.createdAt}`,
          ),
      );
      element.setAttribute(
        "download",
        `${episode.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`,
      );
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="space-y-4 bg-white">
      {!limit && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search episodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredEpisodes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileAudio className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No episodes found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Upload your first audio file to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEpisodes.map((episode) => (
            <Card
              key={episode.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {episode.source === "youtube" ? (
                        <Youtube className="w-5 h-5 text-red-500" />
                      ) : (
                        <FileAudio className="w-5 h-5 text-blue-500" />
                      )}
                      {getStatusIcon(episode.status, episode.progress)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{episode.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{episode.duration}</span>
                        </span>
                        <span>
                          {new Date(episode.createdAt).toLocaleDateString()}
                        </span>
                        {episode.fileSize && <span>{episode.fileSize}</span>}
                      </div>
                      {episode.status === "processing" && episode.progress && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Processing...</span>
                            <span>{episode.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${episode.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(episode.status)}

                    <Button
                      size="sm"
                      onClick={() => handleEdit(episode.id)}
                      className="flex items-center space-x-1"
                      disabled={episode.status === "processing"}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(episode.id)}
                          disabled={episode.status === "processing"}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {episode.status === "completed" && (
                          <DropdownMenuItem
                            onClick={() => handleExport(episode.id)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(episode.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {limit && filteredEpisodes.length > 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate("/episodes")}>
            View All Episodes
          </Button>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this episode? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EpisodeList;
