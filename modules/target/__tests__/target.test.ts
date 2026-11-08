import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/http";
import { masterTargetSchema, type MasterTargetItem } from "@/modules/target";
import {
  createMasterTarget,
  deleteMasterTarget,
  updateMasterTarget,
  type TargetRepositoryDeps,
} from "@/modules/target/server/target.service";

function createInMemoryDeps(initial: MasterTargetItem[] = []): TargetRepositoryDeps {
  const store = [...initial];

  return {
    findAll: async (filter) =>
      store.filter((t) => {
        if (filter?.tahun && t.tahun !== filter.tahun) return false;
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          return (
            t.kodeTarget.toLowerCase().includes(q) ||
            t.namaTarget.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    findById: async (id) => store.find((t) => t.id === id) ?? null,
    findByKode: async (kode) => {
      const found = store.find((t) => t.kodeTarget === kode.trim());
      if (!found) return null;
      return {
        id: found.id,
        kode_target: found.kodeTarget,
        nama_target: found.namaTarget,
        kuantitas_total: found.kuantitasTotal,
        satuan: found.satuan,
        tahun: found.tahun,
      };
    },
    insert: async (input) => {
      const created: MasterTargetItem = {
        id: `target-${store.length + 1}`,
        kodeTarget: input.kodeTarget,
        namaTarget: input.namaTarget,
        kuantitasTotal: input.kuantitasTotal,
        kuantitasDitugaskan: 0,
        satuan: input.satuan,
        tahun: input.tahun,
        formatBukti: input.formatBukti.map((fb, idx) => ({
          id: `fb-${idx + 1}`,
          namaField: fb.namaField,
          tipeData: fb.tipeData,
          statusIsian: fb.statusIsian,
        })),
      };
      store.push(created);
      return created;
    },
    update: async (id, input) => {
      const index = store.findIndex((t) => t.id === id);
      const updated: MasterTargetItem = {
        ...store[index],
        kodeTarget: input.kodeTarget,
        namaTarget: input.namaTarget,
        kuantitasTotal: input.kuantitasTotal,
        satuan: input.satuan,
        tahun: input.tahun,
        formatBukti: input.formatBukti.map((fb, idx) => ({
          id: fb.id ?? `fb-new-${idx + 1}`,
          namaField: fb.namaField,
          tipeData: fb.tipeData,
          statusIsian: fb.statusIsian,
        })),
      };
      store[index] = updated;
      return updated;
    },
    remove: async (id) => {
      const idx = store.findIndex((t) => t.id === id);
      if (idx >= 0) store.splice(idx, 1);
    },
  };
}

describe("Master Target Module (Phase 03)", () => {
  describe("masterTargetSchema validation", () => {
    it("validates a complete target with dynamic formatBukti", () => {
      const res = masterTargetSchema.safeParse({
        kodeTarget: "T-06",
        namaTarget: "Publikasi buku ajar atau monograf",
        kuantitasTotal: 2,
        satuan: "Buku",
        tahun: 2026,
        formatBukti: [
          { namaField: "Judul buku", tipeData: "Teks", statusIsian: "Wajib" },
          { namaField: "File bukti", tipeData: "File", statusIsian: "Opsional" },
        ],
      });
      expect(res.success).toBe(true);
    });

    it("rejects target without formatBukti or with zero quantity", () => {
      const res = masterTargetSchema.safeParse({
        kodeTarget: "T-06",
        namaTarget: "Publikasi buku ajar",
        kuantitasTotal: 0,
        satuan: "Buku",
        tahun: 2026,
        formatBukti: [],
      });
      expect(res.success).toBe(false);
    });
  });

  describe("target.service business rules", () => {
    it("creates a new target and rejects duplicate kodeTarget (409 CONFLICT)", async () => {
      const deps = createInMemoryDeps();
      const created = await createMasterTarget(
        {
          kodeTarget: "T-06",
          namaTarget: "Publikasi buku ajar atau monograf",
          kuantitasTotal: 2,
          satuan: "Buku",
          tahun: 2026,
          formatBukti: [
            { namaField: "Judul buku", tipeData: "Teks", statusIsian: "Wajib" },
          ],
        },
        deps,
      );

      expect(created.kodeTarget).toBe("T-06");
      expect(created.formatBukti).toHaveLength(1);

      await expect(
        createMasterTarget(
          {
            kodeTarget: "T-06",
            namaTarget: "Target duplikat",
            kuantitasTotal: 1,
            satuan: "Buku",
            tahun: 2026,
            formatBukti: [
              { namaField: "Judul", tipeData: "Teks", statusIsian: "Wajib" },
            ],
          },
          deps,
        ),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        status: 409,
      });
    });

    it("updates an existing target and prevents deleting a target with assigned tickets", async () => {
      const deps = createInMemoryDeps([
        {
          id: "t-assigned",
          kodeTarget: "T-01",
          namaTarget: "Publikasi artikel",
          kuantitasTotal: 5,
          kuantitasDitugaskan: 3,
          satuan: "Artikel",
          tahun: 2026,
          formatBukti: [
            {
              id: "fb-1",
              namaField: "Judul",
              tipeData: "Teks",
              statusIsian: "Wajib",
            },
          ],
        },
      ]);

      const updated = await updateMasterTarget(
        "t-assigned",
        {
          kodeTarget: "T-01",
          namaTarget: "Publikasi artikel jurnal internasional",
          kuantitasTotal: 6,
          satuan: "Artikel",
          tahun: 2026,
          formatBukti: [
            {
              id: "fb-1",
              namaField: "Judul Artikel",
              tipeData: "Teks",
              statusIsian: "Wajib",
            },
          ],
        },
        deps,
      );

      expect(updated.kuantitasTotal).toBe(6);

      await expect(
        deleteMasterTarget("t-assigned", deps),
      ).rejects.toBeInstanceOf(AppError);
    });
  });
});
