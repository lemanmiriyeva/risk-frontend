"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import InventoryFormDialog from "./InventoryFormDialog";
import {DATA_GRID_LOCALE_AZ} from "@/lib/dataGridLocaleAz";

const C = {
    bg: '#fff',
    surface: '#FFFFFF',
    line: '#E4E1D8',
    lineStrong: '#D0CCC0',
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    inkFaint: '#948D7C',
    gold: '#9C7A2E',
    goldWash: 'rgba(156,122,46,0.08)',
    goldMuted: 'rgba(156,122,46,0.35)',
};

const OWNER_TYPE_FILTERS = [
    {value: '', label: 'Hamısı'},
    {value: 'person', label: 'Şəxs'},
    {value: 'department', label: 'Departament'},
    {value: 'aparat', label: 'Aparat'},
];

const gridSx = {
    border: `1px solid ${C.line}`,
    borderRadius: '4px',
    backgroundColor: C.surface,
    '& .MuiDataGrid-columnHeaders': {backgroundColor: C.surface, borderBottom: `1px solid ${C.lineStrong}`},
    '& .MuiDataGrid-columnHeaderTitle': {fontSize: 11, letterSpacing: '0.05em', color: C.inkFaint, textTransform: 'uppercase', fontWeight: 500},
    '& .MuiDataGrid-cell': {borderBottom: `1px solid ${C.line}`, fontSize: 13.5, color: C.ink, display: 'flex', alignItems: 'center'},
    '& .MuiDataGrid-row:hover': {backgroundColor: 'rgba(0,0,0,0.015)'},
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {outline: 'none'},
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {outline: 'none'},
    '& .MuiDataGrid-footerContainer': {borderTop: `1px solid ${C.line}`},
};

export default function InventoryTable() {
    const {enqueueSnackbar} = useSnackbar();

    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [ownerTypeFilter, setOwnerTypeFilter] = useState('');
    const [paginationModel, setPaginationModel] = useState({page: 0, pageSize: 20});

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [detailRow, setDetailRow] = useState(null);
    const [deleteRow, setDeleteRow] = useState(null);

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (ownerTypeFilter) params.set('owner_type', ownerTypeFilter);
        params.set('page', String(paginationModel.page + 1));
        params.set('page_size', String(paginationModel.pageSize));
        return params.toString();
    }, [search, ownerTypeFilter, paginationModel]);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.INVENTORY.LIST}?${buildQuery()}`);
            const data = res.data;
            setRows(data.results || []);
            setCount(data.count ?? (data.results || []).length);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [buildQuery, enqueueSnackbar]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    useEffect(() => {
        const t = setTimeout(() => setPaginationModel((p) => ({...p, page: 0})), 300);
        return () => clearTimeout(t);
    }, [search]);

    async function handleDeleteConfirm() {
        if (!deleteRow) return;
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.INVENTORY.DETAIL + deleteRow.id + '/');
            enqueueSnackbar('İnventar silindi', {variant: 'success'});
            setDeleteRow(null);
            fetchRows();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    }

    const columns = useMemo(() => ([
        {field: 'inventory_number', headerName: 'İnventar №', width: 130},
        {field: 'product_name', headerName: 'Məhsulun adı', flex: 1.2, minWidth: 180},
        {
            field: 'owner_type_display', headerName: 'Sahib növü', width: 130,
            renderCell: (p) => <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>{p.value}</Typography>,
        },
        {field: 'owner_display', headerName: 'Sahib', width: 200},
        {
            field: 'created_by_name', headerName: 'Yaradan', width: 160,
            renderCell: (p) => <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>{p.value || '—'}</Typography>,
        },
        {
            field: 'updated_by_name', headerName: 'Son dəyişən', width: 160,
            renderCell: (p) => <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>{p.value || '—'}</Typography>,
        },
        {
            field: 'created_at', headerName: 'Yaradılma tarixi', width: 160,
            renderCell: (p) => <Typography sx={{fontSize: 12, color: C.inkFaint}}>{p.value ? new Date(p.value).toLocaleString('az-AZ') : '—'}</Typography>,
        },
        {
            field: 'actions', headerName: '', width: 120, sortable: false, filterable: false, disableColumnMenu: true,
            renderCell: (p) => (
                <Box sx={{display: 'flex', gap: 0.5}}>
                    <IconButton size="small" onClick={() => setDetailRow(p.row)} sx={{color: C.inkFaint}}>
                        <VisibilityOutlinedIcon sx={{fontSize: 17}}/>
                    </IconButton>
                    <IconButton size="small" onClick={() => {setEditingRow(p.row); setFormOpen(true);}} sx={{color: C.inkFaint}}>
                        <EditOutlinedIcon sx={{fontSize: 17}}/>
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteRow(p.row)} sx={{color: '#A23B3B'}}>
                        <DeleteOutlineIcon sx={{fontSize: 17}}/>
                    </IconButton>
                </Box>
            ),
        },
    ]), []);

    return (
        <Box sx={{p: {xs: 2, sm: 3}, maxWidth: {xs: '100%', sm: '92%', lg: 1400}, mx: 'auto'}}>
            <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 2}}>
                <Button
                    variant="contained" startIcon={<AddIcon/>}
                    onClick={() => {setEditingRow(null); setFormOpen(true);}}
                    sx={{backgroundColor: C.gold, textTransform: 'none', '&:hover': {backgroundColor: '#7d631f'}}}
                >
                    Yeni inventar
                </Button>
            </Box>

            <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2}}>
                <TextField
                    size="small" placeholder="Axtar (məhsul adı, inventar №, sahib)..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{mr: 1, fontSize: 18, color: C.inkFaint}}/>,
                        sx: {color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px', '& .MuiOutlinedInput-notchedOutline': {borderColor: C.line}},
                    }}
                    sx={{minWidth: 300}}
                />
                <TextField
                    select size="small" value={ownerTypeFilter}
                    onChange={(e) => {setOwnerTypeFilter(e.target.value); setPaginationModel((p) => ({...p, page: 0}));}}
                    SelectProps={{sx: {color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px'}}}
                    sx={{minWidth: 190}}
                >
                    {OWNER_TYPE_FILTERS.map((o) => (
                        <MenuItem key={o.value} value={o.value} sx={{color: C.ink, fontSize: 13}}>{o.label}</MenuItem>
                    ))}
                </TextField>
            </Box>

            <Box sx={{height: {xs: 480, sm: 560, md: 640}, width: '100%'}}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loading}
                    rowCount={count}
                    paginationMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[20, 50, 100]}
                    disableRowSelectionOnClick
                    disableColumnFilter
                    localeText={{...DATA_GRID_LOCALE_AZ, noRowsLabel: 'Heç bir qeyd tapılmadı'}}
                    sx={gridSx}
                />
            </Box>

            <InventoryFormDialog
                open={formOpen}
                editingRow={editingRow}
                onClose={() => setFormOpen(false)}
                onSaved={fetchRows}
            />

            <Dialog open={!!detailRow} onClose={() => setDetailRow(null)} maxWidth="xs" fullWidth>
                {detailRow && (
                    <>
                        <DialogTitle sx={{borderBottom: `1px solid ${C.line}`}}>{detailRow.product_name}</DialogTitle>
                        <DialogContent sx={{pt: 2.5}}>
                            <Box sx={{border: `1px solid ${C.line}`, borderRadius: '4px', overflow: 'hidden'}}>
                                {[
                                    ['İnventar №', detailRow.inventory_number],
                                    ['Sahib növü', detailRow.owner_type_display],
                                    ['Sahib', detailRow.owner_display],
                                    ['Yaradan', detailRow.created_by_name || '—'],
                                    ['Son dəyişən', detailRow.updated_by_name || '—'],
                                    ['Yaradılma tarixi', detailRow.created_at ? new Date(detailRow.created_at).toLocaleString('az-AZ') : '—'],
                                ].map(([label, value], i) => (
                                    <Box key={label} sx={{display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, gap: {xs: 0.25, sm: 2}, px: 2, py: 1.2, borderTop: i === 0 ? 'none' : `1px solid ${C.line}`}}>
                                        <Typography sx={{fontSize: 12, color: C.inkFaint, minWidth: {xs: 'auto', sm: 140}, fontWeight: 500}}>{label}</Typography>
                                        <Typography sx={{fontSize: 13, color: C.ink, wordBreak: 'break-word'}}>{value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetailRow(null)}>Bağla</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <Dialog open={!!deleteRow} onClose={() => setDeleteRow(null)} maxWidth="xs" fullWidth>
                {deleteRow && (
                    <>
                        <DialogTitle>İnventarı sil</DialogTitle>
                        <DialogContent>
                            <Typography sx={{fontSize: 14}}>
                                "{deleteRow.product_name}" ({deleteRow.inventory_number}) adlı inventarı silmək istədiyinizə əminsiniz?
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteRow(null)}>Ləğv et</Button>
                            <Button onClick={handleDeleteConfirm} sx={{color: '#A23B3B'}}>Sil</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}