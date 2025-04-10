import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string;
  title?: string;
  onBuild?: () => void;
}

export function PDFViewer({ pdfUrl, title, onBuild }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Set up PDF viewer iframe
  const iframeUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;

  useEffect(() => {
    // Check if the PDF file is accessible
    const checkPdfFile = async () => {
      try {
        const response = await fetch(pdfUrl, { method: 'HEAD' });
        if (!response.ok) {
          setError('PDF file could not be loaded');
        }
        setLoading(false);
      } catch (err) {
        setError('PDF file could not be loaded');
        setLoading(false);
      }
    };

    checkPdfFile();
  }, [pdfUrl]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, numPages));
  };

  return (
    <Card className="w-full border rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-3 bg-muted border-b">
        <h3 className="text-sm font-medium">{title || "PDF Preview"}</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <a href={pdfUrl} download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              <span className="sr-only">Download PDF</span>
            </Button>
          </a>
          {onBuild && (
            <Button size="sm" onClick={onBuild}>
              Build App
            </Button>
          )}
        </div>
      </div>
      <CardContent className="p-0 w-full h-[600px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              The PDF file could not be loaded. Please check the URL and try again.
            </p>
          </div>
        ) : (
          <iframe 
            src={iframeUrl} 
            className="w-full h-full border-0"
            title="PDF Viewer" 
            onLoad={() => setLoading(false)}
          />
        )}
      </CardContent>
      
      {numPages > 0 && (
        <div className="flex justify-center items-center p-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm mx-2">
            Page {currentPage} of {numPages}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNextPage}
            disabled={currentPage === numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}