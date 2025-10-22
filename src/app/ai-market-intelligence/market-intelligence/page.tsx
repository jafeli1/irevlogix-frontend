'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppLayout from '../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../utils/rbac';
import { BACKEND_URL } from '../../../utils/constants';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RecyclableComponent {
  name: string;
  material: string;
  estimatedWeight: string;
  estimatedValue: string;
}

interface MarketPriceInfo {
  averagePrice?: string;
  priceRange?: string;
  marketTrend?: string;
}

interface EbayListing {
  title: string;
  price: number;
  currency: string;
  condition: string;
  itemUrl: string;
  imageUrl: string;
}

interface MatchedRecycler {
  companyName: string;
  address: string;
  certificationType: string;
  contactPhone: string;
  contactEmail: string;
  matchScore: number;
  matchReason: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}

interface VisualizationData {
  componentComposition: {
    data: ChartDataPoint[];
  };
  metalComposition: {
    data: ChartDataPoint[];
  };
  valueDistribution: {
    data: ChartDataPoint[];
  };
}

interface ProductAnalysisResult {
  productName: string;
  brand?: string;
  model?: string;
  category?: string;
  specifications?: Record<string, string>;
  components?: RecyclableComponent[];
  marketPrice?: MarketPriceInfo;
  summary?: string;
  ebayListings?: EbayListing[];
  matchedRecyclers?: MatchedRecycler[];
  chartData?: VisualizationData;
}

export default function MarketIntelligencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysisResult | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const userPermissions = await fetchUserPermissions(token);
      setPermissions(userPermissions);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const validateImage = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPG, PNG, or WebP)';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 10MB';
    }

    return null;
  };

  const sanitizeInput = (input: string): boolean => {
    const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const htmlRegex = /<[^>]*>/g;
    const sqlRegex = /(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi;
    
    return !scriptRegex.test(input) && !htmlRegex.test(input) && !sqlRegex.test(input);
  };

  const handleImageUpload = (file: File) => {
    const error = validateImage(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError('');
    setUploadedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  }, [handleImageUpload]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (value.length > 2000) {
      setValidationError('Description must be less than 2000 characters');
      return;
    }

    if (!sanitizeInput(value)) {
      setValidationError('Invalid input detected. Please remove any HTML, scripts, or SQL commands.');
      return;
    }

    setValidationError('');
    setProductDescription(value);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage && !productDescription.trim()) {
      setValidationError('Please upload a product photo or enter a description');
      return;
    }

    setAnalyzing(true);
    setValidationError('');
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      let base64Image = null;
      if (uploadedImage) {
        const reader = new FileReader();
        base64Image = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedImage);
        });
      }

      const response = await fetch(`${BACKEND_URL}/api/marketintelligence/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          base64Image: base64Image,
          productDescription: productDescription || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
      setAnalyzing(false);
    } catch (error) {
      console.error('Analysis error:', error);
      setValidationError(error instanceof Error ? error.message : 'Failed to analyze product. Please try again.');
      setAnalyzing(false);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setValidationError('');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!permissions || !hasPermission(permissions, 'ProjectManagement', 'Read')) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">You don&apos;t have permission to view this page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            AI Driven Recyclable Product Analysis and Market Intelligence
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Objective</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              Analyze and outline the components of a recyclable product so the actual value of each recyclable component is evident and you can maximize your ROI.
            </li>
            <li>
              Remove reliance on manual market research for recyclable product resale values by automatically determining Estimated Resale Value for each component.
            </li>
            <li>
              Facilitate the optimization of sales channels for processed materials by automatically determining Expected Sales Price Per Unit.
            </li>
            <li>
              Automatically generate dynamic sales channel recommendations by suggesting recyclers or downstream vendors for the products or components.
            </li>
          </ol>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Upload or Drag and Drop Product Photo Here:
            </label>
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Product preview"
                      width={384}
                      height={192}
                      className="mx-auto h-48 w-auto rounded-md"
                      unoptimized
                    />
                    <button
                      onClick={clearImage}
                      className="mt-3 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      type="button"
                    >
                      Remove Image
                    </button>
                    {uploadedImage && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {uploadedImage.name} ({(uploadedImage.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="product-image-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="product-image-upload"
                          name="product-image-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="sr-only"
                          onChange={handleFileInputChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG, or WebP up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="product-description" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Or Enter The Name and Detailed Description of the Product Here:
            </label>
            <textarea
              id="product-description"
              name="product-description"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter product name, model, color, specifications, materials, dimensions, weight, and any other relevant details that will help identify and analyze the product..."
              value={productDescription}
              onChange={handleDescriptionChange}
              maxLength={2000}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Include as much detail as possible for better analysis</span>
              <span>{productDescription.length}/2000 characters</span>
            </div>
          </div>

          {validationError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {validationError}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={(!uploadedImage && !productDescription.trim()) || analyzing}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {analyzing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Analyze'
              )}
            </button>
          </div>
        </div>

        {analysisResult && (
          <>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Section 1: Product Summary
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {analysisResult.productName}
                  </h3>
                  {analysisResult.brand && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Brand: {analysisResult.brand}
                    </p>
                  )}
                  {analysisResult.model && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Model: {analysisResult.model}
                    </p>
                  )}
                  {analysisResult.category && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Category: {analysisResult.category}
                    </p>
                  )}
                </div>

                {analysisResult.specifications && Object.keys(analysisResult.specifications).length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Specifications:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(analysisResult.specifications).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">{key}:</span>
                          <span className="text-gray-600 dark:text-gray-400">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.summary && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Summary:
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{analysisResult.summary}</p>
                  </div>
                )}

                {analysisResult.components && analysisResult.components.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Recyclable Components:
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Component
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Material
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Est. Weight
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Est. Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {analysisResult.components.map((component, index: number) => (
                            <tr key={index}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                {component.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {component.material}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {component.estimatedWeight}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {component.estimatedValue}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> Please be reminded that above is just a general estimate based on a web search today, {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, and prices can fluctuate daily based on market conditions, location, and the purity of the scrap material.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Section 2: Secondary Market Price Analysis
              </h2>
              <div className="space-y-4">
                {analysisResult.marketPrice && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysisResult.marketPrice.averagePrice && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Average Price
                        </h4>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {analysisResult.marketPrice.averagePrice}
                        </p>
                      </div>
                    )}
                    {analysisResult.marketPrice.priceRange && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Price Range
                        </h4>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {analysisResult.marketPrice.priceRange}
                        </p>
                      </div>
                    )}
                    {analysisResult.marketPrice.marketTrend && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Market Trend
                        </h4>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {analysisResult.marketPrice.marketTrend}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {analysisResult.ebayListings && analysisResult.ebayListings.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Recent eBay Listings:
                    </h4>
                    <div className="space-y-3">
                      {analysisResult.ebayListings.map((listing, index: number) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <a 
                                href={listing.itemUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              >
                                {listing.title}
                              </a>
                              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {listing.currency} ${listing.price.toFixed(2)}
                                </span>
                                {listing.condition && (
                                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {listing.condition}
                                  </span>
                                )}
                              </div>
                            </div>
                            {listing.imageUrl && (
                              <Image 
                                src={listing.imageUrl} 
                                alt={listing.title}
                                width={80}
                                height={80}
                                className="w-20 h-20 object-cover rounded ml-4"
                                unoptimized
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> Please be reminded that above is just a general estimate based on a web search today, {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, and prices can fluctuate daily based on market conditions, location, and the purity of the scrap material.
                  </p>
                </div>
              </div>
            </div>

            {analysisResult.matchedRecyclers && analysisResult.matchedRecyclers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Recyclers Matched to Your Product Components
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Company Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Certification Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Contact Phone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Contact Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {analysisResult.matchedRecyclers.map((recycler, index: number) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {recycler.companyName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {recycler.address || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {recycler.certificationType || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {recycler.contactPhone || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {recycler.contactEmail || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Disclaimer:</strong> iRevLogix.ai is NOT affiliated with the recyclers listed above. They were selected based on the recyclable product components and if applicable the ones nearest to your location.
                  </p>
                </div>
              </div>
            )}

            {analysisResult.chartData && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Product Analysis Visualization
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analysisResult.chartData.componentComposition.data.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 text-center">
                        Component Composition Breakdown
                      </h3>
                      <div className="h-64 flex items-center justify-center">
                        <Pie
                          data={{
                            labels: analysisResult.chartData.componentComposition.data.map(d => d.label),
                            datasets: [{
                              data: analysisResult.chartData.componentComposition.data.map(d => d.value),
                              backgroundColor: analysisResult.chartData.componentComposition.data.map(d => d.color),
                              borderWidth: 2,
                              borderColor: '#ffffff'
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  color: '#6b7280',
                                  padding: 15
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `${context.label}: ${context.parsed} components`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {analysisResult.chartData.metalComposition.data.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 text-center">
                        Metal Composition by Mass
                      </h3>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: analysisResult.chartData.metalComposition.data.map(d => d.label),
                            datasets: [{
                              label: 'Percentage by Mass',
                              data: analysisResult.chartData.metalComposition.data.map(d => d.value),
                              backgroundColor: analysisResult.chartData.metalComposition.data.map(d => d.color),
                              borderWidth: 0
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `${context.parsed.y}% of total mass`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  callback: function(value) {
                                    return value + '%';
                                  },
                                  color: '#6b7280'
                                },
                                grid: {
                                  color: '#e5e7eb'
                                }
                              },
                              x: {
                                ticks: {
                                  color: '#6b7280'
                                },
                                grid: {
                                  display: false
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {analysisResult.chartData.valueDistribution.data.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg lg:col-span-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 text-center">
                        Value Distribution
                      </h3>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: analysisResult.chartData.valueDistribution.data.map(d => d.label),
                            datasets: [{
                              label: 'Estimated Value ($)',
                              data: analysisResult.chartData.valueDistribution.data.map(d => d.value),
                              backgroundColor: analysisResult.chartData.valueDistribution.data.map(d => d.color),
                              borderWidth: 0
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `$${context.parsed.y.toFixed(2)}`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: function(value) {
                                    return '$' + value;
                                  },
                                  color: '#6b7280'
                                },
                                grid: {
                                  color: '#e5e7eb'
                                }
                              },
                              x: {
                                ticks: {
                                  color: '#6b7280'
                                },
                                grid: {
                                  display: false
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Download Analysis Report
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Download a complete text report of this analysis including all components, pricing, charts data, and recycler information.
                    </p>
                  </div>
                  <button
                    onClick={downloadAnalysis}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center whitespace-nowrap"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download this Recyclable Product Analysis and Market Intelligence
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
