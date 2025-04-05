import { Badge } from "@/components/ui/badge";

interface AppInfoProps {
  appName: string;
  packageName: string;
  url: string;
  status: "pending" | "valid" | "invalid" | "building" | "completed" | "failed";
}

const AppInfo = ({ appName, packageName, url, status }: AppInfoProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return <Badge className="px-2 py-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending URL</Badge>;
      case "valid":
        return <Badge className="px-2 py-1 bg-green-100 text-green-800 hover:bg-green-100">Valid URL</Badge>;
      case "invalid":
        return <Badge className="px-2 py-1 bg-red-100 text-red-800 hover:bg-red-100">Invalid URL</Badge>;
      case "building":
        return <Badge className="px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-100">Building APK</Badge>;
      case "completed":
        return <Badge className="px-2 py-1 bg-green-100 text-green-800 hover:bg-green-100">APK Ready</Badge>;
      case "failed":
        return <Badge className="px-2 py-1 bg-red-100 text-red-800 hover:bg-red-100">Build Failed</Badge>;
      default:
        return <Badge className="px-2 py-1 bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
      <h3 className="text-lg font-semibold mb-4">App Info</h3>
      <div className="border-t border-gray-100 pt-4">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">App Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{appName || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Package Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{packageName || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Target URL</dt>
            <dd className="mt-1 text-sm text-gray-900 break-all">{url || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">WebView Type</dt>
            <dd className="mt-1 text-sm text-gray-900">Chromium-based WebView</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm">
              {getStatusBadge()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default AppInfo;
