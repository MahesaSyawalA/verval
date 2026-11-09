import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Alert, AlertToastProvider, alertToast } from "../alert";

describe("HeroUI Toast Alert (placement='top end')", () => {
  afterEach(() => {
    act(() => {
      alertToast.clear();
    });
  });

  it("renders success, warning, info, and error alerts using HeroUI Toast top end", async () => {
    const { rerender } = render(
      <Alert
        status="success"
        title="Berhasil Disimpan"
        description="Notulensi berhasil difinalisasi dan disimpan ke Arsip Rapat."
      />,
    );

    const toastEl = await screen.findByRole("alertdialog");
    expect(toastEl).toHaveAttribute("data-slot", "toast");
    expect(toastEl).toHaveAttribute("data-placement", "top end");
    expect(toastEl).toHaveClass("toast--top-end", "toast--success");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Berhasil Disimpan/i,
    );
    expect(
      screen.getByText(
        /Notulensi berhasil difinalisasi dan disimpan ke Arsip Rapat/i,
      ),
    ).toBeInTheDocument();

    rerender(
      <Alert
        status="warning"
        title="Perlu Tindakan"
        description="2 tiket perlu tindakanmu."
      />,
    );
    expect(await screen.findByRole("alertdialog")).toHaveClass(
      "toast--top-end",
      "toast--warning",
    );

    rerender(
      <Alert
        status="info"
        title="Informasi"
        description="Hanya notulis yang ditunjuk yang dapat mengubah isi notulensi ini."
      />,
    );
    expect(await screen.findByRole("alertdialog")).toHaveClass(
      "toast--top-end",
      "toast--accent",
    );

    rerender(
      <Alert
        status="error"
        title="Ditolak"
        description="Catatan untuk dosen wajib diisi jika tiket ditolak."
      />,
    );
    expect(await screen.findByRole("alertdialog")).toHaveClass(
      "toast--top-end",
      "toast--danger",
    );
  });

  it("supports imperative alertToast (success, warning, info, error) with AlertToastProvider top end", async () => {
    render(
      <AlertToastProvider placement="top end">
        <div>App Content</div>
      </AlertToastProvider>,
    );

    act(() => {
      alertToast.success("Tiket berhasil disetujui", {
        description: "Ditandai Tercapai oleh Kaprodi.",
      });
    });

    const region = document.querySelector('[data-slot="toast-region"]');
    expect(region).toHaveClass("toast-region--top-end");

    const toastNode = await screen.findByRole("alertdialog");
    expect(toastNode).toHaveAttribute("data-placement", "top end");
    expect(toastNode).toHaveClass("toast--top-end", "toast--success");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Tiket berhasil disetujui/i,
    );
  });

  it("auto-dismisses Alert toast after timeout", async () => {
    render(
      <AlertToastProvider placement="top end">
        <Alert status="info" timeout={80}>
          Notifikasi otomatis tertutup
        </Alert>
      </AlertToastProvider>,
    );

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    });

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
