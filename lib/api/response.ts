import { NextResponse } from 'next/server';
import { ApiError } from './errors';
import { ApiResponse } from '@/types/api';

export type ActionResponse<T = any> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: string; details?: any; data?: never };

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data, status } as ApiResponse<T>, { status });
}

export function errorResponse(error: string | unknown, status = 400) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, status: error.statusCode, code: error.code, details: error.details },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  if (status === 500) {
     console.error('[API Error]', error);
     // Don't expose server logic to client in prod
     return NextResponse.json(
       { error: process.env.NODE_ENV === 'development' ? message : 'Internal Server Error', status: 500, code: 'INTERNAL_ERROR' },
       { status: 500 }
     );
  }

  return NextResponse.json({ error: message, status } as ApiResponse<null>, { status });
}

export const apiResponse = successResponse;
export const apiError = errorResponse;

export function actionSuccess<T>(data: T): ActionResponse<T> {
  return { success: true, data };
}

export function actionError(error: unknown): ActionResponse {
  if (error instanceof ApiError) {
    return { success: false, error: error.message, details: error.details };
  }
  
  console.error('[Action Error]', error);
  const message = error instanceof Error ? 
    (process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred') 
    : 'An unexpected error occurred';
    
  return { success: false, error: message };
}
