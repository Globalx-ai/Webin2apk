import { Button } from "@/components/ui/button";

const SupportInfo = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Need Help?</h3>
          <p className="text-gray-600">Check out our documentation or join our community for support</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-3">
          <Button variant="outline" className="inline-flex items-center">
            <span className="material-icons mr-2 text-gray-500">help_outline</span>
            Documentation
          </Button>
          <Button 
            className="inline-flex items-center bg-purple-600 hover:bg-purple-700"
          >
            <span className="material-icons mr-2">forum</span>
            Community
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupportInfo;
