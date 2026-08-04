
export const DATA_GRID_LOCALE_AZ = {
    MuiTablePagination: {
        labelRowsPerPage: "Səhifədə sətir sayı:",
        labelDisplayedRows: ({ from, to, count }) =>
            `${from}–${to} / ${count !== -1 ? count : `${to}-dən çox`}`,
    },

    footerRowSelected: (count) =>
        count !== 1
            ? `${count.toLocaleString("az-AZ")} sətir seçildi`
            : `${count.toLocaleString("az-AZ")} sətir seçildi`,
    footerTotalRows: "Ümumi sətir sayı:",
    footerTotalVisibleRows: (visibleCount, totalCount) =>
        `${visibleCount.toLocaleString("az-AZ")} / ${totalCount.toLocaleString("az-AZ")}`,

    noRowsLabel: "Heç bir qeyd tapılmadı",
    noResultsOverlayLabel: "Nəticə tapılmadı",

    columnMenuLabel: "Menyu",
    columnMenuShowColumns: "Sütunları göstər",
    columnMenuManageColumns: "Sütunları idarə et",
    columnMenuFilter: "Filtr",
    columnMenuHideColumn: "Gizlət",
    columnMenuUnsort: "Sıralamanı ləğv et",
    columnMenuSortAsc: "Artan sırala",
    columnMenuSortDesc: "Azalan sırala",

    checkboxSelectionHeaderName: "Seçim",
};