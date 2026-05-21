import { NextResponse } from "next/server";
import {
  AUTHENTICATION_ERROR,
  ODOO_ERROR,
  PERMISSION_ERROR,
} from "@/lib/permissions";

export function successResponse<TData>(data: TData, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function unauthorizedResponse() {
  return errorResponse(AUTHENTICATION_ERROR, 401);
}

export function forbiddenResponse() {
  return errorResponse(PERMISSION_ERROR, 403);
}

export function notFoundResponse(message = "Not found.") {
  return errorResponse(message, 404);
}

export function odooErrorResponse() {
  return errorResponse(ODOO_ERROR, 502);
}
