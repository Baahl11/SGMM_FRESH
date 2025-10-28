"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, Filter, RefreshCw, Search, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryMovement {
  id: string;
  item_id: string;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  cantidad_anterior: number | null;
  cantidad_nueva: number | null;
  motivo: string | null;
  related_record_id: string | null;
  created_at: string;
}

type RangeFilter = "30" | "90" | "365" | "all";

type TipoFilter = "todos" | "entrada" | "salida" | "ajuste";

interface InventoryMovementsProps {
  itemId: string;
  className?: string;
}

function formatMovementDate(dateIso: string) {
  try {
    return format(new Date(dateIso), "PPp", { locale: es });
  } catch (error) {
    return dateIso;
  }
}

function getTipoBadge(tipo: InventoryMovement["tipo"]) {
  switch (tipo) {
    case "entrada":
      return <Badge className="bg-emerald-100 text-emerald-700">Entrada</Badge>;
    case "salida":
      return <Badge className="bg-rose-100 text-rose-700">Salida</Badge>;
    case "ajuste":
      return <Badge className="bg-amber-100 text-amber-700">Ajuste</Badge>;
    default:
      return null;
  }
}

export function InventoryMovements({ itemId, className }: InventoryMovementsProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("todos");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("90");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearchDebounced(search.trim()), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ item_id: itemId, limit: "200" });

      if (tipoFilter !== "todos") {
        params.set("tipo", tipoFilter);
      }

      if (rangeFilter !== "all") {
        const now = new Date();
        const days = parseInt(rangeFilter, 10);
        const from = new Date(now);
        from.setDate(now.getDate() - days);
        params.set("from", from.toISOString());
      }

      if (searchDebounced.length > 0) {
        params.set("search", searchDebounced);
      }

      const response = await fetch(`/api/inventory/movements?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Error al cargar movimientos de inventario");
      }

      const data = await response.json();
      setMovements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [itemId, tipoFilter, rangeFilter, searchDebounced]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const totals = useMemo(() => {
    return movements.reduce(
      (acc, movement) => {
        const qty = Number(movement.cantidad) || 0;
        if (movement.tipo === "entrada") {
          acc.entradas += qty;
        }
        if (movement.tipo === "salida") {
          acc.salidas += qty;
        }
        if (movement.tipo === "ajuste") {
          acc.ajustes += qty;
        }
        return acc;
      },
      { entradas: 0, salidas: 0, ajustes: 0 }
    );
  }, [movements]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const header = [
        "Fecha",
        "Tipo",
        "Cantidad",
        "Stock Anterior",
        "Stock Nuevo",
        "Motivo",
        "Record Relacionado",
      ];

      const rows = movements.map((movement) => [
        formatMovementDate(movement.created_at),
        movement.tipo,
        movement.cantidad?.toString() ?? "",
        movement.cantidad_anterior?.toString() ?? "",
        movement.cantidad_nueva?.toString() ?? "",
        movement.motivo ? movement.motivo.replace(/\n/g, " ") : "",
        movement.related_record_id ?? "",
      ]);

      const csvContent = [header, ...rows]
        .map((line) =>
          line
            .map((value) => `"${(value || "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `movimientos-inventario-${itemId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar CSV", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <History className="h-5 w-5 text-blue-600" />
            Historial de Movimientos
          </CardTitle>
          <p className="text-sm text-gray-500">
            Traza completa de entradas, salidas y ajustes asociados a este item.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTipoFilter("todos");
              setRangeFilter("90");
              setSearch("");
            }}
            title="Limpiar filtros"
          >
            <Filter className="mr-1 h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMovements}
            title="Recargar registros"
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || movements.length === 0}
          >
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de movimiento</Label>
            <Select
              value={tipoFilter}
              onValueChange={(value: TipoFilter) => setTipoFilter(value)}
            >
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodo">Periodo</Label>
            <Select
              value={rangeFilter}
              onValueChange={(value: RangeFilter) => setRangeFilter(value)}
            >
              <SelectTrigger id="periodo">
                <SelectValue placeholder="Últimos 90 días" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="365">Últimos 12 meses</SelectItem>
                <SelectItem value="all">Todo el historial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="search">Buscar por motivo</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ej: tratamiento botox, compra proveedor, ajuste manual..."
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-600">Entradas</p>
            <p className="text-2xl font-semibold text-emerald-700">
              {totals.entradas.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm text-rose-600">Salidas</p>
            <p className="text-2xl font-semibold text-rose-700">
              {totals.salidas.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm text-amber-600">Ajustes</p>
            <p className="text-2xl font-semibold text-amber-700">
              {totals.ajustes.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-3/4" />
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-gray-500">
                    No se encontraron movimientos con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                movements.map((movement) => (
                  <TableRow key={movement.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {formatMovementDate(movement.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      {getTipoBadge(movement.tipo)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      {movement.cantidad?.toLocaleString("es-MX", {
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {movement.cantidad_anterior !== null && movement.cantidad_nueva !== null ? (
                        <span>
                          {movement.cantidad_anterior.toLocaleString("es-MX", {
                            maximumFractionDigits: 2,
                          })}
                          {" → "}
                          {movement.cantidad_nueva.toLocaleString("es-MX", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {movement.motivo || "Sin motivo especificado"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-blue-600">
                      {movement.related_record_id ? `#${movement.related_record_id.slice(0, 8)}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default InventoryMovements;
