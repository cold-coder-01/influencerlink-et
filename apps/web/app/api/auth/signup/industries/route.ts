import { NextResponse } from "next/server";
import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
} from "@/lib/odoo-rpc";

type OdooField = {
  type?: string;
};

type OdooFields = Record<string, OdooField>;

type OdooIndustry = {
  id: number;
  name?: string | false;
};

export async function GET() {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await executeKw<OdooFields>(
      uid,
      "influencer.industry",
      "fields_get",
      [],
      { attributes: ["type"] },
      config,
    );
    const domain = "active" in fields ? [[["active", "=", true]]] : [[]];
    const industries = await executeKw<OdooIndustry[]>(
      uid,
      "influencer.industry",
      "search_read",
      domain,
      {
        fields: ["name"],
        order: "name asc",
      },
      config,
    );

    return NextResponse.json({
      success: true,
      industries: industries.map((industry) => ({
        id: industry.id,
        name: industry.name || `Industry ${industry.id}`,
      })),
    });
  } catch (error) {
    console.error("Signup industries failed while connecting to Odoo.", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not load industries from Odoo.",
        industries: [],
      },
      { status: 502 },
    );
  }
}
