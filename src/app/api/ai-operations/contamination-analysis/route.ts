import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://irevlogix-backend.onrender.com';

type PascalContaminationRow = {
  ProcessingLotId: number;
  MaterialType?: string | null;
  ContaminationPercentage?: number | null;
  IncomingMaterialNotes?: string | null;
  ActualReceivedWeight?: number | null;
  OriginatorClientId?: number | null;
  OriginatorName?: string | null;
  ShipmentId?: number | null;
  DateCreated: string;
};

type PascalContaminationResponse = {
  CommonContaminants?: string[];
  PreventativeMeasures?: string[];
  SupplierImprovements?: string[];
  UsedRows?: PascalContaminationRow[];
  TotalRows?: number;
  MaterialType?: string | null;
  OriginatorClientId?: number | null;
  PeriodWeeks?: number;
  GeneratedAt?: string;
};

type ContaminationRow = {
  processingLotId: number;
  materialType?: string | null;
  contaminationPercentage?: number | null;
  incomingMaterialNotes?: string | null;
  actualReceivedWeight?: number | null;
  originatorClientId?: number | null;
  originatorName?: string | null;
  shipmentId?: number | null;
  dateCreated: string;
};

type ContaminationResponse = {
  commonContaminants: string[];
  preventativeMeasures: string[];
  supplierImprovements: string[];
  usedRows: ContaminationRow[];
  totalRows: number;
  materialType?: string | null;
  originatorClientId?: number | null;
  periodWeeks: number;
  generatedAt?: string;
};

function mapUsedRow(row: PascalContaminationRow): ContaminationRow {
  return {
    processingLotId: row.ProcessingLotId,
    materialType: row.MaterialType ?? null,
    contaminationPercentage: row.ContaminationPercentage ?? null,
    incomingMaterialNotes: row.IncomingMaterialNotes ?? null,
    actualReceivedWeight: row.ActualReceivedWeight ?? null,
    originatorClientId: row.OriginatorClientId ?? null,
    originatorName: row.OriginatorName ?? null,
    shipmentId: row.ShipmentId ?? null,
    dateCreated: row.DateCreated,
  };
}

function mapResponse(data: PascalContaminationResponse): ContaminationResponse {
  return {
    commonContaminants: data.CommonContaminants ?? [],
    preventativeMeasures: data.PreventativeMeasures ?? [],
    supplierImprovements: data.SupplierImprovements ?? [],
    usedRows: Array.isArray(data.UsedRows) ? data.UsedRows.map(mapUsedRow) : [],
    totalRows: data.TotalRows ?? 0,
    materialType: data.MaterialType ?? null,
    originatorClientId: data.OriginatorClientId ?? null,
    periodWeeks: data.PeriodWeeks ?? 4,
    generatedAt: data.GeneratedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const { search } = new URL(request.url);
    const queryString = search ? search.substring(1) : '';

    const response = await fetch(
      `${BACKEND_URL}/api/ai-operations/contamination-analysis${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const errorBody = contentType.includes('application/json') ? await response.json() : await response.text();
      return NextResponse.json({ error: errorBody }, { status: response.status });
    }

    const raw = (await response.json()) as PascalContaminationResponse;
    const data = mapResponse(raw);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying contamination analysis request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
