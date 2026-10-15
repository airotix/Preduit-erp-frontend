"use client";
import { useParams } from "next/navigation";
import { StocktakeWorkspace } from "@/components/screens/inventory-operations";
export default function Page() { const { recordId } = useParams<{ recordId: string }>(); return <StocktakeWorkspace id={recordId} />; }
