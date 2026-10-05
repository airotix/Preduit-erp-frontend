"use client";
import * as React from "react";
import { PhoneInput } from "@/components/ui/phone-input";
import { LocationFields } from "@/components/ui/location-fields";
import { AutoForm } from "@/components/screens/auto-form";
import { Sheet } from "@/components/ui/sheet";
import { customerSchema } from "@/modules/sales/schema";

/** Manual fixture: temporarily re-export from an app route for browser checks. */
export default function LocationPhonePreview() {
  const [location, setLocation] = React.useState({ country: "", state: "", city: "" });
  const [phone, setPhone] = React.useState("");
  const [submitted, setSubmitted] = React.useState<Record<string, unknown>>({});
  return <main className="mx-auto max-w-2xl space-y-5 p-4">
    <h1>Location and phone checks</h1>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <LocationFields value={location} onChange={patch => setLocation(prev => ({ ...prev, ...patch }))} />
    </div>
    <label htmlFor="preview-phone">Contact phone</label>
    <PhoneInput id="preview-phone" className="h-11 rounded-lg border px-3" country={location.country} value={phone} onChange={e => setPhone(e.target.value)} />
    <output className="block break-all" data-testid="selected-location">{JSON.stringify(location)}</output>
    <p data-testid="normalized-phone">Normalized: {phone}</p>
    <h2>Shared customer form</h2>
    <Sheet><AutoForm schema={customerSchema} defaultValues={{ name: "Validation fixture", email: "test@example.com", type: "Retail" }} onSubmit={setSubmitted} /></Sheet>
    <output className="block break-all" data-testid="submitted">{JSON.stringify(submitted)}</output>
  </main>;
}
