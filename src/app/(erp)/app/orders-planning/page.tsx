import { CalendarDays, ClipboardList, Route, Rows3 } from "lucide-react";
import { DataConnectionGate } from "@/components/layout/DataConnectionGate";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getOrdersPlanningData } from "@/lib/data/factory";

export const dynamic = "force-dynamic";

export default async function OrdersPlanningPage() {
  const summary = await getOrdersPlanningData();

  return (
    <>
      <SectionHeader
        eyebrow="Orders & Planning"
        title="Orders and planning foundation"
        description="This page summarizes real order, production plan, daily quantity, and routing records. No scheduling board is invented in the first shell."
      />
      <DataConnectionGate result={summary}>
        {(data) => (
          <div className="space-y-6">
            {data.lineOrderContexts === 0 ? (
              <section className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-900">
                Line assignment is not active yet because line_order_contexts is empty.
              </section>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total orders"
                value={data.totalOrders}
                helper="From orders"
                icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
              />
              <KpiCard
                label="Production plans"
                value={data.productionPlans}
                helper="From production_plans"
                icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
              />
              <KpiCard
                label="Routes"
                value={data.routeCount}
                helper="From order_operation_routes"
                icon={<Route className="h-5 w-5" aria-hidden="true" />}
              />
              <KpiCard
                label="Daily quantity rows"
                value={data.dailyQuantityRows}
                helper="From production_plan_daily_quantities"
                icon={<Rows3 className="h-5 w-5" aria-hidden="true" />}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-jade-ink">Orders by customer</h2>
                <div className="mt-4 space-y-3">
                  {data.byCustomer.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm"
                    >
                      <span className="font-semibold text-jade-ink">
                        {item.label}
                      </span>
                      <span className="text-jade-steel">{item.count}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-jade-ink">Nearest shipment dates</h2>
                <div className="mt-4 space-y-3">
                  {data.nearestShipmentDates.map((item) => (
                    <div
                      key={`${item.orderCode}-${item.shipmentDate}`}
                      className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-jade-ink">{item.orderCode}</p>
                        <p className="text-jade-steel">{item.customerName}</p>
                      </div>
                      <span className="font-semibold text-jade-blue">
                        {item.shipmentDate}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-lg border border-jade-line bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-jade-ink">Week 21-25 quantity summary</h2>
              {data.weekQuantitySummary.length > 0 ? (
                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  {data.weekQuantitySummary.map((item) => (
                    <div key={item.week} className="rounded-md border border-slate-100 bg-slate-50 p-4">
                      <p className="text-sm font-bold text-jade-ink">{item.week}</p>
                      <p className="mt-2 text-2xl font-black text-jade-ink">
                        {item.quantity ?? "Waiting"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-jade-steel">
                        {item.rows} plan rows
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold text-jade-steel">
                  Waiting for real factory data.
                </p>
              )}
            </section>
          </div>
        )}
      </DataConnectionGate>
    </>
  );
}
