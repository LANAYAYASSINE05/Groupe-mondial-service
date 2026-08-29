import ExcelJS from "exceljs";
import type { Control, FormType } from "@/lib/api-client";

export type ExportView = "global" | "detail";

export type MockReport = {
  kpis: {
    total: number;
    anomalies: number;
    audit: number;
    passager: number;
    unvisitedSites: { id: string; name: string }[];
  };
  controls: Control[];
  summaries: {
    bySite: {
      establishmentId: string;
      name: string;
      total: number;
      anomalies: number;
      audit: number;
      passager: number;
    }[];
    byController: {
      userId: string;
      name: string;
      total: number;
      anomalies: number;
      audit: number;
      passager: number;
    }[];
    byItem: {
      formType: FormType;
      itemKey: string;
      label: string;
      ok: number;
      no: number;
      na: number;
    }[];
  };
};

/** Palette Mondial Service */
const COLORS = {
  brand: "FFD13A34",
  brandDark: "FF8D2A26",
  brandLight: "FFFDF5F5",
  white: "FFFFFFFF",
  text: "FF1A1A1A",
  textMuted: "FF6B7280",
  border: "FFE5E7EB",
  stripe: "FFF9FAFB",
  ok: "FF166534",
  okBg: "FFECFDF5",
  alert: "FFB91C1C",
  alertBg: "FFFEF2F2",
  gold: "FFC5A059",
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
};

function formTypeLabel(formType: FormType): string {
  return formType === "audit" ? "Audit" : "Passager";
}

function stateLabel(state: string): string {
  if (state === "ok") return "Conforme";
  if (state === "no") return "Non conforme";
  return "Non applicable";
}

function styleSectionTitle(cell: ExcelJS.Cell) {
  cell.font = { bold: true, size: 11, color: { argb: COLORS.brandDark } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.brandLight },
  };
}

function styleTableHeader(row: ExcelJS.Row, colCount: number) {
  row.height = 22;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: COLORS.white } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.brandDark },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thinBorder;
  }
}

function styleDataRow(row: ExcelJS.Row, colCount: number, stripe: boolean) {
  row.height = 18;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { size: 10, color: { argb: COLORS.text } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: stripe ? COLORS.stripe : COLORS.white },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = thinBorder;
  }
}

function styleStatusCell(cell: ExcelJS.Cell, value: string) {
  const v = String(value).toLowerCase();
  if (v === "conforme") {
    cell.font = { size: 10, color: { argb: COLORS.ok } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.okBg },
    };
  } else if (v === "non conforme" || v === "oui") {
    cell.font = { bold: true, size: 10, color: { argb: COLORS.alert } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.alertBg },
    };
  }
}

function autoFitColumns(sheet: ExcelJS.Worksheet, minWidth = 10, maxWidth = 42) {
  sheet.columns.forEach((col) => {
    let maxLen = minWidth;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > maxLen) maxLen = Math.min(len + 2, maxWidth);
    });
    col.width = maxLen;
  });
}

function addSheetBanner(sheet: ExcelJS.Worksheet, title: string, subtitle: string) {
  sheet.mergeCells("A1:H1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.brand },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 28;

  sheet.mergeCells("A2:H2");
  const subCell = sheet.getCell("A2");
  subCell.value = subtitle;
  subCell.font = { size: 9, color: { argb: COLORS.textMuted } };
  subCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.brandLight },
  };
  subCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(2).height = 18;

  return 3;
}

type TableOptions = {
  statusColumns?: number[];
  dateColumns?: number[];
  numberColumns?: number[];
};

function addTableSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  sheetTitle: string,
  headers: string[],
  rows: (string | number | Date | boolean)[][],
  options: TableOptions = {}
) {
  const sheet = workbook.addWorksheet(name.slice(0, 31), {
    views: [{ showGridLines: false }],
  });

  const startRow = addSheetBanner(
    sheet,
    sheetTitle,
    `GMS Contrôle · ${name}`
  );

  const headerRow = sheet.getRow(startRow);
  headerRow.values = headers;
  styleTableHeader(headerRow, headers.length);

  const dataStart = startRow + 1;
  if (rows.length === 0) {
    const emptyRow = sheet.getRow(dataStart);
    emptyRow.getCell(1).value = "Aucune donnée pour cette période.";
    sheet.mergeCells(dataStart, 1, dataStart, headers.length);
    emptyRow.getCell(1).font = {
      italic: true,
      size: 10,
      color: { argb: COLORS.textMuted },
    };
    emptyRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    emptyRow.height = 24;
  } else {
    rows.forEach((rowData, index) => {
      const row = sheet.getRow(dataStart + index);
      row.values = rowData;
      styleDataRow(row, headers.length, index % 2 === 1);

      options.dateColumns?.forEach((col) => {
        const cell = row.getCell(col);
        if (cell.value instanceof Date) {
          cell.numFmt = "dd/mm/yyyy hh:mm";
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }
      });

      options.numberColumns?.forEach((col) => {
        const cell = row.getCell(col);
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.numFmt = "#,##0";
      });

      options.statusColumns?.forEach((col) => {
        styleStatusCell(row.getCell(col), String(row.getCell(col).value ?? ""));
      });
    });

    sheet.autoFilter = {
      from: { row: startRow, column: 1 },
      to: { row: dataStart + rows.length - 1, column: headers.length },
    };
    sheet.views = [
      {
        state: "frozen",
        ySplit: startRow,
        showGridLines: false,
      },
    ];
  }

  autoFitColumns(sheet);
  return sheet;
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  view: ExportView,
  filterMeta: [string, string][],
  report: MockReport
) {
  const sheet = workbook.addWorksheet("Synthèse", {
    views: [{ showGridLines: false }],
  });

  sheet.mergeCells("A1:D1");
  const mainTitle = sheet.getCell("A1");
  mainTitle.value =
    view === "global"
      ? "RAPPORT GMS — VUE GLOBALE"
      : "RAPPORT GMS — VUE DÉTAIL";
  mainTitle.font = { bold: true, size: 16, color: { argb: COLORS.white } };
  mainTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.brand },
  };
  mainTitle.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 32;

  sheet.getCell("A2").value = "Généré le";
  sheet.getCell("B2").value = new Date();
  sheet.getCell("B2").numFmt = "dd/mm/yyyy hh:mm";
  sheet.getCell("A2").font = { bold: true, size: 10, color: { argb: COLORS.textMuted } };
  sheet.getCell("B2").font = { size: 10, color: { argb: COLORS.text } };
  sheet.getRow(2).height = 20;

  let row = 4;
  sheet.mergeCells(`A${row}:D${row}`);
  const filtersCell = sheet.getCell(`A${row}`);
  filtersCell.value = "FILTRES APPLIQUÉS";
  styleSectionTitle(filtersCell);
  sheet.getRow(row).height = 22;
  row += 1;

  for (const [label, value] of filterMeta) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`B${row}`).value = value;
    sheet.getCell(`A${row}`).font = { bold: true, size: 10, color: { argb: COLORS.textMuted } };
    sheet.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.text } };
    sheet.getCell(`A${row}`).border = thinBorder;
    sheet.getCell(`B${row}`).border = thinBorder;
    row += 1;
  }

  row += 1;
  sheet.mergeCells(`A${row}:D${row}`);
  const kpiTitle = sheet.getCell(`A${row}`);
  kpiTitle.value = "SYNTHÈSE";
  styleSectionTitle(kpiTitle);
  sheet.getRow(row).height = 22;
  row += 1;

  const kpis: [string, number, string][] = [
    ["Total contrôles", report.kpis.total, COLORS.text],
    ["Audits", report.kpis.audit, COLORS.text],
    ["Passagers", report.kpis.passager, COLORS.text],
    ["Anomalies", report.kpis.anomalies, COLORS.alert],
  ];

  for (const [label, value, color] of kpis) {
    sheet.getCell(`A${row}`).value = label;
    sheet.getCell(`B${row}`).value = value;
    sheet.getCell(`A${row}`).font = { bold: true, size: 10, color: { argb: COLORS.textMuted } };
    sheet.getCell(`B${row}`).font = {
      bold: true,
      size: 12,
      color: { argb: color },
    };
    sheet.getCell(`B${row}`).alignment = { horizontal: "left" };
    sheet.getCell(`A${row}`).border = thinBorder;
    sheet.getCell(`B${row}`).border = thinBorder;
    if (label === "Anomalies" && value > 0) {
      sheet.getCell(`B${row}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORS.alertBg },
      };
    }
    row += 1;
  }

  if (report.kpis.unvisitedSites.length > 0) {
    row += 1;
    sheet.mergeCells(`A${row}:D${row}`);
    const unvisitedTitle = sheet.getCell(`A${row}`);
    unvisitedTitle.value = "SITES NON VISITÉS";
    styleSectionTitle(unvisitedTitle);
    row += 1;
    sheet.mergeCells(`A${row}:D${row}`);
    sheet.getCell(`A${row}`).value = report.kpis.unvisitedSites
      .map((s) => s.name)
      .join(" · ");
    sheet.getCell(`A${row}`).font = { size: 10, color: { argb: COLORS.alert } };
    sheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: "top" };
  }

  sheet.getColumn(1).width = 24;
  sheet.getColumn(2).width = 36;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 12;
}

export async function buildMockExportXlsx(
  report: MockReport,
  view: ExportView
): Promise<Blob> {
  const filterMeta: [string, string][] = [
    ["Mode", "Démo mock"],
    ["Source", "Données fictives en mémoire"],
  ];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GMS Contrôle — Mondial Service";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.company = "Mondial Service";

  addSummarySheet(workbook, view, filterMeta, report);

  const formTypes: FormType[] = ["audit", "passager"];

  if (view === "global") {
    addTableSheet(
      workbook,
      "Par site",
      "Synthèse par site",
      ["Site", "Audit", "Passager", "Total", "Anomalies"],
      report.summaries.bySite.map((site) => [
        site.name,
        site.audit,
        site.passager,
        site.total,
        site.anomalies,
      ]),
      { numberColumns: [2, 3, 4, 5], statusColumns: [5] }
    );

    addTableSheet(
      workbook,
      "Par contrôleur",
      "Synthèse par contrôleur",
      ["Contrôleur", "Audit", "Passager", "Total", "Anomalies"],
      report.summaries.byController.map((ctrl) => [
        ctrl.name,
        ctrl.audit,
        ctrl.passager,
        ctrl.total,
        ctrl.anomalies,
      ]),
      { numberColumns: [2, 3, 4, 5], statusColumns: [5] }
    );

    for (const formType of formTypes) {
      const label = formTypeLabel(formType);
      const items = report.summaries.byItem.filter(
        (i) => i.formType === formType
      );
      addTableSheet(
        workbook,
        `Items ${label}`,
        `Résultats par point — ${label}`,
        ["Type", "Point", "OK", "Non conforme", "N/A"],
        items.map((item) => [label, item.label, item.ok, item.no, item.na]),
        { numberColumns: [3, 4, 5], statusColumns: [4] }
      );
    }

    addTableSheet(
      workbook,
      "Liste contrôles",
      "Liste des contrôles",
      [
        "Date",
        "Site",
        "Type",
        "Contrôleur",
        "Email",
        "Anomalie",
        "Explication",
        "Nb points",
      ],
      report.controls.map((c) => [
        new Date(c.createdAt),
        c.establishment?.name ?? "—",
        formTypeLabel(c.formType),
        c.user?.name ?? "—",
        c.user?.email ?? "—",
        c.anomaly ? "Oui" : "Non",
        c.explanation,
        c.items?.length ?? 0,
      ]),
      {
        dateColumns: [1],
        numberColumns: [8],
        statusColumns: [6],
      }
    );
  } else {
    for (const formType of formTypes) {
      const label = formTypeLabel(formType);
      const controls = report.controls.filter((c) => c.formType === formType);
      const rows: (string | number | Date | boolean)[][] = [];
      for (const c of controls) {
        for (const item of c.items ?? []) {
          rows.push([
            new Date(c.createdAt),
            c.user?.name ?? "—",
            c.user?.email ?? "—",
            c.establishment?.name ?? "—",
            label,
            item.label,
            stateLabel(item.state),
            item.comment,
            c.anomaly ? "Oui" : "Non",
          ]);
        }
      }
      addTableSheet(
        workbook,
        `Détail ${label}`,
        `Détail par item — ${label}`,
        [
          "Date",
          "Contrôleur",
          "Email",
          "Établissement",
          "Type",
          "Point",
          "État",
          "Commentaire",
          "Anomalie contrôle",
        ],
        rows,
        {
          dateColumns: [1],
          statusColumns: [7, 9],
        }
      );
    }

    for (const formType of formTypes) {
      const label = formTypeLabel(formType);
      const controls = report.controls.filter((c) => c.formType === formType);
      addTableSheet(
        workbook,
        `Contrôles ${label}`,
        `Contrôles — ${label}`,
        [
          "Date",
          "Site",
          "Contrôleur",
          "Email",
          "Anomalie",
          "Explication",
          "Nb points",
        ],
        controls.map((c) => [
          new Date(c.createdAt),
          c.establishment?.name ?? "—",
          c.user?.name ?? "—",
          c.user?.email ?? "—",
          c.anomaly ? "Oui" : "Non",
          c.explanation,
          c.items?.length ?? 0,
        ]),
        {
          dateColumns: [1],
          numberColumns: [7],
          statusColumns: [5],
        }
      );
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
