import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  createdAt: Date;
}

interface AssetCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export default function AssetRepository() {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const categoriesQuery = trpc.assets.getCategories.useQuery();
  const allAssetsQuery = trpc.assets.getAll.useQuery();
  const uploadMutation = trpc.assets.upload.useMutation();

  useEffect(() => {
    if (allAssetsQuery.data) {
      setAssets(allAssetsQuery.data as Asset[]);
    }
  }, [allAssetsQuery.data]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (selectedCategory === null) {
      toast.error("Please select a category first");
      return;
    }

    setIsUploading(true);
    let uploaded = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const base64Content = content.split(',')[1] || content;

            await uploadMutation.mutateAsync({
              categoryId: selectedCategory,
              fileName: file.name,
              fileContent: base64Content,
              mimeType: file.type,
              description: `Uploaded on ${new Date().toLocaleDateString()}`,
            });

            uploaded++;
            setUploadProgress(Math.round((uploaded / files.length) * 100));
            toast.success(`Uploaded: ${file.name}`);
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            toast.error(`Failed to upload ${file.name}`);
          }
        };

        reader.readAsDataURL(file);
      }

      setTimeout(() => {
        allAssetsQuery.refetch();
        setIsUploading(false);
        setUploadProgress(0);
        toast.success("All files uploaded successfully!");
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-yellow-400 mb-4">Asset Repository</h1>
            <p className="text-gray-300 mb-8">
              Please log in to access the secure asset repository
            </p>
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-yellow-400 text-slate-900 hover:bg-yellow-300"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Asset Repository</h1>
          <p className="text-gray-300">
            Secure storage for Infrastructure Academy documents, images, and resources
          </p>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto">
            <Card
              className={`p-4 cursor-pointer transition border-2 flex-shrink-0 ${
                selectedCategory === null
                  ? "bg-slate-700 border-yellow-400"
                  : "bg-slate-800 border-slate-600 hover:border-yellow-400"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              <h3 className="text-yellow-400 font-bold">All Assets</h3>
              <p className="text-gray-400 text-sm">{assets.length} files</p>
            </Card>
            {categoriesQuery.data?.map((category: AssetCategory) => (
              <Card
                key={category.id}
                className={`p-4 cursor-pointer transition border-2 flex-shrink-0 ${
                  selectedCategory === category.id
                    ? "bg-slate-700 border-yellow-400"
                    : "bg-slate-800 border-slate-600 hover:border-yellow-400"
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <h3 className="text-yellow-400 font-bold text-sm">{category.name}</h3>
                <p className="text-gray-400 text-xs">{category.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        {selectedCategory !== null && (
          <div className="mb-8">
            <Card
              className={`p-8 border-2 border-dashed transition cursor-pointer ${
                isDragging
                  ? "bg-slate-700 border-yellow-400"
                  : "bg-slate-800 border-slate-600 hover:border-yellow-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-yellow-400 mb-2">
                  Drag & Drop Files Here
                </h3>
                <p className="text-gray-400 mb-4">
                  or click to select files (10-15 images per batch recommended)
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                  id="file-input"
                />
                <Button
                  onClick={() => document.getElementById("file-input")?.click()}
                  className="bg-yellow-400 text-slate-900 hover:bg-yellow-300"
                  disabled={isUploading}
                >
                  {isUploading ? `Uploading... ${uploadProgress}%` : "Select Files"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Asset List */}
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Files</h2>
          {assets.length === 0 ? (
            <Card className="p-8 bg-slate-800 border-slate-600 text-center">
              <p className="text-gray-300">No assets uploaded yet</p>
            </Card>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {assets.map((asset) => (
                <Card
                  key={asset.id}
                  className="p-4 bg-slate-800 border-slate-600 hover:bg-slate-700 transition flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-yellow-400 font-semibold truncate">{asset.fileName}</h3>
                    <div className="text-gray-400 text-sm mt-1">
                      <span>{formatFileSize(asset.fileSize)}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(asset.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.open(asset.fileUrl, "_blank")}
                    className="bg-yellow-400 text-slate-900 hover:bg-yellow-300 ml-4 flex-shrink-0"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-slate-800 border border-slate-600 rounded">
          <p className="text-gray-300 text-sm">
            <strong>💡 Tip:</strong> Upload files in batches of 10-15 images to avoid timeouts. 
            All files are stored securely on cloud storage and won't be lost.
          </p>
        </div>
      </div>
    </div>
  );
}
