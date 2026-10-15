"use client";
import { useParams } from "next/navigation";
import { ReturnWorkspace } from "@/components/screens/inventory-operations";
export default function Page() { const { recordId } = useParams<{ recordId: string }>(); return <ReturnWorkspace id={recordId} sales />; }
