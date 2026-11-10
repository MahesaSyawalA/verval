import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DatePicker,
  DatePickerSkeleton,
  FormGroupSkeleton,
  Input,
  InputSkeleton,
  Select,
  SelectSkeleton,
  Skeleton,
  TextArea,
  TextAreaSkeleton,
} from "../index";

describe("Skeleton & Form Skeletons (HeroUI)", () => {
  it("merender Skeleton dasar dari HeroUI dengan class default", () => {
    const { container } = render(<Skeleton className="h-10 w-40" />);
    const el = container.querySelector(".h-10.w-40");
    expect(el).toBeInTheDocument();
  });

  it("merender InputSkeleton dengan label placeholder dan input placeholder", () => {
    render(<InputSkeleton label="Target Capaian" hasHelper />);
    expect(screen.getByText("Target Capaian")).toBeInTheDocument();
  });

  it("merender SelectSkeleton dengan varian standard dan filter", () => {
    const { container: stdContainer } = render(
      <SelectSkeleton label="Pilih Dosen" />,
    );
    expect(screen.getByText("Pilih Dosen")).toBeInTheDocument();

    const { container: filterContainer } = render(
      <SelectSkeleton label="Filter Dosen" size="filter" />,
    );
    expect(screen.getByText("Filter Dosen")).toBeInTheDocument();
    expect(
      filterContainer.querySelector('[data-slot="select-skeleton-filter"]'),
    ).toBeInTheDocument();
  });

  it("merender TextAreaSkeleton dan DatePickerSkeleton", () => {
    render(<TextAreaSkeleton label="Catatan Notulensi" rows={4} />);
    expect(screen.getByText("Catatan Notulensi")).toBeInTheDocument();

    render(<DatePickerSkeleton label="Tenggat Verifikasi" />);
    expect(screen.getByText("Tenggat Verifikasi")).toBeInTheDocument();
  });

  it("merender FormGroupSkeleton dengan jumlah kolom yang sesuai", () => {
    const { container } = render(
      <FormGroupSkeleton cols={2}>
        <InputSkeleton label="Field 1" />
        <InputSkeleton label="Field 2" />
      </FormGroupSkeleton>,
    );

    const group = container.querySelector('[data-slot="form-group-skeleton"]');
    expect(group).toHaveClass("sm:grid-cols-2");
    expect(screen.getByText("Field 1")).toBeInTheDocument();
    expect(screen.getByText("Field 2")).toBeInTheDocument();
  });

  it("otomatis merender skeleton saat prop isLoading=true pada Input, Select, TextArea, dan DatePicker", () => {
    const { rerender } = render(
      <Input label="Kode Target" isLoading placeholder="T-01" readOnly value="" />,
    );
    expect(screen.getByText("Kode Target")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("T-01")).toBeNull();

    rerender(
      <Select
        label="Dosen Pembimbing"
        isLoading
        options={[{ value: "1", label: "Pak Budi" }]}
      />,
    );
    expect(screen.getByText("Dosen Pembimbing")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();

    rerender(<TextArea label="Hasil Rapat" isLoading value="" readOnly />);
    expect(screen.getByText("Hasil Rapat")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();

    rerender(<DatePicker label="Jadwal Rapat" isLoading value="" />);
    expect(screen.getByText("Jadwal Rapat")).toBeInTheDocument();
    expect(screen.queryByRole("group")).toBeNull();
  });
});
