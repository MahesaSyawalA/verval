import { fireEvent, render, renderHook, act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "../data-table";
import { TablePagination, usePagination } from "../pagination";

describe("usePagination", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("memotong data sesuai ukuran halaman dan membatasi halaman aktif", () => {
    const { result } = renderHook(() => usePagination(items, 10));
    expect(result.current.pageItems).toHaveLength(10);
    expect(result.current.totalPages).toBe(3);

    act(() => result.current.setPage(3));
    expect(result.current.pageItems).toEqual([21, 22, 23, 24, 25]);
    expect(result.current.offset).toBe(20);

    act(() => result.current.setPageSize(5));
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(5);
  });

  it("menjaga halaman tetap valid ketika data menyusut", () => {
    const { result, rerender } = renderHook(
      ({ data }) => usePagination(data, 10),
      { initialProps: { data: items } },
    );
    act(() => result.current.setPage(3));
    rerender({ data: items.slice(0, 8) });
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toHaveLength(8);
  });
});

describe("TablePagination", () => {
  it("menampilkan ringkasan, pilihan jumlah data, dan navigasi halaman", () => {
    const onPageChange = (p: number) => calls.push(p);
    const calls: number[] = [];
    render(
      <TablePagination
        page={1}
        pageSize={10}
        totalItems={45}
        onPageChange={onPageChange}
        onPageSizeChange={() => {}}
      />,
    );

    expect(screen.getByText(/Menampilkan 1–10 dari 45 data/)).toBeInTheDocument();
    expect(screen.getByText("Tampilkan")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(calls).toEqual([2]);
  });

  it("tidak dirender saat data kosong", () => {
    const { container } = render(
      <TablePagination
        page={1}
        pageSize={10}
        totalItems={0}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("DataTable pagination", () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: `r${i + 1}` }));

  it("hanya merender satu halaman data dan dapat pindah halaman", () => {
    render(
      <DataTable
        columns={[{ key: "id", header: "ID", render: (r) => r.id }]}
        data={rows}
        rowKey={(r) => r.id}
        defaultPageSize={5}
      />,
    );

    expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5
    expect(screen.getByText("r1")).toBeInTheDocument();
    expect(screen.queryByText("r6")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByText("r6")).toBeInTheDocument();
    expect(screen.queryByText("r1")).toBeNull();
  });
});
