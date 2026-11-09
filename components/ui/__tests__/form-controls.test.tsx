import { fireEvent, render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { BareInput } from "../bare-input";
import { DatePicker } from "../date-picker";
import { Input } from "../input";
import { Select } from "../select";
import { TextArea } from "../textarea";

function ControlledInput({ onValue }: { onValue?: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <Input
      label="Judul"
      name="judul"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onValue?.(e.target.value);
      }}
    />
  );
}

describe("Input (HeroUI)", () => {
  it("menghubungkan label ke field dan menjaga nilai terkontrol dengan onChange native", () => {
    const onValue = vi.fn();
    render(<ControlledInput onValue={onValue} />);

    const input = screen.getByLabelText("Judul") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Rapat Evaluasi" } });

    expect(onValue).toHaveBeenCalledWith("Rapat Evaluasi");
    expect(input.value).toBe("Rapat Evaluasi");
  });

  it("menampilkan error sebagai alert dan menandai field tidak valid", () => {
    render(<Input label="Email" error="Email wajib diisi." readOnly value="" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Email wajib diisi.");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("menampilkan teks bantuan bila tidak ada error", () => {
    render(<Input label="NIP" helperText="18 digit" readOnly value="" />);

    expect(screen.getByText("18 digit")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByLabelText("NIP")).not.toHaveAttribute("aria-invalid", "true");
  });

  it("meneruskan type, placeholder, disabled, dan ref ke elemen input", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Input
        ref={ref}
        label="Kata sandi"
        type="password"
        placeholder="Masukkan kata sandi"
        disabled
        readOnly
        value=""
      />,
    );

    const input = screen.getByLabelText("Kata sandi");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("placeholder", "Masukkan kata sandi");
    expect(input).toBeDisabled();
    expect(ref.current).toBe(input);
  });

  it("merender ikon kiri dan elemen kanan", () => {
    render(
      <Input
        label="Cari"
        leftIcon={<span data-testid="kiri" />}
        rightElement={<button type="button">tampil</button>}
        readOnly
        value=""
      />,
    );

    expect(screen.getByTestId("kiri")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tampil" })).toBeInTheDocument();
  });
});

describe("TextArea (HeroUI)", () => {
  it("menghubungkan label dan meneruskan perubahan native", () => {
    const seen: string[] = [];
    render(
      <TextArea
        label="Catatan"
        rows={3}
        value=""
        onChange={(e) => seen.push(e.target.value)}
      />,
    );

    const area = screen.getByLabelText("Catatan");
    expect(area.tagName).toBe("TEXTAREA");
    expect(area).toHaveAttribute("rows", "3");

    fireEvent.change(area, { target: { value: "Perlu revisi" } });
    expect(seen).toEqual(["Perlu revisi"]);
  });

  it("menampilkan error sebagai alert", () => {
    render(<TextArea label="Catatan" error="Wajib diisi" readOnly value="" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Wajib diisi");
  });
});

describe("BareInput (HeroUI)", () => {
  it("menjadi input biasa berlabel aria dengan onChange native", () => {
    const onChange = vi.fn();
    render(
      <BareInput
        type="search"
        aria-label="Cari rapat"
        placeholder="Cari..."
        value=""
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText("Cari rapat");
    expect(input).toHaveAttribute("type", "search");
    fireEvent.change(input, { target: { value: "kurikulum" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("Select (HeroUI)", () => {
  const options = [
    { value: "AKADEMIK", label: "Akademik" },
    { value: "PENELITIAN", label: "Penelitian" },
  ];

  it("merender trigger dengan label dan nilai terpilih serta menyembunyikan indikator item di dalam trigger", () => {
    const { container } = render(
      <Select
        label="Kategori Target"
        value="AKADEMIK"
        options={options}
      />,
    );

    expect(screen.getByText("Kategori Target")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveTextContent("Akademik");
    const selectValue = container.querySelector('[data-slot="select-value"]');
    expect(selectValue?.className).toContain("[&_[data-slot=list-box-item-indicator]]:hidden");
  });

  it("menampilkan error sebagai alert bila ada error", () => {
    render(
      <Select
        label="Kategori Target"
        value=""
        options={options}
        error="Kategori wajib dipilih"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Kategori wajib dipilih");
  });
});

describe("DatePicker (HeroUI)", () => {
  it("merender segmen tanggal dari string ISO YYYY-MM-DD dan tombol kalender", () => {
    render(
      <DatePicker
        label="Tenggat Waktu"
        value="2026-11-15"
      />,
    );

    expect(screen.getByText("Tenggat Waktu")).toBeInTheDocument();
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("menampilkan pesan error sebagai alert", () => {
    render(
      <DatePicker
        label="Tanggal Rapat"
        value=""
        error="Tanggal wajib diisi"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Tanggal wajib diisi");
  });
});
