import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  title: string;
  description: string;
  onFileUpload: (data: any[]) => void;
  expectedColumns: string[];
  recordCount: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  title,
  description,
  onFileUpload,
  expectedColumns,
  recordCount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const parseAndValidate = (rawData: any[], source: string): any[] => {
    if (!rawData || rawData.length === 0) {
      throw new Error("The file contains no data.");
    }

    const headers = Object.keys(rawData[0]).map(h => h.trim());
    const missingColumns = expectedColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const validated: any[] = [];

    rawData.forEach((row, i) => {
      const record: any = {};

      for (const header of expectedColumns) {
        const valueRaw = row[header];
        const value = typeof valueRaw === 'string' ? valueRaw.trim() : valueRaw;

        if (header.toLowerCase().includes('amount')) {
          const cleaned = typeof value === 'string'
            ? value.replace(/,/g, '').replace(/INR/i, '').trim()
            : value;

          const parsed = parseFloat(cleaned);
          if (isNaN(parsed)) {
            throw new Error(`Invalid amount in ${source}, line ${i + 2}: "${value}"`);
          }

          record[header] = parsed;
        } else if (header === 'company_name') {
          if (!value || typeof value !== 'string') {
            throw new Error(`Invalid company_name in ${source}, line ${i + 2}`);
          }
          record[header] = value;
        } else {
          record[header] = value;
        }
      }

      validated.push(record);
    });

    return validated;
  };

  const handleFileSelect = async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    try {
      let rawData: any[] = [];

      if (fileExt === 'csv' || fileExt === 'tsv') {
        const text = await file.text();
        const delimiter = fileExt === 'tsv' ? '\t' : ',';
        const lines = text.trim().split('\n');
        const headers = lines[0].split(delimiter).map(h => h.trim());
        rawData = lines.slice(1).map(line => {
          const values = line.split(delimiter).map(v => v.trim());
          const record: any = {};
          headers.forEach((h, idx) => {
            record[h] = values[idx] ?? '';
          });
          return record;
        });
      } else if (fileExt === 'xlsx') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json(sheet);
      } else {
        throw new Error("Unsupported file format. Please upload CSV, TSV, or XLSX files.");
      }

      const data = parseAndValidate(rawData, file.name);
      setFileName(file.name);
      onFileUpload(data);
    } catch (error) {
      toast({
        title: "File parsing error",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Card className={`transition-all duration-200 ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {recordCount > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{recordCount} records</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">{description}</p>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".csv,.tsv,.xlsx"
            className="hidden"
          />

          {fileName ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <File className="h-8 w-8" />
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm">{recordCount} records loaded</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-gray-600">
                Drag and drop your CSV, TSV, or Excel file here, or{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse files
                </Button>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
