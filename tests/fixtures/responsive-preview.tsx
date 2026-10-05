"use client";

import * as React from "react";
import { NavigationProvider } from "@/components/shell/navigation-context";
import { SidebarRail } from "@/components/shell/sidebar-rail";
import { Topbar } from "@/components/shell/topbar";
import { PageHeader } from "@/components/shell/page-header";
import { CurrencyProvider } from "@/lib/currency";
import { DataTable } from "@/components/screens/data-table";
import { BoardView } from "@/components/screens/board-view";
import { DashboardView } from "@/components/screens/dashboard-view";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildColumns } from "@/lib/build-columns";
import type { DashboardConfig, Row } from "@/lib/screen-types";

const columns = buildColumns([{label:"Reference"},{label:"Article"},{label:"Quantity"},{label:"Status"}]);
const rows: Row[] = Array.from({length:12}, (_,i) => [`MO-${i+1}`, "Cotton shirt with a long catalog article name", i+1, "Pending"]);
const dashboard: DashboardConfig = {
  kind:"dashboard", metrics:Array.from({length:4},(_,i)=>({label:`Metric ${i+1}`,value:"€12,500",delta:"+5%",up:true,sub:"Sample records",icon:"activity",iconBg:"#eee",iconColor:"#333"})),
  chartTitle:"Monthly production",chartSub:"Sample data",bars:[10,20,40,60,30,80,20,50,40,90,10,40],donutTitle:"Orders",donutTotal:"12",
  donut:[{label:"Pending",value:"12",pct:100,color:"#F36523"}],tableTitle:"Recent orders",tableCols:[{l:"Reference",a:"left"},{l:"Article",a:"left"},{l:"Quantity",a:"right"}],
  tableData:[["MO-1","Cotton shirt",12,"#F36523"]],activity:[],
};

export default function ResponsivePreview() {
  const [open,setOpen] = React.useState(false);
  const [message,setMessage] = React.useState("");
  return <NavigationProvider><div className="erp-shell flex h-dvh w-full bg-[#C8CCD5] p-0 sm:p-2">
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-white sm:rounded-[18px]">
      <SidebarRail /><main className="flex min-h-0 min-w-0 flex-1 flex-col"><CurrencyProvider><Topbar />
        <PageHeader crumb="Sample data" title="Responsive verification" />
        <div className="erp-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-[26px] pb-7 pt-5">
          <DashboardView config={dashboard}/>
          <DataTable columns={columns} data={rows} searchPlaceholder="Search sample orders" onAction={()=>setOpen(true)} actionLabel="New order"
            onRowClick={()=>setMessage("Order opened")} onEditRow={()=>setOpen(true)} onStartRow={()=>setMessage("Start action selected")}/>
          <p role="status">{message}</p>
          <BoardView config={{kind:"board",columns:["Tech Pack","Trims","Lining","Cutting","Sewing","Finishing","Packed"].map((title)=>({title,accent:"#F36523",count:1,cards:[{ref:"MO-1",title:"Cotton shirt",sub:"12 units",meta:"Pending",metaIcon:"activity",av:"CS",tone:"neutral"}]}))}}/>
          <Button onClick={()=>setOpen(true)}>Open sample form</Button>
        </div>
        <Sheet open={open} onOpenChange={setOpen}><SheetContent><SheetHeader><SheetTitle>Sample order form</SheetTitle><SheetDescription>Layout verification only; no records are saved.</SheetDescription></SheetHeader>
          <div className="erp-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6 sm:px-6">{Array.from({length:16},(_,i)=><label key={i} className="block">Field {i+1}<Input aria-label={`Field ${i+1}`} placeholder="Sample value"/></label>)}</div>
          <SheetFooter><Button onClick={()=>setOpen(false)}>Close form</Button></SheetFooter>
        </SheetContent></Sheet>
      </CurrencyProvider></main>
    </div>
  </div></NavigationProvider>;
}
